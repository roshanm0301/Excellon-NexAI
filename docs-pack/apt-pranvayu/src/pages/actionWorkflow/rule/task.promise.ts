import { v4 } from "uuid";
import { execSteps, execTask, execTasks, ITask, Task, TaskType } from "./task";

export interface ITaskPromise extends ITask {
  type: TaskType.Promise;
}
export interface ITaskPromiseAll extends ITaskPromise {
  method: "PromiseAll";
  tasks: Task[];
}
export interface ITaskPromiseAllSettled extends ITaskPromise {
  method: "PromiseAllSettled";
  tasks: Task[];
}
export interface ITaskPromiseRace extends ITaskPromise {
  method: "PromiseRace";
  tasks: Task[];
}
export interface ITaskPromiseResolve extends ITaskPromise {
  method: "PromiseResolve";
  tasks: Task[];
}
export interface ITaskPromiseReject extends ITaskPromise {
  method: "PromiseReject";
  tasks: Task[];
}
export type TaskPromise =
  | ITaskPromiseAll
  | ITaskPromiseAllSettled
  | ITaskPromiseRace
  | ITaskPromiseResolve
  | ITaskPromiseReject;

export enum PromiseMethodType {
  "PromiseReject" = "PromiseReject",
  "PromiseResolve" = "PromiseResolve",
  "PromiseRace" = "PromiseRace",
  "PromiseAllSettled" = "PromiseAllSettled",
  "PromiseAll" = "PromiseAll",
}

export const execTaskPromise = async (
  _task: any,
  task: any
): Promise<TaskPromise> => {
  delete _task.branches;

  const ts = task.properties?.taskSettings || {};

  // DEFENSIVE: Branches may be at task.branches.tasks (correct) or
  // taskSettings.branches.tasks / taskSettings.properties.branches.tasks (LLM mistake)
  const branchTasks = (task.branches?.tasks?.length > 0)
    ? task.branches.tasks
    : (ts.branches?.tasks || ts.properties?.branches?.tasks || []);

  // Clean settings: remove branch/double-nested keys before spreading
  const cleanSettings = { ...ts };
  delete cleanSettings.branches;
  delete cleanSettings.properties;

  let promise: TaskPromise = {
    ..._task,
    ...cleanSettings,
    tasks: await execTasks(branchTasks),
  };
  return promise;
};

export const execStepPromise = (task: any) => {
  const branches: any = {
    tasks: execSteps(task?.tasks),
  };

  let taskDefinition: any = {
    id: task.id || task.type,  // Preserve execution ID for state storage: state[task.id]
    _id: v4(),                 // New AI identifier
    componentType: task.componentType || "switch",
    type: task.type,
    name: task.name || task.id || task.type,
    properties: {
      type: task.method,
      taskSettings: {
        ...task,
        tasks: [],
      },
    },
    branches: branches,
  };

  return taskDefinition;
};
