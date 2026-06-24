import { useState } from "react"
import { useCreateApp } from "@/shared/query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/ui"

const VERTICALS = [
  { value: "automotive", label: "Automotive" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "retail", label: "Retail" },
]

interface CreateAppDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (appId: string) => void
}

export function CreateAppDialog({ open, onOpenChange, onCreated }: CreateAppDialogProps) {
  const [name, setName] = useState("")
  const [vertical, setVertical] = useState("")
  const [description, setDescription] = useState("")
  const createMutation = useCreateApp()

  const handleCreate = () => {
    if (!name || !vertical) return
    createMutation.mutate(
      { name, vertical, description: description || undefined },
      {
        onSuccess: (app) => {
          onCreated(app.id)
          onOpenChange(false)
          setName("")
          setVertical("")
          setDescription("")
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-label="Create new application">
        <DialogHeader>
          <DialogTitle>New Application</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="app-name">Name</Label>
            <Input
              id="app-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Application"
              aria-label="Application name"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Vertical</Label>
            <Select value={vertical} onValueChange={setVertical}>
              <SelectTrigger aria-label="Vertical">
                <SelectValue placeholder="Select vertical…" />
              </SelectTrigger>
              <SelectContent>
                {VERTICALS.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="app-desc">Description (optional)</Label>
            <Input
              id="app-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description…"
              aria-label="Application description"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name || !vertical || createMutation.isPending}
              aria-label="Create application"
            >
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
