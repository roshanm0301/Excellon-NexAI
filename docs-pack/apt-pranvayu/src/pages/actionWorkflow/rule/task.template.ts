import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskTemplate extends ITask {
    type: TaskType.Action;
}
export interface ITaskTemplateGetById extends ITaskTemplate {
    method: 'Get';
    schema: string,
    documentId: string,
}

export interface ITaskTemplateCreate extends ITaskTemplate {
    method: "Post";
    payload: IKeyValue[];
}

export interface ITaskTemplateUpdate extends ITaskTemplate {
    method: 'Put';
    payload: IKeyValue[];
    documentId: string
}

export interface ITaskTemplatePickList extends ITaskTemplate {
    method: 'List';
    payload: any[];
    select: IKeyValue[];

}

export interface ITaskFindPaging extends ITaskTemplate {
    method: 'Paging';
    payload: IKeyValue[];
    take: string,
    skip: string,
    orderby: string,
    asc: string,
    page: string,
}

export type TaskTemplate = ITaskTemplateGetById | ITaskTemplateCreate | ITaskTemplateUpdate | ITaskTemplatePickList | ITaskFindPaging


export const execTaskTemplate = async (task: any, taskSettings: TaskTemplate): Promise<TaskTemplate> => {
    let action: TaskTemplate = { ...task, ...taskSettings };
    return action;
};

export enum TemplateMethodType {
    "Paging" = "Paging",
    "List" = "List",
    "Put" = "Put",
    "Post" = "Post",
    "Get" = "Get",
}