import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskSMTP extends ITask {
  type: TaskType.SMTP;
  To: string;
  From: string;
  CC: string;
  HtmlBody: string;
  Body: string;
  Subject: string;
  payload: IKeyValue[];
}

export type TaskSMTP = ITaskSMTP;

export const execTaskSMTP = async (task: any, taskSettings: TaskSMTP): Promise<TaskSMTP> => {
  let document: TaskSMTP = { ...task, ...taskSettings };
  return document;
};