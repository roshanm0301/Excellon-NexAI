import { ITask, TaskType } from "./task";

export interface ITaskObject extends ITask {
    type: TaskType.Object;
}
export interface ITaskIsExist extends ITaskObject {
    method: "IsExist",
    key: string;
    path: string;
}

export interface ITasIskNaN extends ITaskObject {
    method: "IsNaN",
    key: string;
    path: string;
}
export interface ITaskIsObject extends ITaskObject {
    method: "IsObject",
    path: string;
}
export interface ITaskMergeObject extends ITaskObject {
    method: "Merge",
    paths?: any;
}
export type TaskObject = ITaskIsExist | ITasIskNaN | ITaskIsObject | ITaskMergeObject

export const execTaskObject = async (task: any, taskSettings: TaskObject): Promise<TaskObject> => {
    let document: TaskObject = { ...task, ...taskSettings };
    if (document.method === "Merge") {
        let _paths = document?.paths.map((item: any) => {
            if (item.id) {
                return item.Value;
            } else {
                return item;
            }
        });
        // delete document.paths;
        document = { ...document, paths: _paths };
    }

    return document;
};
export enum ObjectMethodType {
    "IsObject" = "IsObject",
    "IsNaN" = "IsNaN",
    "IsExist" = "IsExist",
    "Merge" = "Merge"
}