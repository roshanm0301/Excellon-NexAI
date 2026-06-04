import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskAction extends ITask {
    type: TaskType.Action;
    repository?:string
}
export interface ITaskGetAction extends ITaskAction {
    method: 'Get';
    schema: string,
    documentId: string,
}

export interface ITaskPostAction extends ITaskAction {
    method: "Post";
    schema: string;
    payload: IKeyValue[];
}
export interface ITaskPutAction extends ITaskAction {
    method: 'Put';
    schema: string;
    payload: IKeyValue[];
    documentId: string
}

export interface ITaskListAction extends ITaskAction {
    method: 'List';
    payload: any[];
    schema: string,
    path?: string,
    documentId:string,
    select: IKeyValue[];

}

export interface ITaskPagingAction extends ITaskAction {
    method: 'Paging';
    take:string,
    skip:string,
    orderby:string,
    asc:string,
    page:string,
    payload: IKeyValue[];
}

export type TaskAction = ITaskPagingAction | ITaskListAction | ITaskPutAction | ITaskPostAction | ITaskGetAction 


export const execTaskAction = async (task: any, taskSettings: TaskAction): Promise<TaskAction> => {
    let action: TaskAction = { ...task, ...taskSettings };
    return action;
};

export enum ActionMethodType {
    "Paging"="Paging",
    "List"="List",
    "Put" = "Put",
    "Post" = "Post",
    "Get" = "Get",
}