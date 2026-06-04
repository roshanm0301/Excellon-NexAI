import { v4 } from "uuid";
import { IKeyValue } from "./common";
import { execTasks, ITask, TaskType } from "./task";
import { Condition } from "./task.condition";

export interface ITaskRSA extends ITask {
  type: TaskType.RSA;
}
export interface ITaskRSAGenerateKeys extends ITaskRSA {

  method: "Generate",

}
export interface ITaskRSAPublicEncrypt extends ITaskRSA {
  method: "PublicEncrypt";
  publicKey: string;
  str: string;
}

export interface ITaskRSAPublicDecrypt extends ITaskRSA {
  method: "PublicDecrypt";
  publicKey: string;
  str: string;
}

export interface ITaskRSAPrivateEncrypt extends ITaskRSA {
  method: "PrivateEncrypt",
  privateKey: string;
  str: string;
}

export interface ITaskRSAPrivateDecrypt extends ITaskRSA {
  method: "PrivateDecrypt",
  privateKey: string;
  str: string;
}

export type TaskRSA = ITaskRSAPublicEncrypt | ITaskRSAPublicDecrypt | ITaskRSAPrivateEncrypt | ITaskRSAPrivateDecrypt


export const execTaskRSA = async (task: any, taskSettings: TaskRSA): Promise<TaskRSA> => {
  let action: TaskRSA = { ...task, ...taskSettings };
  return action;
};

export enum RSAMethodType {
  "Generate" = "Generate",
  "PublicEncrypt" = "PublicEncrypt",
  "PublicDecrypt" = "PublicDecrypt",
  "PrivateEncrypt" = "PrivateEncrypt",
  "PrivateDecrypt" = "PrivateDecrypt",
}
