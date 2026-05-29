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

func (h *Handler) callClaude(system, userContent string) (string, error) {
	reqBody, err := json.Marshal(claudeRequest{
		Model:     h.model,
		MaxTokens: 512,
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
	req.Header.Set("Authorization", "Bearer "+h.apiKey)
	req.Header.Set("x-api-version", "2023-06-01")

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

	text, err := h.callClaude(systemPromptImportFields, req.Description)
	if err != nil {
		slog.Error("nlp: import fields", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "NLP call failed"})
		return
	}

	// Pass through the raw JSON from Claude
	var result json.RawMessage
	if err := json.Unmarshal([]byte(text), &result); err != nil {
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

	text, err := h.callClaude(systemPromptExpression, userContent)
	if err != nil {
		slog.Error("nlp: generate expression", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "NLP call failed"})
		return
	}

	var result json.RawMessage
	if err := json.Unmarshal([]byte(text), &result); err != nil {
		slog.Error("nlp: invalid JSON from claude", "text", text, "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "invalid response from NLP service"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(result) //nolint
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
