import { ResponseError, ResponseSuccess } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskUUID extends ITask {
    type: TaskType.UUID;
    success: ResponseSuccess;
    error: ResponseError;
}

export const execTaskUUID = async (task: any, taskSettings: ITaskUUID): Promise<ITaskUUID> => {
    let document: ITaskUUID = { ...task, ...taskSettings };
    return document;
};