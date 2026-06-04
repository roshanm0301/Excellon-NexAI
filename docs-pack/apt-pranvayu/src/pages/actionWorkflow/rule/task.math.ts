import { ITask, TaskType } from "./task";
import { IKeyValue } from "./common";

export enum MathMethodType {
    "Evaluate" = "Evaluate",
    "Round" = "Round",
    "Ceil" = "Ceil",
    "Floor" = "Floor"
}
export interface ITaskMath extends ITask {
    type: TaskType.Math;
}
export interface ITaskEvaluate extends ITaskMath {
    method: MathMethodType.Evaluate;
    expression: string;
    payload: IKeyValue[];
}
export interface ITaskRound extends ITaskMath {
    method: MathMethodType.Round;
    expression: string;
}
export interface ITaskCeil extends ITaskMath {
    method: MathMethodType.Ceil;
    expression: string;
}
export interface ITaskFloor extends ITaskMath {
    method: MathMethodType.Floor;
    expression: string;
}



export type TaskMath = ITaskEvaluate | ITaskRound | ITaskCeil | ITaskFloor

export const execTaskMath = async (task: any, taskSettings: TaskMath): Promise<TaskMath> => {
    let document: TaskMath = { ...task, ...taskSettings };
    return document;
};