import { v4 } from "uuid";
import { execSteps, execTasks, ITask, Task, TaskType } from "./task";

export interface ITaskTransaction extends ITask {
  id: string;
  type: TaskType.Transaction;
  key: string;
  tasks: Task[];
  rollback: Task[];
}

export const execTaskTransaction = async (
  _task: any,
  task: any
): Promise<ITaskTransaction> => {
  let transaction: ITaskTransaction;
  delete _task.branches;

  const ts = task.properties?.taskSettings || {};

  // DEFENSIVE: Branches may be at task.branches (correct) or
  // taskSettings.branches / taskSettings.properties.branches (LLM mistake)
  const hasTopBranches = (task.branches?.tasks?.length > 0 || task.branches?.rollback?.length > 0);
  const branchSource = hasTopBranches
    ? task.branches
    : (ts.branches || ts.properties?.branches || { tasks: [], rollback: [] });

  // Clean settings: remove branch/double-nested keys before spreading
  const cleanSettings = { ...ts };
  delete cleanSettings.branches;
  delete cleanSettings.properties;

  transaction = {
    ..._task,
    ...cleanSettings,
    tasks: await execTasks(branchSource?.tasks || []),
    rollback: await execTasks(branchSource?.rollback || []),
  };
  return transaction;
};

export const execStepTransaction = (task: any) => {
  const branches: any = {
    tasks: execSteps(task.tasks),
    rollback: execSteps(task.rollback),
  };

  let taskDefinition: any = {
    id: task.id || task.type,  // Preserve execution ID for state storage: state[task.id]
    _id: v4(),                 // New AI identifier
    componentType: task.componentType || "switch",
    type: task.type,
    name: task.name || task.id || task.type,
    properties: {
      type: task.type,
      taskSettings: {
        ...task,
        tasks: [],
        rollback: [],
      },
    },
    branches: branches,
  };

  return taskDefinition;
};
