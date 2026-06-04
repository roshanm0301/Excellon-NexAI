import { IKeyValue,  } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskResponse extends ITask {
    id: string;
    type: TaskType.Response;
    payload: IKeyValue[];
}

export const execTaskResponse = async (task: any, taskSettings: ITaskResponse): Promise<ITaskResponse> => {
    let document: ITaskResponse = { ...task, ...taskSettings };
    return document;
};