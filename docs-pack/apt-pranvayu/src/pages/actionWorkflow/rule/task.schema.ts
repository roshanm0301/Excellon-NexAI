import { IKeyValue } from "./common";
import { ITask } from "./task";

export interface ITaskSchemaPost extends ITask {
    method: 'Post';
    payload: IKeyValue[];
    repository?:string
}

export interface ITaskSchemaPut extends ITask {
    method: 'Put';
    payload: IKeyValue[];
    documentId: string;
}

export interface ITaskSchemaGet extends ITask {
    method: 'Get';
    documentId: string;
}

export interface ITaskSchemaList extends ITask {
    method: 'List';
}

export interface ITaskSchemaPaging extends ITask {
    method: 'Paging';
    payload: IKeyValue[];
    take: string;
    skip: string;
    orderby: string;
    asc: string;
    page: string;
}

export type TaskSchema = ITaskSchemaPost | ITaskSchemaPut | ITaskSchemaGet | ITaskSchemaList | ITaskSchemaPaging

export const execTaskSchema = async (task: any, taskSettings: TaskSchema): Promise<TaskSchema> => {
    let document: TaskSchema = { ...task, ...taskSettings };
    return document;
};

export enum SchemaMethodType {
    "Get" = "Get",
    "Put" = "Put",
    "Post" = "Post",
    "List" = "List",
    "Paging" = "Paging"
}