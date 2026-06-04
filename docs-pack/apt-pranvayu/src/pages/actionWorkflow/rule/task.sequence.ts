import { IKeyValue, ResponseError, ResponseSuccess } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskSequence extends ITask {
  type: TaskType.Sequence;
  subscription: string;
  schema: string;
  prefix: string;
  paddingLength: string;
  paddingCharacter: string;
  readonly: boolean;
  success: ResponseSuccess;
  error: ResponseError;
}

export const execTaskSequence = async (task: any, taskSettings: ITaskSequence): Promise<ITaskSequence> => {
  let sequence: ITaskSequence = { ...task, ...taskSettings };
  return sequence;
};
