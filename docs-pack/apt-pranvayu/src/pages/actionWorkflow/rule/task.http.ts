import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskHttp extends ITask {
    type: TaskType.HTTP;
    url: string;
    headers: IKeyValue[];
    method: HttpMethodType;
    path: boolean;
    body: IKeyValue[] | string;
    params: IKeyValue[];
}

export interface ITaskHttpGet extends ITaskHttp {
    method: HttpMethodType.Get;
}

export interface ITaskHttpPost extends ITaskHttp {
    method: HttpMethodType.Post;
    payload: IKeyValue[];
}

export interface ITaskHttpDelete extends ITaskHttp {
    method: HttpMethodType.Delete;
    documentId: string;

}

export interface ITaskHttpPut extends ITaskHttp {
    method: HttpMethodType.Put;
    documentId: string;

}
export enum HttpMethodType {
    "Get" = "Get",
    "Post" = "Post",
    "Put" = "Put",
    "Delete" = "Delete"
}


export type TaskHttp = ITaskHttpGet | ITaskHttpPost | ITaskHttpDelete

export const execTaskHttp = async (task: any, taskSettings: TaskHttp): Promise<TaskHttp> => {
    let http: TaskHttp = { ...task, ...taskSettings };
    return http;
};