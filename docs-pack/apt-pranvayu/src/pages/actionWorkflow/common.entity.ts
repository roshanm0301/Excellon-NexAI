import { v4 } from "uuid";
import { CustomIconConfiguration } from "../../designer";
import { IKeyValue, ResponseError, ResponseSuccess, ValueTypes } from "./rule";

export const successStatusCode: any[] = [200, 201];
export const errorStatusCode: any[] = [200, 400, 401, 404, 405, 408, 500, 501, 502];
export const failedStatusCode: any[] = [400, 401, 404, 405, 408, 500, 501, 502];

export const successDefinition: ResponseSuccess = {
    statusCode: 200,
    data: "payload",
    success: true,
    code: "200",
    cookies: [],
};

export const errorDefinition: ResponseError = {
    statusCode: 500,
    success: false,
    message: "Something went wrong!",
    error: "",
    code: "500",
};

export const failedDefinition: ResponseError = {
    statusCode: 400,
    success: false,
    message: "Bad Request.",
    error: undefined,
    code: "400",
};

export const payloadDefinition: IKeyValue = {
    IsResolved: true,
    Key: "",
    Value: "",
    Type: ValueTypes.Literal,
};



const schema = {
    itemType: "group",
    caption: "Success",
    cssClass: "no-margin",
    colCount: 1,
    items: [
        {
            label: { text: "Status Code" },
            dataField: "Response.success.statusCode",
        },
        {
            label: { text: "Data" },
            dataField: "Response.success.data",
        },
        {
            label: { text: "success" },
            dataField: "Response.success.success",
        },
        {
            label: { text: "Code" },
            dataField: "Response.success.code",
        },

    ],
}

export const getGetSchema = (schema: any, resolverPath: string) => {
    return false
}

export const CustomIconButtons: CustomIconConfiguration = {
    Save: false,
    SendPullRequest: false,
    Clear: false,
    Reload: false,
    ViewDefinition: false,
    CloneWorkFlow: false,
    CloneTask: false,
    ViewHistory: false,
    PasteTask: false,
    CopyToClipboard: false
}

export enum WorkFlowModes {
    ADD_ACTION = "ADD_ACTION",
    EDIT_ACTION = "EDIT_ACTION",
    CLONE_ACTION = "CLONE_ACTION",
}


export const DefaultState = [
    {
        id: v4(),
        name: "False",
        SourceType: "Const",
        path: "{$.const.false}",
        DataType: "String",
        IsPredefineColumn: true,
    },
    {
        id: v4(),
        name: "True",
        SourceType: "Const",
        path: "{$.const.true}",
        DataType: "String",
        IsPredefineColumn: true,
    },
    {
        id: v4(),
        name: "Null",
        SourceType: "Const",
        path: "{$.const.null}",
        DataType: "String",
        IsPredefineColumn: true,
    },
    {
        id: v4(),
        name: "Now",
        SourceType: "Const",
        path: "{$.const.now}",
        DataType: "String",
        IsPredefineColumn: true,
    },
    {
        id: v4(),
        name: "UserId",
        SourceType: "Auth",
        path: "{$.auth.userid}",
        DataType: "String",
        IsPredefineColumn: true,
    },
    {
        id: v4(),
        name: "SubscriptionId",
        SourceType: "Auth",
        path: "{$.subscription.id}",
        DataType: "String",
        IsPredefineColumn: true,
    },
]

export enum ActionTypeDataSource {
    "Validation" = "Validation",
    "Create" = "Create",
    "Update" = "Update",
    "Filter" = "Filter"
}