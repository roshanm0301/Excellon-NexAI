import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import type { FieldErrors, Resolver } from "react-hook-form"
import { useQueryClient } from "@tanstack/react-query"
import type { ComponentNode, OriginState, PropValue, SetOp } from "@/domain/types"
import { SEMANTIC_CONTRACTS } from "@/domain/types"
import type { PropDefinition } from "@/domain/types"
import { useOverrideNode } from "@/shared/query/mutations"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { PropertyRow } from "@/shared/ui"
import { Button } from "@/shared/ui"
import { BindingPicker } from "./BindingPicker"
import { OverridePrompt, RevertDialog } from "./OverridePrompt"

interface PropsTabProps {
  node: ComponentNode
  origin: OriginState
}

// Inline zodResolver — avoids @hookform/resolvers dependency
function buildZodSchema(props: Record<string, PropDefinition>): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const [key, def] of Object.entries(props)) {
    let fieldSchema: z.ZodTypeAny
    switch (def.type) {
      case "number":
        fieldSchema = z.number()
        break
      case "boolean":
        fieldSchema = z.boolean()
        break
      case "string[]":
        fieldSchema = z.array(z.string())
        break
      case "number[]":
        fieldSchema = z.array(z.number())
        break
      default:
        fieldSchema = z.string()
        break
    }
    if (!def.required) {
      fieldSchema = fieldSchema.optional()
    }
    shape[key] = fieldSchema
  }
  return z.object(shape)
}

function makeZodResolver<T extends z.ZodTypeAny>(
  schema: T,
): Resolver<z.infer<T>> {
  return async (values) => {
    const result = schema.safeParse(values)
    if (result.success) {
      return { values: result.data as z.infer<T>, errors: {} }
    }
    const errors: FieldErrors<z.infer<T>> = {}
    for (const issue of result.error.issues) {
      const path = issue.path[0] as string
      if (path) {
        // @ts-expect-error — dynamic key assignment; safe here
        errors[path] = { type: "manual", message: issue.message }
      }
    }
    return { values: {} as z.infer<T>, errors }
  }
}

export function PropsTab({ node, origin }: PropsTabProps) {
  const contract = SEMANTIC_CONTRACTS[node.semanticType]
  const editingLevel = useWorkspaceStore((s) => s.editingLevel)
  const overrideNode = useOverrideNode()
  const queryClient = useQueryClient()

  const [bindingPickerOpen, setBindingPickerOpen] = useState(false)
  const [bindingPickerPropKey, setBindingPickerPropKey] = useState("")
  const [overridePromptOpen, setOverridePromptOpen] = useState(false)
  const [revertDialogOpen, setRevertDialogOpen] = useState(false)
  const [revertPropKey, setRevertPropKey] = useState("")

  const props = contract?.props ?? {}
  const schema = buildZodSchema(props)
  type FormValues = Record<string, PropValue | undefined>

  const defaultValues: FormValues = {}
  for (const key of Object.keys(props)) {
    defaultValues[key] = node.props?.[key] ?? undefined
  }

  const { handleSubmit, setValue, watch, formState } = useForm<FormValues>({
    resolver: makeZodResolver(schema),
    defaultValues,
  })

  const formValues = watch()

  const onSubmit = useCallback(
    (data: FormValues) => {
      const ops: SetOp[] = []
      for (const key of Object.keys(formState.dirtyFields)) {
        ops.push({ op: "set", path: `props.${key}`, value: data[key] })
      }
      if (ops.length === 0) return
      overrideNode.mutate(
        { logicalKey: node.logicalKey, level: editingLevel, ops },
        {
          onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ["node"] })
            void queryClient.invalidateQueries({ queryKey: ["preview"] })
          },
        },
      )
    },
    [formState.dirtyFields, overrideNode, node.logicalKey, editingLevel, queryClient],
  )

  if (!contract) {
    return (
      <p className="p-3 text-xs text-muted-foreground">
        No prop contract for {node.semanticType}
      </p>
    )
  }

  const isInherited = origin === "inherited"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-1 px-1">
      {isInherited && (
        <div className="my-2 rounded border border-dashed border-muted-foreground/40 px-3 py-2 text-xs text-muted-foreground">
          This node is inherited — override to edit properties
        </div>
      )}

      <div className={isInherited ? "pointer-events-none opacity-60" : ""}>
        {Object.entries(props).map(([key, def]) => (
          <PropertyRow
            key={key}
            propKey={key}
            label={key}
            propType={def.type}
            required={def.required}
            value={formValues[key]}
            origin={origin}
            onChangeValue={(v) => {
              setValue(key, v, { shouldDirty: true, shouldValidate: true })
            }}
            onClickBind={() => {
              setBindingPickerPropKey(key)
              setBindingPickerOpen(true)
            }}
            onRevert={() => {
              setRevertPropKey(key)
              setRevertDialogOpen(true)
            }}
          />
        ))}
      </div>

      <Button
        type="submit"
        size="sm"
        disabled={isInherited || !formState.isDirty || !formState.isValid || overrideNode.isPending}
        className="mt-2 w-full text-xs"
      >
        {overrideNode.isPending ? "Saving…" : "Save Changes"}
      </Button>

      <BindingPicker
        open={bindingPickerOpen}
        onOpenChange={setBindingPickerOpen}
        propKey={bindingPickerPropKey}
        propType={props[bindingPickerPropKey]?.type ?? "string"}
        onBind={(binding) => {
          setValue(bindingPickerPropKey, binding, { shouldDirty: true })
        }}
      />

      <OverridePrompt
        open={overridePromptOpen}
        onOpenChange={setOverridePromptOpen}
        node={node}
        editingLevel={editingLevel}
      />

      <RevertDialog
        open={revertDialogOpen}
        onOpenChange={setRevertDialogOpen}
        propKey={revertPropKey}
        logicalKey={node.logicalKey}
        editingLevel={editingLevel}
      />
    </form>
  )
}
