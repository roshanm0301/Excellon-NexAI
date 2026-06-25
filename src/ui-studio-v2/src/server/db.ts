import type { CascadeLevel, NodeBase, MetaNode, Issue } from "../domain/types"
import type { AppSummary, CreateAppInput, CreatePageInput, Lock } from "../services/interfaces"
import type { PublishResult } from "../services/interfaces"
import { AppModel, LockModel, NodeModel, VersionModel } from "./models"
import { CURRENT_USER_ID, seedLocks } from "./reference/presence"
import { seedApp, verticalNodes, tenantNodes, orgNodes } from "./reference/studio-seed"
import { buildPageScaffold } from "./lib/page-scaffold"
import { buildLayeredNodes, runValidationForNodes } from "./state"

const DEFAULT_APP_ID = seedApp.id
let seedPromise: Promise<void> | null = null

export async function ensureSeedData(): Promise<void> {
  if (seedPromise) {
    await seedPromise
    return
  }

  seedPromise = (async () => {
    await AppModel.updateOne(
      { id: DEFAULT_APP_ID },
      { $setOnInsert: seedApp },
      { upsert: true },
    )

    const seedNodes = [...verticalNodes, ...tenantNodes, ...orgNodes]
    for (const node of seedNodes) {
      await NodeModel.updateOne(
        {
          appId: DEFAULT_APP_ID,
          logicalKey: node.logicalKey,
          cascadeLevel: node.cascadeLevel,
        },
        {
          $setOnInsert: {
            id: node.id,
            appId: DEFAULT_APP_ID,
            logicalKey: node.logicalKey,
            cascadeLevel: node.cascadeLevel,
            payload: node,
          },
        },
        { upsert: true },
      )
    }

    for (const lock of seedLocks) {
      await LockModel.updateOne(
        { key: lock.key },
        { $setOnInsert: lock },
        { upsert: true },
      )
    }
  })()

  try {
    await seedPromise
  } finally {
    seedPromise = null
  }
}

export async function resetStudioData(): Promise<void> {
  seedPromise = null
  await Promise.all([
    AppModel.deleteMany({}),
    NodeModel.deleteMany({}),
    VersionModel.deleteMany({}),
    LockModel.deleteMany({}),
  ])
  await ensureSeedData()
}

export async function listApps(): Promise<AppSummary[]> {
  const docs = await AppModel.find({}).sort({ createdAt: 1 }).lean()
  return docs.map((doc) => ({
    id: doc.id,
    name: doc.name,
    vertical: doc.vertical,
    description: doc.description,
    createdAt: doc.createdAt,
    modifiedAt: doc.modifiedAt,
  }))
}

export async function createApp(input: CreateAppInput): Promise<AppSummary> {
  const now = new Date().toISOString()
  const appId = `app-${Date.now()}`
  const appSummary: AppSummary = {
    id: appId,
    name: input.name,
    vertical: input.vertical,
    description: input.description ?? "",
    createdAt: now,
    modifiedAt: now,
  }

  await AppModel.create(appSummary)

  const appNode: MetaNode = {
    id: appId,
    logicalKey: appId,
    cascadeLevel: "vertical",
    objectVersion: 1,
    audit: {
      createdBy: CURRENT_USER_ID,
      createdAt: now,
      modifiedBy: CURRENT_USER_ID,
      modifiedAt: now,
    },
    kind: "application",
    name: input.name,
    children: [],
  } as MetaNode

  await upsertNode(appId, appNode)
  return appSummary
}

export async function getAppNodes(appId: string): Promise<NodeBase[]> {
  const normalizedAppId = appId || DEFAULT_APP_ID
  const docs = await NodeModel.find({ appId: normalizedAppId }).lean()
  return docs.map((doc) => doc.payload as NodeBase)
}

export async function getLayeredNodes(appId: string, scopeId: string): Promise<Map<CascadeLevel, NodeBase[]>> {
  const nodes = await getAppNodes(appId)
  return buildLayeredNodes(nodes, scopeId)
}

export async function getNodeByIdOrLogicalKey(id: string): Promise<NodeBase | null> {
  const doc = await NodeModel.findOne({
    $or: [{ id }, { logicalKey: id }],
  }).lean()

  return doc ? (doc.payload as NodeBase) : null
}

export async function upsertNode(appId: string, node: NodeBase): Promise<void> {
  await NodeModel.findOneAndUpdate(
    { appId, logicalKey: node.logicalKey, cascadeLevel: node.cascadeLevel },
    {
      id: node.id,
      appId,
      logicalKey: node.logicalKey,
      cascadeLevel: node.cascadeLevel,
      payload: node,
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  )
}

export async function createNode(appId: string, body: Record<string, unknown>): Promise<MetaNode> {
  const now = new Date().toISOString()
  const node: MetaNode = {
    id: `uuid-gen-${Date.now()}`,
    logicalKey: body.logicalKey as string,
    cascadeLevel: body.cascadeLevel as CascadeLevel,
    objectVersion: 1,
    audit: {
      createdBy: CURRENT_USER_ID,
      createdAt: now,
      modifiedBy: CURRENT_USER_ID,
      modifiedAt: now,
    },
    kind: body.kind as MetaNode["kind"],
    ...(body.data as Record<string, unknown>),
  } as MetaNode

  await upsertNode(appId, node)
  return node
}

export async function createPage(input: CreatePageInput): Promise<MetaNode> {
  const title = input.title ?? "Untitled Page"
  const slug = toCamelCase(title)
  const now = new Date().toISOString()
  const audit = {
    createdBy: CURRENT_USER_ID,
    createdAt: now,
    modifiedBy: CURRENT_USER_ID,
    modifiedAt: now,
  }

  const scaffoldNodes = buildPageScaffold(
    slug,
    title,
    input.archetype,
    input.entityRef,
    input.cascadeLevel,
    audit,
  )

  for (const node of scaffoldNodes) {
    await upsertNode(input.appId, node)
  }

  const moduleDoc = await NodeModel.findOne({
    appId: input.appId,
    logicalKey: input.moduleKey,
    cascadeLevel: input.cascadeLevel,
  })

  if (moduleDoc) {
    const moduleNode = moduleDoc.payload as MetaNode & { pages?: string[] }
    if (moduleNode.kind === "module") {
      moduleNode.pages = [...(moduleNode.pages ?? []), `page.${slug}`]
      moduleNode.audit = {
        ...moduleNode.audit,
        modifiedBy: CURRENT_USER_ID,
        modifiedAt: now,
      }
      await upsertNode(input.appId, moduleNode)
    }
  }

  return scaffoldNodes[scaffoldNodes.length - 1] as MetaNode
}

export async function createOverrideNode(
  appId: string,
  logicalKey: string,
  level: CascadeLevel,
  ops: unknown[],
): Promise<NodeBase> {
  const now = new Date().toISOString()
  const overrideNode: NodeBase = {
    id: `uuid-ovr-${Date.now()}`,
    logicalKey: `${logicalKey}.override.${level}.${Date.now()}`,
    cascadeLevel: level,
    overrideOf: logicalKey,
    overrideOps: ops as NodeBase["overrideOps"],
    objectVersion: 1,
    audit: {
      createdBy: CURRENT_USER_ID,
      createdAt: now,
      modifiedBy: CURRENT_USER_ID,
      modifiedAt: now,
    },
  }

  await upsertNode(appId, overrideNode)
  return overrideNode
}

export async function nextVersionNumber(appId: string): Promise<number> {
  const latest = await VersionModel.findOne({ appId }).sort({ version: -1 }).lean()
  return latest ? latest.version + 1 : 1
}

export async function snapshotAppNodes(appId: string): Promise<NodeBase[]> {
  const docs = await NodeModel.find({ appId }).sort({ logicalKey: 1 }).lean()
  return docs.map((doc) => doc.payload as NodeBase)
}

export async function createVersion(
  appId: string,
  env: string,
  message: string,
  issues: Issue[],
  snapshot: NodeBase[],
): Promise<PublishResult> {
  const version = await nextVersionNumber(appId)
  const publishedAt = new Date().toISOString()
  await VersionModel.create({
    appId,
    version,
    env,
    publishedAt,
    publishedBy: CURRENT_USER_ID,
    message,
    issues,
    snapshot,
  })

  return {
    success: true,
    artifactVersion: version,
    message,
    issues,
  }
}

export async function computePublishResult(
  appId: string,
  env: string,
  scopeId: string,
): Promise<PublishResult> {
  const layeredNodes = await getLayeredNodes(appId, scopeId)
  const issues = runValidationForNodes(layeredNodes)
  const hasErrors = issues.some((issue) => issue.severity === "error")
  if (hasErrors) {
    return {
      success: false,
      artifactVersion: await nextVersionNumber(appId),
      message: "Publish blocked: errors found",
      issues,
    }
  }

  const snapshot = await snapshotAppNodes(appId)
  return createVersion(appId, env, "Published successfully", issues, snapshot)
}

export async function listVersions(appId: string) {
  return VersionModel.find({ appId }).sort({ version: 1 }).lean()
}

export async function getVersion(appId: string, version: number) {
  return VersionModel.findOne({ appId, version }).lean()
}

export async function upsertLock(lock: Lock): Promise<void> {
  await LockModel.findOneAndUpdate({ key: lock.key }, lock, { upsert: true, returnDocument: "after" })
}

export async function listLocks(): Promise<Lock[]> {
  const docs = await LockModel.find({}).lean()
  return docs.map((doc) => ({
    key: doc.key,
    heldBy: doc.heldBy,
    acquiredAt: doc.acquiredAt,
    expiresAt: doc.expiresAt,
  }))
}
