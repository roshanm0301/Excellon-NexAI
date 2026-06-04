import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskProvider extends ITask {
  type: TaskType.Provider;
  subscriptionId?: string;
  schemaId?: string;
  repository?:string
}

export interface ITaskProviderGet extends ITaskProvider {
  method: ProviderMethodType.Get;
  schema: string;
  documentId: string;
}

export interface ITaskProviderPost extends ITaskProvider {
  method: ProviderMethodType.Post;
  payload: IKeyValue[];
}

export interface ITaskProviderPut extends ITaskProvider {
  method: ProviderMethodType.Put;
  schema: string;
  documentId: string;
  payload: IKeyValue[];
}

export interface ITaskProviderList extends ITaskProvider {
    method: ProviderMethodType.List;
  }

export interface ITaskProviderPaging extends ITaskProvider {
  method: ProviderMethodType.Paging;
  take: string;
  skip: string;
  orderby: string;
  asc: string;
  payload: IKeyValue[];
}

export type TaskProvider =
  | ITaskProviderGet
  | ITaskProviderPost
  | ITaskProviderPut
  | ITaskProviderList
  | ITaskProviderPaging ;

export enum ProviderMethodType {
  "Get" = "Get",
  "Post" = "Post",
  "Put" = "Put",
  "List" = "List",
  "Paging" = "Paging", 
}

export const execTaskProvider = async (task: any, taskSettings: TaskProvider): Promise<TaskProvider> => {
  let provider: TaskProvider = { ...task, ...taskSettings };
  return provider;
};
