import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";
import { Condition } from "./task.condition";

export interface ITaskQuery extends ITask {
    type: TaskType.Query;
    repository?: string;
}

export interface ITaskFind extends ITaskQuery {
    method: 'Find';
    take: number
    where: IKeyValue[];
    sort?: IKeyValue[];
    select?: IKeyValue[];
}
export interface ITaskFindOne extends ITaskQuery {
    method: 'FindOne';
    where: IKeyValue[];
    sort: IKeyValue[];
    select: IKeyValue[];
}
export interface ITaskQueryCreate extends ITaskQuery {
    method: 'Create';
    payload: IKeyValue[];
    where: IKeyValue[];
}
export interface ITaskQueryUpdate extends ITaskQuery {
    method: 'Update';
    payload: IKeyValue[];
    where: IKeyValue[];
}
export interface ITaskPaging extends ITaskQuery {
    method: 'FindPaging';
    payload: IKeyValue[];
    where: IKeyValue[];
    take: string;
    skip: string;
    orderby: string,
    asc: string,
    page: string
}
export interface ITaskDynamic extends ITaskQuery {
    method: 'Dynamic';
    dynamicInput: string,
    where: IKeyValue[];
    sort: IKeyValue[];
}

export interface ITaskQueryWhere extends ITaskQuery {
    method: 'Where';
    where: string,
    select: IKeyValue[],
    order: IKeyValue[],
    conditions: Condition;
}

export interface ITaskWherePaging extends ITaskQuery {
    method: "WherePaging";
    where: string;
    select: IKeyValue[];
    sort: IKeyValue[];
    take: string;
    skip: string;
    page: string;
}
export interface ITaskNotExist extends ITaskQuery {
    method: "NotExist";
    where: IKeyValue[];
}
export interface ITaskRawQuery extends ITaskQuery {
    method: QueryMethodType.RawQuery;
    query: string;
}

export type TaskQuery = ITaskQueryCreate | ITaskQueryUpdate | ITaskFind | ITaskFindOne | ITaskPaging | ITaskQueryWhere | ITaskNotExist | ITaskRawQuery

export const execTaskQuery = async (task: any, taskSettings: TaskQuery): Promise<TaskQuery> => {
    let document: TaskQuery = { ...task, ...taskSettings };
    return document;
};
export enum QueryMethodType {
    "FindPaging" = "FindPaging",
    "Update" = "Update",
    "Create" = "Create",
    "FindOne" = "FindOne",
    "Find" = "Find",
    "Dynamic" = "Dynamic",
    "Where" = "Where",
    "WherePaging" = "WherePaging",
    "NotExist" = "NotExist",
    "RawQuery" = "RawQuery"
}
