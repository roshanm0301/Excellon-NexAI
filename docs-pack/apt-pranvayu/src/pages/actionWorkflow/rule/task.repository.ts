import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskRepository extends ITask {
    type: TaskType.Repository;
}

export interface ITaskGetCollection extends ITaskRepository {
    method: 'Collection';
    providerId: string;
    privateKey: string;
    options: string;
    containerId: string;
    subscriptionId: string
}

export interface ITaskGetRepository extends ITaskRepository {
    method: 'Repository';
    providerId: string;
    privateKey: string;
    options: string;
    schema: string
}

export type TaskRepository = ITaskGetCollection | ITaskGetRepository;
export const execTaskRepository = async (task: any, taskSettings: TaskRepository): Promise<TaskRepository> => {
    let document: TaskRepository = { ...task, ...taskSettings };
    return document;
};
