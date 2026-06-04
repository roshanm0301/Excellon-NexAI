import { ITask, TaskType } from "./task";
import { IKeyValue } from "./common";

export interface ITaskEntity extends ITask {
    type: TaskType.Entity;
    subscriptionId: string;
    containerId: string;
}

export interface ITaskGetEntity extends ITaskEntity {
    method: EntityMethodType.Get;
    documentId: string;
}

export interface ITaskPostEntity extends ITaskEntity {
    method: EntityMethodType.Post;
    payload: IKeyValue[];
}

export interface ITaskPutEntity extends ITaskEntity {
    method: EntityMethodType.Put;
    documentId: string;
    payload: IKeyValue[];
}

export interface ITaskEntityList extends ITaskEntity {
    method: EntityMethodType.List;
    where: IKeyValue[];
    select: IKeyValue[];
}

export interface ITaskEntityPaging extends ITaskEntity {
    method: EntityMethodType.Paging;
    where: IKeyValue[];
    select: IKeyValue[];
    take: string;
    skip: string;
    orderby: string;
    asc: string;
    page: string;
}

export interface ITaskEntityClone extends ITaskEntity {
    method: 'Clone';
    destination: string,
}

export enum EntityMethodType {
    "Get" = "Get",
    "Post" = "Post",
    "Put" = "Put",
    "List" = "List",
    "Paging" = "Paging",
    "Clone" = "Clone"
}

export type TaskEntity = ITaskEntityClone | ITaskGetEntity | ITaskPostEntity | ITaskPutEntity | ITaskEntityList | ITaskEntityPaging

export const execTaskEntity = async (
    task: any,
    taskSettings: TaskEntity
): Promise<TaskEntity> => {
    let entity: TaskEntity = { ...task, ...taskSettings };
    return entity;
};
