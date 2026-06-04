import { v4 } from "uuid";
import { execSteps, execTask, execTasks, ITask, Task, TaskType } from "./task";

export type Condition = {
  and?: Condition[];
  any?: Condition[];
  operator?:
  | "equals"
  | "notEquals"
  | "in"
  | "notIn"
  | "contains"
  | "notContains"
  | "greaterThan"
  | "greaterThanEquals"
  | "lessThan"
  | "lessThanEquals"
  | "isObject"
  | "notObject"
  | "isNaN"
  | "isNumber"
  | "isArray"
  | "notArray"
  | "notNull"
  | "regex"
  | "hasProperty"
  fact?: string;
  value?: string;
};

export interface ITaskCondition extends ITask {
  id: string;
  type: TaskType.Condition;
  conditions: Condition;
  onSuccess: Task[];
  onFailure: Task[];
}

export interface ISubCondition {
  and?: Condition[];
  any?: Condition[];
  operator?:
  | "equals"
  | "notEquals"
  | "in"
  | "notIn"
  | "contains"
  | "notContains"
  | "greaterThan"
  | "greaterThanEquals"
  | "lessThan"
  | "lessThanEquals"
  | "isObject"
  | "notObject"
  | "isNaN"
  | "isNumber"
  | "isArray"
  | "notArray"
  | "notNull"
  | "regex"
  | "hasProperty"
  fact?: string;
  value?: string;
}

export const execTaskCondition = async (
  _task: any,
  task: any
): Promise<ITaskCondition> => {
  let condition: ITaskCondition;
  delete _task.branches;

  const ts = task.properties?.taskSettings || {};

  // DEFENSIVE: Conditions may be at taskSettings.conditions or taskSettings.properties.conditions
  // (LLM sometimes double-wraps: { properties: { conditions: {...} } })
  const conditions = ts.conditions || ts.properties?.conditions || {};

  // DEFENSIVE: Branches may be at task.branches (correct) or
  // taskSettings.branches / taskSettings.properties.branches (LLM mistake)
  const hasTopBranches = (task.branches?.onSuccess?.length > 0 || task.branches?.onFailure?.length > 0);
  const branchSource = hasTopBranches
    ? task.branches
    : (ts.branches || ts.properties?.branches || { onSuccess: [], onFailure: [] });

  // Clean settings: remove branch/double-nested keys before spreading
  const cleanSettings = { ...ts };
  delete cleanSettings.branches;
  delete cleanSettings.properties;

  condition = {
    ..._task,
    ...cleanSettings,
    conditions: { ...conditions },
    onSuccess: await execTasks(branchSource?.onSuccess || []),
    onFailure: await execTasks(branchSource?.onFailure || []),
  };

  return condition;
};

export const execTaskSubCondition = async (
  _task: any,
  task: any
): Promise<ISubCondition> => {
  delete _task.branches;
  delete _task.type;
  let condition: ISubCondition = {
    ..._task,
    ...(task.properties?.taskSettings?.conditions || {}),
    and: await resolveSubCondition(task?.branches.and),
    any: await resolveSubCondition(task?.branches.any),
  };
  return condition;
};

const resolveSubCondition = async (data: any[]) => {
  let items = [];
  for (const item of data) {
    if (item.type === "SubCondition") {
      const _item = { ...item };
      items.push(await execTaskSubCondition(_item, item));
    }
  }
  return items;
};

export const execStepCondition = (task: any) => {
  const branches: any = {
    onSuccess: execSteps(task.onSuccess),
    onFailure: execSteps(task.onFailure),
  };

  let taskDefinition: any = {
    id: task.id || task.type,  // Preserve execution ID for state storage: state[task.id]
    _id: v4(),                 // New AI identifier
    componentType: task.componentType || "switch",
    type: task.type,
    name: task.name || task.id || task.type,
    branches: branches,
    properties: {
      type: task.type,
      taskSettings: {
        ...task,
        onSuccess: [],
        onFailure: [],
      },
    },
  };

  return taskDefinition;
};
