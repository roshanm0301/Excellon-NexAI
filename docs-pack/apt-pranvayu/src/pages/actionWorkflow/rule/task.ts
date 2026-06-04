import { v4 } from "uuid";
import { Step } from "../../../designer";
import { ResponseError, ResponseSuccess } from "./common";
import { execTaskAction } from "./task.action";
import {
  ITaskArray,
  execTaskArray,
} from "./task.array";
import { TaskAzure, execTaskAzure } from "./task.azure";
import { ITaskCache, execTaskCache } from "./task.cache";
import {
  ISubCondition,
  ITaskCondition,
  execStepCondition,
  execTaskCondition,
  execTaskSubCondition,
} from "./task.condition";
import { ITaskCrypto, execTaskCrypto } from "./task.crypto";
import { TaskDate, execTaskDate } from "./task.date";
import { TaskDocument, execTaskDocument } from "./task.document";
import { TaskEntity, execTaskEntity } from "./task.entity";
import { TaskFilter, execTaskFilter } from "./task.filter";
import { TaskGeometry, execTaskGeometry } from "./task.geo";
import { execTaskHistory } from "./task.history";
import { TaskHttp, execTaskHttp } from "./task.http";
import { ITaskIdentifier, execTaskIdentifier } from "./task.identifier";
import { ITaskIterator, execIterator } from "./task.iterator";
import { ITaskJSON, execTaskJSON } from "./task.json";
import { ITaskLoop, execTaskLoop } from "./task.loop";
import { TaskMath, execTaskMath } from "./task.math";
import { execTaskMinIO } from "./task.minIO";
import { TaskObject, execTaskObject } from "./task.object";
import { TaskORM, execTaskORM } from "./task.orm";
import {
  TaskPromise,
  execStepPromise as execStepSwitchCommon,
  execTaskPromise,
} from "./task.promise";
import { ITaskProvider, execTaskProvider } from "./task.provider";
import { TaskQuery, execTaskQuery } from "./task.query";
import { ITaskRepository, execTaskRepository } from "./task.repository";
import { ITaskAction, TaskRequest, execTaskRequest } from "./task.request";
import { ITaskResolver, execTaskResolver } from "./task.resolver";
import { ITaskResponse, execTaskResponse } from "./task.response";
import { ITaskRSA, execTaskRSA } from "./task.rsa";
import { execTaskRule, ITaskRule } from "./task.rule";
import { TaskSchema, execTaskSchema } from "./task.schema";
import { TaskSecurity, execTaskSecurity } from "./task.security";
import { ITaskSMTP, execTaskSMTP } from "./task.smtp";
import { ITaskState, execState } from "./task.state";
import { ITaskString, execTaskString } from "./task.string";
import { ITaskSubscription, execTaskSubscription } from "./task.subscription";
import { ITaskSwitch, execStepSwitch, execTaskSwitch } from "./task.switch";
import {
  ITaskTransaction,
  execStepTransaction,
  execTaskTransaction,
} from "./task.transaction";
import { TaskTrino, execTaskTrino } from "./task.trino";
import { ITaskUUID, execTaskUUID } from "./task.uuid";
import { execTaskVersion } from "./task.version";
import { ITaskWorkflow, execTaskWorkflow } from "./task.workflow";
import { TaskVariable, execTaskVariable } from "./task.variable";
import { ITaskSequence, execTaskSequence } from "./task.sequence";
import { TaskValidator, execTaskValidator } from "./task.validator";
import { ITaskESQuery, execTaskESQuery } from "./task.esquery";
import { TaskExport, execTaskExport } from "./task.export";
import { execTaskTemplate, TaskTemplate } from "./task.template";
import { execTaskUIComponent, TaskUIComponent } from "./task.uiComponent";
import { ITaskKeycloak } from "./task.keycloak";

/**
 * Base interface for all workflow tasks (API format)
 * 
 * CRITICAL: Two separate identifiers:
 * 
 * - id = Execution ID (camelCase, no spaces) â†’ STATE STORAGE KEY
 *   Backend stores: state[task.id] = response
 *   Data paths: {$.taskId.data} â†’ state["taskId"].data
 *   Example: id = "getUser" â†’ {$.getUser.data}
 * 
 * - name = Display name (readable, can have spaces) â†’ for UI/logging
 *   Shown in designer, logs, error messages
 *   Example: name = "Get User"
 * 
 * Example flow:
 * 1. Task id="getUser", name="Get User" executes
 * 2. Backend stores: state["getUser"] = { success: true, data: {...} }
 * 3. Next task references: {$.getUser.data} â†’ resolves to user data
 */
export interface ITask {
  /** 
   * Execution ID - STATE STORAGE KEY (camelCase, no spaces)
   * Backend: state[task.id] = response
   * Data paths: {$.id.data} â†’ state["id"].data
   * Example: "getUser" â†’ {$.getUser.data}
   */
  id: string;
  /** 
   * Display name - for UI and logging (can have spaces)
   * Shown in designer, logs, error messages
   * Example: "Get User"
   */
  name: string;
  type: TaskType;
  success: ResponseSuccess;
  failed: ResponseError;
  error: ResponseError;
}

export type Task =
  | ITaskResolver
  | TaskRequest
  | ITaskResponse
  | ITaskRule
  | TaskQuery
  | ITaskUUID
  | TaskDate
  | TaskDocument
  | ITaskSwitch
  | ITaskCondition
  | ITaskArray
  | TaskObject
  | TaskGeometry
  | TaskPromise
  // | ITaskFilter
  | TaskHttp
  | ITaskIdentifier
  | ITaskJSON
  | ITaskTransaction
  | TaskSecurity
  | ITaskLoop
  | ITaskSMTP
  | ISubCondition
  | TaskMath
  | ITaskIterator
  | ITaskString
  | ITaskAction
  | ITaskProvider
  | TaskSchema
  | ITaskRepository
  | ITaskRSA
  | ITaskCrypto
  | ITaskWorkflow
  | ITaskSubscription
  | ITaskCache
  | TaskEntity
  | TaskORM
  | ITaskState
  | TaskFilter
  | TaskTrino
  | TaskAzure
  | TaskVariable
  | ITaskSequence
  | TaskValidator
  | ITaskESQuery
  | TaskExport
  | TaskTemplate
  | TaskUIComponent
  | ITaskKeycloak

export enum TaskType {
  "Rule" = "Rule",
  "Document" = "Document",
  "Query" = "Query",
  "Date" = "Date",
  "Request" = "Request",
  "Response" = "Response",
  "Resolver" = "Resolver",
  "UUID" = "UUID",
  "Switch" = "Switch",
  "Condition" = "Condition",
  "Array" = "Array",
  "Object" = "Object",
  "HTTP" = "HTTP",
  "Geometry" = "Geometry",
  "Promise" = "Promise",
  "Identifier" = "Identifier",
  "JSON" = "JSON",
  "Transaction" = "Transaction",
  "Security" = "Security",
  "Loop" = "Loop",
  "SMTP" = "SMTP",
  "SubCondition" = "SubCondition",
  "Filter" = "Filter",
  "Math" = "Math",
  "Iterator" = "Iterator",
  "Where" = "Where",
  "String" = "String",
  "Action" = "Action",
  "Provider" = "Provider",
  "Schema" = "Schema",
  "Repository" = "Repository",
  "RSA" = "RSA",
  "Crypto" = "Crypto",
  "Workflow" = "Workflow",
  "Subscription" = "Subscription",
  "Cache" = "Cache",
  "Version" = "Version",
  "History" = "History",
  "Entity" = "Entity",
  "ORM" = "ORM",
  "MinIO" = "MinIO",
  "State" = "State",
  "Trino" = "Trino",
  "Azure" = "Azure",
  "Variable" = "Variable",
  "Sequence" = "Sequence",
  "Validator" = "Validator",
  "ESQuery" = "ESQuery",
  "Export" = "Export",
  "Template" = "Template",
  "UIComponent" = "UIComponent",
  "Keycloak" = "Keycloak"
}

/**
 * Convert Step[] (designer format) to Task[] (API format)
 * 
 * CRITICAL: Two separate identifiers:
 * - task.id = Execution ID (step.id) â†’ used for state storage: state[task.id] = response
 *   Example: "getUser" â†’ state["getUser"] = { success: true, data: {...} }
 *   Data paths: {$.getUser.data} â†’ resolves to state["getUser"].data
 * 
 * - task.name = Display name (step.name) â†’ for display/debugging
 *   Example: "Get User" â†’ shown in logs, designer UI
 * 
 * Flow: {$.getUser.data} â†’ matches state["getUser"] â†’ returns task output
 */
export const execTasks = async (sequence: Step[]): Promise<any> => {
  let tasks: Task[] = [];

  for (const task of sequence || []) {
    let _task: any = { ...task };

    // CRITICAL: Preserve execution ID for state storage key
    // step.id = execution ID (e.g., "getUser") â†’ becomes task.id
    // step.name = display name (e.g., "Get User") â†’ becomes task.name
    const executionId = task.id || task.type;  // Execution ID for state storage
    const displayName = task.name || task.id || task.type;  // Display name

    // Remove designer-specific fields
    delete _task.id;          // Will be set to executionId below
    delete _task._id;         // Remove AI assistant's id
    delete _task.properties;  // Properties are passed separately via taskSettings
    delete _task.name;        // Will be set to displayName below

    // Execute task conversion
    const convertedTask = await execTask(_task, task);

    // CRITICAL: Set id (execution) and name (display) for backend
    // id = executionId â†’ state[task.id] = state["getUser"] 
    // This enables {$.getUser.data} path resolution
    convertedTask.id = executionId;
    convertedTask.name = displayName;

    tasks.push(convertedTask);
  }
  return tasks;
};

export const execTask = async (_task: any, task: any): Promise<any> => {
  switch (_task.type) {
    case TaskType.Document: {
      return await execTaskDocument(_task, task.properties.taskSettings);
    }
    case TaskType.Query: {
      return await execTaskQuery(_task, task.properties.taskSettings);
    }
    case TaskType.Date: {
      return await execTaskDate(_task, task.properties.taskSettings);
    }
    case TaskType.Request: {
      return await execTaskRequest(_task, task.properties.taskSettings);
    }
    case TaskType.Response: {
      return await execTaskResponse(_task, task.properties.taskSettings);
    }
    case TaskType.Resolver: {
      return await execTaskResolver(_task, task.properties.taskSettings);
    }
    case TaskType.Rule: {
      return await execTaskRule(_task, task.properties.taskSettings);
    }
    case TaskType.UUID: {
      return await execTaskUUID(_task, task.properties.taskSettings);
    }
    case TaskType.Object: {
      return await execTaskObject(_task, task.properties.taskSettings);
    }
    case TaskType.HTTP: {
      return await execTaskHttp(_task, task.properties.taskSettings);
    }
    case TaskType.Geometry: {
      return await execTaskGeometry(_task, task.properties.taskSettings);
    }
    case TaskType.Identifier: {
      return await execTaskIdentifier(_task, task.properties.taskSettings);
    }
    case TaskType.JSON: {
      return await execTaskJSON(_task, task.properties.taskSettings);
    }
    case TaskType.Security: {
      return await execTaskSecurity(_task, task.properties.taskSettings);
    }
    case TaskType.SMTP: {
      return await execTaskSMTP(_task, task.properties.taskSettings);
    }
    case TaskType.Math: {
      return await execTaskMath(_task, task.properties.taskSettings);
    }
    case TaskType.Array: {
      return await execTaskArray(_task, task);
    }
    case TaskType.Action: {
      return await execTaskAction(_task, task.properties.taskSettings);
    }
    case TaskType.Provider: {
      return await execTaskProvider(_task, task.properties.taskSettings);
    }
    case TaskType.Schema: {
      return await execTaskSchema(_task, task.properties.taskSettings);
    }
    case TaskType.Repository: {
      return await execTaskRepository(_task, task.properties.taskSettings);
    }
    case TaskType.RSA: {
      return await execTaskRSA(_task, task.properties.taskSettings);
    }
    case TaskType.Crypto: {
      return await execTaskCrypto(_task, task.properties.taskSettings);
    }
    case TaskType.Workflow: {
      return await execTaskWorkflow(_task, task.properties.taskSettings);
    }
    case TaskType.Subscription: {
      return await execTaskSubscription(_task, task.properties.taskSettings);
    }
    case TaskType.History: {
      return await execTaskHistory(_task, task.properties.taskSettings);
    }
    case TaskType.Version: {
      return await execTaskVersion(_task, task.properties.taskSettings);
    }
    case TaskType.Entity: {
      return await execTaskEntity(_task, task.properties.taskSettings);
    }
    case TaskType.ORM: {
      return await execTaskORM(_task, task.properties.taskSettings);
    }
    case TaskType.MinIO: {
      return await execTaskMinIO(_task, task.properties.taskSettings);
    }
    case TaskType.Filter: {
      return await execTaskFilter(_task, task.properties.taskSettings);
    }
    case TaskType.Trino: {
      return await execTaskTrino(_task, task.properties.taskSettings);
    }
    case TaskType.Azure: {
      return await execTaskAzure(_task, task.properties.taskSettings);
    }
    case TaskType.Variable: {
      return await execTaskVariable(_task, task.properties.taskSettings);
    }
    case TaskType.Sequence: {
      return await execTaskSequence(_task, task.properties.taskSettings);
    }
    case TaskType.Validator: {
      return await execTaskValidator(_task, task.properties.taskSettings);
    }
    case TaskType.ESQuery: {
      return await execTaskESQuery(_task, task.properties.taskSettings);
    }
    case TaskType.Export: {
      return await execTaskExport(_task, task.properties.taskSettings);
    }
    case TaskType.Template: {
      return await execTaskTemplate(_task, task.properties.taskSettings);
    }
    case TaskType.UIComponent: {
      return await execTaskUIComponent(_task, task.properties.taskSettings);
    }
    case TaskType.Keycloak: {
      return await execTaskUIComponent(_task, task.properties.taskSettings);
    }

    
    // Switch Task
    case TaskType.Switch: {
      return await execTaskSwitch(_task, task);
    }
    case TaskType.Condition: {
      return await execTaskCondition(_task, task);
    }
    case TaskType.Promise: {
      return await execTaskPromise(_task, task);
    }
    case TaskType.Transaction: {
      return await execTaskTransaction(_task, task);
    }
    case TaskType.Loop: {
      return await execTaskLoop(_task, task);
    }
    case TaskType.SubCondition: {
      return await execTaskSubCondition(_task, task);
    }
    case TaskType.Iterator: {
      return await execIterator(_task, task);
    }
    case TaskType.String: {
      return await execTaskString(_task, task);
    }
    case TaskType.Cache: {
      return await execTaskCache(_task, task.properties.taskSettings);
    }
    case TaskType.State: {
      return await execState(_task, task);
    }
  }
};

// Convert Task to Step
export const execSteps = (Tasks: ITask[]) => {
  let sequence: any[] = [];
  for (let task of Tasks || []) {
    const step = execStep(task);
    if (step) {
      sequence.push(step);
    } else {
    }
  }
  return sequence;
};

export const execStep = (task: any) => {
  switch (task.type) {
    case TaskType.Document: {
      return execStepDocument(task);
    }
    case TaskType.Query: {
      return execStepDocument(task);
    }
    case TaskType.Date: {
      return execStepDocument(task);
    }
    case TaskType.Request: {
      return execStepDocument(task);
    }
    case TaskType.Response: {
      return execStepDocument(task);
    }
    case TaskType.Resolver: {
      return execStepDocument(task);
    }
    case TaskType.Rule: {
      return execStepDocument(task);
    }
    case TaskType.UUID: {
      return execStepDocument(task);
    }
    case TaskType.Object: {
      return execStepDocument(task);
    }
    case TaskType.HTTP: {
      return execStepDocument(task);
    }
    case TaskType.Geometry: {
      return execStepDocument(task);
    }
    case TaskType.Identifier: {
      return execStepDocument(task);
    }
    case TaskType.JSON: {
      return execStepDocument(task);
    }
    case TaskType.Trino: {
      return execStepDocument(task);
    }
    case TaskType.Security: {
      return execStepDocument(task);
    }
    case TaskType.SMTP: {
      return execStepDocument(task);
    }
    case TaskType.Math: {
      return execStepDocument(task);
    }
    case TaskType.Array: {
      return execStepDocument(task);
    }
    case TaskType.String: {
      return execStepDocument(task);
    }
    case TaskType.Action: {
      return execStepDocument(task);
    }

    case TaskType.Provider: {
      return execStepDocument(task);
    }
    case TaskType.Schema: {
      return execStepDocument(task);
    }
    case TaskType.Repository: {
      return execStepDocument(task);
    }
    case TaskType.RSA: {
      return execStepDocument(task);
    }
    case TaskType.Crypto: {
      return execStepDocument(task);
    }
    case TaskType.Workflow: {
      return execStepDocument(task);
    }
    case TaskType.Subscription: {
      return execStepDocument(task);
    }
    case TaskType.Cache: {
      return execStepDocument(task);
    }
    case TaskType.History: {
      return execStepDocument(task);
    }
    case TaskType.Version: {
      return execStepDocument(task);
    }
    case TaskType.Entity: {
      return execStepDocument(task);
    }
    case TaskType.ORM: {
      return execStepDocument(task);
    }
    case TaskType.MinIO: {
      return execStepDocument(task);
    }
    case TaskType.Filter: {
      return execStepDocument(task);
    }
    case TaskType.Azure: {
      return execStepDocument(task);
    }
    case TaskType.Variable: {
      return execStepDocument(task);
    }
    case TaskType.Sequence: {
      return execStepDocument(task);
    }
    case TaskType.Validator: {
      return execStepDocument(task)
    }
    case TaskType.ESQuery: {
      return execStepDocument(task);
    }
    case TaskType.Export: {
      return execStepDocument(task);
    }
    case TaskType.Template: {
      return execStepDocument(task);
    }
    case TaskType.UIComponent: {
      return execStepDocument(task);
    }
    // Switch Task
    case TaskType.Switch: {
      return execStepSwitch(task);
    }
    case TaskType.Condition: {
      return execStepCondition(task);
    }
    case TaskType.Promise: {
      return execStepSwitchCommon(task);
    }
    case TaskType.Transaction: {
      return execStepTransaction(task);
    }
    case TaskType.Loop: {
      return execStepSwitchCommon(task);
    }
    case TaskType.Iterator: {
      return execStepSwitchCommon(task);
    }
    case TaskType.State: {
      return execStepSwitchCommon(task);
    }
    default: {
      // Handle unknown task types by using generic document step conversion
      return execStepDocument(task);
    }
  }
};

const execStepDocument = (task: any) => {
  // Ensure method is preserved for router components to render correct child
  const method = task.method || task.taskSettings?.method;

  let taskDefinition: Step = {
    id: task.id || task.type,  // Preserve execution ID for state storage: state[task.id]
    _id: v4(),                 // New AI identifier
    componentType: task.componentType || "task",
    type: task.type,
    name: task.name || task.id || task.type,
    properties: {
      type: method,
      taskSettings: {
        ...task,
        method: method, // Ensure method is in taskSettings
      },
    },
  };
  return taskDefinition;
};
