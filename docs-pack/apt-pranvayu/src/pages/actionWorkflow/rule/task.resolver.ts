import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

// export interface ITaskResolver extends ITask {
//     type: TaskType.Resolver;
//     isArray: boolean;
//     path: string;
//     payload: IKeyValue[];
// }

export interface ITaskResolver extends ITask {
    type: TaskType.Resolver;
    name :string;
    method: string;
    isArray?: boolean;
    path?: string;
    string?: string;
    payload: IKeyValue[];
}

// export interface ITaskObjectResolver extends ITaskResolver {
//     method: ResolverMethodType.ObjectResolver;
//     isArray: boolean;
//     path: string;
//     payload: IKeyValue[];
// }

// export interface ITaskStringResolver extends ITaskResolver {
//     method: ResolverMethodType.StringResolver;
//     string: string;
//     payload: IKeyValue[];
// }

// export enum ResolverMethodType {
//     "ObjectResolver" = "ObjectResolver",
//     "StringResolver" = "StringResolver"
// }

export type TaskResolver = ITaskResolver

export const execTaskResolver = async (task: any, taskSettings: TaskResolver): Promise<TaskResolver> => {
    let document: TaskResolver = { ...task, ...taskSettings };
    return document;
};