import { ITask, Task, TaskType } from "./task";
import { IKeyValue,  } from "./common";

export interface ITaskSecurity extends ITask {
    id: string;
    type: TaskType.Security;
}

export interface ITaskJWTSign extends ITaskSecurity {
    method: MethodType.JWTSign;
    payload: IKeyValue[];
    options: IKeyValue[];
    secret: string;
    selfSign?:boolean
}

export interface ITaskJWTVerify extends ITaskSecurity {
    method: MethodType.JWTVerify;
    token: string;
    options: IKeyValue[];
    secret: string;
    selfSign?:boolean
}

export interface ITaskHash extends ITaskSecurity {
    method: MethodType.hashPassword,
    password: string
}

export interface ITaskMatch extends ITaskSecurity {
    method: MethodType.matchPassword,
    password: string,
    hash: string
}
export interface ITaskVerifyPassword extends ITaskSecurity {
    method: MethodType.verifyPassword,
    password: string,
    hash: string
}

enum MethodType {
    "JWTSign" = "JWTSign",
    "JWTVerify" = "JWTVerify",
    "hashPassword" = "hashPassword",
    "matchPassword" = "matchPassword",
    "verifyPassword"="verifyPassword"
}

export type TaskSecurity = ITaskJWTSign | ITaskJWTVerify | ITaskHash | ITaskMatch
export const execTaskSecurity = async (task: any, taskSettings: TaskSecurity): Promise<TaskSecurity> => {
    let document: TaskSecurity = { ...task, ...taskSettings };
    return document;
  };