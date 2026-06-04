import { errorDefinition, failedDefinition, successDefinition } from "../../common.entity";
import { TaskType } from "../../rule";
import { ITaskSchemaGet, SchemaMethodType } from "../../rule/task.schema";

export const GetRequestDefinition: ITaskSchemaGet = {
    id: "SchemaGet",
    name: "",
    method: SchemaMethodType.Get,
    type: TaskType.Schema,
    documentId: "",
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
};