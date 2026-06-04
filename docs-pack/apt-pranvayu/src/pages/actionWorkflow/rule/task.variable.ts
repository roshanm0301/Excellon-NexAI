import { ITask, TaskType } from "./task";
import { IKeyValue } from "./common";

export interface ITaskVariable extends ITask {
    type: TaskType.Variable;
    repository: string;
}

export interface ITaskVariableGetById extends ITaskVariable {
    method: 'Get';
    schema: string,
    variableId: string
}

export interface ITaskVariableCreate extends ITaskVariable {
    method: 'Post';
    payload: IKeyValue[];
}

export interface ITaskVariableUpdate extends ITaskVariable {
    method: 'Put';
    payload: IKeyValue[];
    documentId: string
}

export interface ITaskVariablePickList extends ITaskVariable {
    method: 'List';
    payload: IKeyValue[];
    documentId: string,
    select: IKeyValue[];
}

export interface ITaskFindPaging extends ITaskVariable {
    method: 'Paging';
    payload: IKeyValue[];
    take: string,
    skip: string,
    orderby: string,
    asc: string,
    page: string,
}

export type TaskVariable = ITaskVariable;

export const execTaskVariable = async (task: any, taskSettings: TaskVariable): Promise<TaskVariable> => {
    let variable: TaskVariable = { ...task, ...taskSettings };
    return variable;
};

export enum VariableMethodType {
    "Paging"="Paging",
    "List"="List",
    "Put" = "Put",
    "Post" = "Post",
    "Get" = "Get",
}