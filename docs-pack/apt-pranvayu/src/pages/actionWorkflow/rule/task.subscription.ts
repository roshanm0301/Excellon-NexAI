import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskSubscription extends ITask {
  type: TaskType.Subscription;
}

export interface ITaskGetSubscription extends ITaskSubscription {
  method: 'Get';
  schema: string;
  documentId: string;
}

export interface ITaskPostSubscription extends ITaskSubscription {
  method: 'Post';
  payload: IKeyValue[];
  schema: string;
}

export interface ITaskSubscriptionList extends ITaskSubscription {
  method: 'List';
}

export interface ITaskSetSubscription extends ITaskSubscription {
  method: 'Set';
  subscriptionId: string;
}
export enum SubscriptionMethodType {
  "List" = "List",
  "Set" = "Set",
  "Post" = "Post",
  "Get" = "Get",
}
export type TaskSubscription = ITaskSetSubscription | ITaskSubscriptionList | ITaskPostSubscription | ITaskGetSubscription


export const execTaskSubscription = async (task: any, taskSettings: TaskSubscription): Promise<TaskSubscription> => {
  let subscription: TaskSubscription = { ...task, ...taskSettings };
  return subscription;
};
