import { ITask, TaskType } from "./task";

export interface ITaskGeometry extends ITask {
  type: TaskType.Geometry;
}

export interface ITaskHaversine extends ITaskGeometry {
  method: "Haversine";
  latitude1: string | number;
  latitude2: string | number;
  longitude1: string | number;
  longitude2: string | number;
  path?: string;
}

export type TaskGeometry = ITaskHaversine;

export const execTaskGeometry = async (
  task: any,
  taskSettings: TaskGeometry
): Promise<TaskGeometry> => {
  let document: TaskGeometry = { ...task, ...taskSettings };
  return document;
};
