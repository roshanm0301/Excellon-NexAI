import { ITask, TaskType } from "./task";

export interface ITaskCache extends ITask {
    type: TaskType.Cache;
}

export interface ITaskGet extends ITaskCache {
    method: MethodType.Get;
    partitionKey: string;
    schemaId: string;
    documentId: string;
}

export interface ITaskSet extends ITaskCache {
    method: MethodType.Set;
    partitionKey: string;
    schemaId: string;
    documentId: string;
    value: any;
    seconds: string;
}

export interface ITaskClear extends ITaskCache {
    method: MethodType.Clear;
    pattern: string;
}

export interface ITaskEmit extends ITaskCache {
    method: MethodType.Emit;
    room: string;
    key: string;
    value: string;
}
export type TaskCache =
    | ITaskGet
    | ITaskSet
    | ITaskClear
    | ITaskEmit;

export enum MethodType {
    "Get" = "Get",
    "Set" = "Set",
    "Clear" = "Clear",
    "Emit" = "Emit"
}

export const execTaskCache = async (task: any, taskSettings: TaskCache): Promise<TaskCache> => {
    let cache: TaskCache = { ...task, ...taskSettings };
    return cache;
};