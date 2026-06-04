import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskORM extends ITask {
    type: TaskType.ORM;
    subscriptionId: string;
    schema: string
}

export interface ITaskGetORM extends ITaskORM {
    method: ORMMethodType.Get;
    documentId: string;
}

export interface ITaskPostORM extends ITaskORM {
    method: ORMMethodType.Post;
    payload: IKeyValue[];
}

export interface ITaskPutORM extends ITaskORM {
    method: ORMMethodType.Put;
    documentId: string;
    payload: IKeyValue[];
}

export interface ITaskORMList extends ITaskORM {
    method: ORMMethodType.List;
    where: IKeyValue[];
    select: IKeyValue[];
    order: IKeyValue[];
}

export interface ITaskORMPaging extends ITaskORM {
    method: ORMMethodType.Paging;
    payload: IKeyValue[];
    take: string;
    skip: string;
    orderby: string;
    asc: string;
    page: string;
}

export type TaskORM = ITaskGetORM | ITaskPostORM | ITaskPutORM | ITaskORMList | ITaskORMPaging

export enum ORMMethodType {
    "Get" = "Get",
    "Post" = "Post",
    "Put" = "Put",
    "List" = "List",
    "Paging" = "Paging"
}

export const execTaskORM = async (task: any, taskSettings: TaskORM): Promise<TaskORM> => {
    let orm: TaskORM = { ...task, ...taskSettings };
    return orm;
};
