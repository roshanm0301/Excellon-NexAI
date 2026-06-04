import { ITask, TaskType } from "./task";

export interface ITaskWorkflow extends ITask {
      type: TaskType.Workflow;
      tasks?: string;
      subscription: string;
      repository: string;
      state: string;
      method:string;
      template?:string
    }

export const execTaskWorkflow = async (task: any, taskSettings: ITaskWorkflow): Promise<ITaskWorkflow> => {
    let workflow : ITaskWorkflow = { ...task, ...taskSettings };
    return workflow ;
};
