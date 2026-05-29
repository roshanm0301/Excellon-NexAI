package pii

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"strings"

	"github.com/excellon/nexai/internal/compiler"
	"golang.org/x/crypto/pbkdf2"
)

const (
	pbkdf2Salt       = "excellon-nexai-pii-v1"
	pbkdf2Iterations = 100000
	keyLen           = 32
)

// Service provides AES-256-GCM encryption and PII masking.
type Service struct {
	key []byte
}

// NewService derives a 32-byte AES-256 key from the master key via PBKDF2.
func NewService(masterKey string) *Service {
	if masterKey == "" {
		masterKey = "default-dev-key-change-in-prod"
	}
	key := pbkdf2.Key([]byte(masterKey), []byte(pbkdf2Salt), pbkdf2Iterations, keyLen, sha256.New)
	return &Service{key: key}
}

// Encrypt encrypts plaintext with AES-256-GCM and returns base64-encoded ciphertext.
func (s *Service) Encrypt(plaintext string) (string, error) {
	block, err := aes.NewCipher(s.key)
	if err != nil {
		return "", fmt.Errorf("pii encrypt: new cipher: %w", err)
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("pii encrypt: new gcm: %w", err)
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("pii encrypt: nonce: %w", err)
	}
	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Decrypt decrypts a base64-encoded AES-256-GCM ciphertext.
func (s *Service) Decrypt(ciphertext string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", fmt.Errorf("pii decrypt: base64 decode: %w", err)
	}
	block, err := aes.NewCipher(s.key)
	if err != nil {
		return "", fmt.Errorf("pii decrypt: new cipher: %w", err)
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("pii decrypt: new gcm: %w", err)
	}
	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("pii decrypt: ciphertext too short")
	}
	nonce, ciphertextBytes := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertextBytes, nil)
	if err != nil {
		return "", fmt.Errorf("pii decrypt: %w", err)
	}
	return string(plaintext), nil
}

// Mask applies the given masking mode to a value.
// mode: "partial" — show last 4 chars, mask rest with *
//       "full"    — replace all chars with *
//       "redact"  — return [REDACTED]
func (s *Service) Mask(value, mode string) string {
	switch mode {
	case "full":
		return strings.Repeat("*", len(value))
	case "redact":
		return "[REDACTED]"
	default: // "partial"
		if len(value) <= 4 {
			return strings.Repeat("*", len(value))
		}
		return strings.Repeat("*", len(value)-4) + value[len(value)-4:]
	}
}

// ProcessPayload walks the payload and applies PII processing for all fields marked pii=true in the schema.
// If encrypt=true (write path): encrypts values.
// If encrypt=false (read path): masks values according to mode.
func (s *Service) ProcessPayload(payload map[string]any, schema *compiler.CompiledSchema, mode string, encrypt bool) map[string]any {
	if schema == nil || !schema.HasPII {
		return payload
	}
	result := make(map[string]any, len(payload))
	for k, v := range payload {
		result[k] = v
	}
	for _, field := range schema.Fields {
		if !field.PII {
			continue
		}
		val, ok := result[field.Key]
		if !ok {
			continue
		}
		strVal, isStr := val.(string)
		if !isStr {
			continue
		}
		if encrypt {
			encrypted, err := s.Encrypt(strVal)
			if err == nil {
				result[field.Key] = encrypted
			}
		} else {
			result[field.Key] = s.Mask(strVal, mode)
		}
	}
	return result
}
