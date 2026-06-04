import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskESQuery extends ITask {
    type: TaskType.ESQuery;
    repository?: string;
}

export interface ITaskFind extends ITaskESQuery {
    method: 'Find';
    take: number
    where: IKeyValue[];
}

export type TaskESQuery = ITaskFind

export const execTaskESQuery = async (task: any, taskSettings: TaskESQuery): Promise<TaskESQuery> => {
    let document: TaskESQuery = { ...task, ...taskSettings };
    return document;
};
export enum ESQueryMethodType {
    "Find" = "Find",
}
