package business_workflow

import (
	"context"
	"log/slog"
	"sync"
)

// Event represents a domain event that can trigger workflows.
type Event struct {
	TenantID   string         `json:"tenantId"`
	EntityType string         `json:"entityType"`
	EntityID   string         `json:"entityId"`
	Type       string         `json:"type"` // TriggerOnCreate, TriggerOnUpdate, etc.
	Payload    map[string]any `json:"payload"`
	UserID     string         `json:"userId"`
}

// EventHandler is a function that processes events.
type EventHandler func(ctx context.Context, event Event)

// EventBus is a simple in-process pub/sub for domain events.
// Workflows subscribe to entity events via this bus.
type EventBus struct {
	mu       sync.RWMutex
	handlers map[string][]EventHandler // key = "entityType:eventType" or "*" for all
}

// GlobalBus is the singleton event bus for the application.
var GlobalBus = NewEventBus()

// NewEventBus creates a new EventBus.
func NewEventBus() *EventBus {
	return &EventBus{
		handlers: make(map[string][]EventHandler),
	}
}

// Subscribe registers a handler for a specific entity type and event type.
// Use entityType="*" to subscribe to all entity types.
func (bus *EventBus) Subscribe(entityType, eventType string, handler EventHandler) {
	bus.mu.Lock()
	defer bus.mu.Unlock()
	key := entityType + ":" + eventType
	bus.handlers[key] = append(bus.handlers[key], handler)
}

// Publish dispatches an event to all matching handlers asynchronously.
// Handlers are invoked in goroutines — they must not panic.
func (bus *EventBus) Publish(ctx context.Context, event Event) {
	bus.mu.RLock()
	defer bus.mu.RUnlock()

	// Specific handlers
	key := event.EntityType + ":" + event.Type
	handlers := bus.handlers[key]

	// Wildcard handlers
	wildcardKey := "*:" + event.Type
	handlers = append(handlers, bus.handlers[wildcardKey]...)

	// Global wildcard
	handlers = append(handlers, bus.handlers["*:*"]...)

	for _, h := range handlers {
		go func(handler EventHandler) {
			defer func() {
				if r := recover(); r != nil {
					slog.Error("event_bus: handler panicked", "event", event.Type, "entity", event.EntityType, "panic", r)
				}
			}()
			handler(ctx, event)
		}(h)
	}
}

// EventTrigger listens to the EventBus and triggers workflows via the resolver + executor.
type EventTrigger struct {
	resolver *WorkflowResolver
	executor *DAGExecutor
}

// NewEventTrigger constructs an EventTrigger and subscribes it to the global bus.
func NewEventTrigger(resolver *WorkflowResolver, executor *DAGExecutor) *EventTrigger {
	et := &EventTrigger{
		resolver: resolver,
		executor: executor,
	}
	// Subscribe to all events
	GlobalBus.Subscribe("*", "*", et.handleEvent)
	return et
}

// handleEvent is the callback invoked by the EventBus for each domain event.
func (et *EventTrigger) handleEvent(ctx context.Context, event Event) {
	// Resolve matching workflow bindings
	resolved, err := et.resolver.Resolve(ctx, event.TenantID, event.EntityType, event.Type, event.Payload)
	if err != nil {
		slog.Error("event_trigger: resolve failed", "error", err, "event", event.Type, "entity", event.EntityType)
		return
	}

	if len(resolved) == 0 {
		return
	}

	slog.Info("event_trigger: matched bindings", "count", len(resolved), "event", event.Type, "entityType", event.EntityType, "entityId", event.EntityID)

	for _, rb := range resolved {
		// Build initial context from event payload
		initialCtx := map[string]any{
			"$event":      event.Type,
			"$entityType": event.EntityType,
			"$entityId":   event.EntityID,
			"$userId":     event.UserID,
		}
		for k, v := range event.Payload {
			initialCtx[k] = v
		}

		if rb.Definition.IsDAGWorkflow() {
			// Start DAG workflow
			_, err := et.executor.StartDAGInstance(ctx, event.TenantID, rb.Definition, event.EntityType, event.EntityID, initialCtx)
			if err != nil {
				slog.Error("event_trigger: start DAG instance failed", "error", err, "definition", rb.Definition.ID)
			}
		} else {
			// Legacy linear workflow — use old engine path
			slog.Info("event_trigger: legacy workflow triggered (not DAG)", "definition", rb.Definition.ID)
		}
	}
}

// PublishEntityEvent is a convenience function for publishing entity events from handlers.
func PublishEntityEvent(ctx context.Context, tenantID, entityType, entityID, eventType, userID string, payload map[string]any) {
	GlobalBus.Publish(ctx, Event{
		TenantID:   tenantID,
		EntityType: entityType,
		EntityID:   entityID,
		Type:       eventType,
		Payload:    payload,
		UserID:     userID,
	})
}
