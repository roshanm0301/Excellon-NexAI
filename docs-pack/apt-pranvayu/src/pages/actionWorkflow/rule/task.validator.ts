import { ITask, TaskType } from "./task";
import { IKeyValue } from "./common";

export interface ITaskValidator extends ITask {
    type: TaskType.Validator;
}

export interface ITaskJSON extends ITaskValidator {
    method: MethodType.JSON;
    schema: string;
    data: string;
}

export interface ITaskGuid extends ITaskValidator {
    method: MethodType.UUID;
    payload: string;
}

export type TaskValidator = ITaskValidator;

export const execTaskValidator = async (task: any, taskSettings: TaskValidator): Promise<TaskValidator> => {
    let validator: TaskValidator = { ...task, ...taskSettings };
    return validator;
};

export enum MethodType {
    "JSON" = "JSON",
    "UUID" = "UUID",
}