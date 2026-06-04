import { execTasks, ITask, Task, TaskType } from "./task";
import { Condition } from "./task.condition";

export interface ITaskLoop extends ITask {
    id: string;
    start: number;
    type: TaskType.Loop;
    tasks: Task[];
    iterations: number | string;
    index: string;
    break: boolean;
    breakConditions: Condition;
}

export const execTaskLoop = async (_task: any, task: any): Promise<ITaskLoop> => {
    let loop: ITaskLoop;
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

    loop = {
        ..._task,
        ...cleanSettings,
        tasks: await execTasks(branchTasks)
    };

    return loop;
};