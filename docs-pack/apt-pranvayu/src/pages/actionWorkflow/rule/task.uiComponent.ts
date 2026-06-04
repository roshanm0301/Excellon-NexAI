import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskUIComponents extends ITask {
    type: TaskType.Action;
    repository?:string
}
export interface ITaskGetUIComponent extends ITaskUIComponents {
    method: 'Get';
    schema: string,
    documentId: string,
}

export interface ITaskPostUIComponent extends ITaskUIComponents {
    method: "Post";
    schema: string;
    payload: IKeyValue[];
}
export interface ITaskPutUIComponent extends ITaskUIComponents {
    method: 'Put';
    schema: string;
    payload: IKeyValue[];
    documentId: string
}

export interface ITaskListUIComponent extends ITaskUIComponents {
    method: 'List';
    payload: any[];
    schema: string,
    path?: string,
    documentId:string,
    select: IKeyValue[];

}

export interface ITaskPagingUIComponent extends ITaskUIComponents {
    method: 'Paging';
    take:string,
    skip:string,
    orderby:string,
    asc:string,
    page:string,
    payload: IKeyValue[];
}

export interface ITaskUIComponentsClone extends ITaskUIComponents {
    method: 'Clone';
    sourceDocumentId: string;
    payload: IKeyValue[];
}

export type TaskUIComponent = ITaskPagingUIComponent | ITaskListUIComponent | ITaskPutUIComponent | ITaskPostUIComponent | ITaskGetUIComponent 


export const execTaskUIComponent = async (task: any, taskSettings: TaskUIComponent): Promise<TaskUIComponent> => {
    let action: TaskUIComponent = { ...task, ...taskSettings };
    return action;
};

export enum UIComponentMethodType {
    "Paging"="Paging",
    "List"="List",
    "Put" = "Put",
    "Post" = "Post",
    "Get" = "Get",
    "Clone"="Clone"
}