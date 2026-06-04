/**
 * Task Converter Service
 * 
 * Converts between different task definition formats:
 * 
 * ## Three JSON Formats:
 * 
 * ### 1. Action Definition (Backend API format - simplest, LLM-friendly)
 * Flat structure used for API execution - what LLM should ideally generate:
 * ```typescript
 * // Simple task - all properties at root
 * { id, type, name, method, subscriptionId, schemaId, payload, ... }
 * 
 * // Condition task - branches at root
 * { id, type: "Condition", name, conditions: {...}, onSuccess: [...], onFailure: [...] }
 * 
 * // Switch task - cases at root  
 * { id, type: "Switch", name, path: "...", case: { case1: [...] }, default: [...] }
 * 
 * // Iterator/Loop/Promise - tasks at root
 * { id, type: "Iterator", name, path: "...", var: "item", tasks: [...] }
 * ```
 * 
 * ### 2. Tool Definition (What addTaskToSequence currently expects)
 * Semi-structured format with properties separated from branches:
 * ```typescript
 * {
 *   taskType: "Condition",
 *   taskName: "CheckUser", 
 *   taskId?: "...",
 *   properties: { conditions: {...}, method: "...", etc },  // flat properties
 *   branches: { onSuccess: [...], onFailure: [...] }        // separate branches
 * }
 * ```
 * 
 * ### 3. Workflow Definition (Designer/UI format - internal)
 * Fully structured format with taskSettings wrapper:
 * ```typescript
 * {
 *   id, componentType: "task"|"switch", type, name,
 *   properties: { type: method, taskSettings: {...all props...} },
 *   branches?: { onSuccess: [...], onFailure: [...] }  // for switch types
 * }
 * ```
 * 
 * ## Conversion Flow:
 * LLM generates Action Definition → Convert to Tool Definition → createStepFromDefinition → Workflow Definition
 */

import { v4 as uuid } from 'uuid';

// ============================================================================
// TASK TYPE ENUMERATION
// ============================================================================

/**
 * All supported task types in the system
 */
export enum TaskType {
    Rule = 'Rule',
    Document = 'Document',
    Query = 'Query',
    Date = 'Date',
    Request = 'Request',
    Response = 'Response',
    Resolver = 'Resolver',
    UUID = 'UUID',
    Switch = 'Switch',
    Condition = 'Condition',
    Array = 'Array',
    Object = 'Object',
    HTTP = 'HTTP',
    Geometry = 'Geometry',
    Promise = 'Promise',
    Identifier = 'Identifier',
    JSON = 'JSON',
    Transaction = 'Transaction',
    Security = 'Security',
    Loop = 'Loop',
    SMTP = 'SMTP',
    SubCondition = 'SubCondition',
    Filter = 'Filter',
    Math = 'Math',
    Iterator = 'Iterator',
    Where = 'Where',
    String = 'String',
    Action = 'Action',
    Provider = 'Provider',
    Schema = 'Schema',
    Repository = 'Repository',
    RSA = 'RSA',
    Crypto = 'Crypto',
    Workflow = 'Workflow',
    Subscription = 'Subscription',
    Cache = 'Cache',
    Version = 'Version',
    History = 'History',
    Entity = 'Entity',
    ORM = 'ORM',
    MinIO = 'MinIO',
    State = 'State',
    Trino = 'Trino',
    Azure = 'Azure',
    Variable = 'Variable',
    Sequence = 'Sequence',
    Validator = 'Validator',
    ESQuery = 'ESQuery',
    Export = 'Export',
    Template = 'Template',
    UIComponent = 'UIComponent'
}

// ============================================================================
// METHOD TYPE ENUMERATIONS (Task-wise)
// ============================================================================

/** Document task methods */
export enum DocumentMethodType {
    Get = 'Get',
    Post = 'Post',
    Put = 'Put',
    GetById = 'GetById',
    UpsertAll = 'UpsertAll'
}

/** Entity task methods */
export enum EntityMethodType {
    Get = 'Get',
    Post = 'Post',
    Put = 'Put',
    List = 'List',
    Paging = 'Paging',
    Clone = 'Clone'
}

/** Query task methods */
export enum QueryMethodType {
    Find = 'Find',
    FindOne = 'FindOne',
    FindPaging = 'FindPaging',
    Create = 'Create',
    Update = 'Update',
    Dynamic = 'Dynamic',
    Where = 'Where',
    WherePaging = 'WherePaging',
    NotExist = 'NotExist',
    RawQuery = 'RawQuery'
}

/** HTTP task methods */
export enum HttpMethodType {
    Get = 'Get',
    Post = 'Post',
    Put = 'Put',
    Delete = 'Delete'
}

/** Request task methods */
export enum RequestMethodType {
    Service = 'Service',
    Action = 'Action',
    GetById = 'GetById',
    Post = 'Post',
    Put = 'Put',
    Schedule = 'Schedule',
    Proxy = 'Proxy',
    Forward = 'Forward',
    ForwardProxy = 'ForwardProxy',
    Produce = 'Produce'
}

/** Promise task methods */
export enum PromiseMethodType {
    PromiseAll = 'PromiseAll',
    PromiseAllSettled = 'PromiseAllSettled',
    PromiseRace = 'PromiseRace',
    PromiseResolve = 'PromiseResolve',
    PromiseReject = 'PromiseReject'
}

/** Date task methods */
export enum DateMethodType {
    Format = 'Format',
    Diff = 'Diff',
    Add = 'Add',
    GetDate = 'GetDate',
    Parse = 'Parse',
    LessThan = 'LessThan',
    GreaterThan = 'GreaterThan',
    GetDay = 'GetDay'
}

/** Math task methods */
export enum MathMethodType {
    Evaluate = 'Evaluate',
    Round = 'Round',
    Ceil = 'Ceil',
    Floor = 'Floor'
}

/** JSON task methods */
export enum JsonMethodType {
    Parse = 'Parse',
    Stringify = 'Stringify'
}

/** Identifier task methods */
export enum IdentifierMethodType {
    UUID = 'UUID',
    NanoId = 'NanoId'
}

/** Cache task methods */
export enum CacheMethodType {
    Get = 'Get',
    Set = 'Set',
    Clear = 'Clear',
    Emit = 'Emit'
}

/** Security task methods */
export enum SecurityMethodType {
    JWTSign = 'JWTSign',
    JWTVerify = 'JWTVerify',
    HashPassword = 'hashPassword',
    MatchPassword = 'matchPassword',
    VerifyPassword = 'verifyPassword'
}

/** Object task methods */
export enum ObjectMethodType {
    IsObject = 'IsObject',
    IsNaN = 'IsNaN',
    IsExist = 'IsExist',
    Merge = 'Merge'
}

/** Array task methods */
export enum ArrayMethodType {
    Push = 'Push',
    Pop = 'Pop',
    Shift = 'Shift',
    Unshift = 'Unshift',
    Slice = 'Slice',
    Splice = 'Splice',
    Concat = 'Concat',
    Join = 'Join',
    Reverse = 'Reverse',
    Sort = 'Sort',
    Filter = 'Filter',
    Map = 'Map',
    Find = 'Find',
    FindIndex = 'FindIndex',
    IndexOf = 'IndexOf',
    Includes = 'Includes',
    Flat = 'Flat',
    Reduce = 'Reduce',
    ToArray = 'ToArray',
    Length = 'Length'
}

/** String task methods */
export enum StringMethodType {
    Concat = 'Concat',
    Substring = 'Substring',
    Replace = 'Replace',
    Split = 'Split',
    Trim = 'Trim',
    ToUpperCase = 'ToUpperCase',
    ToLowerCase = 'ToLowerCase',
    PadStart = 'PadStart',
    PadEnd = 'PadEnd',
    CharAt = 'CharAt',
    Length = 'Length'
}

/** RSA task methods */
export enum RSAMethodType {
    Generate = 'Generate',
    PublicEncrypt = 'PublicEncrypt',
    PublicDecrypt = 'PublicDecrypt',
    PrivateEncrypt = 'PrivateEncrypt',
    PrivateDecrypt = 'PrivateDecrypt'
}

/** Crypto task methods */
export enum CryptoMethodType {
    Encrypt = 'Encrypt',
    Decrypt = 'Decrypt'
}

/** Azure task methods */
export enum AzureMethodType {
    GetContainerClient = 'GetContainerClient',
    CreateContainer = 'CreateContainer',
    DeleteContainer = 'DeleteContainer',
    UndeleteContainer = 'UndeleteContainer',
    GetProperties = 'GetProperties',
    SetProperties = 'SetProperties',
    ListContainers = 'ListContainers',
    DownloadBlobToBuffer = 'DownloadBlobToBuffer',
    Download = 'Download',
    GetBlockBlobClient = 'GetBlockBlobClient',
    UploadData = 'UploadData',
    DownloadToBuffer = 'DownloadToBuffer',
    Upload = 'Upload'
}

/** ORM task methods */
export enum ORMMethodType {
    Get = 'Get',
    Post = 'Post',
    Put = 'Put',
    List = 'List',
    Paging = 'Paging'
}

/** Provider task methods */
export enum ProviderMethodType {
    Get = 'Get',
    Post = 'Post',
    Put = 'Put',
    List = 'List',
    Paging = 'Paging'
}

// ============================================================================
// TASK-WISE PROPERTY INTERFACES
// ============================================================================

/** Common key-value payload structure */
export interface IKeyValue {
    Id: string;
    Key: string;
    Value: unknown;
    Type: 'Literal' | 'Property' | 'Array';
    IsResolved?: boolean;
}

/**
 * Parse a literal value string to its proper JS type.
 * - "true" / "false" → boolean
 * - numeric strings → number
 * - null / "null" → null
 * - everything else stays as-is
 */
export function parseLiteralValue(value: unknown): unknown {
    if (typeof value !== 'string') {
        return value;
    }

    const trimmed = value.trim();

    // Boolean
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;

    // Null
    if (trimmed.toLowerCase() === 'null') return null;

    // Number (reject empty strings and whitespace-only)
    if (trimmed !== '' && !isNaN(Number(trimmed))) {
        return Number(trimmed);
    }

    return value;
}

/**
 * Normalize an IKeyValue array by parsing Literal-typed values to their
 * proper JS types (boolean, number, null).
 * Non-Literal entries and non-array inputs are returned unchanged.
 */
export function normalizeKeyValues(kvArray: unknown): unknown {
    if (!Array.isArray(kvArray)) {
        return kvArray;
    }

    return kvArray.map((item: IKeyValue) => {
        if (item && item.Type === 'Literal') {
            return { ...item, Value: parseLiteralValue(item.Value) };
        }
        return item;
    });
}

/** Success response structure */
export interface ResponseSuccess {
    output: string;
}

/** Error response structure */
export interface ResponseError {
    output: string;
}

// ----------------------------------------------------------------------------
// DOCUMENT TASK PROPERTIES
// ----------------------------------------------------------------------------

/** Base Document task properties */
export interface DocumentTaskBase {
    type: 'Document';
    subscriptionId: string;
    schemaId: string;
}

/** Document.Get method properties */
export interface DocumentGetProperties extends DocumentTaskBase {
    method: 'Get';
    documentId: string;
}

/** Document.Post method properties */
export interface DocumentPostProperties extends DocumentTaskBase {
    method: 'Post';
    payload: IKeyValue[];
}

/** Document.Put method properties */
export interface DocumentPutProperties extends DocumentTaskBase {
    method: 'Put';
    documentId: string;
    payload: IKeyValue[];
}

/** Document.UpsertAll method properties */
export interface DocumentUpsertAllProperties extends DocumentTaskBase {
    method: 'UpsertAll';
    documentId: string;
    payload: IKeyValue[];
    path: string;
}

// ----------------------------------------------------------------------------
// ENTITY TASK PROPERTIES
// ----------------------------------------------------------------------------

/** Base Entity task properties */
export interface EntityTaskBase {
    type: 'Entity';
    subscriptionId: string;
    containerId: string;
}

/** Entity.Get method properties */
export interface EntityGetProperties extends EntityTaskBase {
    method: 'Get';
    documentId: string;
}

/** Entity.Post method properties */
export interface EntityPostProperties extends EntityTaskBase {
    method: 'Post';
    payload: IKeyValue[];
}

/** Entity.Put method properties */
export interface EntityPutProperties extends EntityTaskBase {
    method: 'Put';
    documentId: string;
    payload: IKeyValue[];
}

/** Entity.List method properties */
export interface EntityListProperties extends EntityTaskBase {
    method: 'List';
    where: IKeyValue[];
    select: IKeyValue[];
}

/** Entity.Paging method properties */
export interface EntityPagingProperties extends EntityTaskBase {
    method: 'Paging';
    where: IKeyValue[];
    select: IKeyValue[];
    take: string;
    skip: string;
    orderby: string;
    asc: string;
    page: string;
}

// ----------------------------------------------------------------------------
// QUERY TASK PROPERTIES
// ----------------------------------------------------------------------------

/** Base Query task properties */
export interface QueryTaskBase {
    type: 'Query';
    repository?: string;
}

/** Query.Find method properties */
export interface QueryFindProperties extends QueryTaskBase {
    method: 'Find';
    take: number;
    where: IKeyValue[];
}

/** Query.FindOne method properties */
export interface QueryFindOneProperties extends QueryTaskBase {
    method: 'FindOne';
    where: IKeyValue[];
    sort: IKeyValue[];
    select: IKeyValue[];
}

/** Query.Create method properties */
export interface QueryCreateProperties extends QueryTaskBase {
    method: 'Create';
    payload: IKeyValue[];
    where: IKeyValue[];
}

/** Query.Update method properties */
export interface QueryUpdateProperties extends QueryTaskBase {
    method: 'Update';
    payload: IKeyValue[];
    where: IKeyValue[];
}

/** Query.FindPaging method properties */
export interface QueryFindPagingProperties extends QueryTaskBase {
    method: 'FindPaging';
    payload: IKeyValue[];
    where: IKeyValue[];
    take: string;
    skip: string;
    orderby: string;
    asc: string;
    page: string;
}

/** Query.RawQuery method properties */
export interface QueryRawQueryProperties extends QueryTaskBase {
    method: 'RawQuery';
    query: string;
}

// ----------------------------------------------------------------------------
// HTTP TASK PROPERTIES
// ----------------------------------------------------------------------------

/** HTTP task properties (all methods) */
export interface HTTPTaskProperties {
    type: 'HTTP';
    method: 'Get' | 'Post' | 'Put' | 'Delete';
    url: string;
    headers: IKeyValue[];
    body: IKeyValue[] | string;
    params: IKeyValue[];
    path?: boolean;
}

// ----------------------------------------------------------------------------
// REQUEST TASK PROPERTIES (Aligned with backend: apt-yuj/src/workflow/task.request.ts)
// ----------------------------------------------------------------------------

/** Base Request task properties - inherited by all Request methods */
export interface RequestBaseProperties {
    type: 'Request';
    isArray?: boolean;      // Backend: transform response to array
    path?: string;          // Backend: path for array extraction
    query?: string;         // Query string
    payload?: string | IKeyValue[]; // Backend supports string OR IKeyValue[]
    overrideError?: boolean; // Backend: override error handling
}

/** Request.Action method properties */
export interface RequestActionProperties extends RequestBaseProperties {
    method: 'Action';
    schema: string;         // Schema ID or path like {$.body.schemaId}
    action: string;         // Action name or ID
    async?: boolean;        // Execute asynchronously
    documentId?: string;    // Document ID for context
}

/** Request.Forward method properties */
export interface RequestForwardProperties extends RequestBaseProperties {
    method: 'Forward';
    schema: string;
    action: string;
    async?: boolean;
    documentId?: string;
}

/** Request.Proxy method properties */
export interface RequestProxyProperties extends RequestBaseProperties {
    method: 'Proxy';
    schema: string;
    action: string;
    subscription?: string;  // Target subscription for cross-tenant calls
    async?: boolean;
    documentId?: string;
}

/** Request.ForwardProxy method properties */
export interface RequestForwardProxyProperties extends RequestBaseProperties {
    method: 'ForwardProxy';
    payload: string;        // Note: payload is string (not IKeyValue[]) for ForwardProxy
    schema: string;
    action: string;
    subscription?: string;
    async?: boolean;
    documentId?: string;
}

/** Request.Schedule method properties */
export interface RequestScheduleProperties extends RequestBaseProperties {
    method: 'Schedule';
    schema: string;
    action: string;
    scheduler: 'remove' | 'cron' | 'delayed'; // Backend enum values
    documentId?: string;
    jobId?: string;         // Note: backend uses jobId (camelCase)
    pattern?: string;       // Cron pattern for 'cron' scheduler
    dateTime?: string;      // DateTime for 'delayed' scheduler
    startDate?: string;
    endDate?: string;
    attempts?: number;
}

/** Request.GetById method properties */
export interface RequestGetByIdProperties extends RequestBaseProperties {
    method: 'GetById';
    schema: string;
    documentId: string;     // Required for GetById
}

/** Request.Post method properties */
export interface RequestPostProperties extends RequestBaseProperties {
    method: 'Post';
    schema: string;
}

/** Request.Put method properties */
export interface RequestPutProperties extends RequestBaseProperties {
    method: 'Put';
    schema: string;
    documentId: string;     // Required for Put
}

/** Request.Service method properties */
export interface RequestServiceProperties extends RequestBaseProperties {
    method: 'Service';
    topic: string;          // Kafka topic
    async?: boolean;
}

/** Request.Produce method properties */
export interface RequestProduceProperties extends RequestBaseProperties {
    method: 'Produce';
    topic: string;          // Kafka topic
    key: string;            // Message key
    headers: string;        // Message headers
}

/** Union of all Request method properties */
export type RequestTaskProperties =
    | RequestActionProperties
    | RequestForwardProperties
    | RequestProxyProperties
    | RequestForwardProxyProperties
    | RequestScheduleProperties
    | RequestGetByIdProperties
    | RequestPostProperties
    | RequestPutProperties
    | RequestServiceProperties
    | RequestProduceProperties;

// ----------------------------------------------------------------------------
// RESPONSE TASK PROPERTIES
// ----------------------------------------------------------------------------

/** Response task properties */
export interface ResponseTaskProperties {
    type: 'Response';
    payload: IKeyValue[];
}

// ----------------------------------------------------------------------------
// RESOLVER TASK PROPERTIES
// ----------------------------------------------------------------------------

/** Resolver task properties */
export interface ResolverTaskProperties {
    type: 'Resolver';
    name: string;
    method: string;
    payload: IKeyValue[];
    isArray?: boolean;
    path?: string;
    string?: string;
}

// ----------------------------------------------------------------------------
// CONDITION TASK PROPERTIES (Branching)
// ----------------------------------------------------------------------------

/** Condition expression structure */
export interface ConditionExpressionDetailed {
    operator?: 'equals' | 'notEquals' | 'in' | 'notIn' | 'contains' | 'notContains' |
    'greaterThan' | 'greaterThanEquals' | 'lessThan' | 'lessThanEquals' |
    'isObject' | 'notObject' | 'isNaN' | 'isNumber' | 'isArray' | 'notArray' |
    'notNull' | 'regex' | 'hasProperty';
    fact?: string;
    value?: unknown;
    and?: ConditionExpressionDetailed[];
    any?: ConditionExpressionDetailed[];
}

/** Condition task properties */
export interface ConditionTaskProperties {
    type: 'Condition';
    conditions: ConditionExpressionDetailed;
    // Branches: onSuccess, onFailure
}

// ----------------------------------------------------------------------------
// SWITCH TASK PROPERTIES (Branching)
// ----------------------------------------------------------------------------

/** Switch task properties */
export interface SwitchTaskProperties {
    type: 'Switch';
    path: string;  // JSONPath to evaluate
    // Branches: case (object), default
}

// ----------------------------------------------------------------------------
// ITERATOR TASK PROPERTIES (Branching)
// ----------------------------------------------------------------------------

/** Iterator task properties */
export interface IteratorTaskProperties {
    type: 'Iterator';
    method: string;
    path: string;      // Path to array to iterate
    var: string;       // Variable name for current item
    index: string;     // Variable name for index
    async: boolean;
    break: boolean;
    breakConditions?: ConditionExpressionDetailed;
    // Branches: tasks
}

// ----------------------------------------------------------------------------
// LOOP TASK PROPERTIES (Branching)
// ----------------------------------------------------------------------------

/** Loop task properties */
export interface LoopTaskProperties {
    type: 'Loop';
    start: number;
    iterations: number | string;
    index: string;     // Variable name for index
    break: boolean;
    breakConditions?: ConditionExpressionDetailed;
    // Branches: tasks
}

// ----------------------------------------------------------------------------
// TRANSACTION TASK PROPERTIES (Branching)
// ----------------------------------------------------------------------------

/** Transaction task properties */
export interface TransactionTaskProperties {
    type: 'Transaction';
    key: string;
    // Branches: tasks, rollback
}

// ----------------------------------------------------------------------------
// PROMISE TASK PROPERTIES (Branching)
// ----------------------------------------------------------------------------

/** Promise task properties */
export interface PromiseTaskProperties {
    type: 'Promise';
    method: 'PromiseAll' | 'PromiseAllSettled' | 'PromiseRace' | 'PromiseResolve' | 'PromiseReject';
    // Branches: tasks
}

// ----------------------------------------------------------------------------
// STATE TASK PROPERTIES (Branching)
// ----------------------------------------------------------------------------

/** State task properties */
export interface StateTaskProperties {
    type: 'State';
    path: string;
    // Branches: tasks
}

// ----------------------------------------------------------------------------
// SEQUENCE TASK PROPERTIES (Branching)
// ----------------------------------------------------------------------------

/** Sequence task properties */
export interface SequenceTaskProperties {
    type: 'Sequence';
    subscription: string;
    schema: string;
    prefix: string;
    paddingLength: number;
    paddingCharacter: string;
    readonly?: boolean;
    // Branches: tasks
}

// ----------------------------------------------------------------------------
// ARRAY TASK PROPERTIES
// ----------------------------------------------------------------------------

/** Array task base properties */
export interface ArrayTaskBase {
    type: 'Array';
    method: string;
}

/** Array.Push properties */
export interface ArrayPushProperties extends ArrayTaskBase {
    method: 'Push';
    path: string;
    value: unknown;
}

/** Array.Filter properties */
export interface ArrayFilterProperties extends ArrayTaskBase {
    method: 'Filter';
    path: string;
    conditions: ConditionExpressionDetailed;
    var?: string;
}

/** Array.Map properties */
export interface ArrayMapProperties extends ArrayTaskBase {
    method: 'Map';
    path: string;
    payload: IKeyValue[];
    var?: string;
}

/** Array.Find properties */
export interface ArrayFindProperties extends ArrayTaskBase {
    method: 'Find';
    path: string;
    conditions: ConditionExpressionDetailed;
}

/** Array.Sort properties */
export interface ArraySortProperties extends ArrayTaskBase {
    method: 'Sort';
    path: string;
    key?: string;
    asc?: boolean;
}

/** Array.Slice properties */
export interface ArraySliceProperties extends ArrayTaskBase {
    method: 'Slice';
    path: string;
    fromIndex?: number;
    index?: number;
}

/** Array.Join properties */
export interface ArrayJoinProperties extends ArrayTaskBase {
    method: 'Join';
    path: string;
    separator?: string;
}

/** Array.ToArray properties */
export interface ArrayToArrayProperties extends ArrayTaskBase {
    method: 'ToArray';
    path: string;
    property?: string;
    distinct?: boolean;
}

// ----------------------------------------------------------------------------
// OBJECT TASK PROPERTIES
// ----------------------------------------------------------------------------

/** Object.IsExist properties */
export interface ObjectIsExistProperties {
    type: 'Object';
    method: 'IsExist';
    key: string;
    path: string;
}

/** Object.IsObject properties */
export interface ObjectIsObjectProperties {
    type: 'Object';
    method: 'IsObject';
    path: string;
}

/** Object.Merge properties */
export interface ObjectMergeProperties {
    type: 'Object';
    method: 'Merge';
    paths?: string[];
}

// ----------------------------------------------------------------------------
// STRING TASK PROPERTIES
// ----------------------------------------------------------------------------

/** String task base properties */
export interface StringTaskBase {
    type: 'String';
    method: string;
}

/** String.Concat properties */
export interface StringConcatProperties extends StringTaskBase {
    method: 'Concat';
    strings: string[];
}

/** String.Substring properties */
export interface StringSubstringProperties extends StringTaskBase {
    method: 'Substring';
    path: string;
    start: string;
    end?: string;
}

/** String.Replace properties */
export interface StringReplaceProperties extends StringTaskBase {
    method: 'Replace';
    path: string;
    searchValue: string;
    replaceValue: string;
}

/** String.Split properties */
export interface StringSplitProperties extends StringTaskBase {
    method: 'Split';
    path: string;
    splitValue: string;
}

/** String.PadStart properties */
export interface StringPadStartProperties extends StringTaskBase {
    method: 'PadStart';
    path: string;
    maxLength: string;
    fillString?: string;
}

// ----------------------------------------------------------------------------
// MATH TASK PROPERTIES
// ----------------------------------------------------------------------------

/** Math.Evaluate properties */
export interface MathEvaluateProperties {
    type: 'Math';
    method: 'Evaluate';
    expression: string;
    payload: IKeyValue[];
}

/** Math.Round properties */
export interface MathRoundProperties {
    type: 'Math';
    method: 'Round' | 'Ceil' | 'Floor';
    expression: string;
}

// ----------------------------------------------------------------------------
// DATE TASK PROPERTIES
// ----------------------------------------------------------------------------

/** Date.GetDate properties */
export interface DateGetDateProperties {
    type: 'Date';
    method: 'GetDate';
}

/** Date.Add properties */
export interface DateAddProperties {
    type: 'Date';
    method: 'Add';
    date: string;
    amount: string;
    unit: 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds';
}

/** Date.Format properties */
export interface DateFormatProperties {
    type: 'Date';
    method: 'Format';
    date: string;
    format: string;
}

/** Date.Diff properties */
export interface DateDiffProperties {
    type: 'Date';
    method: 'Diff';
    from: string;
    to: string;
    unitOfTime: 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds';
    precise?: boolean;
}

// ----------------------------------------------------------------------------
// JSON TASK PROPERTIES
// ----------------------------------------------------------------------------

/** JSON.Parse properties */
export interface JSONParseProperties {
    type: 'JSON';
    method: 'Parse';
    payload: string;
}

/** JSON.Stringify properties */
export interface JSONStringifyProperties {
    type: 'JSON';
    method: 'Stringify';
    payload: string;
}

// ----------------------------------------------------------------------------
// IDENTIFIER TASK PROPERTIES
// ----------------------------------------------------------------------------

/** Identifier.UUID properties */
export interface IdentifierUUIDProperties {
    type: 'Identifier';
    method: 'UUID';
}

/** Identifier.NanoId properties */
export interface IdentifierNanoIdProperties {
    type: 'Identifier';
    method: 'NanoId';
    format: string;
    size: string;
}

// ----------------------------------------------------------------------------
// CACHE TASK PROPERTIES
// ----------------------------------------------------------------------------

/** Cache.Get properties */
export interface CacheGetProperties {
    type: 'Cache';
    method: 'Get';
    partitionKey: string;
    schemaId: string;
    documentId: string;
}

/** Cache.Set properties */
export interface CacheSetProperties {
    type: 'Cache';
    method: 'Set';
    partitionKey: string;
    schemaId: string;
    documentId: string;
    value: unknown;
    seconds: string;
}

/** Cache.Clear properties */
export interface CacheClearProperties {
    type: 'Cache';
    method: 'Clear';
    pattern: string;
}

/** Cache.Emit properties */
export interface CacheEmitProperties {
    type: 'Cache';
    method: 'Emit';
    room: string;
    key: string;
    value: string;
}

// ----------------------------------------------------------------------------
// SECURITY TASK PROPERTIES
// ----------------------------------------------------------------------------

/** Security.JWTSign properties */
export interface SecurityJWTSignProperties {
    type: 'Security';
    method: 'JWTSign';
    payload: IKeyValue[];
    options: IKeyValue[];
    secret: string;
    selfSign?: boolean;
}

/** Security.JWTVerify properties */
export interface SecurityJWTVerifyProperties {
    type: 'Security';
    method: 'JWTVerify';
    token: string;
    options: IKeyValue[];
    secret: string;
    selfSign?: boolean;
}

/** Security.HashPassword properties */
export interface SecurityHashPasswordProperties {
    type: 'Security';
    method: 'hashPassword';
    password: string;
}

// ----------------------------------------------------------------------------
// CRYPTO TASK PROPERTIES
// ----------------------------------------------------------------------------

/** Crypto.Encrypt properties */
export interface CryptoEncryptProperties {
    type: 'Crypto';
    method: 'Encrypt';
    hashAlgo: string;
    iv: string;
    algorithm: string;
    data: string;
    secret: string;
    outputEncoding: string;
    inputEncoding: string;
}

/** Crypto.Decrypt properties */
export interface CryptoDecryptProperties {
    type: 'Crypto';
    method: 'Decrypt';
    hashAlgo: string;
    iv: string;
    algorithm: string;
    data: string;
    secret: string;
    outputEncoding: string;
    inputEncoding: string;
}

// ----------------------------------------------------------------------------
// RSA TASK PROPERTIES
// ----------------------------------------------------------------------------

/** RSA.PublicEncrypt properties */
export interface RSAPublicEncryptProperties {
    type: 'RSA';
    method: 'PublicEncrypt';
    publicKey: string;
    str: string;
}

/** RSA.PrivateDecrypt properties */
export interface RSAPrivateDecryptProperties {
    type: 'RSA';
    method: 'PrivateDecrypt';
    privateKey: string;
    str: string;
}

// ----------------------------------------------------------------------------
// SMTP TASK PROPERTIES
// ----------------------------------------------------------------------------

/** SMTP task properties */
export interface SMTPTaskProperties {
    type: 'SMTP';
    To: string;
    From: string;
    CC?: string;
    HtmlBody?: string;
    Body?: string;
    Subject: string;
    payload: IKeyValue[];
}

// ----------------------------------------------------------------------------
// WORKFLOW TASK PROPERTIES
// ----------------------------------------------------------------------------

/** Workflow task properties */
export interface WorkflowTaskProperties {
    type: 'Workflow';
    subscription: string;
    repository: string;
    state: string;
    method: string;
    tasks?: string;
    template?: string;
}

// ----------------------------------------------------------------------------
// AZURE TASK PROPERTIES
// ----------------------------------------------------------------------------

/** Azure task base properties */
export interface AzureTaskBase {
    type: 'Azure';
    method: string;
    containerName: string;
    options?: string;
}

/** Azure.Upload properties */
export interface AzureUploadProperties extends AzureTaskBase {
    method: 'Upload';
    blobName: string;
    data: string;
}

/** Azure.Download properties */
export interface AzureDownloadProperties extends AzureTaskBase {
    method: 'Download';
    blobName: string;
}

// ----------------------------------------------------------------------------
// ORM TASK PROPERTIES
// ----------------------------------------------------------------------------

/** ORM task properties */
export interface ORMTaskProperties {
    type: 'ORM';
    method: string;
    subscriptionId: string;
    schema: string;
}

// ----------------------------------------------------------------------------
// EXPORT TASK PROPERTIES
// ----------------------------------------------------------------------------

/** Export task properties */
export interface ExportTaskProperties {
    type: 'Export';
    columns: IKeyValue[];
    where: IKeyValue[];
    select: IKeyValue[];
    schema: string;
    subscription: string;
}

// ----------------------------------------------------------------------------
// GEOMETRY TASK PROPERTIES
// ----------------------------------------------------------------------------

/** Geometry.Haversine properties */
export interface GeometryHaversineProperties {
    type: 'Geometry';
    method: 'Haversine';
    latitude1: string;
    longitude1: string;
    latitude2: string;
    longitude2: string;
}

// ----------------------------------------------------------------------------
// VALIDATOR TASK PROPERTIES
// ----------------------------------------------------------------------------

/** Validator task properties */
export interface ValidatorTaskProperties {
    type: 'Validator';
    method: string;
}

// ----------------------------------------------------------------------------
// VARIABLE TASK PROPERTIES
// ----------------------------------------------------------------------------

/** Variable task properties */
export interface VariableTaskProperties {
    type: 'Variable';
    repository: string;
}

// ----------------------------------------------------------------------------
// UUID TASK PROPERTIES
// ----------------------------------------------------------------------------

/** UUID task properties (generates UUID) */
export interface UUIDTaskProperties {
    type: 'UUID';
}

// ============================================================================
// TASK PROPERTY CONFIGURATION MAP
// ============================================================================

/**
 * Configuration for each task type defining required properties per method
 */
export const TASK_PROPERTY_CONFIG: Record<string, {
    methods?: Record<string, string[]>;              // method -> required properties
    methodOptionalProperties?: Record<string, string[]>;  // method -> optional properties
    requiredProperties?: string[];                   // always required
    optionalProperties?: string[];                   // optional properties
    isBranching?: boolean;                           // whether it has branches
    branches?: string[];                             // branch names
}> = {
    // Data Operation Tasks
    Document: {
        requiredProperties: ['subscriptionId', 'schemaId'],
        methods: {
            Get: ['documentId'],
            Post: ['payload'],
            Put: ['documentId', 'payload'],
            UpsertAll: ['documentId', 'payload', 'path']
        }
    },
    Entity: {
        requiredProperties: ['subscriptionId', 'containerId'],
        methods: {
            Get: ['documentId'],
            Post: ['payload'],
            Put: ['documentId', 'payload'],
            List: ['where', 'select'],
            Paging: ['where', 'select', 'take', 'skip', 'orderby', 'asc', 'page']
        }
    },
    Query: {
        optionalProperties: ['repository'],
        methods: {
            Find: ['take', 'where'],
            FindOne: ['where', 'sort', 'select'],
            Create: ['payload', 'where'],
            Update: ['payload', 'where'],
            FindPaging: ['payload', 'where', 'take', 'skip', 'orderby', 'asc', 'page'],
            RawQuery: ['query']
        }
    },
    // Network Tasks
    HTTP: {
        requiredProperties: ['url', 'method', 'headers'],
        optionalProperties: ['body', 'params', 'path']
    },
    Request: {
        requiredProperties: [],  // Base properties: isArray, path, query, payload, overrideError (all optional)
        optionalProperties: ['isArray', 'path', 'query', 'payload', 'overrideError'],
        methods: {
            Action: ['schema', 'action'],
            Forward: ['schema', 'action'],
            Proxy: ['schema', 'action'],
            ForwardProxy: ['schema', 'action', 'payload'],  // payload is string, required
            Schedule: ['schema', 'action', 'scheduler'],
            GetById: ['schema', 'documentId'],
            Post: ['schema'],
            Put: ['schema', 'documentId'],
            Service: ['topic'],
            Produce: ['topic', 'key', 'headers']
        },
        methodOptionalProperties: {
            Action: ['async', 'documentId', 'payload'],
            Forward: ['async', 'documentId', 'payload'],
            Proxy: ['async', 'documentId', 'subscription', 'payload'],
            ForwardProxy: ['async', 'documentId', 'subscription'],
            Schedule: ['documentId', 'jobId', 'pattern', 'dateTime', 'startDate', 'endDate', 'attempts', 'payload'],
            GetById: ['path'],
            Post: ['payload'],
            Put: ['payload'],
            Service: ['async', 'payload'],
            Produce: []
        }
    },
    Response: {
        requiredProperties: ['payload']
    },
    SMTP: {
        requiredProperties: ['To', 'From', 'Subject', 'payload'],
        optionalProperties: ['CC', 'HtmlBody', 'Body']
    },
    // Transformation Tasks
    Resolver: {
        requiredProperties: ['name', 'method', 'payload'],
        optionalProperties: ['isArray', 'path', 'string']
    },
    Array: {
        requiredProperties: ['method'],
        methods: {
            Push: ['path', 'value'],
            Pop: ['path'],
            Shift: ['path'],
            Slice: ['path'],
            Filter: ['path', 'conditions'],
            Map: ['path', 'payload'],
            Find: ['path', 'conditions'],
            Sort: ['path'],
            Join: ['path'],
            ToArray: ['path']
        }
    },
    Object: {
        requiredProperties: ['method'],
        methods: {
            IsExist: ['key', 'path'],
            IsObject: ['path'],
            Merge: []
        }
    },
    String: {
        requiredProperties: ['method'],
        methods: {
            Concat: ['strings'],
            Substring: ['path', 'start'],
            Replace: ['path', 'searchValue', 'replaceValue'],
            Split: ['path', 'splitValue'],
            PadStart: ['path', 'maxLength'],
            PadEnd: ['path', 'maxLength']
        }
    },
    JSON: {
        requiredProperties: ['method', 'payload']
    },
    Math: {
        requiredProperties: ['method'],
        methods: {
            Evaluate: ['expression', 'payload'],
            Round: ['expression'],
            Ceil: ['expression'],
            Floor: ['expression']
        }
    },
    // Date/Time Tasks
    Date: {
        requiredProperties: ['method'],
        methods: {
            GetDate: [],
            Add: ['date', 'amount', 'unit'],
            Format: ['date', 'format'],
            Diff: ['from', 'to', 'unitOfTime']
        }
    },
    // Security Tasks
    Security: {
        requiredProperties: ['method'],
        methods: {
            JWTSign: ['payload', 'options', 'secret'],
            JWTVerify: ['token', 'options', 'secret'],
            hashPassword: ['password']
        }
    },
    Crypto: {
        requiredProperties: ['method', 'hashAlgo', 'iv', 'algorithm', 'data', 'secret', 'outputEncoding', 'inputEncoding']
    },
    RSA: {
        requiredProperties: ['method'],
        methods: {
            PublicEncrypt: ['publicKey', 'str'],
            PrivateDecrypt: ['privateKey', 'str']
        }
    },
    // System Tasks
    UUID: {
        requiredProperties: []
    },
    Identifier: {
        requiredProperties: ['method'],
        methods: {
            UUID: [],
            NanoId: ['format', 'size']
        }
    },
    Cache: {
        requiredProperties: ['method'],
        methods: {
            Get: ['partitionKey', 'schemaId', 'documentId'],
            Set: ['partitionKey', 'schemaId', 'documentId', 'value', 'seconds'],
            Clear: ['pattern'],
            Emit: ['room', 'key', 'value']
        }
    },
    Variable: {
        requiredProperties: ['repository']
    },
    // Platform Tasks
    Azure: {
        requiredProperties: ['method', 'containerName'],
        optionalProperties: ['options']
    },
    Workflow: {
        requiredProperties: ['subscription', 'repository', 'state', 'method'],
        optionalProperties: ['tasks', 'template']
    },
    ORM: {
        requiredProperties: ['subscriptionId', 'schema', 'method']
    },
    Export: {
        requiredProperties: ['columns', 'where', 'select', 'schema', 'subscription']
    },
    Geometry: {
        requiredProperties: ['method'],
        methods: {
            Haversine: ['latitude1', 'longitude1', 'latitude2', 'longitude2']
        }
    },
    Validator: {
        requiredProperties: ['method']
    },
    // Branching Tasks
    Condition: {
        requiredProperties: ['conditions'],
        isBranching: true,
        branches: ['onSuccess', 'onFailure']
    },
    Switch: {
        requiredProperties: ['path'],
        isBranching: true,
        branches: ['case', 'default']
    },
    Iterator: {
        requiredProperties: ['method', 'path', 'var', 'index', 'async'],
        optionalProperties: ['break', 'breakConditions'],
        isBranching: true,
        branches: ['tasks']
    },
    Loop: {
        requiredProperties: ['start', 'iterations', 'index'],
        optionalProperties: ['break', 'breakConditions'],
        isBranching: true,
        branches: ['tasks']
    },
    Transaction: {
        requiredProperties: ['key'],
        isBranching: true,
        branches: ['tasks', 'rollback']
    },
    Promise: {
        requiredProperties: ['method'],
        isBranching: true,
        branches: ['tasks']
    },
    State: {
        requiredProperties: ['path'],
        isBranching: true,
        branches: ['tasks']
    },
    Sequence: {
        requiredProperties: ['subscription', 'schema', 'prefix', 'paddingLength', 'paddingCharacter'],
        optionalProperties: ['readonly'],
        isBranching: true,
        branches: ['tasks']
    }
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Action Definition - Flat structure that LLM generates
 * This is the simpler format that's easier for LLM to understand and generate
 */
export interface ActionDefinitionTask {
    id?: string;
    type: string;
    name?: string;
    method?: string;
    componentType?: string;

    // Common properties (flattened)
    [key: string]: unknown;

    // Condition task specific (at root level)
    conditions?: ConditionExpression;
    onSuccess?: ActionDefinitionTask[];
    onFailure?: ActionDefinitionTask[];

    // Switch task specific (at root level)
    case?: Record<string, ActionDefinitionTask[]>;
    default?: ActionDefinitionTask[];
    path?: string;

    // Iterator/Loop/Promise/Transaction task specific (at root level)
    tasks?: ActionDefinitionTask[];
    rollback?: ActionDefinitionTask[];
}

export interface ConditionExpression {
    operator?: string;
    fact?: string;
    value?: unknown;
    and?: ConditionExpression[];
    any?: ConditionExpression[];
}

/**
 * Workflow Definition - Structured format that designer uses
 */
export interface WorkflowDefinitionTask {
    id: string;
    componentType: 'task' | 'switch';
    type: string;
    name: string;
    properties: {
        type?: string;
        taskSettings: Record<string, unknown>;
    };
    branches?: Record<string, WorkflowDefinitionTask[]>;
}

// ============================================================================
// BRANCHING TASK TYPES
// ============================================================================

/**
 * Task types that use branching (componentType: "switch")
 */
const BRANCHING_TASK_TYPES = new Set([
    'Condition',
    'Switch',
    'Iterator',
    'Loop',
    'Transaction',
    'Promise',
    'State',
    'Sequence'
]);

/**
 * Branch configurations for each branching task type
 */
const BRANCH_CONFIGS: Record<string, {
    branchNames: string[];
    defaultBranches: Record<string, ActionDefinitionTask[]>;
}> = {
    'Condition': {
        branchNames: ['onSuccess', 'onFailure'],
        defaultBranches: { onSuccess: [], onFailure: [] }
    },
    'Switch': {
        branchNames: ['case', 'default'],
        defaultBranches: { default: [] }
    },
    'Iterator': {
        branchNames: ['tasks'],
        defaultBranches: { tasks: [] }
    },
    'Loop': {
        branchNames: ['tasks'],
        defaultBranches: { tasks: [] }
    },
    'Transaction': {
        branchNames: ['tasks', 'rollback'],
        defaultBranches: { tasks: [], rollback: [] }
    },
    'Promise': {
        branchNames: ['tasks'],
        defaultBranches: { tasks: [] }
    },
    'State': {
        branchNames: ['tasks'],
        defaultBranches: { tasks: [] }
    },
    'Sequence': {
        branchNames: ['tasks'],
        defaultBranches: { tasks: [] }
    }
};

/**
 * Properties that should be excluded from taskSettings (they go elsewhere)
 */
const EXCLUDED_FROM_TASK_SETTINGS = new Set([
    'id', 'type', 'name', 'componentType',
    // Branching properties - handled separately
    'onSuccess', 'onFailure', 'tasks', 'rollback', 'case', 'default'
]);

// ============================================================================
// MAIN CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert Action Definition (LLM format) to Workflow Definition (Designer format)
 * This is the main function used after LLM generates a task
 * 
 * @param actionTask - Task in Action Definition format (what LLM generates)
 * @returns Task in Workflow Definition format (what designer uses)
 */
export function actionToWorkflowDefinition(actionTask: ActionDefinitionTask): WorkflowDefinitionTask {
    const taskType = actionTask.type;
    const isBranching = BRANCHING_TASK_TYPES.has(taskType);

    if (isBranching) {
        return convertBranchingTask(actionTask);
    } else {
        return convertSimpleTask(actionTask);
    }
}

/**
 * Convert multiple Action Definition tasks to Workflow Definition tasks
 * 
 * @param actionTasks - Array of tasks in Action Definition format
 * @returns Array of tasks in Workflow Definition format
 */
export function actionArrayToWorkflowDefinition(actionTasks: ActionDefinitionTask[]): WorkflowDefinitionTask[] {
    if (!actionTasks || !Array.isArray(actionTasks)) {
        return [];
    }
    return actionTasks.map(task => actionToWorkflowDefinition(task));
}

/**
 * Convert Workflow Definition (Designer format) to Action Definition (LLM format)
 * This is useful when fetching existing workflows to show to LLM
 * 
 * @param workflowTask - Task in Workflow Definition format
 * @returns Task in Action Definition format
 */
export function workflowToActionDefinition(workflowTask: WorkflowDefinitionTask): ActionDefinitionTask {
    const taskType = workflowTask.type;
    const isBranching = BRANCHING_TASK_TYPES.has(taskType);

    if (isBranching) {
        return convertWorkflowBranchingToAction(workflowTask);
    } else {
        return convertWorkflowSimpleToAction(workflowTask);
    }
}

/**
 * Convert multiple Workflow Definition tasks to Action Definition tasks
 * 
 * @param workflowTasks - Array of tasks in Workflow Definition format
 * @returns Array of tasks in Action Definition format
 */
export function workflowArrayToActionDefinition(workflowTasks: WorkflowDefinitionTask[]): ActionDefinitionTask[] {
    if (!workflowTasks || !Array.isArray(workflowTasks)) {
        return [];
    }
    return workflowTasks.map(task => workflowToActionDefinition(task));
}

// ============================================================================
// CONVERSION HELPERS: ACTION → WORKFLOW
// ============================================================================

/**
 * Convert a simple (non-branching) task from Action to Workflow format
 */
function convertSimpleTask(actionTask: ActionDefinitionTask): WorkflowDefinitionTask {
    const taskSettings = extractTaskSettings(actionTask);

    return {
        id: actionTask.id || uuid(),
        componentType: 'task',
        type: actionTask.type,
        name: actionTask.name || actionTask.id || actionTask.type,
        properties: {
            type: actionTask.method || actionTask.type,
            taskSettings
        }
    };
}

/**
 * Convert a branching task from Action to Workflow format
 */
function convertBranchingTask(actionTask: ActionDefinitionTask): WorkflowDefinitionTask {
    const taskType = actionTask.type;
    const taskSettings = extractTaskSettings(actionTask);
    const branches = extractBranches(actionTask);

    // For Condition task, conditions should be in taskSettings
    if (taskType === 'Condition' && actionTask.conditions) {
        taskSettings.conditions = actionTask.conditions;
    }

    // For Switch task, path should be in taskSettings  
    if (taskType === 'Switch' && actionTask.path) {
        taskSettings.path = actionTask.path;
    }

    return {
        id: actionTask.id || uuid(),
        componentType: 'switch',
        type: taskType,
        name: actionTask.name || actionTask.id || taskType,
        properties: {
            type: actionTask.method || taskType,
            taskSettings
        },
        branches
    };
}

/**
 * Extract taskSettings from Action Definition (excluding branch properties)
 */
function extractTaskSettings(actionTask: ActionDefinitionTask): Record<string, unknown> {
    const taskSettings: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(actionTask)) {
        if (!EXCLUDED_FROM_TASK_SETTINGS.has(key)) {
            // For Condition, don't include conditions here as it's handled separately
            if (actionTask.type === 'Condition' && key === 'conditions') {
                continue;
            }
            // Normalize IKeyValue[] arrays so Literal values are parsed to proper types
            taskSettings[key] = Array.isArray(value) ? normalizeKeyValues(value) : value;
        }
    }

    return taskSettings;
}

/**
 * Extract and convert branches from Action Definition
 */
function extractBranches(actionTask: ActionDefinitionTask): Record<string, WorkflowDefinitionTask[]> {
    const taskType = actionTask.type;
    const config = BRANCH_CONFIGS[taskType];

    if (!config) {
        return {};
    }

    // Initialize with empty arrays (not the defaultBranches which have wrong type)
    const branches: Record<string, WorkflowDefinitionTask[]> = {};
    for (const key of Object.keys(config.defaultBranches)) {
        branches[key] = [];
    }

    switch (taskType) {
        case 'Condition':
            if (actionTask.onSuccess) {
                branches.onSuccess = actionArrayToWorkflowDefinition(actionTask.onSuccess);
            }
            if (actionTask.onFailure) {
                branches.onFailure = actionArrayToWorkflowDefinition(actionTask.onFailure);
            }
            break;

        case 'Switch':
            // Handle case branches
            if (actionTask.case) {
                for (const [caseName, caseTasks] of Object.entries(actionTask.case)) {
                    if (Array.isArray(caseTasks)) {
                        branches[caseName] = actionArrayToWorkflowDefinition(caseTasks);
                    }
                }
            }
            // Handle default branch
            if (actionTask.default) {
                branches.default = actionArrayToWorkflowDefinition(actionTask.default);
            }
            break;

        case 'Transaction':
            if (actionTask.tasks) {
                branches.tasks = actionArrayToWorkflowDefinition(actionTask.tasks);
            }
            if (actionTask.rollback) {
                branches.rollback = actionArrayToWorkflowDefinition(actionTask.rollback);
            }
            break;

        case 'Iterator':
        case 'Loop':
        case 'Promise':
        case 'State':
        case 'Sequence':
            if (actionTask.tasks) {
                branches.tasks = actionArrayToWorkflowDefinition(actionTask.tasks);
            }
            break;
    }

    return branches;
}

// ============================================================================
// CONVERSION HELPERS: WORKFLOW → ACTION
// ============================================================================

/**
 * Convert a simple (non-branching) task from Workflow to Action format
 */
function convertWorkflowSimpleToAction(workflowTask: WorkflowDefinitionTask): ActionDefinitionTask {
    const taskSettings = workflowTask.properties?.taskSettings || {};

    return {
        id: workflowTask.id,
        type: workflowTask.type,
        name: workflowTask.name,
        ...taskSettings
    } as ActionDefinitionTask;
}

/**
 * Convert a branching task from Workflow to Action format
 */
function convertWorkflowBranchingToAction(workflowTask: WorkflowDefinitionTask): ActionDefinitionTask {
    const taskType = workflowTask.type;
    const taskSettings = workflowTask.properties?.taskSettings || {};
    const branches = workflowTask.branches || {};

    const actionTask: ActionDefinitionTask = {
        id: workflowTask.id,
        type: taskType,
        name: workflowTask.name,
        ...taskSettings
    };

    switch (taskType) {
        case 'Condition':
            // Move conditions to root level
            if (taskSettings.conditions) {
                actionTask.conditions = taskSettings.conditions as ConditionExpression;
            }
            // Convert branches
            if (branches.onSuccess) {
                actionTask.onSuccess = workflowArrayToActionDefinition(branches.onSuccess);
            }
            if (branches.onFailure) {
                actionTask.onFailure = workflowArrayToActionDefinition(branches.onFailure);
            }
            break;

        case 'Switch': {
            // Move path to root level
            if (taskSettings.path) {
                actionTask.path = taskSettings.path as string;
            }
            // Convert case branches
            const caseObj: Record<string, ActionDefinitionTask[]> = {};
            for (const [branchName, branchTasks] of Object.entries(branches)) {
                if (branchName === 'default') {
                    actionTask.default = workflowArrayToActionDefinition(branchTasks);
                } else {
                    caseObj[branchName] = workflowArrayToActionDefinition(branchTasks);
                }
            }
            if (Object.keys(caseObj).length > 0) {
                actionTask.case = caseObj;
            }
            break;
        }

        case 'Transaction':
            if (branches.tasks) {
                actionTask.tasks = workflowArrayToActionDefinition(branches.tasks);
            }
            if (branches.rollback) {
                actionTask.rollback = workflowArrayToActionDefinition(branches.rollback);
            }
            break;

        case 'Iterator':
        case 'Loop':
        case 'Promise':
        case 'State':
        case 'Sequence':
            if (branches.tasks) {
                actionTask.tasks = workflowArrayToActionDefinition(branches.tasks);
            }
            break;
    }

    return actionTask;
}

// ============================================================================
// VALIDATION & UTILITIES
// ============================================================================

/**
 * Check if a task is a branching task type
 */
export function isBranchingTaskType(taskType: string): boolean {
    return BRANCHING_TASK_TYPES.has(taskType);
}

/**
 * Get the branch configuration for a task type
 */
export function getBranchConfig(taskType: string): typeof BRANCH_CONFIGS[string] | null {
    return BRANCH_CONFIGS[taskType] || null;
}

/**
 * Validate that a task has required branches
 */
export function validateTaskBranches(task: ActionDefinitionTask): { valid: boolean; errors: string[] } {
    const taskType = task.type;
    const config = BRANCH_CONFIGS[taskType];

    if (!config) {
        return { valid: true, errors: [] };
    }

    const errors: string[] = [];

    // For now, just check that branch arrays are arrays if they exist
    switch (taskType) {
        case 'Condition':
            if (task.onSuccess && !Array.isArray(task.onSuccess)) {
                errors.push('onSuccess must be an array');
            }
            if (task.onFailure && !Array.isArray(task.onFailure)) {
                errors.push('onFailure must be an array');
            }
            break;

        case 'Switch':
            if (task.case && typeof task.case !== 'object') {
                errors.push('case must be an object');
            }
            if (task.default && !Array.isArray(task.default)) {
                errors.push('default must be an array');
            }
            break;

        case 'Iterator':
        case 'Loop':
        case 'Promise':
        case 'State':
        case 'Sequence':
            if (task.tasks && !Array.isArray(task.tasks)) {
                errors.push('tasks must be an array');
            }
            break;

        case 'Transaction':
            if (task.tasks && !Array.isArray(task.tasks)) {
                errors.push('tasks must be an array');
            }
            if (task.rollback && !Array.isArray(task.rollback)) {
                errors.push('rollback must be an array');
            }
            break;
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Deep clone a task definition
 */
export function cloneTaskDefinition<T extends ActionDefinitionTask | WorkflowDefinitionTask>(task: T): T {
    // Use structuredClone for deep cloning (available in modern browsers/Node.js)
    if (typeof structuredClone === 'function') {
        return structuredClone(task);
    }
    // Fallback for older environments
    return JSON.parse(JSON.stringify(task));
}

// ============================================================================
// ACTION DEFINITION → TOOL DEFINITION CONVERSION
// ============================================================================

/**
 * Tool Definition - What addTaskToSequence expects
 * This is an intermediate format between Action Definition and Workflow Definition
 * 
 * CRITICAL: Two separate identifiers:
 * - taskId: Execution ID (required) - camelCase, no spaces, state storage key
 *   Used for: state[taskId] = response, {$.taskId.data} path resolution
 * - taskName: Display name (optional) - readable, can have spaces, shown in UI
 */
export interface ToolDefinitionTask {
    taskType: string;
    /** Execution ID (required) - camelCase, no spaces, state storage key: {$.taskId.data} */
    taskId: string;
    /** Display name (optional) - readable, shown in designer UI */
    taskName?: string;
    properties: Record<string, unknown>;
    branches?: Record<string, ToolDefinitionTask[]>;
}

/**
 * Convert Action Definition (flat, LLM-friendly) to Tool Definition (what addTaskToSequence expects)
 * This is the key function that allows LLM to generate simpler Action Definition format
 * 
 * CRITICAL: Two separate identifiers:
 * - taskId: From actionTask.id → execution ID (state storage key)
 * - taskName: From actionTask.name → display name (UI)
 * 
 * @param actionTask - Task in Action Definition format (flat structure)
 * @returns Task in Tool Definition format (properties + branches separated)
 */
export function actionToToolDefinition(actionTask: ActionDefinitionTask): ToolDefinitionTask {
    const taskType = actionTask.type;
    const isBranching = BRANCHING_TASK_TYPES.has(taskType);

    // Extract properties (exclude id, type, name, and branch-specific properties)
    const properties: Record<string, unknown> = {};
    const branchPropertyNames = ['onSuccess', 'onFailure', 'tasks', 'rollback', 'case', 'default'];
    const excludeFromProperties = new Set(['id', 'type', 'name', 'componentType', ...branchPropertyNames]);

    for (const [key, value] of Object.entries(actionTask)) {
        if (!excludeFromProperties.has(key)) {
            // Normalize IKeyValue[] arrays so Literal values are parsed to proper types
            properties[key] = Array.isArray(value) ? normalizeKeyValues(value) : value;
        }
    }

    // CRITICAL: taskId = execution ID (for state storage: state[taskId])
    // taskName = display name (for UI, optional)
    const executionId = actionTask.id || taskType;
    const displayName = actionTask.name || actionTask.id;  // Name is optional

    const toolTask: ToolDefinitionTask = {
        taskType,
        taskId: executionId,      // Execution ID (required) - state storage key
        taskName: displayName,     // Display name (optional)
        properties
    };

    // Handle branches for branching tasks
    if (isBranching) {
        const branches: Record<string, ToolDefinitionTask[]> = {};

        switch (taskType) {
            case 'Condition':
                if (actionTask.onSuccess && Array.isArray(actionTask.onSuccess)) {
                    branches.onSuccess = actionTask.onSuccess.map(t => actionToToolDefinition(t));
                } else {
                    branches.onSuccess = [];
                }
                if (actionTask.onFailure && Array.isArray(actionTask.onFailure)) {
                    branches.onFailure = actionTask.onFailure.map(t => actionToToolDefinition(t));
                } else {
                    branches.onFailure = [];
                }
                break;

            case 'Switch':
                // Handle case branches
                if (actionTask.case && typeof actionTask.case === 'object') {
                    for (const [caseName, caseTasks] of Object.entries(actionTask.case)) {
                        if (Array.isArray(caseTasks)) {
                            branches[caseName] = caseTasks.map(t => actionToToolDefinition(t));
                        }
                    }
                }
                // Handle default branch
                if (actionTask.default && Array.isArray(actionTask.default)) {
                    branches.default = actionTask.default.map(t => actionToToolDefinition(t));
                } else {
                    branches.default = [];
                }
                break;

            case 'Transaction':
                if (actionTask.tasks && Array.isArray(actionTask.tasks)) {
                    branches.tasks = actionTask.tasks.map(t => actionToToolDefinition(t));
                } else {
                    branches.tasks = [];
                }
                if (actionTask.rollback && Array.isArray(actionTask.rollback)) {
                    branches.rollback = actionTask.rollback.map(t => actionToToolDefinition(t));
                } else {
                    branches.rollback = [];
                }
                break;

            case 'Iterator':
            case 'Loop':
            case 'Promise':
            case 'State':
            case 'Sequence':
                if (actionTask.tasks && Array.isArray(actionTask.tasks)) {
                    branches.tasks = actionTask.tasks.map(t => actionToToolDefinition(t));
                } else {
                    branches.tasks = [];
                }
                break;
        }

        toolTask.branches = branches;
    }

    return toolTask;
}

/**
 * Convert array of Action Definitions to Tool Definitions
 */
export function actionArrayToToolDefinition(actionTasks: ActionDefinitionTask[]): ToolDefinitionTask[] {
    if (!actionTasks || !Array.isArray(actionTasks)) {
        return [];
    }
    return actionTasks.map(task => actionToToolDefinition(task));
}

/**
 * Convert Tool Definition back to Action Definition
 * Useful when you need to show the simpler format to user/LLM
 */
export function toolToActionDefinition(toolTask: ToolDefinitionTask): ActionDefinitionTask {
    const actionTask: ActionDefinitionTask = {
        type: toolTask.taskType,
        name: toolTask.taskName,
        ...toolTask.properties
    };

    if (toolTask.taskId) {
        actionTask.id = toolTask.taskId;
    }

    // Handle branches
    if (toolTask.branches) {
        const taskType = toolTask.taskType;

        switch (taskType) {
            case 'Condition':
                if (toolTask.branches.onSuccess) {
                    actionTask.onSuccess = toolTask.branches.onSuccess.map(t => toolToActionDefinition(t));
                }
                if (toolTask.branches.onFailure) {
                    actionTask.onFailure = toolTask.branches.onFailure.map(t => toolToActionDefinition(t));
                }
                break;

            case 'Switch': {
                const caseObj: Record<string, ActionDefinitionTask[]> = {};
                for (const [branchName, branchTasks] of Object.entries(toolTask.branches)) {
                    if (branchName === 'default') {
                        actionTask.default = branchTasks.map(t => toolToActionDefinition(t));
                    } else {
                        caseObj[branchName] = branchTasks.map(t => toolToActionDefinition(t));
                    }
                }
                if (Object.keys(caseObj).length > 0) {
                    actionTask.case = caseObj;
                }
                break;
            }

            case 'Transaction':
                if (toolTask.branches.tasks) {
                    actionTask.tasks = toolTask.branches.tasks.map(t => toolToActionDefinition(t));
                }
                if (toolTask.branches.rollback) {
                    actionTask.rollback = toolTask.branches.rollback.map(t => toolToActionDefinition(t));
                }
                break;

            case 'Iterator':
            case 'Loop':
            case 'Promise':
            case 'State':
            case 'Sequence':
                if (toolTask.branches.tasks) {
                    actionTask.tasks = toolTask.branches.tasks.map(t => toolToActionDefinition(t));
                }
                break;
        }
    }

    return actionTask;
}

// ============================================================================
// TASK VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a task against its type and method requirements
 * Returns detailed validation result with missing properties
 */
export function validateTaskProperties(task: ActionDefinitionTask): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    missingRequired: string[];
    taskType: string;
    method?: string;
} {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingRequired: string[] = [];

    const taskType = task.type;
    const method = task.method as string | undefined;

    if (!taskType) {
        errors.push('Task type is required');
        return { valid: false, errors, warnings, missingRequired, taskType: 'unknown' };
    }

    const config = TASK_PROPERTY_CONFIG[taskType];
    if (!config) {
        warnings.push(`Unknown task type: ${taskType}. Validation skipped.`);
        return { valid: true, errors, warnings, missingRequired, taskType };
    }

    // Check always-required properties
    if (config.requiredProperties) {
        for (const prop of config.requiredProperties) {
            if (task[prop] === undefined || task[prop] === null) {
                missingRequired.push(prop);
                errors.push(`Missing required property: ${prop}`);
            }
        }
    }

    // Check method-specific properties
    if (config.methods && method) {
        const methodProps = config.methods[method];
        if (methodProps) {
            for (const prop of methodProps) {
                if (task[prop] === undefined || task[prop] === null) {
                    missingRequired.push(prop);
                    errors.push(`Missing required property for ${taskType}.${method}: ${prop}`);
                }
            }
        } else if (Object.keys(config.methods).length > 0) {
            warnings.push(`Unknown method '${method}' for task type '${taskType}'. Available methods: ${Object.keys(config.methods).join(', ')}`);
        }
    }

    // Validate branches for branching tasks
    if (config.isBranching && config.branches) {
        const branchValidation = validateTaskBranches(task);
        errors.push(...branchValidation.errors);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        missingRequired,
        taskType,
        method
    };
}

/**
 * Get required properties for a specific task type and method
 */
export function getRequiredProperties(taskType: string, method?: string): string[] {
    const config = TASK_PROPERTY_CONFIG[taskType];
    if (!config) {
        return [];
    }

    const required: string[] = [...(config.requiredProperties || [])];

    if (method && config.methods && config.methods[method]) {
        required.push(...config.methods[method]);
    }

    return required;
}

/**
 * Get all available methods for a task type
 */
export function getTaskMethods(taskType: string): string[] {
    const config = TASK_PROPERTY_CONFIG[taskType];
    if (!config || !config.methods) {
        return [];
    }
    return Object.keys(config.methods);
}

/**
 * Check if a task type requires a method property
 */
export function taskRequiresMethod(taskType: string): boolean {
    const config = TASK_PROPERTY_CONFIG[taskType];
    if (!config) {
        return false;
    }
    return config.methods !== undefined && Object.keys(config.methods).length > 0;
}

/**
 * Get the branch names for a branching task type
 */
export function getTaskBranches(taskType: string): string[] {
    const config = TASK_PROPERTY_CONFIG[taskType];
    if (!config || !config.isBranching) {
        return [];
    }
    return config.branches || [];
}

/**
 * Generate a template for a task with all required properties
 */
export function generateTaskTemplate(taskType: string, method?: string): ActionDefinitionTask {
    const config = TASK_PROPERTY_CONFIG[taskType];
    const template: ActionDefinitionTask = {
        type: taskType,
        name: `New ${taskType} Task`
    };

    if (method) {
        template.method = method;
    }

    // Add required properties with placeholder values
    const required = getRequiredProperties(taskType, method);
    for (const prop of required) {
        if (prop === 'payload' || prop === 'where' || prop === 'select' || prop === 'headers' || prop === 'params') {
            template[prop] = [];
        } else if (prop === 'conditions') {
            template[prop] = { operator: 'equals', fact: '', value: '' };
        } else {
            template[prop] = '';
        }
    }

    // Add default branches for branching tasks
    if (config?.isBranching && config.branches) {
        for (const branch of config.branches) {
            if (branch === 'case') {
                template.case = {};
            } else {
                template[branch] = [];
            }
        }
    }

    return template;
}

// ============================================================================
// EXPORT DEFAULT CONVERTER OBJECT
// ============================================================================

export const TaskConverter = {
    // Main conversion functions
    actionToWorkflow: actionToWorkflowDefinition,
    actionArrayToWorkflow: actionArrayToWorkflowDefinition,
    workflowToAction: workflowToActionDefinition,
    workflowArrayToAction: workflowArrayToActionDefinition,

    // Action → Tool conversions (for LLM integration)
    actionToTool: actionToToolDefinition,
    actionArrayToTool: actionArrayToToolDefinition,
    toolToAction: toolToActionDefinition,

    // Validation functions
    validateTaskProperties,
    validateTaskBranches,
    getRequiredProperties,
    getTaskMethods,
    taskRequiresMethod,
    getTaskBranches,
    generateTaskTemplate,

    // Utilities
    isBranchingTaskType,
    getBranchConfig,
    cloneTaskDefinition,
    parseLiteralValue,
    normalizeKeyValues,

    // Constants
    BRANCHING_TASK_TYPES,
    BRANCH_CONFIGS,
    TASK_PROPERTY_CONFIG,

    // Enums
    TaskType,
    DocumentMethodType,
    EntityMethodType,
    QueryMethodType,
    HttpMethodType,
    RequestMethodType,
    PromiseMethodType,
    DateMethodType,
    MathMethodType,
    JsonMethodType,
    IdentifierMethodType,
    CacheMethodType,
    SecurityMethodType,
    ObjectMethodType,
    ArrayMethodType,
    StringMethodType,
    RSAMethodType,
    CryptoMethodType,
    AzureMethodType,
    ORMMethodType,
    ProviderMethodType
};

export default TaskConverter;
