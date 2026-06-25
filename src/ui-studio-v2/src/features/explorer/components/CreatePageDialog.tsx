import { useState, useId } from "react"
import { useNavigate } from "@tanstack/react-router"
import type { PageArchetype } from "@/domain/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useTree, useRegistryList, useCreatePage } from "@/shared/query"
import { ARCHETYPES } from "@/features/asset-library/catalogue"
import { toCamelCase } from "@/shared/lib/utils"

export interface CreatePageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreatePageDialog({ open, onOpenChange }: CreatePageDialogProps) {
  const navigate = useNavigate()
  const uid = useId()

  const appId = useWorkspaceStore((s) => s.appId)
  const env = useWorkspaceStore((s) => s.env)
  const editingLevel = useWorkspaceStore((s) => s.editingLevel)
  const editingScopeId = useWorkspaceStore((s) => s.editingScopeId)

  const [title, setTitle] = useState("")
  const [archetype, setArchetype] = useState<PageArchetype | "">("")
  const [moduleKey, setModuleKey] = useState("")
  const [entityRef, setEntityRef] = useState("")

  const { data: treeData } = useTree(env, appId, editingLevel, editingScopeId)
  const { data: entities } = useRegistryList("entity")
  const createPage = useCreatePage()

  // Flatten tree to find module nodes
  function flattenTree(
    nodes: { kind: string; logicalKey: string; label: string; children: typeof nodes }[],
  ): { logicalKey: string; label: string }[] {
    const result: { logicalKey: string; label: string }[] = []
    for (const node of nodes) {
      if (node.kind === "module") result.push({ logicalKey: node.logicalKey, label: node.label })
      result.push(...flattenTree(node.children))
    }
    return result
  }

  const modules = treeData ? flattenTree(treeData as Parameters<typeof flattenTree>[0]) : []

  const slugPreview = title ? `page.${toCamelCase(title)}` : ""
  const canSubmit = title.trim().length > 0 && archetype !== "" && moduleKey !== ""

  function handleClose() {
    setTitle("")
    setArchetype("")
    setModuleKey("")
    setEntityRef("")
    onOpenChange(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || archetype === "") return

    createPage.mutate(
      {
        appId,
        moduleKey,
        title: title.trim(),
        archetype,
        entityRef: entityRef || undefined,
        cascadeLevel: editingLevel,
      },
      {
        onSuccess: (page) => {
          handleClose()
          void navigate({
            to: "/editor/$appId/$pageId",
            params: { appId, pageId: page.logicalKey },
          })
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New Page</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-title`}>Page Title</Label>
            <Input
              id={`${uid}-title`}
              placeholder="e.g. Customer List"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            {slugPreview && (
              <p className="text-xs text-muted-foreground font-mono">{slugPreview}</p>
            )}
          </div>

          {/* Archetype */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-archetype`}>Archetype</Label>
            <Select
              value={archetype}
              onValueChange={(v) => setArchetype(v as PageArchetype)}
            >
              <SelectTrigger id={`${uid}-archetype`}>
                <SelectValue placeholder="Select archetype…" />
              </SelectTrigger>
              <SelectContent>
                {ARCHETYPES.map((a) => (
                  <SelectItem key={a.semanticType} value={a.semanticType}>
                    <span className="mr-2">{a.icon}</span>
                    {a.label}
                    <span className="ml-2 text-xs text-muted-foreground">— {a.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parent Module */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-module`}>Parent Module</Label>
            <Select value={moduleKey} onValueChange={setModuleKey}>
              <SelectTrigger id={`${uid}-module`}>
                <SelectValue placeholder="Select module…" />
              </SelectTrigger>
              <SelectContent>
                {modules.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    No modules found
                  </SelectItem>
                ) : (
                  modules.map((m) => (
                    <SelectItem key={m.logicalKey} value={m.logicalKey}>
                      {m.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Primary Entity */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-entity`}>Primary Entity</Label>
            <Select value={entityRef} onValueChange={setEntityRef}>
              <SelectTrigger id={`${uid}-entity`}>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {(entities ?? []).map((e) => (
                  <SelectItem key={e.ref} value={e.ref}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || createPage.isPending}
            >
              {createPage.isPending ? "Creating…" : "Create Page"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
