import { errorDefinition, failedDefinition, successDefinition } from "../../common.entity";
import { ITaskAction, ITaskCreate, ITaskGetById, ITaskRequestForward, ITaskRequestProxy, ITaskSchedule, ITaskService, ITaskUpdate, MethodType, RequestMethodType, TaskType } from "../../rule";

export const GetRequestDefinition: ITaskGetById = {
    id: "RequestGet",
    name: "",
    method: RequestMethodType.GetById,
    type: TaskType.Request,
    documentId: "",
    schema: "",
    path: "",
    query: "",
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },

};

export const PostRequestDefinition: ITaskCreate = {
    id: "RequestPost",
    name: "",
    method: RequestMethodType.Post,
    type: TaskType.Request,
    schema: "",
    path: "",
    payload: [],
    query: "",
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },

};

export const PutRequestDefinition: ITaskUpdate = {
    id: "RequestPut",
    name: "",
    method: RequestMethodType.Put,
    type: TaskType.Request,
    documentId: "",
    schema: "",
    payload: [],
    query: "",
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },

};

export const ActionRequestDefinition: ITaskAction = {
    id: "requestAction",
    name: "",
    method: RequestMethodType.Action,
    type: TaskType.Request,
    schema: "",
    documentId: "",
    async: false,
    action: "",
    payload: [],
    query: "",
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },

};


export const ServiceRequestDefinition: ITaskService = {
    id: "RequestService",
    name: "",
    method: RequestMethodType.Service,
    type: TaskType.Request,
    topic: "",
    payload: [],
    query: "",
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },

};

export const ScheduleRequestDefinition: ITaskSchedule = {
    id: "Schedule",
    name: '',
    type: TaskType.Request,
    method: RequestMethodType.Schedule,
    payload: [],
    schema: "",
    action: "",
    dateTime: "",
    documentId: "",
    query: "",
    scheduler: "",
    startDate: "",
    endDate: "",
    attempts: 0,
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
};

export const ProxyRequestDefinition: ITaskRequestProxy = {
    id: "Proxy",
    name: '',
    type: TaskType.Request,
    method: RequestMethodType.Proxy,
    payload: [],
    subscription: "",
    documentId: "",
    schema: "",
    action: "",
    query: "",
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
};

export const ForwardRequestDefinition: ITaskRequestForward = {
    id: "Forward",
    name: '',
    type: TaskType.Request,
    method: RequestMethodType.Forward,
    payload: [],
    documentId: "",
    schema: "",
    action: "",
    query: "",
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
}

export enum SchedulerType {
    "cron" = "cron",
    "delayed" = "delayed",
    "remove" = "remove"
}