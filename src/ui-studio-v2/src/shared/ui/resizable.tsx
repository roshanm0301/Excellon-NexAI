import * as React from "react"
import { GripVertical } from "lucide-react"
import {
  Group as RRPGroup,
  Panel as RRPPanel,
  Separator as RRPSeparator,
} from "react-resizable-panels"
import { cn } from "@/shared/lib/utils"

// Phase 4 §7.1 — chrome wrapper around react-resizable-panels v4
// The v4 API names differ from shadcn-classic; this wrapper preserves the
// shadcn vocabulary (`ResizablePanelGroup` / `ResizableHandle`) for call sites.

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof RRPGroup>) => (
  <RRPGroup
    className={cn("flex h-full w-full data-[orientation=vertical]:flex-col", className)}
    {...props}
  />
)

const ResizablePanel = RRPPanel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof RRPSeparator> & { withHandle?: boolean }) => (
  <RRPSeparator
    className={cn(
      "relative flex w-px items-center justify-center bg-border " +
        "after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 " +
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </RRPSeparator>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
