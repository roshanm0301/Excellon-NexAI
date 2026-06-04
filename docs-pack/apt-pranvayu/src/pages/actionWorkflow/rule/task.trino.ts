import { ITask, TaskType } from "./task";

export interface ITaskTrino extends ITask {
    type: TaskType.Trino;
    options: string;
}

export interface ITaskQuery extends ITaskTrino {
    query: string;
    method: TrinoMethodType.Query;
    bucketName: string;
    ObjectLocking: boolean;
}

export type TaskTrino = ITaskQuery;

export const execTaskTrino = async (task: any, taskSettings: TaskTrino): Promise<TaskTrino> => {
    let trino: TaskTrino = { ...task, ...taskSettings };
    return trino;
};

export enum TrinoMethodType {
    "Query" = "Query",
}