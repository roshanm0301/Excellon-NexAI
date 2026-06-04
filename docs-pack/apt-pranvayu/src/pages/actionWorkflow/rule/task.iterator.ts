import { execTasks, ITask, Task, TaskType } from "./task";
import { Condition } from "./task.condition";

export interface ITaskIterator extends ITask {
    id: string;
    type: TaskType.Iterator;
    method: string,
    path: string,
    var: string,
    index: string,
    async: boolean;
    tasks: Task[],
    break: boolean,
    breakConditions: Condition;
}

export const execIterator = async (_task: any, task: any): Promise<ITaskIterator> => {
    let iterator: ITaskIterator;
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

    iterator = {
        ..._task,
        ...cleanSettings,
        tasks: await execTasks(branchTasks)
    };

    return iterator;
};