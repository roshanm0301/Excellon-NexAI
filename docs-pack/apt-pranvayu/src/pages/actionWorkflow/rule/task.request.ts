import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskRequest extends ITask {
    type: TaskType.Request;
    query: string
}
export interface ITaskAction extends ITaskRequest {
    method: RequestMethodType.Action;
    payload: IKeyValue[];
    schema: string,
    documentId?: string,
    async: boolean;
    action: string,
}

export interface ITaskSchedule extends ITaskRequest {
    method: RequestMethodType.Schedule;
    payload: IKeyValue[];
    schema: string,
    documentId?: string,
    action: string,
    scheduler: string,
    jobId?: string
    pattern?: string,
    dateTime?: string,
    startDate: string,
    endDate: string,
    attempts: number
}
export interface ITaskGetById extends ITaskRequest {
    method: RequestMethodType.GetById;
    schema: string,
    path: string,
    documentId: string
}

export interface ITaskCreate extends ITaskRequest {
    method: RequestMethodType.Post;
    payload: any[];
    schema: string,
    path?: string,
}

export interface ITaskUpdate extends ITaskRequest {
    method: RequestMethodType.Put;
    payload: IKeyValue[];
    schema: string,
    documentId: string
}

export interface ITaskService extends ITaskRequest {
    method: RequestMethodType.Service;
    payload: IKeyValue[];
    topic: string;
}

export interface ITaskRequestProxy extends ITaskRequest {
    method: RequestMethodType.Proxy;
    payload: IKeyValue[];
    schema: string,
    documentId?: string,
    subscription?: string,
    action: string,
}

export interface ITaskRequestForward extends ITaskRequest {
    method: RequestMethodType.Forward;
    payload: IKeyValue[];
    schema: string,
    documentId?: string,
    action: string,
}

export interface ITaskForwardProxy extends ITaskRequest {
    method: RequestMethodType.ForwardProxy;
    payload: string;
    schema: string,
    documentId?: string,
    subscription?: string,
    action: string,
}

export interface ITaskRequestProduce extends ITaskRequest {
    method: RequestMethodType.Produce;
    topic: string;
    key: string;
    headers: string;
    value: string;
}

export type TaskRequest = ITaskAction | ITaskGetById | ITaskCreate | ITaskUpdate | ITaskService | ITaskSchedule | ITaskForwardProxy | ITaskRequestProduce

export const execTaskRequest = async (task: any, taskSettings: TaskRequest): Promise<TaskRequest> => {
    let document: TaskRequest = { ...task, ...taskSettings };
    return document;
};

export enum RequestMethodType {
    "Service" = "Service",
    "Put" = "Put",
    "Post" = "Post",
    "Action" = "Action",
    "GetById" = "GetById",
    "Schedule" = "Schedule",
    "Proxy" = "Proxy",
    "Forward" = "Forward",
    "ForwardProxy" = "ForwardProxy",
    "Produce" = "Produce"
}