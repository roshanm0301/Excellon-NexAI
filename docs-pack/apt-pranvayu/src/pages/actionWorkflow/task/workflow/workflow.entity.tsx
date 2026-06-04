import {
  errorDefinition,
  failedDefinition,
  successDefinition,
} from "../../common.entity";
import { TaskType } from "../../rule";
import { ITaskWorkflow } from "../../rule/task.workflow";


export const workFlowDefinition: ITaskWorkflow = {
  type: TaskType.Workflow,
  id: "Workflow",
  name: "",
  method: "",
  template: "",
  tasks: "",
  subscription: "",
  repository: "",
  state: "",
  success: { ...successDefinition },
  failed: { ...failedDefinition },
  error: { ...errorDefinition },
};

export const MethodList = ["Template", "Custom"];
