import moment from 'moment';

import { ITask, TaskType } from "./task";

export interface ITaskDate extends ITask {
    type: TaskType.Date;
}
export interface ITaskGetDate extends ITaskDate {
    method: DateMethodType.GetDate;
}
export interface ITaskAddDate extends ITaskDate {
    method: DateMethodType.Add;
    amount: string,
    date: string,
    unit: moment.unitOfTime.DurationConstructor
}

export interface ITaskGetDay extends ITaskDate {
    method: DateMethodType.GetDay;
    date: string;
}

export interface ITaskDiff extends ITaskDate {
    method: DateMethodType.Diff;
    from: string,
    to: string,
    unitOfTime: moment.unitOfTime.Diff
    precise: boolean
}

export interface ITaskFormat extends ITaskDate {
    method: DateMethodType.Format;
    date: string;
    format: string;
}
export interface ITaskParse extends ITaskDate {
    method: DateMethodType.Parse;
    date: string;
}
export interface ITaskLessThan extends ITaskDate {
    method: DateMethodType.LessThan;
    date: string;
    comparisionDate: string;
    format: string;
}
export interface ITaskGreaterThan extends ITaskDate {
    method: DateMethodType.GreaterThan;
    date: string;
    comparisionDate: string;
    format: string;
}
export type TaskDate = ITaskGetDate | ITaskAddDate | ITaskDiff | ITaskFormat | ITaskParse | ITaskLessThan | ITaskGreaterThan

export const execTaskDate = async (task: any, taskSettings: TaskDate): Promise<TaskDate> => {
    let document: TaskDate = { ...task, ...taskSettings };
    return document;
};

export enum DateMethodType {
    "Format" = "Format",
    "Diff" = "Diff",
    "Add" = "Add",
    "GetDate" = "GetDate",
    "Parse" = "Parse",
    "LessThan" = "LessThan",
    "GreaterThan" = "GreaterThan",
    "GetDay" = "GetDay"
}