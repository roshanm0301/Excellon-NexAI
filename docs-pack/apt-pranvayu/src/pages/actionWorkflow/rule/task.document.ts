import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskDocument extends ITask {
  type: TaskType.Document;
  subscriptionId: string;
  schemaId: string;
}

export interface ITaskDocumentGet extends ITaskDocument {
  method: MethodType.Get;
  documentId: string;
}

export interface ITaskDocumentCreate extends ITaskDocument {
  method: MethodType.Post;
  payload: IKeyValue[];
}

export interface ITaskDocumentUpdate extends ITaskDocument {
  method: MethodType.Put;
  documentId: string;
  payload: IKeyValue[];
}

export interface ITaskDocumentUpsertAll extends ITaskDocument {
  method: MethodType.UpsertAll;
  documentId: string;
  payload: IKeyValue[];
  path: string
  subscriptionId: string
}

export type TaskDocument =
  | ITaskDocumentCreate
  | ITaskDocumentUpdate
  | ITaskDocumentGet
  | ITaskDocumentUpsertAll

export enum MethodType {
  "Get" = "Get",
  "Post" = "Post",
  "Put" = "Put",
  "GetById" = "GetById",
  "UpsertAll" = "UpsertAll",
}

export const execTaskDocument = async (task: any, taskSettings: TaskDocument): Promise<TaskDocument> => {
  let document: TaskDocument = { ...task, ...taskSettings };
  return document;
};
