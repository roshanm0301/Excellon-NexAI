import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskMinIO extends ITask {
    type: TaskType.MinIO;
}

export interface ITaskMakeBucket extends ITaskMinIO {
    method: 'MakeBucket';
    bucketName: string;
    options: string;
}

export interface ITaskBucketExists extends ITaskMinIO {
    method: 'BucketExists';
    bucketName: string;
    options: string;
}

export interface ITaskPutObject extends ITaskMinIO {
    method: 'PutObject';
    bucketName: string;
    objectName: string;
    options: string;
    payload: string;
    size?: number | undefined;
    metaData: string;
}

export interface ITaskRemoveBucket extends ITaskMinIO {
    method: 'RemoveBucket';
    bucketName: string;
    options: string;
}

export interface ITaskGetObject extends ITaskMinIO {
    method: 'GetObject';
    bucketName: string;
    objectName: string;
    options: string;
}

export interface ITaskStatObject extends ITaskMinIO {
    method: 'StatObject';
    bucketName: string;
    objectName: string;
    options: string;
}

export type TaskMinIO = ITaskPutObject | ITaskBucketExists | ITaskMakeBucket |ITaskRemoveBucket

export const execTaskMinIO = async (task: any, taskSettings: TaskMinIO): Promise<TaskMinIO> => {
    let action: TaskMinIO = { ...task, ...taskSettings };
    return action;
};
