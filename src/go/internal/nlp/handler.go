package nlp

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
)

const claudeAPIURL = "https://api.anthropic.com/v1/messages"

const systemPromptImportFields = `You are an API that converts natural language entity descriptions into structured field definitions for the Excellon DMS platform.
Return ONLY valid JSON with this exact structure, no explanation:
{"fields":[{"name":"<camelCase>","type":"<text|number|boolean|date|datetime|email|phone|url|uuid|json|reference>","required":<bool>,"unique":<bool>,"indexed":<bool>}]}
Rules: field names must be camelCase, infer types from context, mark obvious unique fields (like ID or code), mark searchable fields as indexed.`

const systemPromptExpression = `You are an API that converts natural language computation descriptions into JSONata expressions for field computation.
Return ONLY valid JSON: {"expression":"<jsonata expression>"}
Available fields will be provided. Use them directly by name. Keep expressions concise and valid JSONata syntax.`

const systemPromptWorkflowGenerate = `You are an API that converts plain-English workflow descriptions into structured workflow definitions for the Excellon DMS platform.
Return ONLY valid JSON with this exact structure, no explanation:
{"properties":{"globalSettings":{"systemName":"<camelCaseName>","displayName":"<Human Name>","description":"<description>","actionType":"process","method":"POST","state":[],"cache":{"enabled":false,"ttlSeconds":300},"dlq":{"enabled":false,"topic":""}}},"sequence":[{"id":"start","name":"Start","type":"start","componentType":"task","properties":{"taskSettings":{}}},{"id":"<camelCaseId>","name":"<Step Name>","type":"<TaskType>","componentType":"<componentType>","properties":{"taskSettings":{}}},{"id":"end","name":"End","type":"end","componentType":"task","properties":{"taskSettings":{}}}]}
Rules:
- Always include a "start" step first (type:"start", componentType:"task") and an "end" step last (type:"end", componentType:"task")
- Step "id" must be camelCase with no spaces, unique within the sequence
- Valid task types: start, end, Document, Query, Response, Request, Resolver, Condition, Switch, Rule, Validator, Variable, Cache, HTTP, Loop, Iterator, Transaction, Sequence, Parallel, Timer, Approval, Notification, Webhook, JSON, String, Math, Array, Object, UUID, SMTP, Filter, Action, Template
- Use "componentType":"switch" for Switch and Condition steps, "componentType":"container" for Loop/Iterator/Sequence/Transaction/Parallel steps, "componentType":"task" for all other types
- Keep taskSettings as an empty object {} unless you have specific values
- Do not hallucinate entity names or step IDs — keep them generic and descriptive
- Add as many intermediate steps as needed between start and end to fulfil the description`

const systemPromptWorkflowExplain = `You are a helpful assistant that explains technical workflow definitions to non-technical business users.
Given a JSON workflow definition, write a clear, plain-English explanation of what the workflow does, step by step.
Focus on business purpose, not technical implementation details.
Be concise — 2 to 5 sentences maximum.`

const systemPromptWorkflowImprove = `You are a workflow quality reviewer for the Excellon DMS platform.
Given a JSON workflow definition, return ONLY a JSON array of improvement suggestions, no explanation:
[{"severity":"<error|warning|info>","title":"<short title>","description":"<detailed description>"}]
Rules:
- Use "error" for missing critical steps (no Response step, duplicate IDs)
- Use "warning" for potential issues (no error handling, missing validation)
- Use "info" for best practice recommendations (caching, naming conventions)
- Return an empty array [] if the workflow looks correct
- Maximum 5 suggestions`

type Handler struct {
	client *http.Client
	apiKey string
	model  string
}

func NewHandler(apiKey, model string) *Handler {
	return &Handler{
		client: &http.Client{},
		apiKey: apiKey,
		model:  model,
	}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Post("/import-fields", h.importFields)
	r.Post("/expression", h.generateExpression)
	r.Post("/workflow-generate", h.generateWorkflow)
	r.Post("/workflow-explain", h.explainWorkflow)
	r.Post("/workflow-improve", h.improveWorkflow)
}

type claudeRequest struct {
	Model     string          `json:"model"`
	MaxTokens int             `json:"max_tokens"`
	System    string          `json:"system"`
	Messages  []claudeMessage `json:"messages"`
}

type claudeMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type claudeResponse struct {
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// callClaude calls the Anthropic Messages API and returns the text response.
// maxTokens controls the response length (defaults to 512 when 0).
func (h *Handler) callClaude(system, userContent string, maxTokens int) (string, error) {
	if maxTokens <= 0 {
		maxTokens = 512
	}
	reqBody, err := json.Marshal(claudeRequest{
		Model:     h.model,
		MaxTokens: maxTokens,
		System:    system,
		Messages: []claudeMessage{
			{Role: "user", Content: userContent},
		},
	})
	if err != nil {
		return "", fmt.Errorf("nlp: marshal request: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, claudeAPIURL, bytes.NewReader(reqBody))
	if err != nil {
		return "", fmt.Errorf("nlp: create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", h.apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := h.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("nlp: call claude: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(io.LimitReader(resp.Body, 1<<16))
	if err != nil {
		return "", fmt.Errorf("nlp: read response: %w", err)
	}

	var cr claudeResponse
	if err := json.Unmarshal(respBytes, &cr); err != nil {
		return "", fmt.Errorf("nlp: decode response: %w", err)
	}
	if cr.Error != nil {
		return "", fmt.Errorf("nlp: claude error: %s", cr.Error.Message)
	}
	if len(cr.Content) == 0 {
		return "", fmt.Errorf("nlp: empty response from claude")
	}
	return strings.TrimSpace(cr.Content[0].Text), nil
}

// extractJSON strips optional Markdown code-fences from Claude responses.
// Claude occasionally wraps JSON in ```json ... ``` even when told not to.
func extractJSON(text string) string {
	text = strings.TrimSpace(text)
	// Already bare JSON
	if strings.HasPrefix(text, "{") || strings.HasPrefix(text, "[") {
		return text
	}
	// Extract from first { or [ to last } or ]
	if start := strings.Index(text, "{"); start >= 0 {
		if end := strings.LastIndex(text, "}"); end > start {
			return text[start : end+1]
		}
	}
	if start := strings.Index(text, "["); start >= 0 {
		if end := strings.LastIndex(text, "]"); end > start {
			return text[start : end+1]
		}
	}
	return text
}

func (h *Handler) importFields(w http.ResponseWriter, r *http.Request) {
	if h.apiKey == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "NLP service not configured"})
		return
	}

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var req struct {
		Description string `json:"description"`
	}
	if err := json.Unmarshal(body, &req); err != nil || req.Description == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "description is required"})
		return
	}

	text, err := h.callClaude(systemPromptImportFields, req.Description, 512)
	if err != nil {
		slog.Error("nlp: import fields", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "NLP call failed"})
		return
	}

	var result json.RawMessage
	if err := json.Unmarshal([]byte(extractJSON(text)), &result); err != nil {
		slog.Error("nlp: invalid JSON from claude", "text", text, "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "invalid response from NLP service"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(result) //nolint
}

func (h *Handler) generateExpression(w http.ResponseWriter, r *http.Request) {
	if h.apiKey == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "NLP service not configured"})
		return
	}

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var req struct {
		Description string   `json:"description"`
		Fields      []string `json:"fields"`
	}
	if err := json.Unmarshal(body, &req); err != nil || req.Description == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "description is required"})
		return
	}

	userContent := req.Description
	if len(req.Fields) > 0 {
		userContent += fmt.Sprintf("\nAvailable fields: %s", strings.Join(req.Fields, ", "))
	}

	text, err := h.callClaude(systemPromptExpression, userContent, 512)
	if err != nil {
		slog.Error("nlp: generate expression", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "NLP call failed"})
		return
	}

	var result json.RawMessage
	if err := json.Unmarshal([]byte(extractJSON(text)), &result); err != nil {
		slog.Error("nlp: invalid JSON from claude", "text", text, "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "invalid response from NLP service"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(result) //nolint
}

func (h *Handler) generateWorkflow(w http.ResponseWriter, r *http.Request) {
	if h.apiKey == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "NLP service not configured"})
		return
	}

	var req struct {
		Prompt  string `json:"prompt"`
		Context struct {
			EntityTypes     []string `json:"entityTypes"`
			ExistingStepIDs []string `json:"existingStepIds"`
		} `json:"context"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Prompt == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "prompt is required"})
		return
	}

	userContent := req.Prompt
	if len(req.Context.EntityTypes) > 0 {
		userContent += fmt.Sprintf("\nAvailable entity types: %s", strings.Join(req.Context.EntityTypes, ", "))
	}
	if len(req.Context.ExistingStepIDs) > 0 {
		userContent += fmt.Sprintf("\nExisting step IDs to avoid: %s", strings.Join(req.Context.ExistingStepIDs, ", "))
	}

	text, err := h.callClaude(systemPromptWorkflowGenerate, userContent, 2000)
	if err != nil {
		slog.Error("nlp: workflow-generate", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "NLP call failed"})
		return
	}

	var result json.RawMessage
	if err := json.Unmarshal([]byte(extractJSON(text)), &result); err != nil {
		slog.Error("nlp: workflow-generate invalid JSON from claude", "text", text, "error", err)
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "AI returned invalid JSON"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(result) //nolint
}

func (h *Handler) explainWorkflow(w http.ResponseWriter, r *http.Request) {
	if h.apiKey == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "NLP service not configured"})
		return
	}

	var req struct {
		Definition json.RawMessage `json:"definition"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || len(req.Definition) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "definition is required"})
		return
	}

	text, err := h.callClaude(systemPromptWorkflowExplain, string(req.Definition), 512)
	if err != nil {
		slog.Error("nlp: workflow-explain", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "NLP call failed"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"explanation": text})
}

func (h *Handler) improveWorkflow(w http.ResponseWriter, r *http.Request) {
	if h.apiKey == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "NLP service not configured"})
		return
	}

	var req struct {
		Definition json.RawMessage `json:"definition"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || len(req.Definition) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "definition is required"})
		return
	}

	text, err := h.callClaude(systemPromptWorkflowImprove, string(req.Definition), 1000)
	if err != nil {
		slog.Error("nlp: workflow-improve", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "NLP call failed"})
		return
	}

	var suggestions json.RawMessage
	if err := json.Unmarshal([]byte(extractJSON(text)), &suggestions); err != nil {
		slog.Error("nlp: workflow-improve invalid JSON from claude", "text", text, "error", err)
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "AI returned invalid JSON"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]json.RawMessage{"suggestions": suggestions}) //nolint
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
