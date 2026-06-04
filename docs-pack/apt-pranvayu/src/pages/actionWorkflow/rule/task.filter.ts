import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskFilter extends ITask {
    type: TaskType.Filter;
    repository: string;
}

export interface ITaskFilterBuilder extends ITaskFilter {
    method: FilterMethodType.FilterBuilder;
    where: IKeyValue[];
}

export type TaskFilter = ITaskFilter;

export const execTaskFilter = async (task: any, taskSettings: TaskFilter): Promise<TaskFilter> => {
    let document: TaskFilter = { ...task, ...taskSettings };
    return document;
};

export enum FilterMethodType {
    "FilterBuilder" = "FilterBuilder",
}