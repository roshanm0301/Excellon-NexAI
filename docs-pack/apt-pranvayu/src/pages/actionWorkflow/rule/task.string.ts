import { IKeyValue } from "./common";
import { ITask, TaskType } from "./task";

export interface ITaskString extends ITask {
  type: TaskType.String;
  method: string,
  path?: string,
  start?: string,
  end?: string,
  strings?: any,
  index?: string,
  searchValue?: string,
  replaceValue?: string,
  splitValue?: string,
  char?: string;
  maxLength?: string;
  fillString?: string;
}

export const execTaskString = async (
  _task: any,
  task: any
): Promise<ITaskString> => {
  let string: ITaskString = { ..._task, ...task.properties.taskSettings };
  if (string.method === "concat") {
    let _paths = string.strings.map((item: any) => {
      if (item.id) {
        return item.Value;
      } else {
        return item;
      }
    });
    // delete array.paths;
    string = { ...string, strings: _paths };
  }
  return string;
};
