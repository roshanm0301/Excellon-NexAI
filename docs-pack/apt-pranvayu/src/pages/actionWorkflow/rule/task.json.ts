import { ITask, TaskType } from "./task";

export interface ITaskJSON extends ITask {
    type: TaskType.JSON;
}

export interface ITaskJSONStringify extends ITaskJSON {
    method: 'Stringify';
    payload: string;
}

export interface ITaskJSONParse extends ITaskJSON {
    method: 'Parse';
    payload: string;
}

export type TaskJSON = ITaskJSONStringify | ITaskJSONParse

export const execTaskJSON = async (task: any, taskSettings: TaskJSON): Promise<TaskJSON> => {
    let document: TaskJSON = { ...task, ...taskSettings };
    return document;
  };

  export enum JsontMethodType {
    "Parse" = "Parse",
    "Stringify" = "Stringify",
  }