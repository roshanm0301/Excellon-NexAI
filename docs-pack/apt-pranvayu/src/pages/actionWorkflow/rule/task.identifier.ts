import { ITask, TaskType } from "./task";

export interface ITaskIdentifier extends ITask {
    type: TaskType.Identifier;
}

export interface ITaskIdentifierUUID extends ITaskIdentifier {
    method: 'UUID';
}

export interface ITaskIdentifierNanoId extends ITaskIdentifier {
    method: 'NanoId';
    format: string
    size: string;
}

export type TaskIdentifier = ITaskIdentifierUUID | ITaskIdentifierNanoId

export const execTaskIdentifier = async (task: any, taskSettings: TaskIdentifier): Promise<TaskIdentifier> => {
    let document: TaskIdentifier = { ...task, ...taskSettings };
    return document;
  };

  export enum IdentifierMethodType {
    "NanoId" = "NanoId",
    "UUID" = "UUID",
  }