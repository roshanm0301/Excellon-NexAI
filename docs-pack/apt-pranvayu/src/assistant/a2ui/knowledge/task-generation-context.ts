/**
 * Task Generation Context
 * Provides complete context for LLM to generate accurate workflow task configurations
 * Each task type has: interface definition, required/optional properties, examples, execution flow
 * 
 * ## IMPORTANT: Two JSON Formats
 * 
 * ### 1. Action Definition Format (simpler, recommended for LLM)
 * Use with `addTaskWithActionFormat` tool. All properties at root level:
 * ```
 * {
 *   "type": "Condition",
 *   "name": "CheckUser",
 *   "conditions": { "operator": "notNull", "fact": "{$.GetUser.data}" },
 *   "onSuccess": [...tasks...],     // At root level
 *   "onFailure": [...tasks...]      // At root level
 * }
 * ```
 * 
 * ### 2. Tool Definition Format (current addTaskToSequence)
 * Properties wrapped, branches separate:
 * ```
 * {
 *   "taskType": "Condition",
 *   "taskName": "CheckUser",
 *   "properties": { "conditions": {...} },  // Wrapped
 *   "branches": { "onSuccess": [...], "onFailure": [...] }  // Separate
 * }
 * ```
 * 
 * The examples in this file show the Action Definition format (simpler).
 * These are automatically converted to the correct format when added to the workflow.
 */

// =============================================================================
// CORE TYPES - These are used across ALL tasks
// =============================================================================

export const CORE_TYPES = {
    IKeyValue: {
        definition: `interface IKeyValue {
    Id: string;            // REQUIRED: Unique UUID for this key-value entry (e.g., crypto.randomUUID())
    Key: string;           // Property name/field name
    Value: any;            // The value - can be literal, path reference, or expression
    Type?: 'Literal' | 'Property' | 'Array' | 'Calculated' | 'Rule';
}`,
        explanation: `IKeyValue is the FUNDAMENTAL data structure used throughout the workflow system.
It's used in: payload, where, select, headers, body, params, etc.

Type meanings:
- 'Literal': Static/constant value. Use for hardcoded values.
  Example: { Id: "<uuid>", Key: "status", Value: "active", Type: "Literal" }
  Example: { Id: "<uuid>", Key: "count", Value: 100, Type: "Literal" }
  Example: { Id: "<uuid>", Key: "enabled", Value: true, Type: "Literal" }

- 'Property': Path reference to data from state/previous tasks. MOST COMMON.
  Example: { Id: "<uuid>", Key: "userId", Value: "{$.body.id}", Type: "Property" }
  Example: { Id: "<uuid>", Key: "name", Value: "{$.QueryTask.data.name}", Type: "Property" }
  Example: { Id: "<uuid>", Key: "items", Value: "{$.params.itemIds}", Type: "Property" }

- 'Calculated': JavaScript-like expression for computed values.
  Example: { Id: "<uuid>", Key: "total", Value: "{$.price} * {$.quantity}", Type: "Calculated" }

- 'Array': When the value is an array type.
  Example: { Id: "<uuid>", Key: "ids", Value: [1, 2, 3], Type: "Array" }

- 'Rule': Rule-based value evaluation.
  Example: { Id: "<uuid>", Key: "discount", Value: "pricing-rule", Type: "Rule" }

PATH SYNTAX:
- {$.body.fieldName} - Access request body
- {$.params.documentId} - Access URL parameters (document ID)
- {$.query.filter} - Access query string parameters
- {$.TaskName.data} - Access output from previous task named "TaskName"
- {$.TaskName.data.fieldName} - Access specific field from task output
- {$.TaskName.data[0]} - Access first item of array output
- {$.item} - Current item in Iterator/Array operations
- {$.index} - Current index in Iterator
- {$.subscription.id} - Current subscription context
- {$.now} - Current timestamp`,
        examples: [
            { Id: "<uuid>", Key: "id", Value: "{$.params.documentId}", Type: "Property" },
            { Id: "<uuid>", Key: "name", Value: "{$.body.name}", Type: "Property" },
            { Id: "<uuid>", Key: "status", Value: "active", Type: "Literal" },
            { Id: "<uuid>", Key: "isEnabled", Value: true, Type: "Literal" },
            { Id: "<uuid>", Key: "count", Value: 10, Type: "Literal" },
            { Id: "<uuid>", Key: "userData", Value: "{$.QueryUser.data}", Type: "Property" },
            { Id: "<uuid>", Key: "fullName", Value: "{$.firstName} {$.lastName}", Type: "Calculated" }
        ]
    },

    Condition: {
        definition: `interface Condition {
    fact?: string;           // State path to value being tested, e.g., "{$.user.role}", "{$.QueryTask.data}"
    operator?: ConditionOperator;  // Comparison operator (see list below)
    value?: any;             // Value to compare against (can also be a path like "{$.expected}")
    and?: Condition[];       // ALL conditions must be true (AND logic) - recursive nesting supported
    any?: Condition[];       // AT LEAST ONE must be true (OR logic) - recursive nesting supported
}

// Evaluation: Final result = (operator_result AND all_and_results AND any_any_result)`,
        operators: [
            { name: 'equals', description: 'Loose equality (==) with type coercion', needsValue: true },
            { name: 'exactEquals', description: 'Strict equality (===) no type coercion', needsValue: true },
            { name: 'notEquals', description: 'Not equal (!==)', needsValue: true },
            { name: 'greaterThan', description: 'Greater than (>)', needsValue: true },
            { name: 'greaterThanEquals', description: 'Greater or equal (>=)', needsValue: true },
            { name: 'lessThan', description: 'Less than (<)', needsValue: true },
            { name: 'lessThanEquals', description: 'Less or equal (<=)', needsValue: true },
            { name: 'in', description: 'Value exists in array', needsValue: true },
            { name: 'notIn', description: 'Value NOT in array', needsValue: true },
            { name: 'contains', description: 'String/array contains value', needsValue: true },
            { name: 'notContains', description: 'Does NOT contain', needsValue: true },
            { name: 'some', description: 'Array overlap (any common element)', needsValue: true },
            { name: 'regex', description: 'Regex pattern match', needsValue: true },
            { name: 'isArray', description: 'Is an array', needsValue: false },
            { name: 'notArray', description: 'Is NOT an array', needsValue: false },
            { name: 'isObject', description: 'Is an object', needsValue: false },
            { name: 'notObject', description: 'Is NOT an object', needsValue: false },
            { name: 'isNumber', description: 'Is a number', needsValue: false },
            { name: 'isNaN', description: 'Is NOT a number', needsValue: false },
            { name: 'notNull', description: 'Not null/undefined/empty string', needsValue: false },
            { name: 'hasProperty', description: 'Object has property (value = property name)', needsValue: true }
        ],
        operatorCategories: {
            comparison: ['equals', 'exactEquals', 'notEquals', 'greaterThan', 'greaterThanEquals', 'lessThan', 'lessThanEquals'],
            array: ['in', 'notIn', 'contains', 'notContains', 'some'],
            typeCheck: ['isArray', 'notArray', 'isObject', 'notObject', 'isNumber', 'isNaN'],
            existence: ['notNull', 'hasProperty'],
            pattern: ['regex']
        },
        examples: {
            simple: { operator: "equals", fact: "{$.user.role}", value: "admin" },
            notNull: { operator: "notNull", fact: "{$.body.email}" },
            greaterThan: { operator: "greaterThan", fact: "{$.order.total}", value: 100 },
            inArray: { operator: "in", fact: "{$.user.status}", value: ["active", "pending"] },
            regex: { operator: "regex", fact: "{$.email}", value: "^[a-z]+@.*\\.com$" },
            hasProperty: { operator: "hasProperty", fact: "{$.user}", value: "email" },
            andLogic: {
                and: [
                    { operator: "notNull", fact: "{$.body.email}" },
                    { operator: "equals", fact: "{$.body.verified}", value: true }
                ]
            },
            orLogic: {
                any: [
                    { operator: "equals", fact: "{$.user.role}", value: "admin" },
                    { operator: "equals", fact: "{$.user.role}", value: "manager" }
                ]
            },
            combined: {
                and: [
                    { operator: "notNull", fact: "{$.user}" },
                    { operator: "equals", fact: "{$.user.active}", value: true },
                    {
                        any: [
                            { operator: "equals", fact: "{$.user.role}", value: "admin" },
                            { operator: "greaterThanEquals", fact: "{$.user.level}", value: 5 }
                        ]
                    }
                ]
            }
        },
        importantNotes: [
            'Condition task uses "conditions" at ROOT level, NOT inside "properties"',
            'Both fact AND value support path references like {$.taskName.data}',
            'notNull checks for null, undefined, AND empty string ""',
            'equals does type coercion, use exactEquals for strict comparison',
            'Unary operators (notNull, isArray, etc.) only need "fact", not "value"'
        ]
    },

    BaseTask: {
        definition: `interface BaseTask {
    id: string;              // Unique task identifier (use for referencing in paths)
    type: TaskType;          // Task type: Query, Resolver, Response, etc.
    name?: string;           // Human-readable name
    componentType?: 'task';  // Always 'task'
    properties: {            // Task-specific configuration
        // ... varies by task type
    };
    success?: ResponseHandler;   // Optional success response override
    failed?: ResponseHandler;    // Optional business failure response
    error?: ResponseHandler;     // Optional system error response
}`,
        explanation: `Every task extends BaseTask. The 'id' is CRITICAL - it's used to reference task output in paths.
Example: If task id is "GetUser", access its output with "{$.GetUser.data}"`
    }
};

// =============================================================================
// COMPLETE TASK GENERATION CONTEXTS
// =============================================================================

export interface TaskGenerationContext {
    taskType: string;
    description: string;
    interface: string;
    requiredProperties: string[];
    optionalProperties: string[];
    methods?: string[];
    methodRequirements?: Record<string, string[]>;
    executionFlow: string;
    completeExamples: Array<{
        scenario: string;
        config: Record<string, unknown>;
        explanation: string;
    }>;
    commonMistakes: string[];
    tips: string[];
    // Condition task specific
    operators?: Array<{
        name: string;
        description: string;
        example?: string;
    }>;
}

export const TASK_GENERATION_CONTEXTS: Record<string, TaskGenerationContext> = {
    // =========================================================================
    // QUERY TASK - From apt-yuj/src/workflow/task.query.ts
    // =========================================================================
    Query: {
        taskType: 'Query',
        description: 'Execute database queries against repositories/tables. Most common data retrieval task.',
        interface: `// Base interface - ALL Query tasks require these
interface ITaskQuery extends ITask {
    type: 'Query';
    repository: string;        // REQUIRED: Table/entity name (e.g., "User", "Order")
}

// Method: Find - Find multiple records
interface ITaskFind extends ITaskQuery {
    method: 'Find';                           // REQUIRED
    where: IKeyValueSearch | IKeyValueSearch[];  // REQUIRED: Filter conditions
    take?: number;                            // Optional: Limit results
    elasticsearch?: { enable: boolean };      // Optional: Use Elasticsearch
}

// Method: FindV2 - Advanced find with WhereCondition
interface ITaskFindV2 extends ITaskQuery {
    method: 'FindV2';                         // REQUIRED
    where: WhereCondition;                    // REQUIRED: Advanced filter
    take?: number;                            // Optional: Limit results
}

// Method: FindOne - Find single record
interface ITaskFindOne extends ITaskQuery {
    method: 'FindOne';                        // REQUIRED
    where: IKeyValueSearch | IKeyValue[];     // REQUIRED: Filter conditions
    sort?: IKeyValue[];                       // Optional: Sort configuration
    select?: IKeyValue[];                     // Optional: Fields to return
}

// Method: FindPaging - Paginated query
interface ITaskPaging extends ITaskQuery {
    method: 'FindPaging';                     // REQUIRED
    where: IKeyValueSearch | IKeyValueSearch[];  // REQUIRED: Filter conditions
    payload?: IKeyValue[];                    // Optional: Additional payload
    orderby?: string;                         // Optional: Sort field
    asc?: string | boolean;                   // Optional: Sort direction
    take?: string | number;                   // Optional: Page size
    skip?: string | number;                   // Optional: Offset
    page?: string;                            // Optional: Page number
}

// Method: RawQuery - Execute raw SQL
interface ITaskRawQuery extends ITaskQuery {
    method: 'RawQuery';                       // REQUIRED
    query: string;                            // REQUIRED: SQL query string
}

// Method: Where - String-based where clause
interface ITaskWhere extends ITaskQuery {
    method: 'Where';                          // REQUIRED
    where: string;                            // REQUIRED: SQL-like where string
    select?: IKeyValue[];                     // Optional: Fields to return
    order?: IKeyValue[];                      // Optional: Sort configuration
}

// Method: WherePaging - Paginated string-based where
interface ITaskWherePaging extends ITaskQuery {
    method: 'WherePaging';                    // REQUIRED
    where: string;                            // REQUIRED: SQL-like where string
    select?: IKeyValue[];                     // Optional: Fields to return
    sort?: IKeyValue[];                       // Optional: Sort configuration
    take?: string | number;                   // Optional: Page size
    skip?: string | number;                   // Optional: Offset
    page?: string;                            // Optional: Page number
}

// Method: NotExist - Check if record doesn't exist
interface ITaskNotExist extends ITaskQuery {
    method: 'NotExist';                       // REQUIRED
    where: IKeyValueSearch | IKeyValue[];     // REQUIRED: Filter conditions
}

// Method: Builder - Advanced query builder
interface ITaskQueryBuilder extends ITaskQuery {
    method: 'Builder';                        // REQUIRED
    select: string[];                         // REQUIRED: Fields to select
    where: IKeyValue[];                       // REQUIRED: Filter conditions
    selectType: 'Distinct' | 'GetOne' | 'GetMany' | 'GetManyCount';  // REQUIRED
}

// IKeyValueSearch extends IKeyValue with Operator
interface IKeyValueSearch extends IKeyValue {
    Operator: 'Like' | 'ILike' | 'IsNull' | 'IsNotNull' | 'LessThan' | 'GreaterThan' | 
              'Equal' | 'Not' | 'In' | 'NotIn' | 'And' | 'Or' | 'Any' | 'Between' | 
              'Text' | 'LessThanOrEqual' | 'GreaterThanOrEqual';
}

type QueryMethod = 'Find' | 'FindV2' | 'FindOne' | 'FindPaging' | 'RawQuery' | 'Where' | 'WherePaging' | 'Builder' | 'NotExist';`,
        requiredProperties: ['repository', 'method'],
        optionalProperties: ['where', 'select', 'take', 'skip', 'page', 'orderby', 'asc', 'sort', 'query', 'payload'],
        methods: ['Find', 'FindV2', 'FindOne', 'FindPaging', 'RawQuery', 'Where', 'WherePaging', 'Builder', 'NotExist'],
        methodRequirements: {
            Find: ['where'],
            FindV2: ['where'],
            FindOne: ['where'],
            FindPaging: ['where'],
            RawQuery: ['query'],
            Where: ['where'],
            WherePaging: ['where'],
            Builder: ['select', 'where', 'selectType'],
            NotExist: ['where']
        },
        executionFlow: `1. Workflow engine receives Query task
2. Connects to database using repository name
3. Builds query based on method:
   - Find/FindOne: SELECT with WHERE clause
   - FindPaging: SELECT with LIMIT/OFFSET
   - RawQuery: Executes provided SQL
4. Executes query against database
5. Returns result in task output: {$.TaskId.data}
   - Find: Array of records
   - FindOne: Single record or null
   - FindPaging: { data: [], total: number, page: number }`,
        completeExamples: [
            {
                scenario: 'Find single user by ID',
                config: {
                    id: "GetUserById",
                    type: "Query",
                    name: "Get User By ID",
                    componentType: "task",
                    properties: {
                        repository: "User",
                        method: "FindOne",
                        where: [
                            { Id: "<uuid>", Key: "id", Value: "{$.params.documentId}", Type: "Property" }
                        ],
                        select: [
                            { Key: "id" },
                            { Key: "name" },
                            { Key: "email" },
                            { Key: "role" },
                            { Key: "createdAt" }
                        ]
                    }
                },
                explanation: 'Finds one user where id matches URL parameter. Output accessed via {$.GetUserById.data}'
            },
            {
                scenario: 'Find all active users with pagination',
                config: {
                    id: "ListActiveUsers",
                    type: "Query",
                    name: "List Active Users",
                    componentType: "task",
                    properties: {
                        repository: "User",
                        method: "FindPaging",
                        where: [
                            { Id: "<uuid>", Key: "status", Value: "active", Type: "Literal" },
                            { Id: "<uuid>", Key: "deletedAt", Value: null, Type: "Literal" }
                        ],
                        select: [
                            { Key: "id" },
                            { Key: "name" },
                            { Key: "email" }
                        ],
                        take: "{$.query.limit}",
                        skip: "{$.query.offset}",
                        orderby: "createdAt",
                        asc: "false"
                    }
                },
                explanation: 'Paginated query with filters. Returns { data: [...], total: N }. Access with {$.ListActiveUsers.data}'
            },
            {
                scenario: 'Complex query with multiple conditions',
                config: {
                    id: "SearchOrders",
                    type: "Query",
                    name: "Search Orders",
                    componentType: "task",
                    properties: {
                        repository: "Order",
                        method: "Find",
                        where: [
                            { Id: "<uuid>", Key: "userId", Value: "{$.body.userId}", Type: "Property" },
                            { Id: "<uuid>", Key: "status", Value: "{$.body.status}", Type: "Property" },
                            { Id: "<uuid>", Key: "createdAt", Value: "{$.body.startDate}", Type: "Property" }
                        ],
                        select: [
                            { Key: "id" },
                            { Key: "orderNumber" },
                            { Key: "total" },
                            { Key: "status" },
                            { Key: "createdAt" }
                        ],
                        take: 50,
                        sort: [
                            { Key: "createdAt", Value: "DESC" }
                        ]
                    }
                },
                explanation: 'Multi-condition search with sorting. Access results via {$.SearchOrders.data}'
            }
        ],
        commonMistakes: [
            'Missing repository name - always specify the table/entity',
            'Using wrong method - FindOne for single record, Find for multiple, FindPaging for pagination',
            'Forgetting Type in IKeyValue - defaults to Literal but explicit is better',
            'Not using select - returns all fields which may be inefficient',
            'Wrong path syntax - use {$.path} not $.path'
        ],
        tips: [
            'Use FindOne when expecting single result (faster)',
            'Always add select to limit returned fields',
            'Use FindPaging for lists shown in UI with pagination',
            'Task id becomes the path prefix: id="MyQuery" â†’ {$.MyQuery.data}'
        ]
    },

    // =========================================================================
    // RESOLVER TASK
    // =========================================================================
    Resolver: {
        taskType: 'Resolver',
        description: 'Transform and map data between tasks. The MOST COMMONLY used task for data transformation.',
        interface: `interface TaskResolver {
    id: string;
    type: 'Resolver';
    name?: string;
    componentType?: 'task';
    properties: {
        method?: 'Object' | 'String';  // Default: 'Object'
        payload: IKeyValue[];          // REQUIRED: Output field mappings
        path?: string;                 // Source array path (for isArray=true)
        isArray?: boolean;             // Iterate over array at path
        string?: string;               // Template string (for method='String')
    };
}`,
        requiredProperties: ['payload'],
        optionalProperties: ['method', 'path', 'isArray', 'string'],
        methods: ['Object', 'String'],
        methodRequirements: {
            Object: ['payload'],
            String: ['string', 'payload']
        },
        executionFlow: `1. Workflow engine receives Resolver task
2. If method='Object' (default):
   - For each IKeyValue in payload:
     - Resolves the Value (path references, literals, calculations)
     - Maps to Key in output object
   - If isArray=true: iterates over array at path, creates output array
3. If method='String':
   - Processes string template with path substitutions
4. Output stored in {$.TaskId.data}`,
        completeExamples: [
            {
                scenario: 'Transform query result to API response format',
                config: {
                    id: "FormatUserResponse",
                    type: "Resolver",
                    name: "Format User Response",
                    componentType: "task",
                    properties: {
                        method: "Object",
                        payload: [
                            { Id: "<uuid>", Key: "id", Value: "{$.GetUser.data.id}", Type: "Property" },
                            { Id: "<uuid>", Key: "fullName", Value: "{$.GetUser.data.name}", Type: "Property" },
                            { Id: "<uuid>", Key: "emailAddress", Value: "{$.GetUser.data.email}", Type: "Property" },
                            { Id: "<uuid>", Key: "isActive", Value: true, Type: "Literal" },
                            { Id: "<uuid>", Key: "fetchedAt", Value: "{$.now}", Type: "Property" }
                        ]
                    }
                },
                explanation: 'Maps data from GetUser task to a new structure. Access via {$.FormatUserResponse.data}'
            },
            {
                scenario: 'Transform array of items',
                config: {
                    id: "TransformOrderItems",
                    type: "Resolver",
                    name: "Transform Order Items",
                    componentType: "task",
                    properties: {
                        method: "Object",
                        path: "{$.GetOrders.data}",
                        isArray: true,
                        payload: [
                            { Id: "<uuid>", Key: "orderId", Value: "{$.id}", Type: "Property" },
                            { Id: "<uuid>", Key: "orderNumber", Value: "{$.orderNumber}", Type: "Property" },
                            { Id: "<uuid>", Key: "amount", Value: "{$.total}", Type: "Property" },
                            { Id: "<uuid>", Key: "status", Value: "{$.status}", Type: "Property" }
                        ]
                    }
                },
                explanation: 'Iterates over GetOrders.data array, transforms each item. In payload, {$.fieldName} refers to current item fields.'
            },
            {
                scenario: 'Combine data from multiple tasks',
                config: {
                    id: "CombineData",
                    type: "Resolver",
                    name: "Combine User and Orders",
                    componentType: "task",
                    properties: {
                        method: "Object",
                        payload: [
                            { Id: "<uuid>", Key: "user", Value: "{$.GetUser.data}", Type: "Property" },
                            { Id: "<uuid>", Key: "orders", Value: "{$.GetOrders.data}", Type: "Property" },
                            { Id: "<uuid>", Key: "orderCount", Value: "{$.GetOrders.data.length}", Type: "Property" },
                            { Id: "<uuid>", Key: "requestedBy", Value: "{$.body.requestedBy}", Type: "Property" }
                        ]
                    }
                },
                explanation: 'Combines outputs from multiple previous tasks into single object.'
            },
            {
                scenario: 'Create payload for another service',
                config: {
                    id: "PrepareNotificationPayload",
                    type: "Resolver",
                    name: "Prepare Notification",
                    componentType: "task",
                    properties: {
                        method: "Object",
                        payload: [
                            { Id: "<uuid>", Key: "to", Value: "{$.GetUser.data.email}", Type: "Property" },
                            { Id: "<uuid>", Key: "subject", Value: "Order Confirmation", Type: "Literal" },
                            { Id: "<uuid>", Key: "templateId", Value: "order-confirmation", Type: "Literal" },
                            { Id: "<uuid>", Key: "data", Value: "{$.OrderDetails.data}", Type: "Property" }
                        ]
                    }
                },
                explanation: 'Prepares structured payload for notification service.'
            }
        ],
        commonMistakes: [
            'Empty payload array - payload must have at least one IKeyValue',
            'Wrong path reference - {$.TaskId.data} not {$.TaskId}',
            'Missing Type in IKeyValue for path references - use Type: "Property"',
            'Using isArray without path - must specify source array path',
            'Referencing non-existent task - check task id spelling'
        ],
        tips: [
            'Resolver is your main data transformation tool',
            'Use before Response to format final output',
            'Task id becomes path: id="MyResolver" â†’ {$.MyResolver.data}',
            'For arrays, use isArray:true and path to iterate',
            'Combine data from multiple tasks in one Resolver'
        ]
    },

    // =========================================================================
    // RESPONSE TASK
    // =========================================================================
    Response: {
        taskType: 'Response',
        description: 'Define the final HTTP response of the workflow. Every workflow should end with a Response task.',
        interface: `interface TaskResponse {
    id: string;
    type: 'Response';
    name?: string;
    componentType?: 'task';
    properties: {
        statusCode?: number;     // HTTP status code (200, 201, 400, 404, 500, etc.)
        payload?: IKeyValue[];   // Response body mapping - MUST include success, code, statusCode, data
        message?: string;        // Response message (optional, for errors)
    };
}

// âš ï¸ REQUIRED: payload MUST always include these 4 keys:
// - success (boolean): true for success, false for error
// - code (string): "SUCCESS", "CREATED", "ERROR", "NOT_FOUND", "VALIDATION_ERROR", etc.
// - statusCode (number): HTTP status code matching the statusCode property
// - data (any): The actual response data, or null for errors`,
        requiredProperties: ['statusCode', 'payload'],
        optionalProperties: ['message'],
        // Note: payload MUST include keys: success, code, statusCode, data
        executionFlow: `1. Workflow engine receives Response task
2. Resolves statusCode (can be dynamic from path)
3. For each IKeyValue in payload:
   - Resolves Value references
   - Builds response body object
4. Sets HTTP status code
5. Returns response body to caller
6. Workflow execution ends`,
        completeExamples: [
            {
                scenario: 'Success response with data (STANDARD FORMAT)',
                config: {
                    id: "SuccessResponse",
                    type: "Response",
                    name: "Success Response",
                    componentType: "task",
                    properties: {
                        statusCode: 200,
                        payload: [
                            { Id: "<uuid>", Key: "success", Value: true, Type: "Literal" },
                            { Id: "<uuid>", Key: "code", Value: "SUCCESS", Type: "Literal" },
                            { Id: "<uuid>", Key: "statusCode", Value: 200, Type: "Literal" },
                            { Id: "<uuid>", Key: "data", Value: "{$.FormatData.data}", Type: "Property" }
                        ]
                    }
                },
                explanation: 'Standard success response - ALWAYS include success, code, statusCode, data.'
            },
            {
                scenario: 'Created response (201)',
                config: {
                    id: "CreatedResponse",
                    type: "Response",
                    name: "Created Response",
                    componentType: "task",
                    properties: {
                        statusCode: 201,
                        payload: [
                            { Id: "<uuid>", Key: "success", Value: true, Type: "Literal" },
                            { Id: "<uuid>", Key: "code", Value: "CREATED", Type: "Literal" },
                            { Id: "<uuid>", Key: "statusCode", Value: 201, Type: "Literal" },
                            { Id: "<uuid>", Key: "data", Value: "{$.CreateEntity.data}", Type: "Property" }
                        ]
                    }
                },
                explanation: 'Response for successful resource creation.'
            },
            {
                scenario: 'Paginated list response',
                config: {
                    id: "ListResponse",
                    type: "Response",
                    name: "List Response",
                    componentType: "task",
                    properties: {
                        statusCode: 200,
                        payload: [
                            { Id: "<uuid>", Key: "success", Value: true, Type: "Literal" },
                            { Id: "<uuid>", Key: "code", Value: "SUCCESS", Type: "Literal" },
                            { Id: "<uuid>", Key: "statusCode", Value: 200, Type: "Literal" },
                            { Id: "<uuid>", Key: "data", Value: "{$.TransformList.data}", Type: "Property" },
                            { Id: "<uuid>", Key: "pagination", Value: "{$.GetList.data.pagination}", Type: "Property" },
                            { Id: "<uuid>", Key: "total", Value: "{$.GetList.data.total}", Type: "Property" }
                        ]
                    }
                },
                explanation: 'Response with pagination metadata - still includes required keys.'
            },
            {
                scenario: 'Error response (STANDARD FORMAT)',
                config: {
                    id: "ErrorResponse",
                    type: "Response",
                    name: "Error Response",
                    componentType: "task",
                    properties: {
                        statusCode: 400,
                        payload: [
                            { Id: "<uuid>", Key: "success", Value: false, Type: "Literal" },
                            { Id: "<uuid>", Key: "code", Value: "VALIDATION_ERROR", Type: "Literal" },
                            { Id: "<uuid>", Key: "statusCode", Value: 400, Type: "Literal" },
                            { Id: "<uuid>", Key: "data", Value: null, Type: "Literal" },
                            { Id: "<uuid>", Key: "message", Value: "Validation failed", Type: "Literal" }
                        ]
                    }
                },
                explanation: 'Error response - data is null, message explains the error.'
            }
        ],
        commonMistakes: [
            'âš ï¸ Missing required payload keys - ALWAYS include: success, code, statusCode, data',
            'Missing Response task - every workflow needs one at the end',
            'Wrong statusCode type - should be number not string',
            'Referencing wrong task data - double-check task ids',
            'Missing payload - response will be empty',
            'Multiple Response tasks in sequence - only last one executes'
        ],
        tips: [
            'âš ï¸ ALWAYS include these 4 keys in payload: success, code, statusCode, data',
            'Always place Response as the last task',
            'Use Resolver before Response to format data',
            'For errors: success=false, data=null, add message key',
            'Use appropriate status codes: 200 OK, 201 Created, 400 Bad Request, 404 Not Found',
            'Use meaningful code values: SUCCESS, CREATED, ERROR, NOT_FOUND, VALIDATION_ERROR, UNAUTHORIZED'
        ]
    },

    // =========================================================================
    // HTTP TASK
    // =========================================================================
    HTTP: {
        taskType: 'HTTP',
        description: 'Make HTTP requests to external APIs and services.',
        interface: `interface TaskHTTP {
    id: string;
    type: 'HTTP';
    name?: string;
    componentType?: 'task';
    properties: {
        url: string;             // REQUIRED: API endpoint URL
        method: HttpMethod;      // REQUIRED: HTTP method
        headers?: IKeyValue[];   // Request headers
        body?: IKeyValue[] | string;  // Request body
        params?: IKeyValue[];    // Query parameters
        timeout?: number;        // Timeout in milliseconds
        path?: boolean;          // Append path parameters
    };
}

type HttpMethod = 'Get' | 'Post' | 'Put' | 'Delete' | 'Patch';`,
        requiredProperties: ['url', 'method'],
        optionalProperties: ['headers', 'body', 'params', 'timeout', 'path'],
        methods: ['Get', 'Post', 'Put', 'Delete', 'Patch'],
        executionFlow: `1. Workflow engine receives HTTP task
2. Resolves URL (can contain path references)
3. Resolves headers (auth tokens, content-type, etc.)
4. Resolves body/params
5. Makes HTTP request to external service
6. Waits for response (or timeout)
7. Parses response JSON
8. Stores response in {$.TaskId.data}
9. On error, triggers error handler`,
        completeExamples: [
            {
                scenario: 'GET request with authorization',
                config: {
                    id: "FetchExternalUser",
                    type: "HTTP",
                    name: "Fetch External User",
                    componentType: "task",
                    properties: {
                        url: "https://api.external-service.com/users/{$.params.userId}",
                        method: "Get",
                        headers: [
                            { Id: "<uuid>", Key: "Authorization", Value: "Bearer {$.body.accessToken}", Type: "Property" },
                            { Id: "<uuid>", Key: "Content-Type", Value: "application/json", Type: "Literal" },
                            { Id: "<uuid>", Key: "X-Api-Key", Value: "{$.config.apiKey}", Type: "Property" }
                        ],
                        timeout: 30000
                    }
                },
                explanation: 'GET request to external API with auth header. Response in {$.FetchExternalUser.data}'
            },
            {
                scenario: 'POST request with JSON body',
                config: {
                    id: "CreateExternalOrder",
                    type: "HTTP",
                    name: "Create External Order",
                    componentType: "task",
                    properties: {
                        url: "https://api.partner.com/orders",
                        method: "Post",
                        headers: [
                            { Id: "<uuid>", Key: "Authorization", Value: "Bearer {$.authToken}", Type: "Property" },
                            { Id: "<uuid>", Key: "Content-Type", Value: "application/json", Type: "Literal" }
                        ],
                        body: [
                            { Id: "<uuid>", Key: "orderId", Value: "{$.OrderData.data.id}", Type: "Property" },
                            { Id: "<uuid>", Key: "items", Value: "{$.OrderData.data.items}", Type: "Property" },
                            { Id: "<uuid>", Key: "total", Value: "{$.OrderData.data.total}", Type: "Property" },
                            { Id: "<uuid>", Key: "currency", Value: "USD", Type: "Literal" }
                        ]
                    }
                },
                explanation: 'POST request with structured body. Body is serialized to JSON.'
            },
            {
                scenario: 'GET request with query parameters',
                config: {
                    id: "SearchProducts",
                    type: "HTTP",
                    name: "Search Products",
                    componentType: "task",
                    properties: {
                        url: "https://api.catalog.com/products/search",
                        method: "Get",
                        headers: [
                            { Id: "<uuid>", Key: "X-Api-Key", Value: "{$.config.catalogApiKey}", Type: "Property" }
                        ],
                        params: [
                            { Id: "<uuid>", Key: "q", Value: "{$.body.searchTerm}", Type: "Property" },
                            { Id: "<uuid>", Key: "category", Value: "{$.body.category}", Type: "Property" },
                            { Id: "<uuid>", Key: "limit", Value: 20, Type: "Literal" },
                            { Id: "<uuid>", Key: "offset", Value: "{$.body.offset}", Type: "Property" }
                        ]
                    }
                },
                explanation: 'GET request with query params. URL becomes /search?q=...&category=...'
            }
        ],
        commonMistakes: [
            'Missing Content-Type header for POST/PUT',
            'Hardcoding auth tokens instead of using path references',
            'Not handling timeout for slow external services',
            'Wrong method - GET for retrieval, POST for creation',
            'URL path not properly escaped'
        ],
        tips: [
            'Always include proper headers (Content-Type, Authorization)',
            'Use path references for dynamic values in URL',
            'Set appropriate timeout for external services',
            'Use params for GET query strings, body for POST/PUT',
            'Response available at {$.TaskId.data}'
        ]
    },

    // =========================================================================
    // CONDITION TASK
    // =========================================================================
    Condition: {
        taskType: 'Condition',
        description: 'Conditional branching - if/else logic for workflow control flow. Evaluates conditions against workflow state and executes different task branches based on the result.',
        interface: `// âš ï¸ When using addTaskToSequence tool:
// - "conditions" goes in the "properties" parameter
// - "onSuccess"/"onFailure" go in the SEPARATE "branches" parameter
// Example:
// addTaskToSequence({
//   taskType: "Condition",
//   taskName: "MyCondition", 
//   properties: { conditions: {...} },      // ONLY conditions here!
//   branches: { onSuccess: [...], onFailure: [...] }  // SEPARATE parameter!
// })

interface ITaskCondition {
    id: string;
    type: 'Condition';
    name?: string;
    componentType: 'switch';     // Condition uses 'switch' componentType
    properties: {
        conditions: Condition;   // REQUIRED: Condition(s) to evaluate
    };
    branches: {                  // SEPARATE from properties!
        onSuccess: Task[];       // Tasks to execute if TRUE
        onFailure: Task[];       // Tasks to execute if FALSE
    };
}

interface Condition {
    fact?: string;               // Path to value: "{$.user.role}", "{$.QueryUser.data}"
    operator?: ConditionOperator; // Comparison operator
    value?: any;                 // Value to compare against (can be path or literal)
    and?: Condition[];           // ALL must be true (AND logic) - recursive
    any?: Condition[];           // AT LEAST ONE must be true (OR logic) - recursive
}

type ConditionOperator =
    | 'equals'           // Loose equality (==) with type coercion
    | 'exactEquals'      // Strict equality (===)
    | 'notEquals'        // Not equal (!==) 
    | 'greaterThan'      // Greater than (>)
    | 'greaterThanEquals' // Greater or equal (>=)
    | 'lessThan'         // Less than (<)
    | 'lessThanEquals'   // Less or equal (<=)
    | 'in'               // Value exists in array
    | 'notIn'            // Value not in array
    | 'contains'         // String/array contains value
    | 'notContains'      // Does not contain
    | 'some'             // Array overlap (alias: any)
    | 'regex'            // Regex pattern match
    | 'isArray'          // Is an array
    | 'notArray'         // Not an array
    | 'isObject'         // Is an object
    | 'notObject'        // Not an object
    | 'isNumber'         // Is a number
    | 'isNaN'            // Is not a number
    | 'notNull'          // Not null/undefined/empty string
    | 'hasProperty';     // Object has property`,
        requiredProperties: ['conditions'],
        optionalProperties: [],
        operators: [
            { name: 'equals', description: 'Loose equality (==) with type coercion', example: '{ operator: "equals", fact: "{$.user.role}", value: "admin" }' },
            { name: 'exactEquals', description: 'Strict equality (===)', example: '{ operator: "exactEquals", fact: "{$.count}", value: 5 }' },
            { name: 'notEquals', description: 'Not equal (!==)', example: '{ operator: "notEquals", fact: "{$.status}", value: "deleted" }' },
            { name: 'greaterThan', description: 'Greater than (>)', example: '{ operator: "greaterThan", fact: "{$.order.total}", value: 100 }' },
            { name: 'greaterThanEquals', description: 'Greater or equal (>=)', example: '{ operator: "greaterThanEquals", fact: "{$.user.age}", value: 18 }' },
            { name: 'lessThan', description: 'Less than (<)', example: '{ operator: "lessThan", fact: "{$.items.length}", value: 10 }' },
            { name: 'lessThanEquals', description: 'Less or equal (<=)', example: '{ operator: "lessThanEquals", fact: "{$.discount}", value: 50 }' },
            { name: 'in', description: 'Value exists in array', example: '{ operator: "in", fact: "{$.user.status}", value: ["active", "pending"] }' },
            { name: 'notIn', description: 'Value not in array', example: '{ operator: "notIn", fact: "{$.user.role}", value: ["banned", "suspended"] }' },
            { name: 'contains', description: 'String/array contains value', example: '{ operator: "contains", fact: "{$.email}", value: "@company.com" }' },
            { name: 'notContains', description: 'Does not contain', example: '{ operator: "notContains", fact: "{$.tags}", value: "spam" }' },
            { name: 'some', description: 'Array overlap - any common element', example: '{ operator: "some", fact: "{$.userRoles}", value: ["admin", "moderator"] }' },
            { name: 'regex', description: 'Regex pattern match', example: '{ operator: "regex", fact: "{$.email}", value: "^[a-z]+@.*\\\\.com$" }' },
            { name: 'isArray', description: 'Check if value is an array', example: '{ operator: "isArray", fact: "{$.items}" }' },
            { name: 'notArray', description: 'Check if value is NOT an array', example: '{ operator: "notArray", fact: "{$.data}" }' },
            { name: 'isObject', description: 'Check if value is an object', example: '{ operator: "isObject", fact: "{$.user}" }' },
            { name: 'notObject', description: 'Check if value is NOT an object', example: '{ operator: "notObject", fact: "{$.response}" }' },
            { name: 'isNumber', description: 'Check if value is a number', example: '{ operator: "isNumber", fact: "{$.quantity}" }' },
            { name: 'isNaN', description: 'Check if value is NOT a number', example: '{ operator: "isNaN", fact: "{$.input}" }' },
            { name: 'notNull', description: 'Not null/undefined/empty string', example: '{ operator: "notNull", fact: "{$.QueryUser.data}" }' },
            { name: 'hasProperty', description: 'Object has property', example: '{ operator: "hasProperty", fact: "{$.user}", value: "email" }' }
        ],
        executionFlow: `1. Workflow engine receives Condition task
2. Resolves fact path â†’ gets actual value from workflow state
3. Resolves value path (if it's a path reference like {$.something})
4. Evaluates condition:
   - For operator: applies operator logic between fact and value
   - For and[]: ALL conditions must return true (short-circuits on first false)
   - For any[]: AT LEAST ONE must return true (short-circuits on first true)
   - Final result = (operator_result AND all_and_results AND any_any_result)
5. If TRUE â†’ executes onSuccess tasks SEQUENTIALLY
6. If FALSE â†’ executes onFailure tasks SEQUENTIALLY  
7. Each branch task result is stored in state[task.id]
8. Condition task result = last executed task's result
9. If any branch task fails, execution stops and returns error`,
        completeExamples: [
            {
                scenario: 'Check user role (simple equality)',
                config: {
                    id: "CheckAdminRole",
                    type: "Condition",
                    name: "Check Admin Role",
                    componentType: "task",
                    conditions: {
                        operator: "equals",
                        fact: "{$.GetUser.data.role}",
                        value: "admin"
                    },
                    onSuccess: [
                        {
                            id: "AdminAction",
                            type: "Resolver",
                            properties: {
                                payload: [
                                    { Id: "<uuid>", Key: "access", Value: "full", Type: "Literal" },
                                    { Id: "<uuid>", Key: "permissions", Value: ["read", "write", "delete"], Type: "Literal" }
                                ]
                            }
                        }
                    ],
                    onFailure: [
                        {
                            id: "DenyAccess",
                            type: "Response",
                            properties: {
                                statusCode: 403,
                                payload: [
                                    { Id: "<uuid>", Key: "error", Value: "Access denied", Type: "Literal" },
                                    { Id: "<uuid>", Key: "message", Value: "Admin role required", Type: "Literal" }
                                ]
                            }
                        }
                    ]
                },
                explanation: 'Branches based on user role. Admin gets full access, others get 403 Forbidden.'
            },
            {
                scenario: 'Check if data exists (notNull)',
                config: {
                    id: "CheckUserExists",
                    type: "Condition",
                    name: "Check User Exists",
                    componentType: "task",
                    conditions: {
                        operator: "notNull",
                        fact: "{$.QueryUser.data}"
                    },
                    onSuccess: [
                        {
                            id: "ProcessUser",
                            type: "Resolver",
                            properties: {
                                payload: [
                                    { Id: "<uuid>", Key: "user", Value: "{$.QueryUser.data}", Type: "Property" },
                                    { Id: "<uuid>", Key: "found", Value: true, Type: "Literal" }
                                ]
                            }
                        }
                    ],
                    onFailure: [
                        {
                            id: "UserNotFound",
                            type: "Response",
                            properties: {
                                statusCode: 404,
                                payload: [
                                    { Id: "<uuid>", Key: "error", Value: "User not found", Type: "Literal" },
                                    { Id: "<uuid>", Key: "id", Value: "{$.params.documentId}", Type: "Property" }
                                ]
                            }
                        }
                    ]
                },
                explanation: 'Checks if query returned data. notNull checks for null, undefined, AND empty string.'
            },
            {
                scenario: 'Multiple conditions with AND logic',
                config: {
                    id: "ValidateOrder",
                    type: "Condition",
                    name: "Validate Order",
                    componentType: "task",
                    conditions: {
                        and: [
                            { operator: "notNull", fact: "{$.body.items}" },
                            { operator: "isArray", fact: "{$.body.items}" },
                            { operator: "greaterThan", fact: "{$.body.items.length}", value: 0 },
                            { operator: "greaterThan", fact: "{$.body.total}", value: 0 }
                        ]
                    },
                    onSuccess: [
                        {
                            id: "CreateOrder",
                            type: "Query",
                            properties: {
                                repository: "Order",
                                method: "Post",
                                payload: [
                                    { Id: "<uuid>", Key: "items", Value: "{$.body.items}", Type: "Property" },
                                    { Id: "<uuid>", Key: "total", Value: "{$.body.total}", Type: "Property" },
                                    { Id: "<uuid>", Key: "status", Value: "pending", Type: "Literal" }
                                ]
                            }
                        }
                    ],
                    onFailure: [
                        {
                            id: "ValidationError",
                            type: "Response",
                            properties: {
                                statusCode: 400,
                                payload: [
                                    { Id: "<uuid>", Key: "error", Value: "Invalid order data", Type: "Literal" },
                                    { Id: "<uuid>", Key: "message", Value: "Order must have items array with at least one item and positive total", Type: "Literal" }
                                ]
                            }
                        }
                    ]
                },
                explanation: 'All AND conditions must pass. Validates items exist, is array, has items, and total > 0.'
            },
            {
                scenario: 'OR logic with any[] for privileged roles',
                config: {
                    id: "CheckPrivilegedRole",
                    type: "Condition",
                    name: "Check Privileged Role",
                    componentType: "task",
                    conditions: {
                        any: [
                            { operator: "equals", fact: "{$.user.role}", value: "admin" },
                            { operator: "equals", fact: "{$.user.role}", value: "manager" },
                            { operator: "equals", fact: "{$.user.role}", value: "superuser" }
                        ]
                    },
                    onSuccess: [
                        {
                            id: "GrantAccess",
                            type: "Resolver",
                            properties: {
                                payload: [
                                    { Id: "<uuid>", Key: "authorized", Value: true, Type: "Literal" },
                                    { Id: "<uuid>", Key: "role", Value: "{$.user.role}", Type: "Property" }
                                ]
                            }
                        }
                    ],
                    onFailure: [
                        {
                            id: "DenyPrivilegedAccess",
                            type: "Response",
                            properties: {
                                statusCode: 403,
                                payload: [
                                    { Id: "<uuid>", Key: "error", Value: "Insufficient privileges", Type: "Literal" }
                                ]
                            }
                        }
                    ]
                },
                explanation: 'OR logic - passes if user is admin OR manager OR superuser.'
            },
            {
                scenario: 'Combined AND + OR for complex authorization',
                config: {
                    id: "ComplexAuth",
                    type: "Condition",
                    name: "Complex Authorization",
                    componentType: "task",
                    conditions: {
                        and: [
                            { operator: "notNull", fact: "{$.user}" },
                            { operator: "equals", fact: "{$.user.active}", value: true },
                            {
                                any: [
                                    { operator: "equals", fact: "{$.user.role}", value: "admin" },
                                    { operator: "greaterThanEquals", fact: "{$.user.level}", value: 5 }
                                ]
                            }
                        ]
                    },
                    onSuccess: [
                        {
                            id: "Authorized",
                            type: "Resolver",
                            properties: {
                                payload: [
                                    { Id: "<uuid>", Key: "authorized", Value: true, Type: "Literal" }
                                ]
                            }
                        }
                    ],
                    onFailure: [
                        {
                            id: "Unauthorized",
                            type: "Response",
                            properties: {
                                statusCode: 401,
                                payload: [
                                    { Id: "<uuid>", Key: "error", Value: "Unauthorized", Type: "Literal" }
                                ]
                            }
                        }
                    ]
                },
                explanation: 'User must exist AND be active AND (be admin OR have level >= 5).'
            },
            {
                scenario: 'Check value in array with "in" operator',
                config: {
                    id: "CheckStatusAllowed",
                    type: "Condition",
                    name: "Check Status Allowed",
                    componentType: "task",
                    conditions: {
                        operator: "in",
                        fact: "{$.order.status}",
                        value: ["pending", "processing", "ready"]
                    },
                    onSuccess: [
                        {
                            id: "AllowUpdate",
                            type: "Resolver",
                            properties: {
                                payload: [
                                    { Id: "<uuid>", Key: "canUpdate", Value: true, Type: "Literal" }
                                ]
                            }
                        }
                    ],
                    onFailure: [
                        {
                            id: "UpdateDenied",
                            type: "Response",
                            properties: {
                                statusCode: 400,
                                payload: [
                                    { Id: "<uuid>", Key: "error", Value: "Cannot modify order in current status", Type: "Literal" },
                                    { Id: "<uuid>", Key: "status", Value: "{$.order.status}", Type: "Property" }
                                ]
                            }
                        }
                    ]
                },
                explanation: 'Checks if order status is one of the allowed values for modification.'
            }
        ],
        commonMistakes: [
            'âš ï¸ CRITICAL: Putting onSuccess/onFailure inside properties - they go in SEPARATE "branches" parameter!',
            'Putting conditions inside properties.taskSettings - conditions goes directly in properties: { conditions: {...} }',
            'Missing branches parameter - use branches: { onSuccess: [...], onFailure: [...] }',
            'Using wrong operator - use notNull for existence checks, equals for value matching',
            'Incorrect fact path - must be valid {$.path} format with proper task references',
            'Forgetting type coercion - equals does coercion, use exactEquals for strict comparison',
            'Not handling both branches - always provide onFailure for error cases',
            'Using "value" with unary operators - notNull, isArray, isObject etc. only need "fact"'
        ],
        tips: [
            'âš ï¸ For addTaskToSequence: properties = { conditions: {...} }, branches = { onSuccess: [...], onFailure: [...] }',
            'Use notNull to check if data exists (catches null, undefined, AND empty string)',
            'Use equals for value matching (has type coercion), exactEquals for strict matching',
            'Use and[] when ALL conditions must be true',
            'Use any[] when AT LEAST ONE condition must be true',
            'Combine and[] with nested any[] for complex logic like (A AND B AND (C OR D))',
            'Both fact AND value can be path references like {$.taskName.data}',
            'onFailure is technically optional but always recommended for proper error handling',
            'Branch tasks execute SEQUENTIALLY - first failure stops execution',
            'The Condition task result equals the last executed branch task result',
            'Use "in" operator to check if value is one of multiple allowed values',
            'Use "hasProperty" to safely check if object has a property before accessing it'
        ]
    },

    // =========================================================================
    // REQUEST TASK
    // =========================================================================
    Request: {
        taskType: 'Request',
        description: 'Call other schemas, workflows, and actions. PRIMARY tool for orchestration between services.',
        interface: `interface TaskRequest {
    id: string;
    type: 'Request';
    name?: string;
    componentType?: 'task';
    properties: {
        method: RequestMethod;    // REQUIRED: Request method type
        schema?: string;          // Target schema name (e.g., "User", "Order")
        action?: string;          // Action/workflow to execute
        documentId?: string;      // Document ID for GetById/Put
        subscription?: string;    // Target subscription for cross-tenant
        payload?: IKeyValue[] | string;  // Request payload
        body?: string;            // Request body (alternative to payload)
        params?: IKeyValue[];     // URL parameters
        query?: string;           // Query string
        async?: boolean;          // Execute asynchronously
        isArray?: boolean;        // Iterate over payload array
        path?: string;            // Path for array iteration
        scheduler?: 'cron' | 'delayed';  // Schedule type
        pattern?: string;         // Cron pattern
        dateTime?: string;        // Delayed execution time
        jobId?: string;           // Scheduled job ID
        topic?: string;           // Message queue topic
        key?: string;             // Message key
    };
}

type RequestMethod = 'Action' | 'Forward' | 'Proxy' | 'ForwardProxy' | 'Schedule' | 'GetById' | 'Post' | 'Put' | 'Service' | 'Produce';`,
        requiredProperties: ['method'],
        optionalProperties: ['schema', 'action', 'documentId', 'subscription', 'payload', 'body', 'params', 'query', 'async', 'isArray', 'path', 'scheduler', 'pattern', 'dateTime', 'jobId', 'topic', 'key'],
        methods: ['Action', 'Forward', 'Proxy', 'ForwardProxy', 'Schedule', 'GetById', 'Post', 'Put', 'Service', 'Produce'],
        methodRequirements: {
            Action: ['schema', 'action'],
            Forward: ['schema', 'action'],
            ForwardProxy: ['subscription', 'schema', 'action'],
            Schedule: ['schema', 'action', 'scheduler (cron or delayed)'],
            GetById: ['schema', 'documentId'],
            Post: ['schema', 'payload or body'],
            Put: ['schema', 'documentId', 'payload or body'],
            Service: ['topic'],
            Produce: ['topic', 'payload']
        },
        executionFlow: `1. Workflow engine receives Request task
2. Based on method:
   - Action: Finds target schema's action workflow, executes it
   - Forward: Passes current request context to target
   - ForwardProxy: Routes to different subscription's schema/action
   - Schedule: Registers job for future execution
   - GetById/Post/Put: Direct entity operations
   - Service/Produce: Sends to message queue
3. For sync calls: waits for response, stores in {$.TaskId.data}
4. For async=true: fires and forgets, continues workflow
5. For Schedule: returns job ID`,
        completeExamples: [
            {
                scenario: 'Call another schema action',
                config: {
                    id: "CreateOrderInvoice",
                    type: "Request",
                    name: "Create Invoice",
                    componentType: "task",
                    properties: {
                        method: "Action",
                        schema: "Invoice",
                        action: "Create",
                        payload: [
                            { Id: "<uuid>", Key: "orderId", Value: "{$.CreateOrder.data.id}", Type: "Property" },
                            { Id: "<uuid>", Key: "userId", Value: "{$.body.userId}", Type: "Property" },
                            { Id: "<uuid>", Key: "items", Value: "{$.body.items}", Type: "Property" },
                            { Id: "<uuid>", Key: "total", Value: "{$.body.total}", Type: "Property" }
                        ]
                    }
                },
                explanation: 'Calls Invoice schema\'s Create action. Response in {$.CreateOrderInvoice.data}'
            },
            {
                scenario: 'Schedule a future task',
                config: {
                    id: "ScheduleReminder",
                    type: "Request",
                    name: "Schedule Reminder",
                    componentType: "task",
                    properties: {
                        method: "Schedule",
                        schema: "Notification",
                        action: "SendReminder",
                        scheduler: "delayed",
                        dateTime: "{$.body.reminderTime}",
                        payload: [
                            { Id: "<uuid>", Key: "userId", Value: "{$.body.userId}", Type: "Property" },
                            { Id: "<uuid>", Key: "message", Value: "{$.body.message}", Type: "Property" }
                        ],
                        jobId: "reminder-{$.body.userId}-{$.now}"
                    }
                },
                explanation: 'Schedules notification for future time. Job can be cancelled by jobId.'
            },
            {
                scenario: 'Cross-subscription call (multi-tenant)',
                config: {
                    id: "CallPartnerService",
                    type: "Request",
                    name: "Call Partner Service",
                    componentType: "task",
                    properties: {
                        method: "ForwardProxy",
                        subscription: "{$.body.partnerSubscriptionId}",
                        schema: "PartnerAPI",
                        action: "ProcessRequest",
                        payload: "{$.PreparedPayload.data}"
                    }
                },
                explanation: 'Calls action in different tenant/subscription context.'
            },
            {
                scenario: 'Async fire-and-forget',
                config: {
                    id: "SendAnalytics",
                    type: "Request",
                    name: "Send Analytics",
                    componentType: "task",
                    properties: {
                        method: "Action",
                        schema: "Analytics",
                        action: "TrackEvent",
                        async: true,
                        payload: [
                            { Id: "<uuid>", Key: "event", Value: "order_created", Type: "Literal" },
                            { Id: "<uuid>", Key: "userId", Value: "{$.body.userId}", Type: "Property" },
                            { Id: "<uuid>", Key: "orderId", Value: "{$.CreateOrder.data.id}", Type: "Property" }
                        ]
                    }
                },
                explanation: 'Sends analytics asynchronously without waiting for response.'
            }
        ],
        commonMistakes: [
            'Missing schema or action for Action method',
            'Wrong scheduler type - use "cron" or "delayed"',
            'Forgetting async:true for fire-and-forget calls',
            'Not providing jobId for scheduled tasks (can\'t cancel without it)',
            'Wrong subscription ID for ForwardProxy'
        ],
        tips: [
            'Use Action for most service-to-service calls',
            'Use async:true when you don\'t need the response',
            'Use Schedule for deferred processing',
            'Use ForwardProxy for multi-tenant scenarios',
            'Always include jobId for scheduled tasks to enable cancellation'
        ]
    },

    // =========================================================================
    // ITERATOR TASK - From apt-yuj/src/workflow/task.iterator.ts
    // =========================================================================
    Iterator: {
        taskType: 'Iterator',
        description: 'Iterate over arrays and execute tasks for each item. Used for batch processing.',
        interface: `// Iterator task interface from apt-yuj
interface ITaskIterate extends ITask {
    type: 'Iterator';
    method: 'Iterate';             // REQUIRED: Always 'Iterate'
    path: string;                  // REQUIRED: Path to array to iterate
    var: string;                   // REQUIRED: Variable name for current item
    index: string;                 // REQUIRED: Variable name for current index
    tasks: Task[];                 // REQUIRED: Tasks to execute per iteration (via branches)
    break?: boolean;               // Optional: Break on task failure
    async?: boolean;               // Optional: Run iterations in parallel
    breakConditions?: Condition;   // Optional: Conditions to break iteration
}`,
        requiredProperties: ['method', 'path', 'var', 'index'],
        optionalProperties: ['async', 'break', 'breakConditions'],
        executionFlow: `1. Workflow engine receives Iterator task
2. Resolves path to get source array
3. For each item in array:
   - Sets {$.var} to current item
   - Sets {$.index} (or custom name) to current index
   - Executes all tasks in sequence array
   - If async=true: runs iterations in parallel
   - If break=true and breakConditions met: exits loop
4. Collects all results into array
5. Output available at {$.TaskId.data}`,
        completeExamples: [
            {
                scenario: 'Process each order item',
                config: {
                    id: "ProcessOrderItems",
                    type: "Iterator",
                    name: "Process Order Items",
                    componentType: "task",
                    properties: {
                        method: "Iterate",
                        path: "{$.body.items}",
                        var: "item",
                        index: "idx"
                    },
                    sequence: [
                        {
                            id: "GetProduct",
                            type: "Query",
                            properties: {
                                repository: "Product",
                                method: "FindOne",
                                where: [
                                    { Id: "<uuid>", Key: "id", Value: "{$.item.productId}", Type: "Property" }
                                ]
                            }
                        },
                        {
                            id: "CalculateItemTotal",
                            type: "Resolver",
                            properties: {
                                payload: [
                                    { Id: "<uuid>", Key: "productId", Value: "{$.item.productId}", Type: "Property" },
                                    { Id: "<uuid>", Key: "quantity", Value: "{$.item.quantity}", Type: "Property" },
                                    { Id: "<uuid>", Key: "price", Value: "{$.GetProduct.data.price}", Type: "Property" },
                                    { Id: "<uuid>", Key: "index", Value: "{$.idx}", Type: "Property" }
                                ]
                            }
                        }
                    ]
                },
                explanation: 'Iterates over order items, fetches product, calculates total for each.'
            },
            {
                scenario: 'Parallel iteration for faster processing',
                config: {
                    id: "SendNotifications",
                    type: "Iterator",
                    name: "Send Notifications",
                    componentType: "task",
                    properties: {
                        method: "Iterate",
                        path: "{$.GetUsers.data}",
                        var: "user",
                        async: true
                    },
                    sequence: [
                        {
                            id: "SendEmail",
                            type: "Request",
                            properties: {
                                method: "Action",
                                schema: "Notification",
                                action: "SendEmail",
                                payload: [
                                    { Id: "<uuid>", Key: "to", Value: "{$.user.email}", Type: "Property" },
                                    { Id: "<uuid>", Key: "template", Value: "announcement", Type: "Literal" }
                                ]
                            }
                        }
                    ]
                },
                explanation: 'Sends notifications to all users in parallel (async:true).'
            }
        ],
        commonMistakes: [
            'Forgetting method: "Iterate"',
            'Wrong path - must point to an array',
            'Using wrong variable name in sequence tasks',
            'Not using {$.varName} syntax to access current item',
            'Heavy operations without async causing timeout'
        ],
        tips: [
            'Use async:true for independent operations (faster)',
            'Use sync (default) when order matters or tasks depend on each other',
            'var sets the current item variable name',
            'Access item fields with {$.varName.fieldName}',
            'Access index with {$.indexName} (default: {$.i})'
        ]
    },

    // =========================================================================
    // CACHE TASK
    // =========================================================================
    Cache: {
        taskType: 'Cache',
        description: 'Redis caching operations and real-time event emission.',
        interface: `interface TaskCache {
    id: string;
    type: 'Cache';
    name?: string;
    componentType?: 'task';
    properties: {
        method: CacheMethod;     // REQUIRED: Cache operation
        key: string;             // REQUIRED: Cache key
        value?: any;             // Value to cache (for Set)
        ttl?: number;            // Time-to-live in seconds (for Set)
        event?: string;          // Event name (for Emit)
        channel?: string;        // Channel for Emit
        payload?: IKeyValue[];   // Payload for Emit
    };
}

type CacheMethod = 'Get' | 'Set' | 'Delete' | 'Expire' | 'Increment' | 'Emit' | 'Broadcast';`,
        requiredProperties: ['method', 'key'],
        optionalProperties: ['value', 'ttl', 'event', 'channel', 'payload'],
        methods: ['Get', 'Set', 'Delete', 'Expire', 'Increment', 'Emit', 'Broadcast'],
        methodRequirements: {
            Get: [],
            Set: ['value'],
            Delete: [],
            Expire: ['ttl'],
            Increment: [],
            Emit: ['event'],
            Broadcast: ['event', 'channel']
        },
        executionFlow: `1. Workflow engine receives Cache task
2. Based on method:
   - Get: Retrieves value from Redis by key
   - Set: Stores value in Redis with optional TTL
   - Delete: Removes key from Redis
   - Expire: Sets TTL on existing key
   - Increment: Atomic increment of numeric value
   - Emit: Sends real-time event via Socket.IO
   - Broadcast: Broadcasts event to channel
3. For Get: result in {$.TaskId.data}
4. For Set/Delete: returns success status`,
        completeExamples: [
            {
                scenario: 'Cache query result',
                config: {
                    id: "CacheUserData",
                    type: "Cache",
                    name: "Cache User Data",
                    componentType: "task",
                    properties: {
                        method: "Set",
                        key: "user:{$.params.userId}",
                        value: "{$.GetUser.data}",
                        ttl: 3600
                    }
                },
                explanation: 'Caches user data for 1 hour (3600 seconds).'
            },
            {
                scenario: 'Check cache before query',
                config: {
                    id: "GetCachedUser",
                    type: "Cache",
                    name: "Get Cached User",
                    componentType: "task",
                    properties: {
                        method: "Get",
                        key: "user:{$.params.userId}"
                    }
                },
                explanation: 'Retrieves cached user. Result in {$.GetCachedUser.data} (null if not cached).'
            },
            {
                scenario: 'Real-time notification',
                config: {
                    id: "NotifyUser",
                    type: "Cache",
                    name: "Notify User",
                    componentType: "task",
                    properties: {
                        method: "Emit",
                        key: "user:{$.body.userId}",
                        event: "order_update",
                        payload: [
                            { Id: "<uuid>", Key: "orderId", Value: "{$.UpdateOrder.data.id}", Type: "Property" },
                            { Id: "<uuid>", Key: "status", Value: "{$.UpdateOrder.data.status}", Type: "Property" },
                            { Id: "<uuid>", Key: "message", Value: "Your order status has been updated", Type: "Literal" }
                        ]
                    }
                },
                explanation: 'Emits real-time event to user\'s socket connection.'
            }
        ],
        commonMistakes: [
            'Missing key - required for all cache operations',
            'Forgetting TTL for Set - data persists forever',
            'Wrong value type for Set',
            'Not checking for null result on Get',
            'Key naming without proper namespacing'
        ],
        tips: [
            'Use namespaced keys: "entity:id" format',
            'Always set TTL to prevent memory bloat',
            'Use Emit for real-time UI updates',
            'Check cache before expensive queries',
            'Use Increment for counters (atomic operation)'
        ]
    },

    // =========================================================================
    // DOCUMENT TASK - From apt-yuj/src/workflow/task.document.ts
    // =========================================================================
    Document: {
        taskType: 'Document',
        description: 'CRUD operations on database documents with schema-based routing. Base interface requires type, subscriptionId, schemaId.',
        interface: `// Base interface - ALL Document tasks require these
interface ITaskDocument extends ITask {
    type: 'Document';
    subscriptionId: string;   // REQUIRED: Must be UUID or path reference {$.path}
    schemaId: string;         // REQUIRED: Schema name or path reference
}

// Method: Get - Retrieve single document by ID
interface ITaskDocumentGet extends ITaskDocument {
    method: 'Get';                   // REQUIRED
    documentId: string;              // REQUIRED: Document ID or path reference
    relations?: IRelation[];         // Optional: Relations to load
    addRelation?: boolean;           // Optional: Include relations
}

// Method: Post - Create new document
interface ITaskDocumentCreate extends ITaskDocument {
    method: 'Post';                  // REQUIRED
    payload: IKeyValue[];            // REQUIRED: Fields to create
}

// Method: Put - Update existing document
interface ITaskDocumentUpdate extends ITaskDocument {
    method: 'Put';                   // REQUIRED
    documentId: string;              // REQUIRED: Document ID to update
    payload: IKeyValue[];            // REQUIRED: Fields to update
}

// Method: Paging - Paginated list query
interface ITaskDocumentPaging extends ITaskDocument {
    method: 'Paging';                // REQUIRED
    documentId?: string;             // Optional: Filter by parent document
    take?: string;                   // Optional: Page size (default varies)
    skip?: string;                   // Optional: Offset
    sort?: IKeyValue[];              // Optional: Sort configuration
    select?: IKeyValue[];            // Optional: Fields to return
    search?: string;                 // Optional: Full-text search
    where?: IKeyValue[];             // Optional: Filter conditions
    relations?: IRelation[];         // Optional: Relations to load
}

// Method: UpsertAll - Bulk upsert from array
interface ITaskDocumentUpsertAll extends ITaskDocument {
    method: 'UpsertAll';             // REQUIRED
    path: string;                    // REQUIRED: Path to source array
    documentId: string;              // REQUIRED: ID field in array items
    payload: IKeyValue[];            // REQUIRED: Field mappings
}

// IRelation structure
interface IRelation {
    name: string;
    subscription?: string;
    schemaId?: string;
    joinColumn?: string;
    column?: string;
    columns?: string[];
    relations?: IRelation[];         // Nested relations
    type?: string;
}

type DocumentMethod = 'Get' | 'Post' | 'Put' | 'Paging' | 'UpsertAll';`,
        requiredProperties: ['method', 'subscriptionId', 'schemaId'],
        optionalProperties: ['documentId', 'payload', 'relations', 'addRelation', 'where', 'select', 'sort', 'take', 'skip', 'search', 'path'],
        methods: ['Get', 'Post', 'Put', 'Paging', 'UpsertAll'],
        methodRequirements: {
            Get: ['documentId'],
            Post: ['payload'],
            Put: ['documentId', 'payload'],
            Paging: [],
            UpsertAll: ['path', 'documentId', 'payload']
        },
        executionFlow: `1. Workflow engine receives Document task
2. Uses subscriptionId for tenant isolation/routing
3. Uses schemaId to determine entity structure
4. Based on method:
   - Get: Retrieves document by ID, optionally loads relations
   - Post: Creates new document with payload
   - Put: Updates document by ID with payload
   - Paging: Returns paginated list with filters
   - UpsertAll: Bulk upsert from array
5. Result in {$.TaskId.data}`,
        completeExamples: [
            {
                scenario: 'Get document with relations',
                config: {
                    id: "GetOrderWithItems",
                    type: "Document",
                    name: "Get Order With Items",
                    componentType: "task",
                    properties: {
                        method: "Get",
                        subscriptionId: "{$.subscription.id}",
                        schemaId: "Order",
                        documentId: "{$.params.orderId}",
                        addRelation: true,
                        relations: [
                            { name: "items" },
                            { name: "customer" }
                        ]
                    }
                },
                explanation: 'Gets order document with nested items and customer relations.'
            },
            {
                scenario: 'Create new document',
                config: {
                    id: "CreateProduct",
                    type: "Document",
                    name: "Create Product",
                    componentType: "task",
                    properties: {
                        method: "Post",
                        subscriptionId: "{$.subscription.id}",
                        schemaId: "Product",
                        payload: [
                            { Id: "<uuid>", Key: "name", Value: "{$.body.name}", Type: "Property" },
                            { Id: "<uuid>", Key: "price", Value: "{$.body.price}", Type: "Property" },
                            { Id: "<uuid>", Key: "category", Value: "{$.body.category}", Type: "Property" },
                            { Id: "<uuid>", Key: "status", Value: "active", Type: "Literal" }
                        ]
                    }
                },
                explanation: 'Creates new product document. Returns created document with ID.'
            },
            {
                scenario: 'Paginated list',
                config: {
                    id: "ListProducts",
                    type: "Document",
                    name: "List Products",
                    componentType: "task",
                    properties: {
                        method: "Paging",
                        subscriptionId: "{$.subscription.id}",
                        schemaId: "Product",
                        where: [
                            { Id: "<uuid>", Key: "status", Value: "active", Type: "Literal" },
                            { Id: "<uuid>", Key: "category", Value: "{$.query.category}", Type: "Property" }
                        ],
                        select: [
                            { Key: "id" },
                            { Key: "name" },
                            { Key: "price" },
                            { Key: "category" }
                        ],
                        sort: [
                            { Key: "createdAt", Value: "DESC" }
                        ],
                        take: "{$.query.limit}",
                        skip: "{$.query.offset}"
                    }
                },
                explanation: 'Returns paginated product list with filters.'
            }
        ],
        commonMistakes: [
            'Missing subscriptionId - required for multi-tenant',
            'Missing schemaId - required to identify entity',
            'Forgetting documentId for Get/Put',
            'Empty payload for Post/Put',
            'Not using relations for nested data'
        ],
        tips: [
            'Use {$.subscription.id} for current subscription context',
            'Load relations with addRelation:true and relations array',
            'Use Paging for list endpoints',
            'UpsertAll is efficient for bulk operations',
            'select limits returned fields for efficiency'
        ]
    },

    // =========================================================================
    // ARRAY TASK - From apt-yuj/src/workflow/task.array.ts
    // =========================================================================
    Array: {
        taskType: 'Array',
        description: 'Array manipulation operations: map, filter, find, sort, merge, etc.',
        interface: `// Base interface - ALL Array tasks require method
interface ITaskArray extends ITask {
    type: 'Array';
}

// Method: Push - Add item to array
interface ITaskArrayPush extends ITaskArray {
    method: 'Push';            // REQUIRED
    path: string;              // REQUIRED: Path to array
    value: string;             // REQUIRED: Value to push (can be path reference)
}

// Method: Index - Get item at index
interface ITaskIndex extends ITaskArray {
    method: 'Index';           // REQUIRED
    path: string;              // REQUIRED: Path to array
    index: number;             // REQUIRED: Array index
}

// Method: Find - Find first matching item
interface ITaskFindArray extends ITaskArray {
    method: 'Find';            // REQUIRED
    path: string;              // REQUIRED: Path to array
    var: string;               // REQUIRED: Variable name for current item
    conditions: Condition;     // REQUIRED: Match conditions
}

// Method: Filter - Filter items by condition
interface ITaskFilter extends ITaskArray {
    method: 'Filter';          // REQUIRED
    path: string;              // REQUIRED: Path to array
    var: string;               // REQUIRED: Variable name for current item
    conditions: Condition;     // REQUIRED: Filter conditions
}

// Method: Map - Transform each item
interface ITaskMap extends ITaskArray {
    method: 'Map';             // REQUIRED
    path: string;              // REQUIRED: Path to array
    var: string;               // REQUIRED: Variable name for current item
    payload: IKeyValue[];      // REQUIRED: Output mapping
}

// Method: Sort - Sort array
interface ITaskSort extends ITaskArray {
    method: 'Sort';            // REQUIRED
    path: string;              // REQUIRED: Path to array
    key: string;               // REQUIRED: Sort key
    var: string;               // REQUIRED: Variable name
    asc: boolean;              // REQUIRED: true = ascending, false = descending
}

// Method: Slice - Extract portion of array
interface ITaskSlice extends ITaskArray {
    method: 'Slice';           // REQUIRED
    path: string;              // REQUIRED: Path to array
    index: number;             // REQUIRED: End index
    fromIndex: number;         // REQUIRED: Start index
}

// Method: Join - Join array to string
interface ITaskJoin extends ITaskArray {
    method: 'Join';            // REQUIRED
    path: string;              // REQUIRED: Path to array
    separator: string;         // REQUIRED: Join separator
}

// Method: Count - Get array length
interface ITaskCount extends ITaskArray {
    method: 'Count';           // REQUIRED
    path: string;              // REQUIRED: Path to array
}

// Method: Merge - Combine multiple arrays
interface ITaskMerge extends ITaskArray {
    method: 'Merge';           // REQUIRED
    paths: string[];           // REQUIRED: Array paths to merge
}

// Method: Distinct - Remove duplicates
interface ITaskDistinct extends ITaskArray {
    method: 'Distinct';        // REQUIRED
    path: string;              // REQUIRED: Path to array
}

// Method: IsArray - Check if value is array
interface ITaskIsArray extends ITaskArray {
    method: 'IsArray';         // REQUIRED
    path: string;              // REQUIRED: Path to check
}

// Method: ToArray - Convert to array with property extraction
interface ITaskToArray extends ITaskArray {
    method: 'ToArray';         // REQUIRED
    path: string;              // REQUIRED: Path to source
    property: string;          // REQUIRED: Property to extract
    distinct: boolean;         // REQUIRED: Remove duplicates
}

type ArrayMethod = 'Push' | 'Index' | 'Find' | 'Slice' | 'Splice' | 'Join' | 'Map' | 'Sort' | 'Count' | 'Filter' | 'Merge' | 'IsArray' | 'ToArray' | 'Distinct';`,
        requiredProperties: ['method'],
        optionalProperties: ['path', 'var', 'value', 'index', 'fromIndex', 'conditions', 'payload', 'key', 'asc', 'separator', 'paths', 'property', 'distinct'],
        methods: ['Push', 'Index', 'Find', 'Slice', 'Splice', 'Join', 'Map', 'Sort', 'Count', 'Filter', 'Merge', 'IsArray', 'ToArray', 'Distinct'],
        methodRequirements: {
            Push: ['path', 'value'],
            Index: ['path', 'index'],
            Find: ['path', 'var', 'conditions'],
            Slice: ['path', 'fromIndex'],
            Splice: ['path', 'index', 'fromIndex'],
            Join: ['path', 'separator'],
            Map: ['path', 'var', 'payload'],
            Sort: ['path', 'key', 'var', 'asc'],
            Filter: ['path', 'var', 'conditions'],
            Merge: ['paths'],
            Count: ['path'],
            Distinct: ['path'],
            IsArray: ['path'],
            ToArray: ['path', 'property', 'distinct']
        },
        executionFlow: `1. Workflow engine receives Array task
2. Resolves path to get source array
3. Based on method:
   - Get/Index: Returns item at index
   - Push: Adds value to array
   - Find: Returns first matching item
   - Filter: Returns all matching items
   - Map: Transforms each item with payload
   - Sort: Orders by key
   - Merge: Combines multiple arrays
   - Count: Returns array length
   - Distinct: Removes duplicates
4. Result in {$.TaskId.data}`,
        completeExamples: [
            {
                scenario: 'Map array to new structure',
                config: {
                    id: "TransformProducts",
                    type: "Array",
                    name: "Transform Products",
                    componentType: "task",
                    properties: {
                        method: "Map",
                        path: "{$.GetProducts.data}",
                        var: "product",
                        payload: [
                            { Id: "<uuid>", Key: "id", Value: "{$.product.id}", Type: "Property" },
                            { Id: "<uuid>", Key: "displayName", Value: "{$.product.name}", Type: "Property" },
                            { Id: "<uuid>", Key: "formattedPrice", Value: "USD {$.product.price}", Type: "Calculated" },
                            { Id: "<uuid>", Key: "inStock", Value: "{$.product.quantity}", Type: "Property" }
                        ]
                    }
                },
                explanation: 'Maps each product to a new format. Access with {$.TransformProducts.data}'
            },
            {
                scenario: 'Filter array by condition',
                config: {
                    id: "FilterActiveUsers",
                    type: "Array",
                    name: "Filter Active Users",
                    componentType: "task",
                    properties: {
                        method: "Filter",
                        path: "{$.GetUsers.data}",
                        var: "user",
                        conditions: {
                            and: [
                                { operator: "equals", fact: "{$.user.status}", value: "active" },
                                { operator: "notNull", fact: "{$.user.email}" }
                            ]
                        }
                    }
                },
                explanation: 'Filters to only active users with email. Returns filtered array.'
            },
            {
                scenario: 'Sort array by field',
                config: {
                    id: "SortByDate",
                    type: "Array",
                    name: "Sort By Date",
                    componentType: "task",
                    properties: {
                        method: "Sort",
                        path: "{$.GetOrders.data}",
                        key: "createdAt",
                        asc: false
                    }
                },
                explanation: 'Sorts orders by createdAt descending (newest first).'
            },
            {
                scenario: 'Merge multiple arrays',
                config: {
                    id: "CombineLists",
                    type: "Array",
                    name: "Combine Lists",
                    componentType: "task",
                    properties: {
                        method: "Merge",
                        paths: [
                            "{$.GetLocalProducts.data}",
                            "{$.GetImportedProducts.data}"
                        ]
                    }
                },
                explanation: 'Merges two product arrays into one.'
            }
        ],
        commonMistakes: [
            'Missing path for array source',
            'Wrong var name in payload references',
            'Using Filter when Find is sufficient (Find returns first match)',
            'Forgetting conditions for Filter/Find',
            'Not using {$.varName.field} syntax in payload'
        ],
        tips: [
            'Map: transforms structure, Filter: reduces items',
            'Use Find for single item, Filter for multiple',
            'In Map/Filter, {$.varName} is current item',
            'Merge combines arrays, Distinct removes duplicates',
            'Sort with asc:false for descending'
        ]
    },

    // =========================================================================
    // ENTITY TASK - From apt-yuj/src/workflow/task.entity.ts
    // =========================================================================
    Entity: {
        taskType: 'Entity',
        description: 'CRUD operations on entities/containers. Used for Get, Post, Put, List, Paging, Clone operations on entity documents.',
        interface: `// Base interface - ALL Entity tasks require these
interface ITaskEntity extends ITask {
    type: 'Entity';
    subscriptionId: string;    // REQUIRED: Subscription context
    containerId: string;       // REQUIRED: Entity/container name
}

// Method: Get - Retrieve single entity
interface ITaskGetEntity extends ITaskEntity {
    method: 'Get';             // REQUIRED
    documentId: string;        // REQUIRED: Entity document ID
}

// Method: Post - Create new entity
interface ITaskPostEntity extends ITaskEntity {
    method: 'Post';            // REQUIRED
    payload: IKeyValue[];      // REQUIRED: Fields to create
}

// Method: Put - Update existing entity
interface ITaskPutEntity extends ITaskEntity {
    method: 'Put';             // REQUIRED
    documentId: string;        // REQUIRED: Entity ID to update
    payload: IKeyValue[];      // REQUIRED: Fields to update
}

// Method: List - Get all entities with optional filter
interface ITaskEntityList extends ITaskEntity {
    method: 'List';            // REQUIRED
    where?: IKeyValue[];       // Optional: Filter conditions
    select?: IKeyValue[];      // Optional: Fields to return
}

// Method: Paging - Paginated entity list
interface ITaskEntityPaging extends ITaskEntity {
    method: 'Paging';          // REQUIRED
    where?: IKeyValue[];       // Optional: Filter conditions
    select?: IKeyValue[];      // Optional: Fields to return
    take?: string | number;    // Optional: Page size
    skip?: string | number;    // Optional: Offset
    orderby?: string;          // Optional: Sort field
    asc?: string | boolean;    // Optional: Sort direction (true = ascending)
    page?: string;             // Optional: Page number
}

// Method: Clone - Copy entity to destination
interface ITaskEntityClone extends ITaskEntity {
    method: 'Clone';           // REQUIRED
    destination: string;       // REQUIRED: Target container/subscription
}

type EntityMethod = 'Get' | 'Post' | 'Put' | 'List' | 'Paging' | 'Clone';`,
        requiredProperties: ['method', 'subscriptionId', 'containerId'],
        optionalProperties: ['documentId', 'payload', 'where', 'select', 'take', 'skip', 'orderby', 'asc', 'page', 'destination'],
        methods: ['Get', 'Post', 'Put', 'List', 'Paging', 'Clone'],
        methodRequirements: {
            Get: ['documentId'],
            Post: ['payload'],
            Put: ['documentId', 'payload'],
            List: [],
            Paging: [],
            Clone: ['destination']
        },
        executionFlow: `1. Workflow engine receives Entity task
2. Uses subscriptionId for tenant context/routing
3. Uses containerId to identify the entity type
4. Based on method:
   - Get: Retrieves single entity by documentId
   - Post: Creates new entity with payload
   - Put: Updates entity by documentId with payload
   - List: Returns all entities (with optional filters)
   - Paging: Returns paginated list with take/skip
   - Clone: Copies entity to destination
5. Result stored in {$.TaskId.data}`,
        completeExamples: [
            {
                scenario: 'Get entity by ID',
                config: {
                    id: "GetUser",
                    type: "Entity",
                    name: "Get User",
                    componentType: "task",
                    properties: {
                        method: "Get",
                        subscriptionId: "{$.subscription.id}",
                        containerId: "User",
                        documentId: "{$.params.documentId}"
                    }
                },
                explanation: 'Retrieves a user entity by ID. Access data via {$.GetUser.data}'
            },
            {
                scenario: 'Create new entity',
                config: {
                    id: "CreateUser",
                    type: "Entity",
                    name: "Create User",
                    componentType: "task",
                    properties: {
                        method: "Post",
                        subscriptionId: "{$.subscription.id}",
                        containerId: "User",
                        payload: [
                            { Id: "<uuid>", Key: "name", Value: "{$.body.name}", Type: "Property" },
                            { Id: "<uuid>", Key: "email", Value: "{$.body.email}", Type: "Property" },
                            { Id: "<uuid>", Key: "role", Value: "user", Type: "Literal" },
                            { Id: "<uuid>", Key: "status", Value: "active", Type: "Literal" }
                        ]
                    }
                },
                explanation: 'Creates a new user entity. Returns created entity with ID.'
            },
            {
                scenario: 'Update entity',
                config: {
                    id: "UpdateUser",
                    type: "Entity",
                    name: "Update User",
                    componentType: "task",
                    properties: {
                        method: "Put",
                        subscriptionId: "{$.subscription.id}",
                        containerId: "User",
                        documentId: "{$.params.documentId}",
                        payload: [
                            { Id: "<uuid>", Key: "name", Value: "{$.body.name}", Type: "Property" },
                            { Id: "<uuid>", Key: "email", Value: "{$.body.email}", Type: "Property" },
                            { Id: "<uuid>", Key: "updatedAt", Value: "{$.now}", Type: "Property" }
                        ]
                    }
                },
                explanation: 'Updates an existing user entity. Returns updated entity.'
            },
            {
                scenario: 'Paginated list with filters',
                config: {
                    id: "ListUsers",
                    type: "Entity",
                    name: "List Users",
                    componentType: "task",
                    properties: {
                        method: "Paging",
                        subscriptionId: "{$.subscription.id}",
                        containerId: "User",
                        where: [
                            { Id: "<uuid>", Key: "status", Value: "active", Type: "Literal" }
                        ],
                        select: [
                            { Key: "id" },
                            { Key: "name" },
                            { Key: "email" },
                            { Key: "role" }
                        ],
                        take: "{$.query.limit}",
                        skip: "{$.query.offset}",
                        orderby: "createdAt",
                        asc: false
                    }
                },
                explanation: 'Returns paginated list of active users. Access via {$.ListUsers.data}'
            }
        ],
        commonMistakes: [
            'Missing subscriptionId - required for multi-tenant context',
            'Missing containerId - required to identify entity type',
            'Forgetting documentId for Get/Put operations',
            'Empty payload for Post/Put',
            'Using wrong method - Get for single, Paging for lists'
        ],
        tips: [
            'Use {$.subscription.id} for current tenant context',
            'Use Get for single entity, Paging for lists',
            'Include select to limit returned fields',
            'Use where to filter results',
            'Task id becomes path: id="GetUser" â†’ {$.GetUser.data}'
        ]
    },

    // =========================================================================
    // LOOP TASK - From apt-yuj/src/workflow/task.loop.ts
    // =========================================================================
    Loop: {
        taskType: 'Loop',
        description: 'Execute tasks a fixed number of times. Used for repeat operations.',
        interface: `interface ITaskLoop extends ITask {
    type: 'Loop';
    id: string;                    // REQUIRED: Task identifier
    index: string;                 // REQUIRED: Variable name for loop counter
    start?: number;                // Optional: Starting index (default: 0)
    iterations: number | string;   // REQUIRED: Number of iterations or path reference
    tasks: Task[];                 // REQUIRED: Tasks to execute per iteration
}`,
        requiredProperties: ['index', 'iterations'],
        optionalProperties: ['start'],
        executionFlow: `1. Workflow engine receives Loop task
2. Resolves iterations (can be number or path reference)
3. For i = start to iterations:
   - Sets {$.index} to current loop counter
   - Executes all nested tasks
4. Result in {$.TaskId.data}`,
        completeExamples: [
            {
                scenario: 'Generate 5 test records',
                config: {
                    id: "GenerateTestRecords",
                    type: "Loop",
                    name: "Generate Test Records",
                    componentType: "task",
                    properties: {
                        index: "i",
                        start: 0,
                        iterations: 5
                    },
                    branches: {
                        tasks: [
                            {
                                id: "CreateRecord",
                                type: "Document",
                                properties: {
                                    method: "Post",
                                    subscriptionId: "{$.subscription.id}",
                                    schemaId: "TestRecord",
                                    payload: [
                                        { Id: "<uuid>", Key: "name", Value: "Test Record {$.i}", Type: "Calculated" },
                                        { Id: "<uuid>", Key: "sequence", Value: "{$.i}", Type: "Property" }
                                    ]
                                }
                            }
                        ]
                    }
                },
                explanation: 'Creates 5 test records with sequential numbering.'
            }
        ],
        commonMistakes: [
            'Using wrong type for iterations (must be number or path)',
            'Forgetting to define index variable name',
            'Not using {$.indexName} in nested tasks'
        ],
        tips: [
            'Use index to name the counter variable',
            'Access counter with {$.indexName}',
            'iterations can be dynamic: "{$.body.count}"',
            'start defaults to 0 if not specified'
        ]
    },

    // =========================================================================
    // SWITCH TASK - From apt-yuj/src/workflow/task.switch.ts
    // =========================================================================
    Switch: {
        taskType: 'Switch',
        description: 'Execute different task branches based on a value. Like a switch/case statement.',
        interface: `interface ITaskSwitch extends ITask {
    type: 'Switch';
    id: string;                            // REQUIRED: Task identifier
    path: string;                          // REQUIRED: Path to value being switched on
    case: { [key: string]: Task[] };       // REQUIRED: Map of case values to task arrays
    default: Task[];                       // REQUIRED: Tasks for default case
}`,
        requiredProperties: ['path', 'case', 'default'],
        optionalProperties: [],
        executionFlow: `1. Workflow engine receives Switch task
2. Resolves path to get the switch value
3. Looks for matching case:
   - If found, executes tasks for that case
   - If not found, executes default tasks
4. Result in {$.TaskId.data}`,
        completeExamples: [
            {
                scenario: 'Handle different order statuses',
                config: {
                    id: "HandleOrderStatus",
                    type: "Switch",
                    name: "Handle Order Status",
                    componentType: "task",
                    properties: {
                        path: "{$.GetOrder.data.status}"
                    },
                    branches: {
                        pending: [
                            { id: "SendReminder", type: "HTTP", properties: { url: "{$.notificationUrl}/reminder", method: "Post" } }
                        ],
                        processing: [
                            { id: "UpdateProgress", type: "Document", properties: { method: "Put", subscriptionId: "{$.subscription.id}", schemaId: "Order", documentId: "{$.GetOrder.data._id}", payload: [{ Id: "<uuid>", Key: "progress", Value: "50%", Type: "Literal" }] } }
                        ],
                        default: [
                            { id: "LogStatus", type: "Resolver", properties: { method: "Object", payload: [{ Id: "<uuid>", Key: "message", Value: "Unknown status", Type: "Literal" }] } }
                        ]
                    }
                },
                explanation: 'Executes different tasks based on order status value.'
            }
        ],
        commonMistakes: [
            'Missing default case - always required',
            'Case keys must match exactly (case-sensitive)',
            'Forgetting to specify path'
        ],
        tips: [
            'Case keys are string values to match',
            'Always include default for unmatched cases',
            'Use for multi-branch logic instead of nested Conditions'
        ]
    },

    // =========================================================================
    // STRING TASK - From apt-yuj/src/workflow/task.string.ts
    // =========================================================================
    String: {
        taskType: 'String',
        description: 'String manipulation operations: toLowerCase, toUpperCase, substring, concat, replace, split, etc.',
        interface: `// Base interface
interface ITaskString extends ITask {
    type: 'String';
}

// toLowerCase - Convert to lowercase
interface ITaskLowerCase extends ITaskString {
    method: 'toLowerCase';     // REQUIRED
    path: string;              // REQUIRED: Path to string
}

// toUpperCase - Convert to uppercase
interface ITaskUpperCase extends ITaskString {
    method: 'toUpperCase';     // REQUIRED
    path: string;              // REQUIRED: Path to string
}

// substring - Extract portion
interface ITaskSubString extends ITaskString {
    method: 'substring';       // REQUIRED
    path: string;              // REQUIRED: Path to string
    start: string;             // REQUIRED: Start index
    end: string;               // REQUIRED: End index
}

// concat - Join strings
interface ITaskConcat extends ITaskString {
    method: 'concat';          // REQUIRED
    strings: string[];         // REQUIRED: Strings to concatenate
    char: string;              // REQUIRED: Separator character
}

// replace - Replace text
interface ITaskReplace extends ITaskString {
    method: 'replace';         // REQUIRED
    path: string;              // REQUIRED: Path to string
    searchValue: string;       // REQUIRED: Text to find
    replaceValue: string;      // REQUIRED: Replacement text
}

// split - Split into array
interface ITaskSplit extends ITaskString {
    method: 'split';           // REQUIRED
    path: string;              // REQUIRED: Path to string
    splitValue: string;        // REQUIRED: Delimiter
}

// length - Get string length
interface ITaskStringLength extends ITaskString {
    method: 'length';          // REQUIRED
    path: string;              // REQUIRED: Path to string
}

// trim - Remove whitespace
interface ITaskTrim extends ITaskString {
    method: 'trim';            // REQUIRED
    path: string;              // REQUIRED: Path to string
}

type StringMethod = 'toLowerCase' | 'toUpperCase' | 'substring' | 'concat' | 'charAt' | 'indexOf' | 'replace' | 'slice' | 'split' | 'toString' | 'trim' | 'length' | 'toObject' | 'toQueryString' | 'padEnd' | 'padStart';`,
        requiredProperties: ['method'],
        optionalProperties: ['path', 'start', 'end', 'strings', 'char', 'searchValue', 'replaceValue', 'splitValue', 'index', 'maxLength', 'fillString'],
        methods: ['toLowerCase', 'toUpperCase', 'substring', 'concat', 'charAt', 'indexOf', 'replace', 'slice', 'split', 'toString', 'trim', 'length', 'toObject', 'toQueryString', 'padEnd', 'padStart'],
        methodRequirements: {
            toLowerCase: ['path'],
            toUpperCase: ['path'],
            substring: ['path', 'start', 'end'],
            concat: ['strings', 'char'],
            replace: ['path', 'searchValue', 'replaceValue'],
            split: ['path', 'splitValue'],
            length: ['path'],
            trim: ['path']
        },
        executionFlow: `1. Workflow engine receives String task
2. Resolves path to get source string
3. Applies string operation based on method
4. Result in {$.TaskId.data}`,
        completeExamples: [
            {
                scenario: 'Convert email to lowercase',
                config: {
                    id: "NormalizeEmail",
                    type: "String",
                    name: "Normalize Email",
                    componentType: "task",
                    properties: {
                        method: "toLowerCase",
                        path: "{$.body.email}"
                    }
                },
                explanation: 'Converts email to lowercase. Result in {$.NormalizeEmail.data}'
            },
            {
                scenario: 'Concatenate name parts',
                config: {
                    id: "BuildFullName",
                    type: "String",
                    name: "Build Full Name",
                    componentType: "task",
                    properties: {
                        method: "concat",
                        strings: ["{$.body.firstName}", "{$.body.lastName}"],
                        char: " "
                    }
                },
                explanation: 'Joins first and last name with space. Result in {$.BuildFullName.data}'
            }
        ],
        commonMistakes: [
            'Wrong method name (case-sensitive)',
            'Missing required parameters for method',
            'Using wrong path reference'
        ],
        tips: [
            'Use toLowerCase for case-insensitive comparisons',
            'Use split to convert string to array',
            'Use concat for building strings from parts'
        ]
    },

    // =========================================================================
    // DATE TASK - From apt-yuj/src/workflow/task.date.ts
    // =========================================================================
    Date: {
        taskType: 'Date',
        description: 'Date manipulation operations: get current date, add/subtract, format, compare, etc.',
        interface: `// Base interface
interface ITaskDate extends ITask {
    type: 'Date';
}

// GetDate - Get current date/time
interface ITaskGetDate extends ITaskDate {
    method: 'GetDate';         // REQUIRED
}

// Add - Add time to date
interface ITaskAddDate extends ITaskDate {
    method: 'Add';             // REQUIRED
    date: string;              // REQUIRED: Date or path reference
    amount: string;            // REQUIRED: Amount to add
    unit: string;              // REQUIRED: 'days' | 'months' | 'years' | 'hours' | 'minutes' | 'seconds'
}

// Diff - Calculate difference between dates
interface ITaskDiff extends ITaskDate {
    method: 'Diff';            // REQUIRED
    from: string;              // REQUIRED: Start date
    to: string;                // REQUIRED: End date
    unitOfTime: string;        // REQUIRED: 'days' | 'months' | 'years' | 'hours' | 'minutes' | 'seconds'
}

// Format - Format date to string
interface ITaskFormat extends ITaskDate {
    method: 'Format';          // REQUIRED
    date: string;              // REQUIRED: Date or path reference
    format: string;            // REQUIRED: Format string (e.g., 'YYYY-MM-DD')
}

// Parse - Parse string to date
interface ITaskParse extends ITaskDate {
    method: 'Parse';           // REQUIRED
    date: string;              // REQUIRED: Date string to parse
}

// LessThan - Compare dates
interface ITaskLessThan extends ITaskDate {
    method: 'LessThan';        // REQUIRED
    date: string;              // REQUIRED: First date
    comparisionDate: string;   // REQUIRED: Second date
    format: string;            // REQUIRED: Date format
}

// GreaterThan - Compare dates
interface ITaskGreaterThan extends ITaskDate {
    method: 'GreaterThan';     // REQUIRED
    date: string;              // REQUIRED: First date
    comparisionDate: string;   // REQUIRED: Second date
    format: string;            // REQUIRED: Date format
}

type DateMethod = 'GetDate' | 'Add' | 'Diff' | 'Format' | 'Parse' | 'GetDay' | 'LessThan' | 'GreaterThan';`,
        requiredProperties: ['method'],
        optionalProperties: ['date', 'amount', 'unit', 'from', 'to', 'unitOfTime', 'format', 'comparisionDate'],
        methods: ['GetDate', 'Add', 'Diff', 'Format', 'Parse', 'GetDay', 'LessThan', 'GreaterThan'],
        methodRequirements: {
            GetDate: [],
            Add: ['date', 'amount', 'unit'],
            Diff: ['from', 'to', 'unitOfTime'],
            Format: ['date', 'format'],
            Parse: ['date'],
            LessThan: ['date', 'comparisionDate', 'format'],
            GreaterThan: ['date', 'comparisionDate', 'format']
        },
        executionFlow: `1. Workflow engine receives Date task
2. Based on method:
   - GetDate: Returns current timestamp
   - Add: Adds amount to date
   - Diff: Calculates difference
   - Format: Converts to formatted string
   - Parse: Parses string to date
   - LessThan/GreaterThan: Compares dates
3. Result in {$.TaskId.data}`,
        completeExamples: [
            {
                scenario: 'Get current timestamp',
                config: {
                    id: "GetCurrentDate",
                    type: "Date",
                    name: "Get Current Date",
                    componentType: "task",
                    properties: {
                        method: "GetDate"
                    }
                },
                explanation: 'Returns current date/time. Result in {$.GetCurrentDate.data}'
            },
            {
                scenario: 'Calculate due date (7 days from now)',
                config: {
                    id: "CalculateDueDate",
                    type: "Date",
                    name: "Calculate Due Date",
                    componentType: "task",
                    properties: {
                        method: "Add",
                        date: "{$.now}",
                        amount: "7",
                        unit: "days"
                    }
                },
                explanation: 'Adds 7 days to current date. Result in {$.CalculateDueDate.data}'
            }
        ],
        commonMistakes: [
            'Wrong unit format (use lowercase: days, months, years)',
            'Missing format string for Format method',
            'Using wrong date format'
        ],
        tips: [
            'Use GetDate to get current timestamp',
            'Use Diff to calculate time elapsed',
            'Format patterns: YYYY-MM-DD, DD/MM/YYYY, etc.'
        ]
    },

    // =========================================================================
    // MATH TASK - From apt-yuj/src/workflow/task.math.ts
    // =========================================================================
    Math: {
        taskType: 'Math',
        description: 'Mathematical operations: evaluate expressions, round, ceil, floor.',
        interface: `// Base interface
interface ITaskMath extends ITask {
    type: 'Math';
}

// Evaluate - Evaluate mathematical expression
interface ITaskEvaluate extends ITaskMath {
    method: 'Evaluate';        // REQUIRED
    expression: string;        // REQUIRED: Mathematical expression
    payload: IKeyValue[];      // REQUIRED: Variables for expression
}

// Round - Round number
interface ITaskRound extends ITaskMath {
    method: 'Round';           // REQUIRED
    expression: string;        // REQUIRED: Path to number
}

// Ceil - Round up
interface ITaskCeil extends ITaskMath {
    method: 'Ceil';            // REQUIRED
    expression: string;        // REQUIRED: Path to number
}

// Floor - Round down
interface ITaskFloor extends ITaskMath {
    method: 'Floor';           // REQUIRED
    expression: string;        // REQUIRED: Path to number
}

type MathMethod = 'Evaluate' | 'Round' | 'Ceil' | 'Floor';`,
        requiredProperties: ['method'],
        optionalProperties: ['expression', 'payload'],
        methods: ['Evaluate', 'Round', 'Ceil', 'Floor'],
        methodRequirements: {
            Evaluate: ['expression', 'payload'],
            Round: ['expression'],
            Ceil: ['expression'],
            Floor: ['expression']
        },
        executionFlow: `1. Workflow engine receives Math task
2. Resolves expression and payload values
3. Based on method:
   - Evaluate: Computes mathematical expression
   - Round/Ceil/Floor: Applies rounding
4. Result in {$.TaskId.data}`,
        completeExamples: [
            {
                scenario: 'Calculate total with tax',
                config: {
                    id: "CalculateTotal",
                    type: "Math",
                    name: "Calculate Total",
                    componentType: "task",
                    properties: {
                        method: "Evaluate",
                        expression: "price * quantity * (1 + taxRate)",
                        payload: [
                            { Id: "<uuid>", Key: "price", Value: "{$.body.price}", Type: "Property" },
                            { Id: "<uuid>", Key: "quantity", Value: "{$.body.quantity}", Type: "Property" },
                            { Id: "<uuid>", Key: "taxRate", Value: "0.1", Type: "Literal" }
                        ]
                    }
                },
                explanation: 'Calculates price * quantity * 1.1 (10% tax). Result in {$.CalculateTotal.data}'
            }
        ],
        commonMistakes: [
            'Expression variables must match payload keys',
            'Missing payload for Evaluate method',
            'Using wrong variable names in expression'
        ],
        tips: [
            'Payload keys become variables in expression',
            'Use Round for decimal precision',
            'Expression supports +, -, *, /, %, etc.'
        ]
    },

    // =========================================================================
    // UUID TASK - From apt-yuj/src/workflow/task.uuid.ts
    // =========================================================================
    UUID: {
        taskType: 'UUID',
        description: 'Generate a new UUID v4. Used for creating unique identifiers.',
        interface: `interface ITaskUUID extends ITask {
    type: 'UUID';
    // No additional properties - generates UUID automatically
}`,
        requiredProperties: [],
        optionalProperties: [],
        executionFlow: `1. Workflow engine receives UUID task
2. Generates a new UUID v4 string
3. Result in {$.TaskId.data}`,
        completeExamples: [
            {
                scenario: 'Generate unique ID for new record',
                config: {
                    id: "GenerateId",
                    type: "UUID",
                    name: "Generate ID",
                    componentType: "task",
                    properties: {}
                },
                explanation: 'Generates UUID like "550e8400-e29b-41d4-a716-446655440000". Access via {$.GenerateId.data}'
            }
        ],
        commonMistakes: [
            'Trying to pass parameters - UUID task has no parameters'
        ],
        tips: [
            'Use for generating document IDs',
            'Output is standard UUID v4 format',
            'No configuration needed'
        ]
    },

    // =========================================================================
    // TRANSACTION TASK - From apt-yuj/src/workflow/task.transaction.ts
    // =========================================================================
    Transaction: {
        taskType: 'Transaction',
        description: 'Execute tasks within a transaction with mutex lock and rollback support.',
        interface: `interface ITaskTransaction extends ITask {
    type: 'Transaction';
    key: string;               // REQUIRED: Unique transaction key for mutex lock
    tasks: Task[];             // REQUIRED: Tasks to execute within transaction
    rollback: Task[];          // REQUIRED: Tasks to execute on failure
}`,
        requiredProperties: ['key'],
        optionalProperties: [],
        executionFlow: `1. Workflow engine receives Transaction task
2. Acquires mutex lock using key
3. Executes nested tasks
4. On success: commits and releases lock
5. On failure: executes rollback tasks and releases lock
6. Result in {$.TaskId.data}`,
        completeExamples: [
            {
                scenario: 'Transfer funds with rollback',
                config: {
                    id: "TransferFunds",
                    type: "Transaction",
                    name: "Transfer Funds",
                    componentType: "task",
                    properties: {
                        key: "transfer-{$.body.fromAccount}-{$.body.toAccount}"
                    },
                    branches: {
                        tasks: [
                            { id: "Debit", type: "Document", properties: { method: "Put", subscriptionId: "{$.subscription.id}", schemaId: "Account", documentId: "{$.body.fromAccount}", payload: [{ Id: "<uuid>", Key: "balance", Value: "{$.newBalance}", Type: "Property" }] } },
                            { id: "Credit", type: "Document", properties: { method: "Put", subscriptionId: "{$.subscription.id}", schemaId: "Account", documentId: "{$.body.toAccount}", payload: [{ Id: "<uuid>", Key: "balance", Value: "{$.creditBalance}", Type: "Property" }] } }
                        ],
                        rollback: [
                            { id: "RevertDebit", type: "Document", properties: { method: "Put", subscriptionId: "{$.subscription.id}", schemaId: "Account", documentId: "{$.body.fromAccount}", payload: [{ Id: "<uuid>", Key: "balance", Value: "{$.originalBalance}", Type: "Property" }] } }
                        ]
                    }
                },
                explanation: 'Executes debit and credit within transaction. Reverts debit on failure.'
            }
        ],
        commonMistakes: [
            'Missing rollback tasks - always required',
            'Key not unique - can cause deadlocks',
            'Not handling all failure scenarios in rollback'
        ],
        tips: [
            'Use unique key to prevent concurrent execution',
            'Rollback should undo all changes made by tasks',
            'Key can include dynamic values for uniqueness'
        ]
    }
};

// =============================================================================
// HELPER FUNCTION TO GET COMPLETE CONTEXT
// =============================================================================

/**
 * Get complete generation context for a task type
 * Includes interface, examples, execution flow, and tips
 */
export function getTaskGenerationContext(taskType: string): TaskGenerationContext | null {
    return TASK_GENERATION_CONTEXTS[taskType] || null;
}

/**
 * Get list of all available task types with generation context
 */
export function getAvailableTaskTypes(): string[] {
    return Object.keys(TASK_GENERATION_CONTEXTS);
}

/**
 * Generate a task template with placeholders
 */
export function generateTaskTemplate(taskType: string, taskName: string): Record<string, unknown> | null {
    const context = TASK_GENERATION_CONTEXTS[taskType];
    if (!context) return null;

    const template: Record<string, unknown> = {
        id: taskName,
        type: taskType,
        name: taskName,
        componentType: 'task',
        properties: {}
    };

    // Add required properties with placeholders
    const props = template.properties as Record<string, unknown>;
    context.requiredProperties.forEach(prop => {
        props[prop] = `<REQUIRED: ${prop}>`;
    });

    return template;
}
