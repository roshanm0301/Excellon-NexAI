// Phase 5 T8.4.1 — red placeholder box for broken/unresolved bindings (OI-P3-3)
// In design-time preview, all bindings are unresolved — render as red-bordered boxes.

import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import type { Binding } from "@/domain/types"

interface BindingPlaceholderProps {
  binding: Binding
}

function formatBindingPath(b: Binding): string {
  return `{{ ${b.bind.ref}${b.bind.path ? "." + b.bind.path : ""} }}`
}

export function BindingPlaceholder({ binding }: BindingPlaceholderProps) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1,
        py: 0.25,
        border: "1.5px solid #d32f2f",
        borderRadius: "4px",
        bgcolor: "rgba(211, 47, 47, 0.06)",
        maxWidth: "100%",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "#d32f2f",
          fontFamily: "monospace",
          fontSize: "11px",
          fontWeight: 500,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {formatBindingPath(binding)}
      </Typography>
    </Box>
  )
}
