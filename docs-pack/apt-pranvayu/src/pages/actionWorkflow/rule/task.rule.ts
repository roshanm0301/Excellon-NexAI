
import { MethodType } from "../task/rule/rule.entity";
import { IKeyValue, OperatorTypes } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskRule extends ITask {
    type: TaskType.Rule;
}
// export interface ITaskRule extends ITask {
//     type: TaskType.Rule;
//     name: string;
//     method: string;
//     isArray?: boolean;
//     path?: string;
//     string?: string;
//     payload: IKeyValue[];
// }
export interface ITaskRuleExecute extends ITaskRule {
    method: MethodType.Execute | MethodType.Object;
    payload: IKeyValue[];
}

export interface ITaskRuleGet extends ITaskRule {
    method: MethodType.Get;
    subscription: string;
    schema: string;
    rule: string;
}

export interface ITaskRulePost extends ITaskRule {
    method: MethodType.Post;
    subscription: string;
    schema: string;
    payload: IKeyValue[];
}

export interface ITaskRulePut extends ITaskRule {
    method: MethodType.Put;
    subscription: string;
    schema: string;
    rule: string;
    payload: IKeyValue[];
}

export interface ITaskRuleList extends ITaskRule {
    method: MethodType.List;
    payload: IKeyValue[];
    documentId: string,
    select: IKeyValue[];
}

export interface ITaskRulePaging extends ITaskRule {
    method: MethodType.Paging;
    payload: IKeyValue[];
    take: string,
    skip: string,
    orderby: string,
    asc: string,
    page: string,
}

export interface ITaskRuleObject extends ITaskRule {
    method: MethodType.Object;
    subscription: string;
    schema: string;
    documentId: string;
    payload: IKeyValue[];
}

export type IKeyValueSearch = IKeyValue & {
    Operator: OperatorTypes;
}
export interface ITaskRuleFindOne extends ITaskRule {
    method: MethodType.FindOne;
    where: IKeyValueSearch | IKeyValue[];
    sort: IKeyValue[];
    select: IKeyValue[];
}

export interface ITaskRuleExecutor extends ITaskRule {
    method: MethodType.Executor;
    subscription: string;
    schema: string;
    documentId: string;
    action: string;
    ruleType: string
}

export type TaskRule = ITaskRule | ITaskRuleGet | ITaskRuleExecute | ITaskRuleFindOne |
    ITaskRulePost | ITaskRulePut | ITaskRuleList | ITaskRulePaging | ITaskRuleObject | ITaskRuleExecutor

export const execTaskRule = async (task: any, taskSettings: ITaskRule): Promise<TaskRule> => {
    let document: TaskRule = { ...task, ...taskSettings };
    return document;
};
