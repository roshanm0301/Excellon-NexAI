import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskArray extends ITask {
  type: TaskType.Array;
  method: string;
  value?: any;
  fromIndex?: number;
  key?: string;
  path?: any;
  // path?: string|[];
  paths?: any;
  index?: number;
  separator?: string;
  var?: string;
  payload?: IKeyValue[];
  asc?: boolean;
  conditions?: any;
  operator?: string;

  // for method type ToArray
  property?: string;
  distinct?: boolean;
}

// export interface ITaskFilter extends ITask {
//   method: string;
//   path: string;
//   conditions: Condition;
// }

export interface ITaskToArray extends ITaskArray {
  method: string; //MethodType.ToArray;
  path: string;
  property: string;
  distinct: boolean;
}

export const execTaskArray = async (
  _task: any,
  task: any
): Promise<ITaskArray> => {
  let array: ITaskArray = { ..._task, ...task.properties.taskSettings };
  if (array.method === "Merge") {
    let _paths = array.paths.map((item: any) => {
      if (item.id) {
        return item.Value;
      } else {
        return item;
      }
    });
    // delete array.paths;
    array = { ...array, paths: _paths };
  }
  return array;
};

// export const exceTaskFilter = async (
//   _task: any,
//   task: any
// ): Promise<ITaskFilter> => {
//   delete _task.branches;
//   let condition = await execTasks(task?.branches.condition);
//   let filter: ITaskFilter = {
//     ..._task,
//     ...task.properties.taskSettings,
//     conditions: condition[0],
//   };

//   return filter;
// };
