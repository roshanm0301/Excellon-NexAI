# DESIGN-SYSTEM.md — Excellon Design System Integration Guide

> **Read before writing any React component.**

---

## What the Excellon Design System Is

The Excellon Design System is the project's proprietary component library and design token system. It is accessible via **Claude Design** — the project's Claude Design file is linked in the project settings.

**At the start of every session where you write React code, read the Excellon Design System in Claude Design before writing any component.**

---

## Where It Lives in the Codebase

```
src/react/src/design-system/
├── components/          # All React components
├── tokens/              # Design tokens (colors, spacing, typography, radius, shadows)
│   ├── index.ts         # Main token export
│   ├── colors.ts
│   ├── spacing.ts
│   ├── typography.ts
│   └── radius.ts
├── index.ts             # Barrel export for all components
└── README.md            # Usage guide (keep this updated)
```

---

## The Absolute Rule

```tsx
// ✅ CORRECT — always from the design system
import { Button, Input, Badge, Modal } from '../../design-system';

// ❌ WRONG — raw HTML with styles
<button style={{ background: '#2563EB', padding: '8px 16px' }}>Save</button>

// ❌ WRONG — third-party component libraries
import { Button } from '@mui/material';
import { Input } from 'antd';
import { Checkbox } from '@radix-ui/react-checkbox';
```

No third-party component library is used in this project. The design system is the sole source of all UI components.

---

## Using Design Tokens

Whenever you need a spacing, color, typography, or radius value in custom styling:

```tsx
// ✅ CORRECT — use tokens
import { tokens } from '../../design-system/tokens';

const containerStyle: CSSProperties = {
    padding: tokens.spacing[4],       // e.g. 16px
    borderRadius: tokens.radius.md,   // e.g. 8px
    color: tokens.color.text.primary,
    backgroundColor: tokens.color.background.surface,
};

// ❌ WRONG — hardcoded values
const containerStyle = {
    padding: '16px',
    borderRadius: '8px',
    color: '#1E293B',
};
```

---

## Component Categories (from Claude Design)

These are the component categories in the Excellon Design System. The exact components and their props are defined in Claude Design — read them there for accurate prop signatures.

### Layout
- `PageLayout` — full-page shell with header, sidebar, content area
- `EditorLayout` — editor shell with tab bar, save/publish actions, dirty indicator
- `SplitPanel` — resizable two-panel layout
- `Card` — surface container

### Navigation
- `TabGroup`, `Tab` — horizontal tabs
- `Sidebar`, `SidebarItem` — navigation sidebar
- `Breadcrumb` — path breadcrumb

### Data Display
- `VirtualGrid` — virtual-scroll table (handles 10,000+ rows)
- `DataTable` — standard scrollable table (smaller datasets)
- `Badge`, `StatusBadge` — inline status/category labels
- `Chip` — tag/category indicators
- `EmptyState` — empty list/search feedback
- `Skeleton` — loading placeholders

### Forms & Inputs
- `Input` — text input with label, error, hint
- `Textarea` — multiline text
- `NumberInput` — numeric input with min/max/step
- `Select` — single-select dropdown
- `MultiSelect` — multi-select with chips
- `Toggle` — boolean switch
- `Checkbox` — checkbox with label
- `RadioGroup`, `Radio` — radio button group
- `DatePicker` — date selection
- `DateTimePicker` — date + time
- `SearchInput` — search with debounce
- `FieldRow` — label + input layout wrapper

### Actions
- `Button` — primary, secondary, ghost, danger, icon variants
- `IconButton` — icon-only button
- `ActionMenu` — dropdown action list
- `ButtonGroup` — grouped buttons

### Feedback
- `Toast` — transient notifications (success, error, warning, info)
- `Modal` — dialog overlay
- `ConfirmDialog` — destructive action confirmation
- `Drawer` — slide-in panel
- `Tooltip` — hover tooltip
- `Banner` — persistent page-level messages
- `ErrorState` — error feedback block

### Indicators
- `Spinner` — loading spinner
- `ProgressBar` — linear progress
- `StepIndicator` — step/wizard progress

### Specialized
- `Accordion`, `AccordionRow` — collapsible content rows (used heavily in FieldBuilder)
- `DragHandle` — drag-and-drop indicator
- `CodeBlock` — monospace code/SQL display
- `JsonViewer` — pretty-printed JSON

---

## Extending the Design System

When the required UI pattern does not exist:

1. **Document the gap** — describe what is needed and why existing components can't satisfy it
2. **Design it generically** — the new component must be reusable, not purpose-built for one screen
3. **Add to the design system first** — place in `src/react/src/design-system/components/`
4. **Export it** — add to `src/react/src/design-system/index.ts`
5. **Use it** — only after step 4 is committed

Do not create one-off styled components inline in page files.

---

## Theme Support

The design system supports light and dark modes. All tokens are theme-aware. When writing custom styles, always use token values — they automatically apply the correct value for the active theme.

Never hardcode a hex color value anywhere in a component file.

---

## Reading the Design System in Claude Design

The Excellon Design System is defined in the project's Claude Design file. At the start of every React session:

1. Open the Claude Design file (linked in project settings)
2. Review the component catalogue for the components you'll be using
3. Check the token values for any design properties you need
4. Follow the exact prop signatures — do not guess prop names

The source of truth for prop signatures, variants, and usage rules is Claude Design, not this document.
