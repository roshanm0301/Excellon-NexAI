import { SwitchStep, TaskStep, Uid, Step, Branches, Properties } from "../../../designer";

/**
 * Task definition for creating nested tasks in branches (from AI assistant)
 * 
 * Two identifiers:
 * - taskId: Execution ID (camelCase, no spaces) â†’ state storage key
 *   Example: "getUser" â†’ state["getUser"] = response
 *   Data path: {$.getUser.data} â†’ resolves to state["getUser"].data
 * 
 * - taskName: Display name (readable, can have spaces) â†’ shown in designer
 *   Example: "Get User" â†’ displayed in workflow designer UI
 * 
 * taskId should be:
 * - Unique within the workflow (to avoid state key conflicts)
 * - A valid JavaScript property name (camelCase, no spaces)
 * - Descriptive (e.g., "getUser", "createOrder", "validateInput")
 */
export interface TaskDefinition {
  taskType: string;
  /** 
   * REQUIRED: Execution ID used as state storage key.
   * Must be: camelCase, no spaces, valid JS property name.
   * Subsequent tasks reference this via {$.taskId.data}
   * Example: "getUser" â†’ {$.getUser.data}
   */
  taskId: string;
  /** 
   * OPTIONAL: Display name shown in designer UI.
   * Can have spaces, more readable.
   * If not provided, taskId is used for display.
   * Example: "Get User"
   */
  taskName?: string;
  properties?: Record<string, unknown>;
  branches?: BranchDefinition;
}

/**
 * Branch definition for branching tasks
 */
export interface BranchDefinition {
  onSuccess?: TaskDefinition[];
  onFailure?: TaskDefinition[];
  tasks?: TaskDefinition[];
  rollback?: TaskDefinition[];
  [key: string]: TaskDefinition[] | undefined;
}

/**
 * Task types that use branching (componentType: "switch")
 */
const BRANCHING_TASK_TYPES = new Set(['Condition', 'Switch', 'Iterator', 'Loop', 'Transaction', 'Promise', 'State']);

/**
 * Get default branches for a branching task type
 */
function getDefaultBranchesForType(taskType: string): Branches {
  switch (taskType) {
    case 'Condition':
      return { onSuccess: [], onFailure: [] };
    case 'Switch':
      return { case1: [], case2: [], default: [] };
    case 'Transaction':
      return { tasks: [], rollback: [] };
    case 'Iterator':
    case 'Loop':
    case 'Promise':
    case 'State':
      return { tasks: [] };
    default:
      return {};
  }
}

/**
 * Validate taskId for use as state storage key (execution ID)
 * - Must not be empty
 * - Must be a valid JavaScript property name (camelCase, no spaces)
 * - Used for data path references: {$.taskId.data}
 */
function validateTaskId(taskId: string, taskType: string): string {
  if (!taskId || taskId.trim() === '') {
    // Fallback to taskType if id is missing
    return taskType;
  }

  // Sanitize: remove spaces and ensure valid property name for state storage
  const sanitized = taskId.trim().replaceAll(/\s+/g, '');
  if (sanitized !== taskId) {
  }

  return sanitized;
}

/**
 * Normalize properties that may have been double-wrapped by the LLM.
 *
 * Common LLM mistakes this fixes:
 * 1. Double-nested properties: { properties: { conditions: {...} } }
 *    â†’ flattened to { conditions: {...} }
 * 2. Branches placed inside properties instead of the separate branches param:
 *    { branches: { onSuccess: [...] }, conditions: {...} }
 *    â†’ branches extracted, properties cleaned to { conditions: {...} }
 * 3. Branch child tasks in flat "Action Definition" format:
 *    { type: "Request", method: "Action", schema: "..." }
 *    â†’ converted to proper TaskDefinition: { taskType: "Request", taskId: "...", properties: { method: "Action", ... } }
 */
function normalizeProperties(
  properties: Record<string, unknown> | undefined,
  existingBranches: BranchDefinition | undefined,
  taskType: string
): { cleanProps: Record<string, unknown>; effectiveBranches: BranchDefinition | undefined } {
  if (!properties) {
    return { cleanProps: {}, effectiveBranches: existingBranches };
  }

  let cleanProps = { ...properties };
  let effectiveBranches = existingBranches;

  // Fix 1: Unwrap double-nested properties
  // LLM sometimes passes { properties: { conditions: {...} } } instead of { conditions: {...} }
  if (cleanProps.properties && typeof cleanProps.properties === 'object' && !Array.isArray(cleanProps.properties)) {
    const inner = cleanProps.properties as Record<string, unknown>;
    delete cleanProps.properties;
    cleanProps = { ...cleanProps, ...inner };
  }

  // Fix 2: Extract branches from properties if LLM put them there
  // LLM sometimes passes { conditions: {...}, branches: { onSuccess: [...] } } all in properties
  if (cleanProps.branches && typeof cleanProps.branches === 'object') {
    const branchesInProps = cleanProps.branches as Record<string, unknown>;
    // Only use these branches if no explicit branches were provided separately
    if (!effectiveBranches || Object.keys(effectiveBranches).every(k => {
      const v = effectiveBranches![k];
      return !v || (Array.isArray(v) && v.length === 0);
    })) {
      effectiveBranches = branchesInProps as BranchDefinition;
    }
    delete cleanProps.branches;
  }

  // Fix 2b: Also check for branch-like keys at root of properties (flat action format)
  // LLM sometimes passes { conditions: {...}, onSuccess: [...], onFailure: [...] } all in properties
  const branchKeyMap: Record<string, string[]> = {
    Condition: ['onSuccess', 'onFailure'],
    Switch: ['case', 'default'],
    Iterator: ['tasks'],
    Loop: ['tasks'],
    Transaction: ['tasks', 'rollback'],
    Promise: ['tasks'],
    State: ['tasks'],
  };
  const branchKeys = branchKeyMap[taskType];
  if (branchKeys && BRANCHING_TASK_TYPES.has(taskType)) {
    const hasBranchKeysInProps = branchKeys.some(k => cleanProps[k] !== undefined);
    const noBranchesProvided = !effectiveBranches || Object.keys(effectiveBranches).every(k => {
      const v = effectiveBranches![k];
      return !v || (Array.isArray(v) && v.length === 0);
    });
    if (hasBranchKeysInProps && noBranchesProvided) {
      const extractedBranches: BranchDefinition = {};
      for (const k of branchKeys) {
        if (cleanProps[k] !== undefined) {
          // Handle Switch 'case' which is an object of arrays, not an array itself
          if (k === 'case' && typeof cleanProps[k] === 'object' && !Array.isArray(cleanProps[k])) {
            const cases = cleanProps[k] as Record<string, unknown[]>;
            for (const [caseName, caseTasks] of Object.entries(cases)) {
              if (Array.isArray(caseTasks)) {
                extractedBranches[caseName] = caseTasks as TaskDefinition[];
              }
            }
          } else if (Array.isArray(cleanProps[k])) {
            extractedBranches[k] = cleanProps[k] as TaskDefinition[];
          }
          delete cleanProps[k];
        }
      }
      if (Object.keys(extractedBranches).length > 0) {
        effectiveBranches = extractedBranches;
      }
    }
  }

  return { cleanProps, effectiveBranches };
}

/**
 * Normalize a branch child task that may be in flat "Action Definition" format
 * into the proper TaskDefinition format expected by createStepFromDefinition.
 *
 * Flat format (what LLM sometimes produces for branch children):
 *   { type: "Request", method: "Action", schema: "...", id: "doSomething", name: "Do Something" }
 *
 * Proper TaskDefinition format:
 *   { taskType: "Request", taskId: "doSomething", taskName: "Do Something",
 *     properties: { method: "Action", schema: "..." } }
 */
function normalizeBranchChild(child: Record<string, unknown>): TaskDefinition {
  // Already in proper TaskDefinition format
  if (child.taskType && typeof child.taskType === 'string') {
    return child as unknown as TaskDefinition;
  }

  // Flat "Action Definition" format â†’ convert to TaskDefinition
  if (child.type && typeof child.type === 'string') {
    const taskType = child.type as string;
    const taskId = (child.id as string) || taskType;
    const taskName = (child.name as string) || taskId;

    // Collect everything except meta-fields into properties
    const properties: Record<string, unknown> = {};
    const metaKeys = new Set(['id', 'type', 'name', 'componentType', '_id']);
    // Also separate branch-like keys
    const branchLikeKeys = new Set(['onSuccess', 'onFailure', 'tasks', 'rollback', 'case', 'default']);

    const branches: BranchDefinition = {};
    for (const [key, value] of Object.entries(child)) {
      if (metaKeys.has(key)) continue;
      if (branchLikeKeys.has(key) && (Array.isArray(value) || (typeof value === 'object' && value !== null))) {
        if (key === 'case' && typeof value === 'object' && !Array.isArray(value)) {
          for (const [caseName, caseTasks] of Object.entries(value as Record<string, unknown>)) {
            if (Array.isArray(caseTasks)) {
              branches[caseName] = caseTasks as TaskDefinition[];
            }
          }
        } else if (Array.isArray(value)) {
          branches[key] = value as TaskDefinition[];
        }
      } else {
        properties[key] = value;
      }
    }

    return {
      taskType,
      taskId,
      taskName,
      properties,
      branches: Object.keys(branches).length > 0 ? branches : undefined,
    };
  }

  // Fallback: treat as-is (may fail downstream but at least won't crash here)
  return child as unknown as TaskDefinition;
}

/**
 * Recursively create a Step (task or switch) from a TaskDefinition
 * This handles nested branching structures
 * 
 * IMPORTANT: Properties are wrapped in { type, taskSettings: {...} } format
 * to match the expected structure in execTasks for API conversion
 * 
 * CRITICAL: Two separate fields:
 * - step.id = taskId (execution key) â†’ becomes task.id in API â†’ state[task.id] = response
 * - step.name = taskName (display) â†’ shown in designer UI
 * 
 * Data paths use taskId: {$.getUser.data} â†’ state["getUser"].data
 * 
 * DEFENSIVE: Handles common LLM format mistakes:
 * - Branches placed inside properties instead of separate branches param
 * - Double-nested properties: { properties: { conditions: {...} } }
 * - Branch children in flat Action Definition format instead of TaskDefinition format
 */
function createStepFromDefinition(def: TaskDefinition): Step {
  const isBranchingTask = BRANCHING_TASK_TYPES.has(def.taskType);

  // Validate taskId - critical for state storage and data path references
  const validatedId = validateTaskId(def.taskId, def.taskType);

  // Display name: use taskName if provided, otherwise use taskId
  const displayName = def.taskName || validatedId;

  // Normalize properties: fix double-nesting, extract misplaced branches
  const { cleanProps, effectiveBranches } = normalizeProperties(def.properties, def.branches, def.taskType);

  // Wrap properties in taskSettings structure to match expected format
  // The execTasks function expects: task.properties.taskSettings
  const wrappedProperties: Properties = {
    type: (cleanProps?.method as string) || def.taskType,
    taskSettings: {
      ...cleanProps
    }
  };

  if (isBranchingTask) {
    // Create a switch-type step with branches
    const defaultBranches = getDefaultBranchesForType(def.taskType);
    const branches: Branches = { ...defaultBranches };

    // Process provided branches (now using effectiveBranches which may have been extracted from properties)
    if (effectiveBranches) {
      for (const [branchName, taskDefs] of Object.entries(effectiveBranches)) {
        if (taskDefs && Array.isArray(taskDefs)) {
          // Normalize each child: handle flat Action Definition format
          branches[branchName] = taskDefs.map(taskDef => {
            const normalized = normalizeBranchChild(taskDef as unknown as Record<string, unknown>);
            return createStepFromDefinition(normalized);
          });
        }
      }
    }

    const switchStep: SwitchStep = {
      id: validatedId,           // Execution ID for state storage: state[task.id]
      _id: Uid.next(),           // AI assistant identifier for find/update/delete
      componentType: 'switch',
      type: def.taskType,
      name: displayName,         // Display name shown in designer UI
      properties: wrappedProperties,
      branches
    };

    return switchStep;
  } else {
    // Create a regular task step
    const taskStep: TaskStep = {
      id: validatedId,           // Execution ID for state storage: state[task.id]
      _id: Uid.next(),           // AI assistant identifier for find/update/delete
      componentType: 'task',
      type: def.taskType,
      name: displayName,         // Display name shown in designer UI
      properties: wrappedProperties
    };

    return taskStep;
  }
}

/**
 * Create a task with optional branches
 * This is the main function used by the AI assistant to create tasks
 * 
 * @param type - Task type (e.g., "Document", "Condition", "Iterator")
 * @param taskId - Execution ID (camelCase, no spaces) - used for state storage: {$.taskId.data}
 * @param properties - Task properties/configuration
 * @param branches - Optional branches for branching tasks (Condition, Switch, etc.)
 * @param taskName - Optional display name (can have spaces) - shown in designer UI
 * @returns A TaskStep or SwitchStep depending on the task type
 */
export function createTaskWithBranches(
  type: string,
  taskId: string,
  properties: Record<string, unknown> = {},
  branches?: BranchDefinition,
  taskName?: string
): Step {
  const def: TaskDefinition = {
    taskType: type,
    taskId: taskId,
    taskName: taskName,
    properties,
    branches
  };

  return createStepFromDefinition(def);
}

export function createTaskStep(): TaskStep {
  return {
    id: Uid.next(),
    _id: Uid.next(),  // AI assistant identifier
    componentType: "task",
    type: "Task",
    name: "Test",
    properties: {},
  };
}

export function createSwitchStep(): SwitchStep {
  return {
    id: Uid.next(),
    _id: Uid.next(),  // AI assistant identifier
    componentType: "switch",
    type: "Switch",
    name: "Switch",
    properties: {},
    branches: {
      case1: [],
      case2: [],
      default: [],
    },
  };
}


export function createConditionStep(): SwitchStep {
  return {
    id: Uid.next(),
    _id: Uid.next(),  // AI assistant identifier
    componentType: "switch",
    type: "Condition",
    name: "Condition",
    properties: {},
    branches: {
      onSuccess: [],
      onFailure: [],
    },
  };
}

export function createPromise(): SwitchStep {
  return {
    id: Uid.next(),
    _id: Uid.next(),  // AI assistant identifier
    componentType: "switch",
    type: "Promise",
    name: "Promise",
    properties: {},
    branches: {
      tasks: [],
    },
  };
}

export function createTransactionStep(): SwitchStep {
  return {
    id: Uid.next(),
    _id: Uid.next(),  // AI assistant identifier
    componentType: "switch",
    type: "Transaction",
    name: "Transaction",
    properties: {},
    branches: {
      tasks: [],
      rollback: [],
    },
  };
}

export function createIteratorStep(): SwitchStep {
  return {
    id: Uid.next(),
    _id: Uid.next(),  // AI assistant identifier
    componentType: "switch",
    type: "Iterator",
    name: "Iterator",
    properties: {},
    branches: {
      tasks: [],
    },
  };
}

export function createStateStep(): SwitchStep {
  return {
    id: Uid.next(),
    _id: Uid.next(),  // AI assistant identifier
    componentType: "switch",
    type: "State",
    name: "State",
    properties: {},
    branches: {
      tasks: [],
    },
  };
}

export function createLoopStep(): SwitchStep {
  return {
    id: Uid.next(),
    _id: Uid.next(),  // AI assistant identifier
    componentType: "switch",
    type: "Loop",
    name: "Loop",
    properties: {},
    branches: {
      tasks: [],
    },
  };
}

// Common Task
export function createTask(type: string, name: string, field: {}): TaskStep {
  return {
    id: Uid.next(),
    _id: Uid.next(),  // AI assistant identifier
    componentType: "task",
    type: type,
    name: name,
    properties: field,
  };
}
