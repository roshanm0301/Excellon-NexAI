import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskHistory extends ITask {
  type: TaskType.History;
  method: string;
  payload?: IKeyValue[];
  documentId?: string;
  take?: string;
  skip?: string;
  orderby?: string;
  asc?: string;
  page?: string;
  where?: IKeyValue[]
}

export const execTaskHistory = async (task: any, taskSettings: ITaskHistory): Promise<ITaskHistory> => {
  let document: ITaskHistory = { ...task, ...taskSettings };
  return document;
};
