/**
 * Task Interfaces Library
 * Comprehensive TypeScript interfaces for all workflow tasks
 * This helps LLM understand the exact structure of each task
 */

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * IKeyValue - Core data structure used across all tasks
 * Used for payload, where, select, headers, etc.
 */
export interface IKeyValue {
    /** REQUIRED: Unique UUID for this key-value entry */
    Id: string;
    /** Property key/name */
    Key: string;
    /** Value - can be literal, property reference, or expression */
    Value: any;
    /** 
     * Value type:
     * - Literal: Static/constant value (e.g., "active", 100)
     * - Property: Path reference (e.g., "{$.body.name}")
     * - Array: Array value
     * - Calculated: JavaScript expression
     * - Rule: Rule-based value
     */
    Type?: 'Literal' | 'Property' | 'Array' | 'Calculated' | 'Rule';
}

/**
 * IRelation - For loading related entities
 */
export interface IRelation {
    /** Relation name/path */
    name: string;
    /** Nested relations */
    relations?: IRelation[];
}

/**
 * Condition - For conditional logic in Condition, Array.Filter, etc.
 */
export interface Condition {
    /** State path to the value being tested (e.g., "{$.body.status}") */
    fact?: string;
    /** Comparison operator */
    operator?: ConditionOperator;
    /** Value to compare against */
    value?: any;
    /** ALL conditions must be true (AND logic) */
    and?: Condition[];
    /** AT LEAST ONE must be true (OR logic) */
    any?: Condition[];
}

/**
 * Available condition operators
 */
export type ConditionOperator =
    | 'equals'           // Loose equality (==)
    | 'exactEquals'      // Strict equality (===)
    | 'notEquals'        // Not equal (!==)
    | 'greaterThan'      // Greater than (>)
    | 'greaterThanEquals' // Greater or equal (>=)
    | 'lessThan'         // Less than (<)
    | 'lessThanEquals'   // Less or equal (<=)
    | 'in'               // Value in array
    | 'notIn'            // Value not in array
    | 'contains'         // String/array contains
    | 'notContains'      // Does not contain
    | 'some'             // Array overlap (alias: any)
    | 'regex'            // Regex match
    | 'isArray'          // Is an array
    | 'notArray'         // Not an array
    | 'isObject'         // Is an object
    | 'notObject'        // Not an object
    | 'isNumber'         // Is a number
    | 'isNaN'            // Is not a number
    | 'notNull'          // Not null/empty
    | 'hasProperty';     // Object has property

/**
 * Response handlers - Every task must have these
 */
export interface ResponseSuccess {
    statusCode: number;
    success: true;
    code: string;
    data?: any;
    message?: string;
}

export interface ResponseError {
    statusCode: number;
    success: false;
    code: string;
    message: string;
}

/**
 * Base task interface - All tasks extend this
 */
export interface BaseTask {
    /** Unique task identifier */
    id: string;
    /** Task type */
    type: TaskType;
    /** Human-readable name */
    name?: string;
    /** Component type (always 'task') */
    componentType?: 'task';
    /** Properties object containing task configuration */
    properties?: Record<string, any>;
    /** Success response handler */
    success?: ResponseSuccess;
    /** Failed response handler (business logic failure) */
    failed?: ResponseError;
    /** Error response handler (system error) */
    error?: ResponseError;
}

export type TaskType =
    // Data Operations
    | 'Document' | 'Query' | 'Entity' | 'HTTP' | 'Repository' | 'ORM' | 'ESQuery' | 'Trino'
    // Flow Control
    | 'Condition' | 'Switch' | 'Loop' | 'Iterator' | 'Promise' | 'Sequence'
    // Transformations
    | 'Array' | 'Object' | 'String' | 'JSON' | 'Resolver' | 'Template'
    // Core
    | 'Request' | 'Response' | 'Variable'
    // Utilities
    | 'Cache' | 'State' | 'Validator' | 'UUID' | 'Identifier' | 'Math' | 'Date' | 'Filter'
    // Security
    | 'Security' | 'Crypto' | 'RSA'
    // Integration
    | 'SMTP' | 'Azure' | 'MinIO' | 'Workflow' | 'Transaction' | 'History' | 'Export';


// =============================================================================
// DATA OPERATIONS TASKS
// =============================================================================

/**
 * Document Task - CRUD operations on database documents
 * Methods: Get, Post, Put, Paging, UpsertAll
 */
export interface TaskDocument extends BaseTask {
    type: 'Document';
    properties: {
        /** CRUD method */
        method: 'Get' | 'Post' | 'Put' | 'Paging' | 'UpsertAll';
        /** Subscription ID for multi-tenant routing */
        subscriptionId: string;
        /** Schema ID for entity definition */
        schemaId: string;
        /** Document ID (required for Get/Put) */
        documentId?: string;
        /** Data payload (for Post/Put) */
        payload?: IKeyValue[];
        /** Relations to load (for Get) */
        relations?: IRelation[];
        /** Whether to include relations */
        addRelation?: boolean;
        /** Filter conditions (for Paging) */
        where?: IKeyValue[];
        /** Fields to select */
        select?: IKeyValue[];
        /** Sort configuration */
        sort?: IKeyValue[];
        /** Page size */
        take?: string;
        /** Offset */
        skip?: string;
        /** Search term */
        search?: string;
        /** Array path (for UpsertAll) */
        path?: string;
    };
}

/**
 * Query Task - Database queries with multiple methods
 * Methods: Builder, Find, FindV2, RawQuery, FindOne, FindPaging, Where, WherePaging, NotExist
 */
export interface TaskQuery extends BaseTask {
    type: 'Query';
    properties: {
        /** Repository/table name */
        repository: string;
        /** Query method */
        method: 'Builder' | 'Find' | 'FindV2' | 'RawQuery' | 'FindOne' | 'FindPaging' | 'Where' | 'WherePaging' | 'NotExist';
        /** WHERE conditions */
        where?: IKeyValue[] | string;
        /** Data payload (for FindPaging) */
        payload?: IKeyValue[];
        /** Fields to select */
        select?: IKeyValue[] | string[];
        /** Sort order */
        sort?: IKeyValue[];
        /** Order for WherePaging */
        order?: IKeyValue[];
        /** Number of records to take */
        take?: string | number;
        /** Number of records to skip */
        skip?: string;
        /** Page number */
        page?: string;
        /** Order by field (for FindPaging) */
        orderby?: string;
        /** Sort direction (true for ascending) */
        asc?: string | boolean;
        /** Raw SQL query (for RawQuery) */
        query?: string;
        /** Select type for Builder */
        selectType?: 'Distinct' | 'GetOne' | 'GetMany' | 'GetManyCount';
        /** Elasticsearch config */
        elasticsearch?: { enable: boolean };
    };
}

/**
 * Entity Task - Entity metadata operations with cloning support
 * Methods: Get, Post, Put, List, Paging, Clone
 */
export interface TaskEntity extends BaseTask {
    type: 'Entity';
    properties: {
        /** Entity method */
        method: 'Get' | 'Post' | 'Put' | 'List' | 'Paging' | 'Clone';
        /** Subscription ID */
        subscriptionId: string;
        /** Container ID */
        containerId: string;
        /** Document ID (for Get/Put) */
        documentId?: string;
        /** Data payload (for Post/Put) */
        payload?: IKeyValue[];
        /** Filter conditions (for List/Paging) */
        where?: IKeyValue[];
        /** Fields to select */
        select?: IKeyValue[];
        /** Page size */
        take?: string;
        /** Offset */
        skip?: string;
        /** Page number */
        page?: string;
        /** Sort field */
        orderby?: string;
        /** Sort direction */
        asc?: string;
        /** Target container for Clone */
        destination?: string;
    };
}

/**
 * HTTP Task - External API calls
 * Methods: Get, Post, Put, Delete
 */
export interface TaskHTTP extends BaseTask {
    type: 'HTTP';
    properties: {
        /** API endpoint URL */
        url: string;
        /** HTTP method */
        method: 'Get' | 'Post' | 'Put' | 'Delete';
        /** Request headers */
        headers?: IKeyValue[];
        /** Request body */
        body?: IKeyValue[] | string;
        /** Query parameters */
        params?: IKeyValue[];
        /** Whether to append path parameters */
        path?: boolean;
        /** Document ID for Put/Delete */
        documentId?: string;
        /** Timeout in milliseconds */
        timeout?: number;
    };
}

/**
 * ORM Task - Object-Relational Mapping operations
 * Methods: Get, Post, Put, List, Paging
 */
export interface TaskORM extends BaseTask {
    type: 'ORM';
    properties: {
        /** ORM method */
        method: 'Get' | 'Post' | 'Put' | 'List' | 'Paging';
        /** Subscription ID */
        subscriptionId: string;
        /** Schema/entity name */
        schema: string;
        /** Document ID (for Get/Put) */
        documentId?: string;
        /** Data payload */
        payload?: IKeyValue[];
        /** Filter conditions (for List) */
        where?: IKeyValue[];
        /** Fields to select */
        select?: IKeyValue[];
        /** Sort order */
        order?: IKeyValue[];
        /** Page size */
        take?: string;
        /** Offset */
        skip?: string;
        /** Page number */
        page?: string;
        /** Sort field */
        orderby?: string;
        /** Sort direction */
        asc?: string;
    };
}

/**
 * ESQuery Task - Elasticsearch queries
 */
export interface TaskESQuery extends BaseTask {
    type: 'ESQuery';
    properties: {
        /** Elasticsearch index */
        index: string;
        /** Elasticsearch query DSL */
        query: Record<string, any>;
        /** Size limit */
        size?: number;
        /** From offset */
        from?: number;
    };
}

/**
 * Trino Task - Distributed SQL queries
 */
export interface TaskTrino extends BaseTask {
    type: 'Trino';
    properties: {
        /** SQL query */
        query: string;
        /** Trino catalog */
        catalog?: string;
        /** Trino schema */
        schema?: string;
    };
}

/**
 * Repository Task - Repository pattern operations
 */
export interface TaskRepository extends BaseTask {
    type: 'Repository';
    properties: {
        /** Repository name */
        repository: string;
        /** Repository method */
        method: string;
        /** Method arguments */
        args?: any[];
    };
}


// =============================================================================
// FLOW CONTROL TASKS
// =============================================================================

/**
 * Condition Task - If/else branching based on conditions
 */
export interface TaskCondition extends BaseTask {
    type: 'Condition';
    properties: {
        /** Condition to evaluate */
        conditions: Condition;
    };
    /** Tasks to execute if condition is TRUE */
    onSuccess: BaseTask[];
    /** Tasks to execute if condition is FALSE */
    onFailure: BaseTask[];
}

/**
 * Switch Task - Multi-branch routing based on value
 */
export interface TaskSwitch extends BaseTask {
    type: 'Switch';
    properties: {
        /** State path to switch value */
        path: string;
    };
    /** Map of values to task arrays */
    case: Record<string, BaseTask[]>;
    /** Tasks if no case matches */
    default: BaseTask[];
}

/**
 * Loop Task - Fixed iteration loop
 */
export interface TaskLoop extends BaseTask {
    type: 'Loop';
    properties: {
        /** Number of iterations */
        count: string | number;
        /** Variable name for current index */
        var?: string;
        /** Break condition */
        breakCondition?: Condition;
    };
    /** Tasks to execute in each iteration */
    sequence: BaseTask[];
}

/**
 * Iterator Task - Array iteration
 */
export interface TaskIterator extends BaseTask {
    type: 'Iterator';
    properties: {
        /** Path to array to iterate */
        path: string;
        /** Variable name for current item */
        var: string;
        /** Variable name for current index */
        index?: string;
        /** Execute iterations asynchronously */
        async?: boolean;
        /** Break condition */
        breakCondition?: Condition;
    };
    /** Tasks to execute for each item */
    sequence: BaseTask[];
}

/**
 * Promise Task - Parallel execution of multiple task groups
 */
export interface TaskPromise extends BaseTask {
    type: 'Promise';
    properties: {
        /** Execution mode: all (wait for all), race (first to complete), allSettled */
        mode?: 'all' | 'race' | 'allSettled';
    };
    /** Array of task arrays to execute in parallel */
    branches: BaseTask[][];
}

/**
 * Sequence Task - Group tasks into named sequence
 */
export interface TaskSequence extends BaseTask {
    type: 'Sequence';
    properties: {
        /** Sequence name for reference */
        name?: string;
    };
    /** Tasks in this sequence */
    sequence: BaseTask[];
}


// =============================================================================
// TRANSFORMATION TASKS
// =============================================================================

/**
 * Array Task - Array manipulation operations
 * Methods: Get, Push, Index, Find, Slice, Splice, Join, Map, Sort, Count, Filter, Merge, IsArray, ToArray, Distinct
 */
export interface TaskArray extends BaseTask {
    type: 'Array';
    properties: {
        /** Array method */
        method: 'Get' | 'Push' | 'Index' | 'Find' | 'Slice' | 'Splice' | 'Join' | 'Map' | 'Sort' | 'Count' | 'Filter' | 'Merge' | 'IsArray' | 'ToArray' | 'Distinct';
        /** State path to array */
        path?: string;
        /** Value for Push */
        value?: any;
        /** Index for specific operations */
        index?: number;
        /** Start index for Slice/Splice */
        fromIndex?: number;
        /** Variable name for current item in iteration */
        var?: string;
        /** Conditions for Find/Filter */
        conditions?: Condition;
        /** Output mapping for Map */
        payload?: IKeyValue[];
        /** Key for Sort */
        key?: string;
        /** Sort direction (true = ascending) */
        asc?: boolean;
        /** Separator for Join */
        separator?: string;
        /** Array paths for Merge */
        paths?: string[];
        /** Property for ToArray */
        property?: string;
        /** Distinct flag for ToArray */
        distinct?: boolean;
    };
}

/**
 * Object Task - Object manipulation
 * Methods: Merge, Pick, Omit, Keys, Values, Entries
 */
export interface TaskObject extends BaseTask {
    type: 'Object';
    properties: {
        /** Object method */
        method: 'Merge' | 'Pick' | 'Omit' | 'Keys' | 'Values' | 'Entries';
        /** State path to object */
        path?: string;
        /** Object paths for Merge */
        paths?: string[];
        /** Keys for Pick/Omit */
        keys?: string[];
        /** Output payload */
        payload?: IKeyValue[];
    };
}

/**
 * String Task - String manipulation
 * Methods: Concat, Split, Replace, Trim, Upper, Lower, Substring, Template
 */
export interface TaskString extends BaseTask {
    type: 'String';
    properties: {
        /** String method */
        method: 'Concat' | 'Split' | 'Replace' | 'Trim' | 'Upper' | 'Lower' | 'Substring' | 'Template';
        /** Input string path */
        path?: string;
        /** String value */
        value?: string;
        /** Separator for Split */
        separator?: string;
        /** Search pattern for Replace */
        search?: string;
        /** Replacement for Replace */
        replace?: string;
        /** Start index for Substring */
        start?: number;
        /** End index for Substring */
        end?: number;
        /** Template string with placeholders */
        template?: string;
    };
}

/**
 * JSON Task - JSON parsing and serialization
 * Methods: Parse, Stringify
 */
export interface TaskJSON extends BaseTask {
    type: 'JSON';
    properties: {
        /** JSON method */
        method: 'Parse' | 'Stringify';
        /** Path to value */
        path?: string;
        /** Raw value */
        value?: string;
    };
}

/**
 * Resolver Task - Data resolution and transformation
 * Methods: Object, String
 * 
 * The most commonly used task for transforming data between tasks.
 */
export interface TaskResolver extends BaseTask {
    type: 'Resolver';
    properties: {
        /** Resolver method: Object (default), String */
        method?: 'Object' | 'String';
        /** Path to source array (for isArray=true) */
        path?: string;
        /** Whether to iterate over array at path */
        isArray?: boolean;
        /** String template (for String method) */
        string?: string;
        /** Output payload mapping */
        payload: IKeyValue[];
    };
}

/**
 * Template Task - Template rendering
 */
export interface TaskTemplate extends BaseTask {
    type: 'Template';
    properties: {
        /** Template string */
        template: string;
        /** Template engine: handlebars, mustache, ejs */
        engine?: 'handlebars' | 'mustache' | 'ejs';
        /** Data for template */
        data?: IKeyValue[];
    };
}


// =============================================================================
// CORE WORKFLOW TASKS
// =============================================================================

/**
 * Request Task - Internal request forwarding, action execution, scheduling, and message production
 * 
 * IMPORTANT: This task is used to:
 * - Call other actions/workflows within the same or different schemas
 * - Forward requests to other services
 * - Schedule delayed or cron-based executions
 * - Produce messages to Kafka topics
 * - Cross-subscription proxying
 * 
 * Methods: Action, Forward, Proxy, ForwardProxy, Schedule, GetById, Post, Put, Service, Produce
 */
export interface TaskRequest extends BaseTask {
    type: 'Request';
    properties: {
        /** 
         * Request method:
         * - Action: Execute another schema's action (most common for calling other workflows)
         * - Forward: Forward request to another schema action
         * - Proxy: Proxy request to schema with subscription context
         * - ForwardProxy: Forward with proxy to different subscription
         * - Schedule: Schedule for later execution (cron or delayed)
         * - GetById: Get document by ID from another schema
         * - Post: Create document via another schema
         * - Put: Update document via another schema
         * - Service: Send to service topic
         * - Produce: Produce message to Kafka topic
         */
        method: 'Action' | 'Forward' | 'Proxy' | 'ForwardProxy' | 'Schedule' | 'GetById' | 'Post' | 'Put' | 'Service' | 'Produce';

        /** 
         * Schema name - The target schema/entity that contains the action to execute
         * Example: "User", "Order", "AuditLog", "Notification"
         * Use this to reference other workflows/actions in the system
         */
        schema?: string;

        /** 
         * Action name - The specific action/workflow to execute within the schema
         * Example: "create", "update", "delete", "process", "notify"
         * These are the workflow names defined in the target schema
         */
        action?: string;

        /** Document ID (for GetById, Put methods) */
        documentId?: string;

        /** 
         * Subscription ID for cross-tenant operations (Proxy, ForwardProxy)
         * Used when forwarding requests to different subscriptions/tenants
         */
        subscription?: string;

        /** Whether to execute asynchronously (don't wait for response) */
        async?: boolean;

        /** Whether payload is an array to iterate over */
        isArray?: boolean;

        /** Path to data (for isArray iteration) */
        path?: string;

        /** Query string or path */
        query?: string;

        /** 
         * Request payload - data to send to the target action
         * Can be IKeyValue[] for structured data or string for raw data
         */
        payload?: IKeyValue[] | string;

        /** Override error handling */
        overrideError?: boolean;

        /** Kafka/message topic (for Service, Produce methods) */
        topic?: string;

        /** Message key for Kafka partitioning */
        key?: string;

        /** Headers for the request */
        headers?: string;

        /** 
         * Scheduler type for Schedule method:
         * - cron: Run on cron pattern
         * - delayed: Run at specific datetime
         */
        scheduler?: 'cron' | 'delayed';

        /** Job ID for scheduled tasks (for tracking/cancellation) */
        jobId?: string;

        /** Cron pattern (for scheduler: 'cron'), e.g., "0 8 * * *" for daily at 8am */
        pattern?: string;

        /** DateTime for delayed execution (for scheduler: 'delayed') */
        dateTime?: string;
    };
}

/**
 * Response Task - Define workflow response
 * 
 * Every workflow should end with a Response task.
 */
export interface TaskResponse extends BaseTask {
    type: 'Response';
    properties: {
        /** HTTP status code */
        statusCode?: number;
        /** Response payload */
        payload?: IKeyValue[];
        /** Response message */
        message?: string;
        /** Success flag */
        success?: boolean;
        /** Response code */
        code?: string;
    };
}

/**
 * Variable Task - Set workflow variables
 */
export interface TaskVariable extends BaseTask {
    type: 'Variable';
    properties: {
        /** Variable assignments */
        payload: IKeyValue[];
    };
}


// =============================================================================
// UTILITY TASKS
// =============================================================================

/**
 * Cache Task - Caching operations
 * Methods: Get, Set, Clear, Emit (for real-time)
 */
export interface TaskCache extends BaseTask {
    type: 'Cache';
    properties: {
        /** Cache method */
        method: 'Get' | 'Set' | 'Clear' | 'Emit';
        /** Cache key */
        key: string;
        /** Value to cache (for Set) */
        value?: any;
        /** TTL in seconds */
        ttl?: number;
        /** Event name (for Emit) */
        event?: string;
        /** Payload for Emit */
        payload?: IKeyValue[];
    };
}

/**
 * State Task - Workflow state management
 */
export interface TaskState extends BaseTask {
    type: 'State';
    properties: {
        /** State action: get, set, update, delete */
        action: 'get' | 'set' | 'update' | 'delete';
        /** State key */
        key: string;
        /** State value */
        value?: any;
    };
}

/**
 * Validator Task - Data validation
 * Methods: JSONSchema, UUID, Email, Required
 */
export interface TaskValidator extends BaseTask {
    type: 'Validator';
    properties: {
        /** Validation method */
        method: 'JSONSchema' | 'UUID' | 'Email' | 'Required' | 'Custom';
        /** JSON Schema for validation */
        schema?: Record<string, any>;
        /** Path to value to validate */
        path?: string;
        /** Required fields */
        required?: string[];
        /** Custom validation expression */
        expression?: string;
    };
}

/**
 * UUID Task - Generate UUIDs
 */
export interface TaskUUID extends BaseTask {
    type: 'UUID';
    properties: {
        /** UUID version: v1, v4 */
        version?: 'v1' | 'v4';
        /** Output variable name */
        output?: string;
    };
}

/**
 * Identifier Task - Generate custom identifiers
 */
export interface TaskIdentifier extends BaseTask {
    type: 'Identifier';
    properties: {
        /** Identifier pattern/prefix */
        prefix?: string;
        /** Length */
        length?: number;
        /** Character set: alphanumeric, numeric, alpha */
        charset?: 'alphanumeric' | 'numeric' | 'alpha';
    };
}

/**
 * Math Task - Mathematical operations
 * Methods: Add, Subtract, Multiply, Divide, Modulo, Round, Floor, Ceil, Min, Max, Abs
 */
export interface TaskMath extends BaseTask {
    type: 'Math';
    properties: {
        /** Math method */
        method: 'Add' | 'Subtract' | 'Multiply' | 'Divide' | 'Modulo' | 'Round' | 'Floor' | 'Ceil' | 'Min' | 'Max' | 'Abs';
        /** First operand */
        a?: string | number;
        /** Second operand */
        b?: string | number;
        /** Decimal places for Round */
        decimals?: number;
        /** Array path for Min/Max */
        path?: string;
    };
}

/**
 * Date Task - Date/time operations
 * Methods: Now, Format, Parse, Add, Subtract, Diff, StartOf, EndOf
 */
export interface TaskDate extends BaseTask {
    type: 'Date';
    properties: {
        /** Date method */
        method: 'Now' | 'Format' | 'Parse' | 'Add' | 'Subtract' | 'Diff' | 'StartOf' | 'EndOf';
        /** Date value/path */
        value?: string;
        /** Date format */
        format?: string;
        /** Amount to add/subtract */
        amount?: number;
        /** Unit: years, months, days, hours, minutes, seconds */
        unit?: 'years' | 'months' | 'days' | 'hours' | 'minutes' | 'seconds';
        /** Second date for Diff */
        date2?: string;
    };
}

/**
 * Filter Task - Data filtering with conditions
 */
export interface TaskFilter extends BaseTask {
    type: 'Filter';
    properties: {
        /** Path to data */
        path: string;
        /** Filter conditions */
        conditions: Condition;
        /** Variable name for iteration */
        var?: string;
    };
}


// =============================================================================
// SECURITY TASKS
// =============================================================================

/**
 * Security Task - Authentication/authorization
 */
export interface TaskSecurity extends BaseTask {
    type: 'Security';
    properties: {
        /** Security action: authenticate, authorize, validate */
        action: 'authenticate' | 'authorize' | 'validate';
        /** Token path */
        token?: string;
        /** Required roles */
        roles?: string[];
        /** Required permissions */
        permissions?: string[];
    };
}

/**
 * Crypto Task - Cryptographic operations
 * Methods: Hash, Encrypt, Decrypt, Sign, Verify
 */
export interface TaskCrypto extends BaseTask {
    type: 'Crypto';
    properties: {
        /** Crypto method */
        method: 'Hash' | 'Encrypt' | 'Decrypt' | 'Sign' | 'Verify';
        /** Algorithm: sha256, sha512, aes-256, etc. */
        algorithm?: string;
        /** Input value path */
        value?: string;
        /** Encryption key */
        key?: string;
        /** Initialization vector */
        iv?: string;
    };
}

/**
 * RSA Task - RSA encryption/decryption
 */
export interface TaskRSA extends BaseTask {
    type: 'RSA';
    properties: {
        /** RSA method */
        method: 'Encrypt' | 'Decrypt' | 'Sign' | 'Verify';
        /** Input value */
        value?: string;
        /** Public key path */
        publicKey?: string;
        /** Private key path */
        privateKey?: string;
    };
}


// =============================================================================
// INTEGRATION TASKS
// =============================================================================

/**
 * SMTP Task - Email sending
 */
export interface TaskSMTP extends BaseTask {
    type: 'SMTP';
    properties: {
        /** Recipient email(s) */
        to: string | string[];
        /** CC recipients */
        cc?: string | string[];
        /** BCC recipients */
        bcc?: string | string[];
        /** Email subject */
        subject: string;
        /** Email body (HTML or text) */
        body: string;
        /** Whether body is HTML */
        html?: boolean;
        /** Attachments */
        attachments?: Array<{
            filename: string;
            content: string;
            contentType?: string;
        }>;
        /** From address */
        from?: string;
    };
}

/**
 * Azure Task - Azure service integrations
 */
export interface TaskAzure extends BaseTask {
    type: 'Azure';
    properties: {
        /** Azure service: blob, queue, servicebus, etc. */
        service: 'blob' | 'queue' | 'servicebus' | 'cosmos' | 'keyvault';
        /** Operation method */
        method: string;
        /** Connection string or key vault reference */
        connectionString?: string;
        /** Container/queue name */
        container?: string;
        /** Blob/message name */
        name?: string;
        /** Data payload */
        data?: any;
    };
}

/**
 * MinIO Task - Object storage operations
 */
export interface TaskMinIO extends BaseTask {
    type: 'MinIO';
    properties: {
        /** MinIO method */
        method: 'Get' | 'Put' | 'Delete' | 'List';
        /** Bucket name */
        bucket: string;
        /** Object key */
        key?: string;
        /** Object data (for Put) */
        data?: any;
        /** Content type */
        contentType?: string;
    };
}

/**
 * Workflow Task - Execute sub-workflows or dynamic task arrays
 * 
 * Use this to:
 * - Execute predefined workflow templates
 * - Run dynamic task arrays at runtime
 * - Compose complex workflows from smaller reusable workflows
 * 
 * Methods: Template, Custom
 */
export interface TaskWorkflow extends BaseTask {
    type: 'Workflow';
    properties: {
        /** 
         * Workflow method:
         * - Template: Execute a predefined workflow template by name
         * - Custom: Execute a dynamic array of tasks from state
         */
        method: 'Template' | 'Custom';

        /** 
         * Template name/path (for Template method)
         * Example: "payment/process", "notification/send", "audit/log"
         */
        template?: string;

        /** 
         * Path to tasks array (for Custom method)
         * Example: "{$.dynamicTasks}", "{$.body.tasks}"
         */
        tasks?: string;

        /** 
         * Path to state object to pass to the workflow
         * Example: "{$.paymentState}", "{$.currentState}"
         */
        state?: string;

        /** Input data for the workflow */
        input?: IKeyValue[];

        /** Whether to execute asynchronously */
        async?: boolean;
    };
}

/**
 * Transaction Task - Database transaction management
 */
export interface TaskTransaction extends BaseTask {
    type: 'Transaction';
    properties: {
        /** Transaction action: begin, commit, rollback */
        action: 'begin' | 'commit' | 'rollback';
        /** Transaction ID (for commit/rollback) */
        transactionId?: string;
    };
    /** Tasks within transaction scope */
    sequence?: BaseTask[];
}

/**
 * History Task - Audit trail/history tracking
 */
export interface TaskHistory extends BaseTask {
    type: 'History';
    properties: {
        /** History method */
        method: 'Log' | 'Get' | 'List';
        /** Entity type */
        entityType?: string;
        /** Entity ID */
        entityId?: string;
        /** Action performed */
        action?: string;
        /** Changes data */
        changes?: Record<string, any>;
        /** User performing action */
        userId?: string;
    };
}

/**
 * Export Task - Data export operations
 * Methods: CSV, Excel, PDF
 */
export interface TaskExport extends BaseTask {
    type: 'Export';
    properties: {
        /** Export format */
        format: 'CSV' | 'Excel' | 'PDF';
        /** Data to export */
        data: string;
        /** Column configuration */
        columns?: Array<{
            key: string;
            header: string;
            width?: number;
        }>;
        /** File name */
        filename?: string;
        /** Template (for PDF) */
        template?: string;
    };
}


// =============================================================================
// TASK FACTORY HELPERS
// =============================================================================

/**
 * Create a Document task configuration
 */
export const createDocumentTask = (
    id: string,
    method: TaskDocument['properties']['method'],
    config: Partial<TaskDocument['properties']>
): TaskDocument => ({
    id,
    type: 'Document',
    name: id,
    componentType: 'task',
    properties: {
        method,
        subscriptionId: '{$.subscription.id}',
        schemaId: '{$.params.schema}',
        ...config
    },
    success: { statusCode: 200, success: true, code: 'OK' },
    failed: { statusCode: 400, success: false, code: 'FAILED', message: 'Operation failed' },
    error: { statusCode: 500, success: false, code: 'ERROR', message: 'Internal error' }
});

/**
 * Create a Query task configuration
 */
export const createQueryTask = (
    id: string,
    repository: string,
    method: TaskQuery['properties']['method'],
    config: Partial<TaskQuery['properties']> = {}
): TaskQuery => ({
    id,
    type: 'Query',
    name: id,
    componentType: 'task',
    properties: {
        repository,
        method,
        ...config
    },
    success: { statusCode: 200, success: true, code: 'OK' },
    failed: { statusCode: 400, success: false, code: 'FAILED', message: 'Query failed' },
    error: { statusCode: 500, success: false, code: 'ERROR', message: 'Internal error' }
});

/**
 * Create a Resolver task configuration
 */
export const createResolverTask = (
    id: string,
    payload: IKeyValue[],
    config: Partial<TaskResolver['properties']> = {}
): TaskResolver => ({
    id,
    type: 'Resolver',
    name: id,
    componentType: 'task',
    properties: {
        method: 'Object',
        payload,
        ...config
    },
    success: { statusCode: 200, success: true, code: 'OK' },
    failed: { statusCode: 400, success: false, code: 'FAILED', message: 'Resolution failed' },
    error: { statusCode: 500, success: false, code: 'ERROR', message: 'Internal error' }
});

/**
 * Create a Response task configuration
 */
export const createResponseTask = (
    id: string,
    statusCode: number,
    payload: IKeyValue[]
): TaskResponse => ({
    id,
    type: 'Response',
    name: id,
    componentType: 'task',
    properties: {
        statusCode,
        success: statusCode < 400,
        payload
    }
});

/**
 * Create an HTTP task configuration
 */
export const createHTTPTask = (
    id: string,
    method: TaskHTTP['properties']['method'],
    url: string,
    config: Partial<TaskHTTP['properties']> = {}
): TaskHTTP => ({
    id,
    type: 'HTTP',
    name: id,
    componentType: 'task',
    properties: {
        method,
        url,
        ...config
    },
    success: { statusCode: 200, success: true, code: 'OK' },
    failed: { statusCode: 400, success: false, code: 'FAILED', message: 'HTTP request failed' },
    error: { statusCode: 500, success: false, code: 'ERROR', message: 'Internal error' }
});

/**
 * Create a Condition task configuration
 */
export const createConditionTask = (
    id: string,
    conditions: Condition,
    onSuccess: BaseTask[],
    onFailure: BaseTask[]
): TaskCondition => ({
    id,
    type: 'Condition',
    name: id,
    componentType: 'task',
    properties: {
        conditions
    },
    onSuccess,
    onFailure,
    success: { statusCode: 200, success: true, code: 'OK' },
    failed: { statusCode: 400, success: false, code: 'FAILED', message: 'Condition evaluation failed' },
    error: { statusCode: 500, success: false, code: 'ERROR', message: 'Internal error' }
});

/**
 * Create a Cache task configuration
 */
export const createCacheTask = (
    id: string,
    method: TaskCache['properties']['method'],
    key: string,
    config: Partial<TaskCache['properties']> = {}
): TaskCache => ({
    id,
    type: 'Cache',
    name: id,
    componentType: 'task',
    properties: {
        method,
        key,
        ...config
    },
    success: { statusCode: 200, success: true, code: 'OK' },
    failed: { statusCode: 400, success: false, code: 'FAILED', message: 'Cache operation failed' },
    error: { statusCode: 500, success: false, code: 'ERROR', message: 'Internal error' }
});

/**
 * Create an Array task configuration
 */
export const createArrayTask = (
    id: string,
    method: TaskArray['properties']['method'],
    config: Partial<TaskArray['properties']> = {}
): TaskArray => ({
    id,
    type: 'Array',
    name: id,
    componentType: 'task',
    properties: {
        method,
        ...config
    },
    success: { statusCode: 200, success: true, code: 'OK' },
    failed: { statusCode: 400, success: false, code: 'FAILED', message: 'Array operation failed' },
    error: { statusCode: 500, success: false, code: 'ERROR', message: 'Internal error' }
});


// =============================================================================
// TASK DOCUMENTATION FOR LLM
// =============================================================================

/**
 * Complete task documentation for LLM understanding
 */
export const TASK_INTERFACE_DOCS = {
    Document: {
        description: 'CRUD operations on database documents with schema-based routing',
        methods: ['Get', 'Post', 'Put', 'Paging', 'UpsertAll'],
        requiredProps: ['method', 'subscriptionId', 'schemaId'],
        methodRequirements: {
            Get: ['documentId'],
            Post: ['payload'],
            Put: ['documentId', 'payload'],
            Paging: ['where', 'take', 'skip'],
            UpsertAll: ['path', 'payload']
        }
    },
    Query: {
        description: 'Database queries with multiple methods for different use cases',
        methods: ['Builder', 'Find', 'FindV2', 'RawQuery', 'FindOne', 'FindPaging', 'Where', 'WherePaging', 'NotExist'],
        requiredProps: ['repository', 'method'],
        methodRequirements: {
            FindOne: ['where'],
            Find: ['where'],
            FindPaging: ['take', 'skip', 'page'],
            RawQuery: ['query'],
            Where: ['where']
        }
    },
    Entity: {
        description: 'Entity metadata operations with cloning support',
        methods: ['Get', 'Post', 'Put', 'List', 'Paging', 'Clone'],
        requiredProps: ['method', 'subscriptionId', 'containerId'],
        methodRequirements: {
            Get: ['documentId'],
            Post: ['payload'],
            Put: ['documentId', 'payload'],
            Clone: ['destination']
        }
    },
    HTTP: {
        description: 'External HTTP API calls',
        methods: ['Get', 'Post', 'Put', 'Delete'],
        requiredProps: ['url', 'method']
    },
    Resolver: {
        description: 'Data transformation and resolution - most commonly used task',
        methods: ['Object', 'String'],
        requiredProps: ['payload'],
        tips: [
            'Use Resolver to transform data between tasks',
            'payload is an array of IKeyValue',
            'Access previous task data with {$.taskName.data}'
        ]
    },
    Response: {
        description: 'Define workflow response - every workflow should end with this',
        requiredProps: ['statusCode', 'payload'],
        tips: [
            'Use at the end of every workflow',
            'payload maps the final output'
        ]
    },
    Condition: {
        description: 'If/else branching based on conditions',
        requiredProps: ['conditions'],
        hasChildren: true,
        children: ['onSuccess', 'onFailure']
    },
    Switch: {
        description: 'Multi-branch routing based on value match',
        requiredProps: ['path'],
        hasChildren: true,
        children: ['case', 'default']
    },
    Array: {
        description: 'Array manipulation operations',
        methods: ['Get', 'Push', 'Index', 'Find', 'Slice', 'Splice', 'Join', 'Map', 'Sort', 'Count', 'Filter', 'Merge', 'IsArray', 'ToArray', 'Distinct'],
        requiredProps: ['method'],
        methodRequirements: {
            Map: ['path', 'var', 'payload'],
            Filter: ['path', 'var', 'conditions'],
            Find: ['path', 'var', 'conditions'],
            Sort: ['path', 'key']
        }
    },
    Cache: {
        description: 'Caching operations with TTL support',
        methods: ['Get', 'Set', 'Clear', 'Emit'],
        requiredProps: ['method', 'key'],
        methodRequirements: {
            Set: ['value'],
            Emit: ['event']
        }
    },
    Iterator: {
        description: 'Iterate over array items',
        requiredProps: ['path', 'var'],
        hasChildren: true,
        children: ['sequence']
    },
    Loop: {
        description: 'Fixed iteration loop',
        requiredProps: ['count'],
        hasChildren: true,
        children: ['sequence']
    },
    Request: {
        description: 'Call other schemas, workflows, and actions within the system - MOST POWERFUL for workflow orchestration',
        methods: ['Action', 'Forward', 'Proxy', 'ForwardProxy', 'Schedule', 'GetById', 'Post', 'Put', 'Service', 'Produce'],
        requiredProps: ['method'],
        methodRequirements: {
            Action: ['schema', 'action'],          // Call another schema's action
            Forward: ['schema', 'action'],         // Forward request to another action
            Proxy: ['url', 'method'],              // Proxy to external URL
            ForwardProxy: ['subscription', 'schema', 'action'], // Cross-subscription call
            Schedule: ['schema', 'action', 'cron | delayed'],   // Schedule future execution
            GetById: ['schema', 'action', 'id'],   // Get specific record by ID
            Post: ['schema', 'action', 'body'],    // POST to another action
            Put: ['schema', 'action', 'body', 'id'], // PUT to another action
            Service: ['schema', 'action'],         // Service-to-service call
            Produce: ['schema', 'action']          // Message queue produce
        },
        tips: [
            'Use Action method to invoke any workflow/action from another schema',
            'schema = name of the target schema (e.g., "User", "Order", "Invoice")',
            'action = name of the workflow/action to execute (e.g., "Create", "GetById", "Process")',
            'Forward passes current request context to target action',
            'ForwardProxy allows cross-subscription (multi-tenant) calls',
            'Schedule enables cron-based or delayed execution',
            'Use to chain workflows, orchestrate microservices, implement saga patterns'
        ],
        examples: {
            callAnotherAction: {
                method: 'Action',
                schema: 'Order',
                action: 'Create',
                body: '{$.resolver1.data}'
            },
            scheduleWithCron: {
                method: 'Schedule',
                schema: 'Report',
                action: 'Generate',
                cron: '0 0 * * *'  // Daily at midnight
            },
            scheduleWithDelay: {
                method: 'Schedule',
                schema: 'Notification',
                action: 'SendReminder',
                delayed: 3600000  // 1 hour in ms
            },
            crossSubscriptionCall: {
                method: 'ForwardProxy',
                subscription: 'tenant-123',
                schema: 'Billing',
                action: 'ProcessPayment'
            }
        }
    },
    Workflow: {
        description: 'Dynamically invoke workflow templates or custom task sequences',
        methods: ['Template', 'Custom'],
        requiredProps: ['method'],
        methodRequirements: {
            Template: ['template'],    // Use predefined workflow template
            Custom: ['tasks']          // Dynamic array of tasks
        },
        tips: [
            'Template method runs a predefined reusable workflow',
            'Custom method allows dynamic task generation at runtime',
            'Use state property to pass data to the sub-workflow',
            'Can be used for dynamic workflow composition'
        ],
        examples: {
            useTemplate: {
                method: 'Template',
                template: 'NotificationWorkflow',
                state: { userId: '{$.request.userId}' }
            },
            customTasks: {
                method: 'Custom',
                tasks: [
                    { id: 'step1', type: 'Resolver', properties: { payload: [] } },
                    { id: 'step2', type: 'Response', properties: { statusCode: 200 } }
                ]
            }
        }
    }
} as const;
