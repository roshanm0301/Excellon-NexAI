import {
	errorDefinition,
	failedDefinition,
	successDefinition,
} from "../../common.entity";
import { ITaskResolver, TaskType } from "../../rule";

export const resolverMethod: any[] = ["Object", "String"];

export const resolverDefinition: ITaskResolver = {
	id: "Resolver",
	name:'',
	type: TaskType.Resolver,
	method: "Object", 
	payload: [],
	success: { ...successDefinition },
	failed: { ...failedDefinition },
	error: { ...errorDefinition },
};
