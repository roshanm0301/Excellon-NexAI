import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskExport extends ITask {
    type: TaskType.Export;
}

export interface ITaskCSV extends ITaskExport {
    method: ExportMethodType.CSV;
    columns: IKeyValue[];
    where: IKeyValue[];
    select: string;
    relations: [];
    schema: string;
    subscription: string;
}

export interface ITaskEXCEL extends ITaskExport {
    method: ExportMethodType.EXCEL;
    columns: IKeyValue[];
    where: IKeyValue[];
    select: string;
    relations: [];
    schema: string;
    subscription: string;
}

export type TaskExport = ITaskExport

export const execTaskExport = async (task: any, taskSettings: TaskExport): Promise<TaskExport> => {
    let document: TaskExport = { ...task, ...taskSettings };
    return document;
};

export enum ExportMethodType {
    "CSV" = "CSV",
    "EXCEL" = "EXCEL"
}