import { v4 } from "uuid";
import { ResponseError } from "./common";

import { execSteps, execTasks, ITask, Task, TaskType } from "./task";

export interface ITaskSwitch extends ITask {
  id: string;
  type: TaskType.Switch;
  path: string;
  case: { [key: string]: Task };
  failed: ResponseError;
  error: ResponseError;
}

export const execTaskSwitch = async (
  _task: any,
  task: any
): Promise<ITaskSwitch> => {
  let document: ITaskSwitch;
  delete _task.branches;

  const ts = task.properties?.taskSettings || {};

  // DEFENSIVE: Branches may be at task.branches (correct) or
  // taskSettings.branches / taskSettings.properties.branches (LLM mistake)
  const hasTopBranches = task.branches && Object.keys(task.branches).some(
    (k: string) => Array.isArray(task.branches[k]) && task.branches[k].length > 0
  );
  const branchSource = hasTopBranches
    ? task.branches
    : (ts.branches || ts.properties?.branches || {});

  let branches: any = {};

  for (const key of Object.keys(branchSource)) {
    let branch = branchSource[key] || [];

    if (branch?.length > 0) {
      branches[key] = await execTasks(branch);
    }
  }

  const defaultCase = branches.hasOwnProperty("default")
    ? branches.default
    : [];

  delete branches.default;

  // Clean settings: remove branch/double-nested keys before spreading
  const cleanSettings = { ...ts };
  delete cleanSettings.branches;
  delete cleanSettings.properties;

  document = {
    ..._task,
    ...cleanSettings,
    case: branches,
    default: defaultCase,
  };

  return document;
};

export const execStepSwitch = (task: any) => {
  const branches: any = {
    default: execSteps(task.default),
  };

  for (const key of Object.keys(task.case)) {
    let branch = task.case[key] || [];
    if (branch?.length > 0) {
      let cases = execSteps(branch);
      branches[key] = cases;
    }
  }

  // Ensure method is preserved for router components
  const method = task.method || task.taskSettings?.method;

  let taskDefinition: any = {
    id: task.id || task.type,  // Preserve execution ID for state storage: state[task.id]
    _id: v4(),                 // New AI identifier
    componentType: task.componentType || "switch",
    type: task.type,
    name: task.name || task.id || task.type,
    branches: branches,
    properties: {
      type: method,
      taskSettings: {
        ...task,
        method: method, // Ensure method is in taskSettings
        // default: undefined,
        case: {},
      },
    },
  };
  delete taskDefinition.properties.taskSettings.default;
  return taskDefinition;
};
