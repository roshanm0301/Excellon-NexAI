import { useState, useCallback, useMemo } from "react"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useTree, useOverrideNode } from "@/shared/query"
import { Button, Input, Skeleton, ScrollArea, Separator } from "@/shared/ui"
import type { OriginState, CascadeLevel } from "@/domain/types"
import { TokenRow } from "./TokenRow"

const COLOR_TOKENS = ["colorPrimary", "colorSecondary", "colorBackground"]
const TYPOGRAPHY_TOKENS = ["fontFamily"]
const LAYOUT_TOKENS = ["borderRadius"]

interface TokenState {
  value: string
  originState: OriginState
  sourceLevel?: CascadeLevel
}


export function ThemeDesigner() {
  const env = useWorkspaceStore((s) => s.env)
  const appId = useWorkspaceStore((s) => s.appId)
  const editingLevel = useWorkspaceStore((s) => s.editingLevel)
  const scopeId = useWorkspaceStore((s) => s.editingScopeId)
  const { data: tree, isLoading } = useTree(env, appId, editingLevel, scopeId)
  const overrideMutation = useOverrideNode()

  const themeNode = useMemo(() => {
    if (!tree) return null
    function findTheme(nodes: typeof tree): (typeof tree)[number] | null {
      if (!nodes) return null
      for (const n of nodes) {
        if (n.kind === "theme") return n
        const found = findTheme(n.children)
        if (found) return found
      }
      return null
    }
    return findTheme(tree)
  }, [tree])

  const [localTokens, setLocalTokens] = useState<Record<string, string>>({})
  const [brandLogo, setBrandLogo] = useState("")
  const [brandFavicon, setBrandFavicon] = useState("")
  const [dirty, setDirty] = useState(false)

  const baseTokens: Record<string, string> = useMemo(() => {
    const defaults: Record<string, string> = {
      colorPrimary: "#1a56db",
      colorSecondary: "#6b7280",
      colorBackground: "#ffffff",
      fontFamily: "Inter, sans-serif",
      borderRadius: "6px",
    }
    return defaults
  }, [])

  const getTokenState = useCallback(
    (key: string): TokenState => {
      if (localTokens[key] !== undefined) {
        return {
          value: localTokens[key],
          originState: "overridden",
          sourceLevel: editingLevel,
        }
      }
      const isInherited = editingLevel !== "vertical"
      return {
        value: baseTokens[key] ?? "",
        originState: isInherited ? "inherited" : "own",
        sourceLevel: isInherited ? "vertical" : undefined,
      }
    },
    [localTokens, baseTokens, editingLevel],
  )

  const handleTokenChange = (key: string, value: string) => {
    setLocalTokens((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  const handleRevert = (key: string) => {
    setLocalTokens((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setDirty(true)
  }

  const handleSave = () => {
    if (!themeNode || Object.keys(localTokens).length === 0) return
    overrideMutation.mutate(
      {
        logicalKey: themeNode.logicalKey,
        level: editingLevel,
        ops: [{ op: "merge" as const, path: "tokens", value: localTokens }],
      },
      {
        onSuccess: () => {
          setDirty(false)
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col" aria-label="Theme designer">
      <div className="flex items-center justify-between px-4 py-2">
        <p className="text-sm font-medium">Theme Designer</p>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!dirty || overrideMutation.isPending}
          aria-label="Save theme"
        >
          {overrideMutation.isPending ? "Saving…" : "Save"}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 px-4 pb-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Colors</p>
            {COLOR_TOKENS.map((key) => {
              const state = getTokenState(key)
              return (
                <TokenRow
                  key={key}
                  label={key}
                  value={state.value}
                  isColor={true}
                  originState={state.originState}
                  sourceLevel={state.sourceLevel}
                  onChange={(v) => handleTokenChange(key, v)}
                  onRevert={state.originState === "overridden" ? () => handleRevert(key) : undefined}
                />
              )
            })}
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Typography</p>
            {TYPOGRAPHY_TOKENS.map((key) => {
              const state = getTokenState(key)
              return (
                <TokenRow
                  key={key}
                  label={key}
                  value={state.value}
                  isColor={false}
                  originState={state.originState}
                  sourceLevel={state.sourceLevel}
                  onChange={(v) => handleTokenChange(key, v)}
                  onRevert={state.originState === "overridden" ? () => handleRevert(key) : undefined}
                />
              )
            })}
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Layout</p>
            {LAYOUT_TOKENS.map((key) => {
              const state = getTokenState(key)
              return (
                <TokenRow
                  key={key}
                  label={key}
                  value={state.value}
                  isColor={false}
                  originState={state.originState}
                  sourceLevel={state.sourceLevel}
                  onChange={(v) => handleTokenChange(key, v)}
                  onRevert={state.originState === "overridden" ? () => handleRevert(key) : undefined}
                />
              )
            })}
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Brand Assets</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-36 shrink-0 text-xs text-muted-foreground">Logo URL</span>
                <Input
                  value={brandLogo}
                  onChange={(e) => { setBrandLogo(e.target.value); setDirty(true) }}
                  className="h-7 text-xs"
                  placeholder="https://..."
                  aria-label="Brand logo URL"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-36 shrink-0 text-xs text-muted-foreground">Favicon URL</span>
                <Input
                  value={brandFavicon}
                  onChange={(e) => { setBrandFavicon(e.target.value); setDirty(true) }}
                  className="h-7 text-xs"
                  placeholder="https://..."
                  aria-label="Brand favicon URL"
                />
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
