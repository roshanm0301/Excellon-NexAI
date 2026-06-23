// Phase 4 §1 — shared/ui: shadcn chrome components barrel
// Chrome components only — never import from runtime-preview/ [Phase 4 §7.1]
export { Button, buttonVariants } from "./button"
export type { ButtonProps } from "./button"
export { Separator } from "./separator"
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip"
export { Avatar, AvatarImage, AvatarFallback } from "./avatar"
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"
export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./dialog"
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
} from "./select"
export { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "./resizable"
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "./command"
