export type ResponseError = {
    statusCode: ErrorCode;
    success: false;
    message: string;
    error?: string;
    code: string;
    [key: string]: any;
};

export type ResponseSuccess = {
    statusCode: SuccessCode;
    data: any;
    success: true;
    code: string;
    cookies?: { key: string; value: string }[];
    [key: string]: any;
};

export enum SuccessCode {
    success = 200,
    created = 201
}

export enum ErrorCode {
    success = 200,
    badRequest = 400,
    unauthorized = 401,
    notfound = 404,
    methodNotAllowed = 405,
    requesttimeout = 408,
    internalServerError = 500,
    notImplemented = 501,
    badGateway = 502
}

export type Response = ResponseError | ResponseSuccess;


export enum ValueTypes {
    Literal = 'Literal',
    Property = 'Property',
    Array = 'Array'
    // DynamicField = 'DynamicField',
    // NestedObject = 'NestedObject'
}

export enum ValueTypesForResolver {
    Literal = 'Literal',
    Property = 'Property',
    Array = 'Array',
    Calculated = 'Calculated',
    Rule = 'Rule',
}

export enum OperatorTypes {
    Like = 'Like',
    LessThan = 'LessThan',
    Equal = 'Equal',
    Not = 'Not',
    ILike = 'ILike',
    IsNull = 'IsNull',
    In = 'In',
    IsNotNull = 'IsNotNull',
    GreaterThan = 'GreaterThan',
    And = 'And',
    Or = 'Or',
    Any = 'Any',
    Between = 'Between',
    NotIn = 'NotIn',
    Text = 'Text',
    LessThanOrEqual = "LessThanOrEqual",
    GreaterThanOrEqual = "GreaterThanOrEqual",
}

export enum AvjType {
    Object = 'Object',
}

export enum KeyType {
    string = 'string',
    boolean = 'boolean',
    timestamp = 'timestamp',
}

export enum Key {
    firstName = 'firstName',
    lastName = 'lastName',
    mobileNumber = 'mobileNumber',
}

export interface IKeyValue {
    IsResolved: boolean;
    Key: string;
    Value: any;
    Type: ValueTypes
}

export enum IProvisioningRequestStatus {
    PendingForApproval = 'PENDINGFORAPPROVAL',
    Approved = 'APPROVED',
    Draft = 'DRAFT',
    Reject = 'REJECT',
    ResubmitForApproval = 'RESUBMITFORAPPROVAL',
    CancelledByUser = 'CANCELLEDBYUSER'
}

export enum IRequestCrud {
    Create = 'CREATE',
    Update = 'UPDATE',
    Delete = 'DELETE'
}

export enum IEntityStatus {
    Draft = 'DRAFT',
    Published = 'PUBLISHED'
}

export enum ValueTypesForRule {
    Literal = 'Literal',
    Property = 'Property',
    Object = 'Object',
    Array = 'Array',
    Calculated = 'Calculated',
    Rule = 'Rule',
    Condition = 'Condition'
}

export enum ValueTypesForParentOfRule {
    Rule = 'Rule',
    Condition = 'Condition'
}