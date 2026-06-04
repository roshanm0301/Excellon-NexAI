import { IKeyValue, Task } from "./rule";

export interface IAction {
    id: string;
    _id: string,
    ParentSchemaId: string,
    PartitionKey: string,
    SystemName: string,
    DisplayName: string,
    Description: string,
    Routing: boolean;
    Topic: string,
    Method: string,
    Body: object,
    Params: object,
    Query: object,
    State: any[],
    Response: object,
    Tasks: Task[],
    ActionType: string,
    Cache: {
        Enabled: boolean,
        TTL: number,
        Headers: IKeyValue[]
    },
    DLQ: {
        Enabled: boolean,
        Topic: string,
    }
    // Resolver: ITaskResolver, //ITaskResolver,
    // Response: ITaskResponse
}

export interface IActionWorkFlowProps {
    SchemaId: any;
    id: string;
    actionByIdData: any;
    entityType?: string;
    disableToolBox: boolean;
    workflowMode?: string;
    handleTreeViewContextMenu?: any
    isTreeView?: boolean
    isTemplateView?:boolean
}