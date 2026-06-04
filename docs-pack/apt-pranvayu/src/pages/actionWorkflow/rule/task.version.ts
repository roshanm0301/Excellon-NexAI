import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskVersion extends ITask {
  type: TaskType.Version;
  method: string;
  payload?: IKeyValue[];
  documentId?: string
}

export const execTaskVersion = async (task: any, taskSettings: ITaskVersion): Promise<ITaskVersion> => {
  let document: ITaskVersion = { ...task, ...taskSettings };
  return document;
};
