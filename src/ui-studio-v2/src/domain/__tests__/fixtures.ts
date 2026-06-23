// Shared test fixtures for domain layer tests

import type { Audit, NodeBase, CascadeLevel, Binding, OverrideOp } from "@/domain/types/base"
import type {
  ComponentNode,
  PageNode,
  ViewNode,
  DataSourceNode,
  ApplicationNode,
  EventNode,
  ActionNode,
  WorkflowBindingNode,
  SectionNode,
} from "@/domain/types/nodes"

export function makeAudit(overrides?: Partial<Audit>): Audit {
  return {
    createdBy: "test-user",
    createdAt: "2024-01-01T00:00:00Z",
    modifiedBy: "test-user",
    modifiedAt: "2024-01-01T00:00:00Z",
    ...overrides,
  }
}

export function makeNodeBase(
  overrides?: Partial<NodeBase> & { logicalKey?: string; cascadeLevel?: CascadeLevel },
): NodeBase {
  return {
    id: "uuid-" + Math.random().toString(36).slice(2, 10),
    logicalKey: overrides?.logicalKey ?? "node.test",
    cascadeLevel: overrides?.cascadeLevel ?? "platform",
    objectVersion: 1,
    audit: makeAudit(),
    ...overrides,
  }
}

export function makeComponent(overrides?: Partial<ComponentNode>): ComponentNode {
  return {
    ...makeNodeBase({ logicalKey: "cmp.test" }),
    kind: "component",
    semanticType: "Button",
    props: { label: "Test" },
    ...overrides,
  }
}

export function makePage(overrides?: Partial<PageNode>): PageNode {
  return {
    ...makeNodeBase({ logicalKey: "page.test" }),
    kind: "page",
    archetype: "list-report",
    route: "/test",
    title: "Test Page",
    views: ["view.test"],
    layoutRef: "layout.test",
    ...overrides,
  }
}

export function makeView(overrides?: Partial<ViewNode>): ViewNode {
  return {
    ...makeNodeBase({ logicalKey: "view.test" }),
    kind: "view",
    sections: ["section.test"],
    layoutRef: "layout.test",
    ...overrides,
  }
}

export function makeSection(overrides?: Partial<SectionNode>): SectionNode {
  return {
    ...makeNodeBase({ logicalKey: "section.test" }),
    kind: "section",
    components: ["cmp.test"],
    ...overrides,
  }
}

export function makeDataSource(overrides?: Partial<DataSourceNode>): DataSourceNode {
  return {
    ...makeNodeBase({ logicalKey: "ds.test" }),
    kind: "dataSource",
    dataSourceType: "entity",
    targetRef: "entity.Test",
    ...overrides,
  }
}

export function makeApplication(overrides?: Partial<ApplicationNode>): ApplicationNode {
  return {
    ...makeNodeBase({ logicalKey: "app.test" }),
    kind: "application",
    name: "Test App",
    verticalScope: "automotive",
    targetProfiles: ["web"],
    modules: [],
    navigationRef: "nav.test",
    themeRef: "theme.test",
    defaultEntryRef: "page.home",
    ...overrides,
  }
}

export function makeEvent(overrides?: Partial<EventNode>): EventNode {
  return {
    ...makeNodeBase({ logicalKey: "evt.test" }),
    kind: "event",
    trigger: "onClick",
    sourceRef: "cmp.test",
    actions: ["action.test"],
    ...overrides,
  }
}

export function makeAction(overrides?: Partial<ActionNode>): ActionNode {
  return {
    ...makeNodeBase({ logicalKey: "action.test" }),
    kind: "action",
    actionKind: "navigate",
    target: "/home",
    ...overrides,
  }
}

export function makeWorkflowBinding(
  overrides?: Partial<WorkflowBindingNode>,
): WorkflowBindingNode {
  return {
    ...makeNodeBase({ logicalKey: "wb.test" }),
    kind: "workflowBinding",
    workflowRef: "wf.test",
    bindingKind: "show-current-state",
    attachPoint: "view.test",
    ...overrides,
  }
}

export function makeBinding(ref: string, kind: Binding["bind"]["kind"] = "dataSource"): Binding {
  return { bind: { kind, ref } }
}

export function makeOverrideOps(...ops: OverrideOp[]): OverrideOp[] {
  return ops
}
