package idgen

import "github.com/google/uuid"

// NewV4 returns a new random UUID v4.
func NewV4() string {
	return uuid.New().String()
}

// NewV7 returns a new time-ordered UUID v7 (preferred for high-insert-rate entity records).
func NewV7() string {
	id, err := uuid.NewV7()
	if err != nil {
		// Fallback to v4 if v7 generation fails (should not happen in practice)
		return uuid.New().String()
	}
	return id.String()
}
