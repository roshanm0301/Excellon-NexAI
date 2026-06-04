import { execTasks, ITask, Task, TaskType } from "./task";

export interface ITaskState extends ITask {
    id: string;
    type: TaskType.State;
    path: string;
    tasks: Task[];
}

export const execState = async (_task: any, task: any): Promise<ITaskState> => {
    let state: ITaskState;
    delete _task.branches;

    state = {
        ..._task,
        ...task.properties.taskSettings,
        tasks: await execTasks(task.branches.tasks)
    };

    return state;
};