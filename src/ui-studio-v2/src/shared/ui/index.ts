// Phase 4 §1 — shared/ui: shadcn chrome components barrel
// Chrome components only — never import from runtime-preview/ [Phase 4 §7.1]
export { Input } from "./input"
export type { InputProps } from "./input"
export { Switch } from "./switch"
export type { SwitchProps } from "./switch"
export { Label } from "./label"
export type { LabelProps } from "./label"
export { PropertyRow } from "./property-row"
export type { PropertyRowProps } from "./property-row"
export { Button, buttonVariants } from "./button"
export type { ButtonProps } from "./button"
export { Badge, badgeVariants } from "./badge"
export type { BadgeProps } from "./badge"
export { Skeleton } from "./skeleton"
export { ScrollArea, ScrollBar } from "./scroll-area"
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./dropdown-menu"
export { OriginBadge } from "./origin-badge"
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./accordion"
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
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./table"
