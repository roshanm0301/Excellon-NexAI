package viewstudio

import (
	"fmt"
	"regexp"
)

var viewCodePattern = regexp.MustCompile(`^[a-z][a-z0-9_]{2,49}$`)

func validateCreateView(req CreateViewRequest) error {
	if req.ViewLabel == "" {
		return fmt.Errorf("view_label is required")
	}
	if len(req.ViewLabel) > 255 {
		return fmt.Errorf("view_label must be 255 characters or less")
	}
	if req.SurfaceType == "" {
		return fmt.Errorf("surface_type is required")
	}
	if !SurfaceType(req.SurfaceType).Valid() {
		return fmt.Errorf("invalid surface_type %q", req.SurfaceType)
	}
	if req.PrimaryEntity == "" {
		return fmt.Errorf("primary_entity is required")
	}
	if len(req.PrimaryEntity) > 100 {
		return fmt.Errorf("primary_entity must be 100 characters or less")
	}
	if req.ViewCode != "" && !viewCodePattern.MatchString(req.ViewCode) {
		return fmt.Errorf("view_code must match pattern: lowercase letters, digits, underscores; 3-50 chars; start with letter")
	}
	if req.ViewCategory != "" && len(req.ViewCategory) > 50 {
		return fmt.Errorf("view_category must be 50 characters or less")
	}
	return nil
}
