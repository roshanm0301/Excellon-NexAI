package service

import (
	"context"
	"fmt"
	"log/slog"
	"time"
)

// --- Notification Service ---

// NotificationService is a built-in service for sending notifications.
type NotificationService struct{}

func NewNotificationService() *NotificationService { return &NotificationService{} }

func (s *NotificationService) Key() string { return "notification" }

func (s *NotificationService) Methods() []string {
	return []string{"send", "send_bulk", "schedule"}
}

func (s *NotificationService) Invoke(ctx context.Context, method string, input map[string]any) (*InvokeResponse, error) {
	switch method {
	case "send":
		return s.send(input)
	case "send_bulk":
		return s.sendBulk(input)
	case "schedule":
		return s.schedule(input)
	default:
		return &InvokeResponse{Success: false, Error: fmt.Sprintf("unknown method: %s", method)}, nil
	}
}

func (s *NotificationService) send(input map[string]any) (*InvokeResponse, error) {
	recipient, _ := input["recipient"].(string)
	channel, _ := input["channel"].(string) // "email", "sms", "in_app", "push"
	message, _ := input["message"].(string)

	if recipient == "" || message == "" {
		return &InvokeResponse{Success: false, Error: "recipient and message are required"}, nil
	}
	if channel == "" {
		channel = "in_app"
	}

	// In production, dispatch to actual notification infrastructure.
	slog.Info("notification_service: send", "recipient", recipient, "channel", channel)

	return &InvokeResponse{
		Success: true,
		Output: map[string]any{
			"notificationId": fmt.Sprintf("notif_%d", time.Now().UnixMilli()),
			"channel":        channel,
			"recipient":      recipient,
			"status":         "delivered",
		},
	}, nil
}

func (s *NotificationService) sendBulk(input map[string]any) (*InvokeResponse, error) {
	recipients, _ := input["recipients"].([]any)
	message, _ := input["message"].(string)

	if len(recipients) == 0 || message == "" {
		return &InvokeResponse{Success: false, Error: "recipients and message are required"}, nil
	}

	slog.Info("notification_service: send_bulk", "count", len(recipients))

	return &InvokeResponse{
		Success: true,
		Output: map[string]any{
			"sent":  len(recipients),
			"failed": 0,
		},
	}, nil
}

func (s *NotificationService) schedule(input map[string]any) (*InvokeResponse, error) {
	return &InvokeResponse{
		Success: true,
		Output: map[string]any{
			"scheduled": true,
			"scheduleId": fmt.Sprintf("sched_%d", time.Now().UnixMilli()),
		},
	}, nil
}

// --- Email Service ---

// EmailService is a built-in service for sending emails.
type EmailService struct{}

func NewEmailService() *EmailService { return &EmailService{} }

func (s *EmailService) Key() string { return "email" }

func (s *EmailService) Methods() []string {
	return []string{"send", "send_template"}
}

func (s *EmailService) Invoke(ctx context.Context, method string, input map[string]any) (*InvokeResponse, error) {
	switch method {
	case "send":
		return s.send(input)
	case "send_template":
		return s.sendTemplate(input)
	default:
		return &InvokeResponse{Success: false, Error: fmt.Sprintf("unknown method: %s", method)}, nil
	}
}

func (s *EmailService) send(input map[string]any) (*InvokeResponse, error) {
	to, _ := input["to"].(string)
	subject, _ := input["subject"].(string)

	if to == "" || subject == "" {
		return &InvokeResponse{Success: false, Error: "to and subject are required"}, nil
	}

	slog.Info("email_service: send", "to", to, "subject", subject)

	return &InvokeResponse{
		Success: true,
		Output: map[string]any{
			"messageId": fmt.Sprintf("email_%d", time.Now().UnixMilli()),
			"to":        to,
			"status":    "sent",
		},
	}, nil
}

func (s *EmailService) sendTemplate(input map[string]any) (*InvokeResponse, error) {
	to, _ := input["to"].(string)
	templateID, _ := input["templateId"].(string)

	if to == "" || templateID == "" {
		return &InvokeResponse{Success: false, Error: "to and templateId are required"}, nil
	}

	slog.Info("email_service: send_template", "to", to, "template", templateID)

	return &InvokeResponse{
		Success: true,
		Output: map[string]any{
			"messageId":  fmt.Sprintf("email_%d", time.Now().UnixMilli()),
			"to":         to,
			"templateId": templateID,
			"status":     "sent",
		},
	}, nil
}

// --- Webhook Service ---

// WebhookService is a built-in service for firing outgoing webhooks.
type WebhookService struct {
	adapter *HTTPAdapter
}

func NewWebhookService() *WebhookService {
	return &WebhookService{adapter: NewHTTPAdapter()}
}

func (s *WebhookService) Key() string { return "webhook" }

func (s *WebhookService) Methods() []string {
	return []string{"fire"}
}

func (s *WebhookService) Invoke(ctx context.Context, method string, input map[string]any) (*InvokeResponse, error) {
	if method != "fire" {
		return &InvokeResponse{Success: false, Error: fmt.Sprintf("unknown method: %s", method)}, nil
	}
	return s.fire(ctx, input)
}

func (s *WebhookService) fire(ctx context.Context, input map[string]any) (*InvokeResponse, error) {
	url, _ := input["url"].(string)
	if url == "" {
		return &InvokeResponse{Success: false, Error: "url is required"}, nil
	}

	// Build a minimal registration for the HTTP adapter
	configBytes, _ := fmt.Appendf(nil, `{"baseUrl": %q}`, url)
	reg := &ServiceRegistration{
		ServiceKey: "webhook",
		Transport:  TransportHTTP,
		Config:     configBytes,
	}

	// Remove url from input so it's not sent in the body
	payload := make(map[string]any, len(input))
	for k, v := range input {
		if k != "url" {
			payload[k] = v
		}
	}

	req := &InvokeRequest{
		ServiceKey: "webhook",
		Method:     "",
		Input:      payload,
	}

	return s.adapter.Invoke(ctx, reg, req)
}

// --- Data Transform Service ---

// DataTransformService provides common data operations.
type DataTransformService struct{}

func NewDataTransformService() *DataTransformService { return &DataTransformService{} }

func (s *DataTransformService) Key() string { return "data_transform" }

func (s *DataTransformService) Methods() []string {
	return []string{"merge", "pick", "validate"}
}

func (s *DataTransformService) Invoke(ctx context.Context, method string, input map[string]any) (*InvokeResponse, error) {
	switch method {
	case "merge":
		return s.merge(input)
	case "pick":
		return s.pick(input)
	case "validate":
		return s.validate(input)
	default:
		return &InvokeResponse{Success: false, Error: fmt.Sprintf("unknown method: %s", method)}, nil
	}
}

func (s *DataTransformService) merge(input map[string]any) (*InvokeResponse, error) {
	source, _ := input["source"].(map[string]any)
	target, _ := input["target"].(map[string]any)

	if source == nil {
		source = map[string]any{}
	}
	if target == nil {
		target = map[string]any{}
	}

	result := make(map[string]any, len(target)+len(source))
	for k, v := range target {
		result[k] = v
	}
	for k, v := range source {
		result[k] = v
	}

	return &InvokeResponse{Success: true, Output: result}, nil
}

func (s *DataTransformService) pick(input map[string]any) (*InvokeResponse, error) {
	data, _ := input["data"].(map[string]any)
	fieldsRaw, _ := input["fields"].([]any)

	if data == nil || len(fieldsRaw) == 0 {
		return &InvokeResponse{Success: false, Error: "data and fields are required"}, nil
	}

	result := make(map[string]any, len(fieldsRaw))
	for _, f := range fieldsRaw {
		if key, ok := f.(string); ok {
			if v, exists := data[key]; exists {
				result[key] = v
			}
		}
	}

	return &InvokeResponse{Success: true, Output: result}, nil
}

func (s *DataTransformService) validate(input map[string]any) (*InvokeResponse, error) {
	data, _ := input["data"].(map[string]any)
	requiredRaw, _ := input["required"].([]any)

	missing := []string{}
	for _, f := range requiredRaw {
		if key, ok := f.(string); ok {
			if _, exists := data[key]; !exists {
				missing = append(missing, key)
			}
		}
	}

	return &InvokeResponse{
		Success: len(missing) == 0,
		Output: map[string]any{
			"valid":   len(missing) == 0,
			"missing": missing,
		},
	}, nil
}

// RegisterBuiltinServices registers all built-in services with the registry.
func RegisterBuiltinServices(reg *Registry) {
	reg.RegisterInternal(NewNotificationService())
	reg.RegisterInternal(NewEmailService())
	reg.RegisterInternal(NewWebhookService())
	reg.RegisterInternal(NewDataTransformService())
}
