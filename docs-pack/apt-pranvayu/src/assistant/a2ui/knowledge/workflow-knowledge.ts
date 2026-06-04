/**
 * Workflow Knowledge Base
 * Contains documentation and examples for the AI assistant
 * Based on official apt-yuj/docs/workflow documentation
 */

import { TaskDocumentation, TaskType } from '../types';

/**
 * IKeyValue interface used across tasks
 * { Key: string, Value: any, Type?: 'Literal' | 'Property' | 'Array' | 'Calculated' | 'Rule' }
 * 
 * ValueTypes:
 * - Literal: Static/constant value
 * - Property: Path expression {$.path.to.value}
 * - Calculated: JavaScript-like expressions
 * - Array: Array value type
 * - Rule: Rule-based value
 */

export const TASK_DOCUMENTATION: Record<TaskType, TaskDocumentation> = {
    // =========================================================================
    // DATA OPERATIONS TASKS (from 02-data-operations.md)
    // =========================================================================

    Document: {
        type: 'Document',
        description: 'CRUD operations on database documents with schema-based routing. Methods: Get, Post, Put, Paging, UpsertAll.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'CRUD method: Get, Post, Put, Paging, UpsertAll' },
            { name: 'subscriptionId', type: 'string', required: true, description: 'Subscription ID for multi-tenant routing' },
            { name: 'schemaId', type: 'string', required: true, description: 'Schema ID for entity definition' },
            { name: 'documentId', type: 'string', required: false, description: 'Document ID for Get/Put operations' },
            { name: 'payload', type: 'IKeyValue[]', required: false, description: 'Data payload for Post/Put' },
            { name: 'relations', type: 'IRelation[]', required: false, description: 'Relations to load for Get' },
            { name: 'addRelation', type: 'boolean', required: false, description: 'Whether to include relations' },
            { name: 'where', type: 'IKeyValue[]', required: false, description: 'Filter conditions for Paging' },
            { name: 'select', type: 'IKeyValue[]', required: false, description: 'Fields to select' },
            { name: 'sort', type: 'IKeyValue[]', required: false, description: 'Sort configuration' },
            { name: 'take', type: 'string', required: false, description: 'Page size for Paging' },
            { name: 'skip', type: 'string', required: false, description: 'Offset for Paging' },
            { name: 'search', type: 'string', required: false, description: 'Search term' },
            { name: 'path', type: 'string', required: false, description: 'Array path for UpsertAll' }
        ],
        examples: [
            '{ "type": "Document", "method": "Get", "subscriptionId": "{$.subscription.id}", "schemaId": "{$.body.schemaId}", "documentId": "{$.params.documentId}", "relations": [], "addRelation": true }',
            '{ "type": "Document", "method": "Post", "subscriptionId": "{$.subscription.id}", "schemaId": "{$.body.schemaId}", "payload": [{"Key": "email", "Value": "{$.body.email}", "Type": "Property"}, {"Key": "name", "Value": "{$.body.name}", "Type": "Property"}] }',
            '{ "type": "Document", "method": "Paging", "subscriptionId": "{$.subscription.id}", "schemaId": "{$.body.schemaId}", "where": [{"Key": "status", "Value": "active", "Type": "Literal"}], "take": "{$.query.limit}", "skip": "{$.query.offset}" }'
        ]
    },

    Query: {
        type: 'Query',
        description: 'Execute database queries. Methods: Builder, Find, FindV2, RawQuery, FindOne, FindPaging, Where, WherePaging, NotExist.',
        properties: [
            { name: 'repository', type: 'string', required: true, description: 'Repository/table name' },
            { name: 'method', type: 'string', required: true, description: 'Query method: Builder, Find, FindV2, RawQuery, FindOne, FindPaging, Where, WherePaging, NotExist' },
            { name: 'where', type: 'IKeyValueSearch|IKeyValue[]', required: false, description: 'WHERE conditions' },
            { name: 'payload', type: 'IKeyValue[]', required: false, description: 'Data payload for FindPaging' },
            { name: 'select', type: 'IKeyValue[]|string[]', required: false, description: 'Fields to select' },
            { name: 'sort', type: 'IKeyValue[]', required: false, description: 'Sort order for FindOne' },
            { name: 'order', type: 'IKeyValue[]', required: false, description: 'Order for WherePaging' },
            { name: 'take', type: 'string|number', required: false, description: 'Number of records to take' },
            { name: 'skip', type: 'string', required: false, description: 'Number of records to skip' },
            { name: 'page', type: 'string', required: false, description: 'Page number' },
            { name: 'orderby', type: 'string', required: false, description: 'Order by field for FindPaging' },
            { name: 'asc', type: 'string', required: false, description: 'Sort direction (true for ascending)' },
            { name: 'query', type: 'string', required: false, description: 'Raw SQL query (for RawQuery method)' },
            { name: 'selectType', type: 'string', required: false, description: 'Select type for Builder: Distinct, GetOne, GetMany, GetManyCount' },
            { name: 'elasticsearch', type: 'object', required: false, description: 'Elasticsearch config with enable flag (for Find)' }
        ],
        examples: [
            '{ "type": "Query", "method": "FindOne", "repository": "User", "where": [{"Key": "id", "Value": "{$.params.documentId}", "Type": "Property"}], "select": [{"Key": "id"}, {"Key": "name"}] }',
            '{ "type": "Query", "method": "Find", "repository": "Order", "where": [{"Key": "status", "Value": "active"}], "take": 10 }',
            '{ "type": "Query", "method": "FindPaging", "repository": "Product", "take": "10", "skip": "0", "page": "1", "orderby": "createdAt", "asc": "false" }',
            '{ "type": "Query", "method": "RawQuery", "repository": "User", "query": "SELECT * FROM users WHERE status = $1" }',
            '{ "type": "Query", "method": "Where", "repository": "Product", "where": "price > 100", "select": [{"Key": "id"}, {"Key": "name"}] }'
        ]
    },

    Entity: {
        type: 'Entity',
        description: 'Entity metadata and configuration operations with support for cloning. Methods: Get, Post, Put, List, Paging, Clone.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Entity method: Get, Post, Put, List, Paging, Clone' },
            { name: 'subscriptionId', type: 'string', required: true, description: 'Subscription ID' },
            { name: 'containerId', type: 'string', required: true, description: 'Container ID' },
            { name: 'documentId', type: 'string', required: false, description: 'Document ID for Get/Put' },
            { name: 'payload', type: 'IKeyValue[]', required: false, description: 'Data payload for Post/Put' },
            { name: 'where', type: 'IKeyValue[]', required: false, description: 'Filter conditions for List/Paging' },
            { name: 'select', type: 'IKeyValue[]', required: false, description: 'Fields to select' },
            { name: 'take', type: 'string', required: false, description: 'Page size' },
            { name: 'skip', type: 'string', required: false, description: 'Offset' },
            { name: 'orderby', type: 'string', required: false, description: 'Sort field' },
            { name: 'asc', type: 'string', required: false, description: 'Sort direction' },
            { name: 'destination', type: 'string', required: false, description: 'Target container for Clone' }
        ],
        examples: [
            '{ "type": "Entity", "method": "Get", "subscriptionId": "{$.subscription.id}", "containerId": "{$.params.containerId}", "documentId": "{$.params.entityId}" }',
            '{ "type": "Entity", "method": "Paging", "subscriptionId": "{$.subscription.id}", "containerId": "{$.params.containerId}", "where": [{"Key": "status", "Value": "active", "Type": "Literal"}], "take": "{$.query.limit}", "skip": "{$.query.offset}", "orderby": "createdAt", "asc": "false" }',
            '{ "type": "Entity", "method": "Clone", "subscriptionId": "{$.subscription.id}", "containerId": "{$.params.containerId}", "destination": "{$.body.targetContainerId}" }'
        ]
    },

    HTTP: {
        type: 'HTTP',
        description: 'Make HTTP API calls to external services. Supports GET, POST, PUT, DELETE methods.',
        properties: [
            { name: 'url', type: 'string', required: true, description: 'API endpoint URL' },
            { name: 'method', type: 'string', required: true, description: 'HTTP method: Get, Post, Put, Delete' },
            { name: 'headers', type: 'IKeyValue[]', required: false, description: 'Request headers as Key-Value pairs' },
            { name: 'body', type: 'IKeyValue[]|string', required: false, description: 'Request body' },
            { name: 'params', type: 'IKeyValue[]', required: false, description: 'Query parameters' },
            { name: 'path', type: 'boolean', required: false, description: 'Whether to append path parameters' },
            { name: 'documentId', type: 'string', required: false, description: 'Document ID for Put/Delete' }
        ],
        examples: [
            '{ "type": "HTTP", "method": "Get", "url": "https://api.example.com/users", "headers": [{"Key": "Authorization", "Value": "Bearer {$.token}"}] }',
            '{ "type": "HTTP", "method": "Post", "url": "https://api.example.com/orders", "body": [{"Key": "data", "Value": "{$.body}"}] }'
        ]
    },

    Repository: {
        type: 'Repository',
        description: 'Repository pattern operations for data access.',
        properties: [
            { name: 'repository', type: 'string', required: true, description: 'Repository name' },
            { name: 'method', type: 'string', required: true, description: 'Repository method' }
        ],
        examples: [
            '{ "type": "Repository", "repository": "UserRepository", "method": "findById" }'
        ]
    },

    ORM: {
        type: 'ORM',
        description: 'ORM-based database operations. Methods: Get, Post, Put, List, Paging.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'ORM method: Get, Post, Put, List, Paging' },
            { name: 'subscriptionId', type: 'string', required: true, description: 'Subscription ID' },
            { name: 'schema', type: 'string', required: true, description: 'Schema/entity name' },
            { name: 'documentId', type: 'string', required: false, description: 'Document ID for Get/Put' },
            { name: 'payload', type: 'IKeyValue[]', required: false, description: 'Data payload for Post/Put/Paging' },
            { name: 'where', type: 'IKeyValue[]', required: false, description: 'Where conditions for List' },
            { name: 'select', type: 'IKeyValue[]', required: false, description: 'Fields to select for List' },
            { name: 'order', type: 'IKeyValue[]', required: false, description: 'Sort order for List' },
            { name: 'take', type: 'string', required: false, description: 'Limit for Paging' },
            { name: 'skip', type: 'string', required: false, description: 'Offset for Paging' },
            { name: 'page', type: 'string', required: false, description: 'Page number for Paging' },
            { name: 'orderby', type: 'string', required: false, description: 'Order by field for Paging' },
            { name: 'asc', type: 'string', required: false, description: 'Sort direction for Paging' }
        ],
        examples: [
            '{ "type": "ORM", "method": "Get", "subscriptionId": "{$.subscription.id}", "schema": "Order", "documentId": "{$.params.documentId}" }',
            '{ "type": "ORM", "method": "Post", "subscriptionId": "{$.subscription.id}", "schema": "User", "payload": [{"Key": "name", "Value": "{$.body.name}"}] }',
            '{ "type": "ORM", "method": "Paging", "subscriptionId": "{$.subscription.id}", "schema": "Product", "take": "10", "skip": "0", "orderby": "createdAt", "asc": "false" }'
        ]
    },

    ESQuery: {
        type: 'ESQuery',
        description: 'Elasticsearch query operations.',
        properties: [
            { name: 'index', type: 'string', required: true, description: 'Elasticsearch index' },
            { name: 'query', type: 'object', required: true, description: 'Elasticsearch query DSL' }
        ],
        examples: [
            '{ "type": "ESQuery", "index": "logs", "query": {"match": {"status": "error"}} }'
        ]
    },

    Trino: {
        type: 'Trino',
        description: 'Trino/Presto distributed SQL query engine operations.',
        properties: [
            { name: 'query', type: 'string', required: true, description: 'SQL query' },
            { name: 'catalog', type: 'string', required: false, description: 'Trino catalog' },
            { name: 'schema', type: 'string', required: false, description: 'Trino schema' }
        ],
        examples: [
            '{ "type": "Trino", "query": "SELECT * FROM catalog.schema.table LIMIT 100" }'
        ]
    },

    // =========================================================================
    // CORE WORKFLOW TASKS
    // =========================================================================

    Resolver: {
        type: 'Resolver',
        description: 'Resolve and transform data from previous tasks. Methods: Object (for object/array transformation), String (for string templates).',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Resolver method: Object, String' },
            { name: 'path', type: 'string', required: false, description: 'Path to source array (for Object method with isArray=true)' },
            { name: 'isArray', type: 'boolean', required: false, description: 'Whether to iterate over array at path (Object method)' },
            { name: 'string', type: 'string', required: false, description: 'String template (for String method)' },
            { name: 'payload', type: 'IKeyValue[]', required: true, description: 'Output payload mapping with Key-Value pairs' }
        ],
        examples: [
            '{ "type": "Resolver", "method": "Object", "payload": [{"Key": "id", "Value": "{$.query.data.id}"}, {"Key": "name", "Value": "{$.query.data.name}"}] }',
            '{ "type": "Resolver", "method": "Object", "path": "{$.entity.data}", "isArray": true, "payload": [{"Key": "id", "Value": "{$.id}"}, {"Key": "name", "Value": "{$.name}"}] }',
            '{ "type": "Resolver", "method": "String", "string": "Hello {$.user.name}, your order #{$.order.id} is confirmed.", "payload": [] }'
        ]
    },

    Response: {
        type: 'Response',
        description: 'Define the final response of the workflow. Must be the last task in a workflow sequence.',
        properties: [
            { name: 'payload', type: 'IKeyValue[]', required: true, description: 'Response payload as Key-Value pairs' }
        ],
        examples: [
            '{ "type": "Response", "payload": [{"Key": "success", "Value": true, "Type": "Literal"}, {"Key": "data", "Value": "{$.resolver.data}", "Type": "Property"}] }',
            '{ "type": "Response", "payload": [{"Key": "statusCode", "Value": 200}, {"Key": "message", "Value": "Created successfully"}] }'
        ]
    },

    Request: {
        type: 'Request',
        description: 'Invoke actions, services, and inter-service communication. Methods: Action, Forward, Proxy, ForwardProxy, GetById, Post, Put, Service, Schedule, Produce.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Request method: Action, Forward, Proxy, ForwardProxy, GetById, Post, Put, Service, Schedule, Produce' },
            { name: 'schema', type: 'string', required: false, description: 'Schema for Action/Forward/Proxy/GetById/Post/Put' },
            { name: 'action', type: 'string', required: false, description: 'Action name for Action/Forward/Proxy/Schedule' },
            { name: 'documentId', type: 'string', required: false, description: 'Document ID for GetById/Put' },
            { name: 'subscription', type: 'string', required: false, description: 'Target subscription for Proxy' },
            { name: 'payload', type: 'string|IKeyValue[]', required: false, description: 'Request payload' },
            { name: 'path', type: 'string', required: false, description: 'Path for array iteration' },
            { name: 'query', type: 'string', required: false, description: 'Query string' },
            { name: 'isArray', type: 'boolean', required: false, description: 'Whether to iterate over array' },
            { name: 'async', type: 'boolean', required: false, description: 'Async execution for Action/Forward/Proxy/Service' },
            { name: 'overrideError', type: 'boolean', required: false, description: 'Override error handling' },
            { name: 'topic', type: 'string', required: false, description: 'Topic for Service/Produce' },
            { name: 'key', type: 'string', required: false, description: 'Key for Produce' },
            { name: 'headers', type: 'string', required: false, description: 'Headers for Produce' },
            { name: 'scheduler', type: 'string', required: false, description: 'Scheduler type for Schedule: remove, cron, delayed' },
            { name: 'jobId', type: 'string', required: false, description: 'Job ID for Schedule' },
            { name: 'pattern', type: 'string', required: false, description: 'Cron pattern for Schedule' },
            { name: 'dateTime', type: 'string', required: false, description: 'DateTime for delayed Schedule' }
        ],
        examples: [
            '{ "type": "Request", "method": "Action", "schema": "users", "action": "create", "payload": "{$.body}" }',
            '{ "type": "Request", "method": "GetById", "schema": "orders", "documentId": "{$.params.documentId}" }',
            '{ "type": "Request", "method": "Proxy", "subscription": "{$.targetSubscription}", "schema": "products", "action": "list" }',
            '{ "type": "Request", "method": "Schedule", "schema": "reports", "action": "generate", "scheduler": "cron", "pattern": "0 0 * * *" }'
        ]
    },

    // =========================================================================
    // CONTROL FLOW TASKS
    // =========================================================================

    Condition: {
        type: 'Condition',
        description: 'Conditional branching with onSuccess and onFailure branches. Supports complex condition expressions.',
        properties: [
            { name: 'conditions', type: 'Condition', required: true, description: 'Condition object with operator, fact, value, and/any arrays' },
            { name: 'onSuccess', type: 'Task[]', required: true, description: 'Tasks to execute when condition is true' },
            { name: 'onFailure', type: 'Task[]', required: false, description: 'Tasks to execute when condition is false' }
        ],
        examples: [
            '{ "type": "Condition", "conditions": {"operator": "equals", "fact": "{$.user.role}", "value": "admin"}, "onSuccess": [...], "onFailure": [...] }',
            '{ "type": "Condition", "conditions": {"and": [{"operator": "notNull", "fact": "{$.data}"}, {"operator": "greaterThan", "fact": "{$.data.length}", "value": "0"}]}, "onSuccess": [...] }'
        ]
    },

    Switch: {
        type: 'Switch',
        description: 'Switch/case branching based on a path value. Each case maps to a different task sequence.',
        properties: [
            { name: 'path', type: 'string', required: true, description: 'Path to the value to switch on' },
            { name: 'case', type: 'object', required: true, description: 'Object mapping case values to task arrays' },
            { name: 'default', type: 'Task[]', required: false, description: 'Default case tasks' }
        ],
        examples: [
            '{ "type": "Switch", "path": "{$.body.action}", "case": {"create": [...], "update": [...], "delete": [...]}, "default": [...] }'
        ]
    },

    Loop: {
        type: 'Loop',
        description: 'Execute tasks multiple times with iteration control.',
        properties: [
            { name: 'iterations', type: 'number|string', required: true, description: 'Number of iterations or path to iteration count' },
            { name: 'index', type: 'string', required: false, description: 'Variable name for current index (default: i)' },
            { name: 'start', type: 'number', required: false, description: 'Starting index (default: 0)' },
            { name: 'tasks', type: 'Task[]', required: true, description: 'Tasks to execute in each iteration' }
        ],
        examples: [
            '{ "type": "Loop", "iterations": "{$.items.length}", "index": "i", "tasks": [...] }',
            '{ "type": "Loop", "iterations": 10, "start": 0, "index": "counter", "tasks": [...] }'
        ]
    },

    Iterator: {
        type: 'Iterator',
        description: 'Iterate over arrays with item-level access. Method: Iterate.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Iterator method: Iterate' },
            { name: 'path', type: 'string', required: true, description: 'Path to array to iterate' },
            { name: 'var', type: 'string', required: false, description: 'Variable name for current item (default: iterate)' },
            { name: 'index', type: 'string', required: false, description: 'Variable name for current index (default: i)' },
            { name: 'tasks', type: 'Task[]', required: true, description: 'Tasks to execute for each item' },
            { name: 'break', type: 'boolean', required: false, description: 'Enable break on failure' },
            { name: 'async', type: 'boolean', required: false, description: 'Execute iterations asynchronously in parallel' },
            { name: 'breakConditions', type: 'Condition', required: false, description: 'Conditions to break the iteration' }
        ],
        examples: [
            '{ "type": "Iterator", "method": "Iterate", "path": "{$.users.data}", "var": "user", "index": "idx", "tasks": [...] }',
            '{ "type": "Iterator", "method": "Iterate", "path": "{$.items}", "var": "item", "async": true, "tasks": [...] }'
        ]
    },

    Promise: {
        type: 'Promise',
        description: 'Execute multiple tasks in parallel. Methods: PromiseAll, PromiseAllSettled, PromiseRace, PromiseResolve, PromiseReject.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Promise method: PromiseAll, PromiseAllSettled, PromiseRace, PromiseResolve, PromiseReject' },
            { name: 'tasks', type: 'Task[]', required: true, description: 'Array of tasks to execute in parallel' }
        ],
        examples: [
            '{ "type": "Promise", "method": "PromiseAll", "tasks": [{"type": "Query", ...}, {"type": "HTTP", ...}] }',
            '{ "type": "Promise", "method": "PromiseAllSettled", "tasks": [...] }',
            '{ "type": "Promise", "method": "PromiseRace", "tasks": [...] }'
        ]
    },

    Sequence: {
        type: 'Sequence',
        description: 'Generate sequential numbers with prefix and padding. Stored per subscription/schema combination.',
        properties: [
            { name: 'subscription', type: 'string', required: true, description: 'Subscription ID for sequence scope' },
            { name: 'schema', type: 'string', required: true, description: 'Schema ID for sequence scope' },
            { name: 'prefix', type: 'string', required: false, description: 'Prefix for the sequence (e.g., "INV-", "ORD-")' },
            { name: 'paddingLength', type: 'string', required: false, description: 'Minimum length with zero padding (default: 10)' },
            { name: 'paddingCharacter', type: 'string', required: false, description: 'Padding character (default: "0")' },
            { name: 'readonly', type: 'boolean', required: false, description: 'If true, returns next value without incrementing' }
        ],
        examples: [
            '{ "type": "Sequence", "subscription": "{$.subscription.id}", "schema": "invoices", "prefix": "INV-", "paddingLength": "6" }',
            '{ "type": "Sequence", "subscription": "{$.subscription.id}", "schema": "orders", "prefix": "ORD-", "paddingLength": "8", "paddingCharacter": "0" }'
        ]
    },

    // =========================================================================
    // TRANSFORMATION TASKS (from 03-transformations.md)
    // =========================================================================

    Array: {
        type: 'Array',
        description: 'Array manipulation operations. Methods: Get, Push, Index, Find, Slice, Splice, Join, Map, Sort, Count, Filter, Merge, IsArray, ToArray, Distinct.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Array method: Get, Push, Index, Find, Slice, Splice, Join, Map, Sort, Count, Filter, Merge, IsArray, ToArray, Distinct' },
            { name: 'path', type: 'string', required: false, description: 'State path to source array' },
            { name: 'value', type: 'string', required: false, description: 'Value for push operations' },
            { name: 'index', type: 'number', required: false, description: 'Index for specific operations' },
            { name: 'fromIndex', type: 'number', required: false, description: 'Start index for slice/splice' },
            { name: 'var', type: 'string', required: false, description: 'Variable name for iteration (item alias)' },
            { name: 'conditions', type: 'Condition', required: false, description: 'Conditions for Find/Filter operations' },
            { name: 'payload', type: 'IKeyValue[]', required: false, description: 'Transformation payload for Map' },
            { name: 'key', type: 'string', required: false, description: 'Key for Sort operations' },
            { name: 'asc', type: 'boolean', required: false, description: 'Sort direction (true=ascending)' },
            { name: 'separator', type: 'string', required: false, description: 'Separator for Join' },
            { name: 'paths', type: 'string[]', required: false, description: 'Multiple paths for Merge' },
            { name: 'property', type: 'string', required: false, description: 'Property for ToArray' },
            { name: 'distinct', type: 'boolean', required: false, description: 'Remove duplicates in ToArray' }
        ],
        examples: [
            '{ "type": "Array", "method": "Map", "path": "{$.findUsers.data}", "var": "item", "payload": [{"Key": "id", "Value": "{$.item.id}", "Type": "Property"}, {"Key": "fullName", "Value": "{$.item.firstName} {$.item.lastName}", "Type": "Property"}] }',
            '{ "type": "Array", "method": "Filter", "path": "{$.items.data}", "var": "item", "conditions": {"fact": "{$.item.status}", "operator": "equals", "value": "active"} }',
            '{ "type": "Array", "method": "Find", "path": "{$.users.data}", "var": "user", "conditions": {"fact": "{$.user.id}", "operator": "equals", "value": "{$.params.userId}"} }',
            '{ "type": "Array", "method": "Sort", "path": "{$.products.data}", "key": "price", "var": "product", "asc": true }',
            '{ "type": "Array", "method": "Merge", "paths": ["{$.array1.data}", "{$.array2.data}"] }',
            '{ "type": "Array", "method": "Join", "path": "{$.body.tags}", "separator": ", " }',
            '{ "type": "Array", "method": "Count", "path": "{$.orders.data}" }',
            '{ "type": "Array", "method": "Distinct", "path": "{$.items.data}" }'
        ]
    },

    Object: {
        type: 'Object',
        description: 'Object manipulation operations. Methods: IsExist (check property existence), IsNaN (check if NaN), IsObject (check if object), Merge (merge objects).',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Object method: IsExist, IsNaN, IsObject, Merge' },
            { name: 'path', type: 'string', required: false, description: 'State path to source object' },
            { name: 'key', type: 'string', required: false, description: 'Property key to check for IsExist/IsNaN' },
            { name: 'paths', type: 'string[]', required: false, description: 'Array of paths to merge for Merge method' }
        ],
        examples: [
            '{ "type": "Object", "method": "IsExist", "path": "{$.findUser.data}", "key": "email" }',
            '{ "type": "Object", "method": "IsNaN", "path": "{$.body.amount}", "key": "value" }',
            '{ "type": "Object", "method": "IsObject", "path": "{$.body.config}" }',
            '{ "type": "Object", "method": "Merge", "paths": ["{$.object1}", "{$.object2}"] }'
        ]
    },

    String: {
        type: 'String',
        description: 'String manipulation operations. Methods: toLowerCase, toUpperCase, substring, concat, charAt, indexOf, replace, slice, split, toString, trim, length, toObject, toQueryString, padEnd, padStart.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'String method: toLowerCase, toUpperCase, substring, concat, charAt, indexOf, replace, slice, split, toString, trim, length, toObject, toQueryString, padEnd, padStart' },
            { name: 'path', type: 'string', required: false, description: 'State path to string' },
            { name: 'start', type: 'string', required: false, description: 'Start index for substring/slice' },
            { name: 'end', type: 'string', required: false, description: 'End index for substring/slice' },
            { name: 'strings', type: 'string[]', required: false, description: 'Array of strings for concat' },
            { name: 'char', type: 'string', required: false, description: 'Separator character for concat' },
            { name: 'index', type: 'string', required: false, description: 'Index for charAt/indexOf' },
            { name: 'searchValue', type: 'string', required: false, description: 'Search value for replace' },
            { name: 'replaceValue', type: 'string', required: false, description: 'Replace value for replace' },
            { name: 'splitValue', type: 'string', required: false, description: 'Separator for split' },
            { name: 'maxLength', type: 'string', required: false, description: 'Max length for padEnd/padStart' },
            { name: 'fillString', type: 'string', required: false, description: 'Fill string for padEnd/padStart' }
        ],
        examples: [
            '{ "type": "String", "method": "toUpperCase", "path": "{$.body.code}" }',
            '{ "type": "String", "method": "toLowerCase", "path": "{$.body.email}" }',
            '{ "type": "String", "method": "concat", "strings": ["{$.body.firstName}", "{$.body.lastName}"], "char": " " }',
            '{ "type": "String", "method": "split", "path": "{$.body.tags}", "splitValue": "," }',
            '{ "type": "String", "method": "replace", "path": "{$.body.content}", "searchValue": "old", "replaceValue": "new" }',
            '{ "type": "String", "method": "substring", "path": "{$.body.text}", "start": "0", "end": "10" }',
            '{ "type": "String", "method": "trim", "path": "{$.body.input}" }',
            '{ "type": "String", "method": "padStart", "path": "{$.body.code}", "maxLength": "6", "fillString": "0" }',
            '{ "type": "String", "method": "toQueryString", "path": "{$.body.params}" }'
        ]
    },

    JSON: {
        type: 'JSON',
        description: 'JSON parsing and stringification. Methods: Parse (string to object), Stringify (object to string).',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'JSON method: Parse, Stringify' },
            { name: 'payload', type: 'string', required: true, description: 'Path to data to parse or stringify' }
        ],
        examples: [
            '{ "type": "JSON", "method": "Parse", "payload": "{$.body.configJson}" }',
            '{ "type": "JSON", "method": "Stringify", "payload": "{$.data}" }'
        ]
    },

    Math: {
        type: 'Math',
        description: 'Mathematical operations. Methods: Evaluate (expression evaluation), Round, Ceil, Floor.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Math method: Evaluate, Round, Ceil, Floor' },
            { name: 'expression', type: 'string', required: true, description: 'Math expression to evaluate or path for Round/Ceil/Floor' },
            { name: 'payload', type: 'IKeyValue[]', required: false, description: 'Payload for Evaluate method - resolves variables for expression' }
        ],
        examples: [
            '{ "type": "Math", "method": "Evaluate", "expression": "{$.price} * {$.quantity}", "payload": [{"Key": "price", "Value": "{$.body.price}"}, {"Key": "quantity", "Value": "{$.body.quantity}"}] }',
            '{ "type": "Math", "method": "Round", "expression": "{$.calculateTotal.data}" }',
            '{ "type": "Math", "method": "Floor", "expression": "{$.amount}" }',
            '{ "type": "Math", "method": "Ceil", "expression": "{$.amount}" }'
        ]
    },

    Date: {
        type: 'Date',
        description: 'Date/time operations using moment.js. Methods: GetDate, Add, Diff, Format, LessThan, GreaterThan, Parse, GetDay.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Date method: GetDate, Add, Diff, Format, LessThan, GreaterThan, Parse, GetDay' },
            { name: 'date', type: 'string', required: false, description: 'Input date or state path' },
            { name: 'amount', type: 'string', required: false, description: 'Amount to add (for Add method)' },
            { name: 'unit', type: 'string', required: false, description: 'Time unit: years, months, weeks, days, hours, minutes, seconds (moment.unitOfTime.DurationConstructor)' },
            { name: 'from', type: 'string', required: false, description: 'From date for Diff' },
            { name: 'to', type: 'string', required: false, description: 'To date for Diff' },
            { name: 'unitOfTime', type: 'string', required: false, description: 'Unit of time for Diff result' },
            { name: 'format', type: 'string', required: false, description: 'Date format string (YYYY-MM-DD, etc.)' },
            { name: 'comparisionDate', type: 'string', required: false, description: 'Date to compare against for LessThan/GreaterThan' }
        ],
        examples: [
            '{ "type": "Date", "method": "GetDate" }',
            '{ "type": "Date", "method": "Format", "date": "{$.body.date}", "format": "YYYY-MM-DD" }',
            '{ "type": "Date", "method": "Add", "date": "{$.body.startDate}", "amount": "7", "unit": "days" }',
            '{ "type": "Date", "method": "Diff", "from": "{$.body.startDate}", "to": "{$.body.endDate}", "unitOfTime": "days" }',
            '{ "type": "Date", "method": "LessThan", "date": "{$.body.expiryDate}", "comparisionDate": "{$.now}", "format": "YYYY-MM-DD" }',
            '{ "type": "Date", "method": "GreaterThan", "date": "{$.body.startDate}", "comparisionDate": "{$.body.endDate}", "format": "YYYY-MM-DD" }',
            '{ "type": "Date", "method": "Parse", "date": "{$.body.dateString}" }',
            '{ "type": "Date", "method": "GetDay", "date": "{$.body.date}" }'
        ]
    },

    Filter: {
        type: 'Filter',
        description: 'Filter data based on conditions.',
        properties: [
            { name: 'path', type: 'string', required: true, description: 'Path to data to filter' },
            { name: 'conditions', type: 'Condition', required: true, description: 'Filter conditions' }
        ],
        examples: [
            '{ "type": "Filter", "path": "{$.items}", "conditions": {"operator": "greaterThan", "fact": "{$.item.price}", "value": "100"} }'
        ]
    },

    Variable: {
        type: 'Variable',
        description: 'Variable repository operations (system variables). Methods: Get, Post, Put, List, Paging.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Variable method: Get, Post, Put, List, Paging' },
            { name: 'repository', type: 'string', required: false, description: 'Repository reference' },
            { name: 'variableId', type: 'string', required: false, description: 'Variable ID for Get' },
            { name: 'schema', type: 'string', required: false, description: 'Schema for Get' },
            { name: 'documentId', type: 'string', required: false, description: 'Document ID for Put/List' },
            { name: 'payload', type: 'IKeyValue[]', required: false, description: 'Data payload for Post/Put' },
            { name: 'select', type: 'IKeyValue[]', required: false, description: 'Fields to select for List' },
            { name: 'take', type: 'string', required: false, description: 'Page size for Paging' },
            { name: 'skip', type: 'string', required: false, description: 'Offset for Paging' },
            { name: 'orderby', type: 'string', required: false, description: 'Sort field for Paging' },
            { name: 'asc', type: 'string', required: false, description: 'Sort direction for Paging' },
            { name: 'page', type: 'string', required: false, description: 'Page number for Paging' }
        ],
        examples: [
            '{ "type": "Variable", "method": "Get", "variableId": "{$.params.documentId}", "schema": "{$.body.schemaId}" }',
            '{ "type": "Variable", "method": "Post", "payload": [{"Key": "name", "Value": "{$.body.name}"}] }',
            '{ "type": "Variable", "method": "Paging", "take": "10", "skip": "0", "orderby": "name", "asc": "true" }'
        ]
    },

    // =========================================================================
    // SECURITY & VALIDATION TASKS
    // =========================================================================

    Security: {
        type: 'Security',
        description: 'Security operations including JWT signing/verification and password hashing. Methods: JWTSign, JWTVerify, hashPassword, matchPassword, verifyPassword.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Security method: JWTSign, JWTVerify, hashPassword, matchPassword, verifyPassword' },
            { name: 'payload', type: 'IKeyValue[]', required: false, description: 'JWT payload for JWTSign' },
            { name: 'options', type: 'IKeyValue[]', required: false, description: 'JWT options (algorithm, expiresIn, etc.)' },
            { name: 'secret', type: 'string', required: false, description: 'Secret key for JWT operations' },
            { name: 'selfSign', type: 'boolean', required: false, description: 'If true, use only provided secret (no system secret appended)' },
            { name: 'token', type: 'string', required: false, description: 'JWT token for JWTVerify' },
            { name: 'password', type: 'string', required: false, description: 'Password for hash/match operations' },
            { name: 'hash', type: 'string', required: false, description: 'Hash to compare against for matchPassword' }
        ],
        examples: [
            '{ "type": "Security", "method": "JWTSign", "payload": [{"Key": "userId", "Value": "{$.user.id}"}], "options": [{"Key": "expiresIn", "Value": "1h"}], "secret": "{$.env.JWT_SECRET}" }',
            '{ "type": "Security", "method": "JWTVerify", "token": "{$.headers.authorization}", "secret": "{$.env.JWT_SECRET}" }',
            '{ "type": "Security", "method": "hashPassword", "password": "{$.body.password}" }',
            '{ "type": "Security", "method": "matchPassword", "password": "{$.body.password}", "hash": "{$.user.passwordHash}" }'
        ]
    },

    Validator: {
        type: 'Validator',
        description: 'Data validation against JSON schemas or UUID format. Methods: JSON, UUID.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Validation method: JSON, UUID' },
            { name: 'schema', type: 'string', required: false, description: 'JSON Schema path or object for JSON method' },
            { name: 'data', type: 'string', required: false, description: 'Data path to validate for JSON method' },
            { name: 'payload', type: 'string', required: false, description: 'UUID string to validate for UUID method' }
        ],
        examples: [
            '{ "type": "Validator", "method": "JSON", "schema": "{$.schemas.userSchema}", "data": "{$.body}" }',
            '{ "type": "Validator", "method": "UUID", "payload": "{$.params.documentId}" }'
        ]
    },

    Crypto: {
        type: 'Crypto',
        description: 'Cryptographic operations for encryption and hashing.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Crypto method: Hash, Encrypt, Decrypt, Sign, Verify' },
            { name: 'algorithm', type: 'string', required: false, description: 'Algorithm to use' },
            { name: 'value', type: 'string', required: true, description: 'Value to process' },
            { name: 'key', type: 'string', required: false, description: 'Encryption key' }
        ],
        examples: [
            '{ "type": "Crypto", "method": "Hash", "algorithm": "sha256", "value": "{$.password}" }'
        ]
    },

    RSA: {
        type: 'RSA',
        description: 'RSA encryption and decryption operations. Methods: Generate (key pair), PublicEncrypt, PublicDecrypt, PrivateEncrypt, PrivateDecrypt.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'RSA method: Generate, PublicEncrypt, PublicDecrypt, PrivateEncrypt, PrivateDecrypt' },
            { name: 'str', type: 'string', required: false, description: 'String to encrypt/decrypt (path expression)' },
            { name: 'publicKey', type: 'string', required: false, description: 'Public key for PublicEncrypt/PublicDecrypt' },
            { name: 'privateKey', type: 'string', required: false, description: 'Private key for PrivateEncrypt/PrivateDecrypt' }
        ],
        examples: [
            '{ "type": "RSA", "method": "Generate" }',
            '{ "type": "RSA", "method": "PublicEncrypt", "str": "{$.body.sensitiveData}", "publicKey": "{$.keys.public}" }',
            '{ "type": "RSA", "method": "PrivateDecrypt", "str": "{$.body.encryptedData}", "privateKey": "{$.keys.private}" }'
        ]
    },

    // =========================================================================
    // INTEGRATION TASKS
    // =========================================================================

    SMTP: {
        type: 'SMTP',
        description: 'Send emails via SMTP using nodemailer.',
        properties: [
            { name: 'To', type: 'string', required: true, description: 'Recipient email address (path expression)' },
            { name: 'From', type: 'string', required: true, description: 'Sender email address (path expression)' },
            { name: 'CC', type: 'string', required: false, description: 'CC email addresses (path expression)' },
            { name: 'Subject', type: 'string', required: true, description: 'Email subject (path expression)' },
            { name: 'Body', type: 'string', required: false, description: 'Plain text email body (path expression)' },
            { name: 'HtmlBody', type: 'string', required: false, description: 'HTML email body (path expression)' }
        ],
        examples: [
            '{ "type": "SMTP", "To": "{$.user.email}", "From": "noreply@example.com", "Subject": "Welcome!", "HtmlBody": "<h1>Hello {$.user.name}</h1>" }',
            '{ "type": "SMTP", "To": "{$.body.email}", "From": "{$.env.SENDER_EMAIL}", "CC": "{$.body.ccEmail}", "Subject": "{$.body.subject}", "Body": "{$.body.message}" }'
        ]
    },

    Cache: {
        type: 'Cache',
        description: 'Redis caching and Socket.io emit operations. Methods: Get, Set, Clear, Emit.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Cache method: Get, Set, Clear, Emit' },
            { name: 'partitionKey', type: 'string', required: false, description: 'Partition key for cache' },
            { name: 'schemaId', type: 'string', required: false, description: 'Schema ID for document cache' },
            { name: 'documentId', type: 'string', required: false, description: 'Document ID for cache key' },
            { name: 'value', type: 'any', required: false, description: 'Value to cache (for Set)' },
            { name: 'seconds', type: 'string', required: false, description: 'TTL in seconds (for Set)' },
            { name: 'pattern', type: 'string', required: false, description: 'Pattern for Clear with wildcard' },
            { name: 'room', type: 'string', required: false, description: 'Socket room for Emit' },
            { name: 'key', type: 'string', required: false, description: 'Socket event key for Emit' }
        ],
        examples: [
            '{ "type": "Cache", "method": "Get", "partitionKey": "{$.subscription.id}", "schemaId": "{$.body.schemaId}", "documentId": "{$.params.documentId}" }',
            '{ "type": "Cache", "method": "Set", "partitionKey": "{$.subscription.id}", "schemaId": "{$.body.schemaId}", "documentId": "{$.findUser.data.id}", "value": "{$.findUser.data}", "seconds": "3600" }',
            '{ "type": "Cache", "method": "Clear", "pattern": "user:*" }',
            '{ "type": "Cache", "method": "Emit", "room": "user:{$.body.userId}", "key": "notification", "value": "{$.notificationData}" }'
        ]
    },

    State: {
        type: 'State',
        description: 'Access nested state value at a path and execute tasks with that state context.',
        properties: [
            { name: 'path', type: 'string', required: true, description: 'Path to state value to use as context' },
            { name: 'tasks', type: 'Task[]', required: true, description: 'Tasks to execute with the state context' }
        ],
        examples: [
            '{ "type": "State", "path": "{$.userData}", "tasks": [...] }'
        ]
    },

    Subscription: {
        type: 'Subscription',
        description: 'Subscription-related operations.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Subscription method' },
            { name: 'subscriptionId', type: 'string', required: false, description: 'Subscription ID' }
        ],
        examples: [
            '{ "type": "Subscription", "method": "GetContext", "subscriptionId": "{$.subscription}" }'
        ]
    },

    // =========================================================================
    // UTILITY TASKS
    // =========================================================================

    Rule: {
        type: 'Rule',
        description: 'Execute and manage business rules. Methods: Execute, Executor, Object, Get, Post, Put, List, Paging, FindOne.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Rule method: Execute, Executor, Object, Get, Post, Put, List, Paging, FindOne' },
            { name: 'subscription', type: 'string', required: false, description: 'Subscription ID for Get/Post/Put/Object/Executor' },
            { name: 'schema', type: 'string', required: false, description: 'Schema ID for Get/Post/Put/Object/Executor' },
            { name: 'rule', type: 'string', required: false, description: 'Rule name for Get/Put' },
            { name: 'documentId', type: 'string', required: false, description: 'Document ID for Object/Executor/List' },
            { name: 'action', type: 'string', required: false, description: 'Action name for Executor' },
            { name: 'ruleType', type: 'string', required: false, description: 'Rule type for Executor' },
            { name: 'payload', type: 'IKeyValue[]', required: false, description: 'Payload for Execute/Object/Post/Put/List/Paging' },
            { name: 'where', type: 'IKeyValueSearch|IKeyValue[]', required: false, description: 'Where conditions for FindOne' },
            { name: 'select', type: 'IKeyValue[]', required: false, description: 'Fields to select for List/FindOne' },
            { name: 'sort', type: 'IKeyValue[]', required: false, description: 'Sort for FindOne' },
            { name: 'take', type: 'string', required: false, description: 'Limit for Paging' },
            { name: 'skip', type: 'string', required: false, description: 'Offset for Paging' },
            { name: 'orderby', type: 'string', required: false, description: 'Order by for Paging' },
            { name: 'asc', type: 'string', required: false, description: 'Sort direction for Paging' },
            { name: 'page', type: 'string', required: false, description: 'Page number for Paging' }
        ],
        examples: [
            '{ "type": "Rule", "method": "Execute", "payload": [{"Key": "data", "Value": "{$.body}"}] }',
            '{ "type": "Rule", "method": "Get", "subscription": "{$.subscription.id}", "schema": "validation", "rule": "email-validator" }',
            '{ "type": "Rule", "method": "Executor", "subscription": "{$.subscription.id}", "schema": "orders", "documentId": "{$.params.documentId}", "action": "validate" }'
        ]
    },

    UUID: {
        type: 'UUID',
        description: 'Generate UUID v4 values.',
        properties: [],
        examples: [
            '{ "type": "UUID" }'
        ]
    },

    Identifier: {
        type: 'Identifier',
        description: 'Generate various identifier formats. Methods: UUID, NanoId.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Identifier method: UUID, NanoId' },
            { name: 'format', type: 'string', required: false, description: 'NanoId format: AlphaNumeric, Alphabet, Number, Password' },
            { name: 'size', type: 'number', required: false, description: 'Length for NanoId' }
        ],
        examples: [
            '{ "type": "Identifier", "method": "UUID" }',
            '{ "type": "Identifier", "method": "NanoId", "format": "AlphaNumeric", "size": 12 }',
            '{ "type": "Identifier", "method": "NanoId", "format": "Number", "size": 6 }',
            '{ "type": "Identifier", "method": "NanoId", "format": "Password", "size": 16 }'
        ]
    },

    Geometry: {
        type: 'Geometry',
        description: 'Geographic/GIS calculations. Method: Haversine (calculate distance between two coordinates).',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Geometry method: Haversine' },
            { name: 'latitude1', type: 'string', required: true, description: 'First latitude (path or value)' },
            { name: 'longitude1', type: 'string', required: true, description: 'First longitude (path or value)' },
            { name: 'latitude2', type: 'string', required: true, description: 'Second latitude (path or value)' },
            { name: 'longitude2', type: 'string', required: true, description: 'Second longitude (path or value)' },
            { name: 'path', type: 'string', required: false, description: 'Optional path prefix' }
        ],
        examples: [
            '{ "type": "Geometry", "method": "Haversine", "latitude1": "{$.body.fromLat}", "longitude1": "{$.body.fromLon}", "latitude2": "{$.body.toLat}", "longitude2": "{$.body.toLon}" }'
        ]
    },

    Transaction: {
        type: 'Transaction',
        description: 'Execute tasks within a distributed transaction with mutex locking and rollback support.',
        properties: [
            { name: 'key', type: 'string', required: true, description: 'Unique transaction key (used for mutex lock)' },
            { name: 'tasks', type: 'Task[]', required: true, description: 'Tasks to execute within the transaction' },
            { name: 'rollback', type: 'Task[]', required: true, description: 'Rollback tasks to execute if transaction fails' }
        ],
        examples: [
            '{ "type": "Transaction", "key": "{$.body.orderId}", "tasks": [...], "rollback": [...] }'
        ]
    },

    Action: {
        type: 'Action',
        description: 'Invoke another action/workflow.',
        properties: [
            { name: 'actionId', type: 'string', required: true, description: 'Action ID to invoke' },
            { name: 'params', type: 'object', required: false, description: 'Parameters to pass' }
        ],
        examples: [
            '{ "type": "Action", "actionId": "send-notification", "params": {"userId": "{$.userId}"} }'
        ]
    },

    Provider: {
        type: 'Provider',
        description: 'Provider/service provider operations.',
        properties: [
            { name: 'providerId', type: 'string', required: true, description: 'Provider ID' },
            { name: 'method', type: 'string', required: true, description: 'Provider method' }
        ],
        examples: [
            '{ "type": "Provider", "providerId": "auth-provider", "method": "Validate" }'
        ]
    },

    Schema: {
        type: 'Schema',
        description: 'Schema operations for metadata and validation.',
        properties: [
            { name: 'schemaId', type: 'string', required: true, description: 'Schema ID' },
            { name: 'method', type: 'string', required: true, description: 'Schema method: Get, Validate' }
        ],
        examples: [
            '{ "type": "Schema", "schemaId": "user-schema", "method": "Get" }'
        ]
    },

    Workflow: {
        type: 'Workflow',
        description: 'Execute a nested/child workflow. Methods: Template (load from repository), Custom (from state).',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Workflow method: Template, Custom' },
            { name: 'template', type: 'string', required: false, description: 'Template ID for Template method' },
            { name: 'tasks', type: 'string', required: false, description: 'Path to tasks array for Custom method' },
            { name: 'state', type: 'string', required: false, description: 'Path to additional state to merge' }
        ],
        examples: [
            '{ "type": "Workflow", "method": "Template", "template": "order-processing-workflow" }',
            '{ "type": "Workflow", "method": "Custom", "tasks": "{$.dynamicTasks}", "state": "{$.additionalContext}" }'
        ]
    },

    Version: {
        type: 'Version',
        description: 'Version management operations.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Version method' }
        ],
        examples: [
            '{ "type": "Version", "method": "Increment" }'
        ]
    },

    History: {
        type: 'History',
        description: 'Track and manage history/audit trail.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'History method: Log, Get' },
            { name: 'entityType', type: 'string', required: false, description: 'Entity type' },
            { name: 'entityId', type: 'string', required: false, description: 'Entity ID' }
        ],
        examples: [
            '{ "type": "History", "method": "Log", "entityType": "Order", "entityId": "{$.orderId}", "action": "Updated" }'
        ]
    },

    Export: {
        type: 'Export',
        description: 'Export data to various formats.',
        properties: [
            { name: 'format', type: 'string', required: true, description: 'Export format: CSV, Excel, PDF, JSON' },
            { name: 'data', type: 'string', required: true, description: 'Data to export' },
            { name: 'filename', type: 'string', required: false, description: 'Output filename' }
        ],
        examples: [
            '{ "type": "Export", "format": "CSV", "data": "{$.reportData}", "filename": "report.csv" }'
        ]
    },

    Template: {
        type: 'Template',
        description: 'Template repository operations. Methods: Get, Post, Put, List, Paging.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'Template method: Get, Post, Put, List, Paging' },
            { name: 'repository', type: 'string', required: true, description: 'Template repository name' },
            { name: 'schema', type: 'string', required: false, description: 'Schema for Get' },
            { name: 'documentId', type: 'string', required: false, description: 'Document ID for Get/Put/List' },
            { name: 'payload', type: 'IKeyValue[]', required: false, description: 'Data payload for Post/Put/List/Paging' },
            { name: 'select', type: 'IKeyValue[]', required: false, description: 'Fields to select for List' },
            { name: 'take', type: 'string', required: false, description: 'Limit for Paging' },
            { name: 'skip', type: 'string', required: false, description: 'Offset for Paging' },
            { name: 'page', type: 'string', required: false, description: 'Page number for Paging' },
            { name: 'orderby', type: 'string', required: false, description: 'Order by field for Paging' },
            { name: 'asc', type: 'string', required: false, description: 'Sort direction for Paging' }
        ],
        examples: [
            '{ "type": "Template", "method": "Get", "repository": "emailTemplates", "schema": "templates", "documentId": "{$.params.templateId}" }',
            '{ "type": "Template", "method": "Post", "repository": "emailTemplates", "payload": [{"Key": "name", "Value": "{$.body.name}"}] }',
            '{ "type": "Template", "method": "Paging", "repository": "emailTemplates", "take": "10", "skip": "0", "orderby": "createdAt" }'
        ]
    },

    // =========================================================================
    // SYSTEM TASKS (08-system.md)
    // =========================================================================

    UIComponent: {
        type: 'UIComponent',
        description: 'UI component operations and rendering.',
        properties: [
            { name: 'component', type: 'string', required: true, description: 'Component name or ID' },
            { name: 'props', type: 'object', required: false, description: 'Component props' },
            { name: 'action', type: 'string', required: false, description: 'Component action' }
        ],
        examples: [
            '{ "type": "UIComponent", "component": "DataGrid", "props": {"data": "{$.items.data}"} }'
        ]
    },

    // =========================================================================
    // MCP TASKS (09-workflow-rules.md)
    // =========================================================================

    MCP: {
        type: 'MCP',
        description: 'Model Context Protocol server operations. Methods: Get, Create, Update, List.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'MCP method: Get, Create, Update, List' },
            { name: 'mcpId', type: 'string', required: false, description: 'MCP server ID (path or value)' },
            { name: 'systemName', type: 'string', required: false, description: 'MCP system name (for Get)' },
            { name: 'documentId', type: 'string', required: false, description: 'Document ID for Get/Update' },
            { name: 'payload', type: 'IKeyValue[]', required: false, description: 'Payload for Create/Update' }
        ],
        examples: [
            '{ "type": "MCP", "method": "Get", "documentId": "{$.params.mcpId}" }',
            '{ "type": "MCP", "method": "List" }',
            '{ "type": "MCP", "method": "Create", "payload": [{"Key": "SystemName", "Value": "my-mcp-server"}] }'
        ]
    },

    MCPTool: {
        type: 'MCPTool',
        description: 'MCP Tool operations. Methods: Get, Create, Update, List.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'MCPTool method: Get, Create, Update, List' },
            { name: 'mcpId', type: 'string', required: false, description: 'Parent MCP server ID' },
            { name: 'documentId', type: 'string', required: false, description: 'Tool document ID for Get/Update' },
            { name: 'payload', type: 'IKeyValue[]', required: false, description: 'Payload for Create/Update' }
        ],
        examples: [
            '{ "type": "MCPTool", "method": "List", "mcpId": "{$.params.mcpId}" }',
            '{ "type": "MCPTool", "method": "Get", "documentId": "{$.params.toolId}" }',
            '{ "type": "MCPTool", "method": "Create", "mcpId": "{$.params.mcpId}", "payload": [{"Key": "name", "Value": "search-tool"}] }'
        ]
    },

    MCPResource: {
        type: 'MCPResource',
        description: 'MCP Resource operations. Methods: Get, Create, Update, List.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'MCPResource method: Get, Create, Update, List' },
            { name: 'mcpId', type: 'string', required: false, description: 'Parent MCP server ID' },
            { name: 'documentId', type: 'string', required: false, description: 'Resource document ID for Get/Update' },
            { name: 'payload', type: 'IKeyValue[]', required: false, description: 'Payload for Create/Update' }
        ],
        examples: [
            '{ "type": "MCPResource", "method": "List", "mcpId": "{$.params.mcpId}" }',
            '{ "type": "MCPResource", "method": "Get", "documentId": "{$.params.resourceId}" }'
        ]
    },

    MCPPrompt: {
        type: 'MCPPrompt',
        description: 'MCP Prompt operations. Methods: Get, Create, Update, List.',
        properties: [
            { name: 'method', type: 'string', required: true, description: 'MCPPrompt method: Get, Create, Update, List' },
            { name: 'mcpId', type: 'string', required: false, description: 'Parent MCP server ID' },
            { name: 'documentId', type: 'string', required: false, description: 'Prompt document ID for Get/Update' },
            { name: 'payload', type: 'IKeyValue[]', required: false, description: 'Payload for Create/Update' }
        ],
        examples: [
            '{ "type": "MCPPrompt", "method": "List", "mcpId": "{$.params.mcpId}" }',
            '{ "type": "MCPPrompt", "method": "Get", "documentId": "{$.params.promptId}" }'
        ]
    }
};

/**
 * Condition operators available in the workflow system
 * From official apt-yuj/docs/workflow/01-flow-control.md
 */
export const CONDITION_OPERATORS = [
    // Equality operators
    'equals',
    'exactEquals',
    'notEquals',
    // Comparison operators
    'greaterThan',
    'greaterThanEquals',
    'lessThan',
    'lessThanEquals',
    // Collection operators
    'in',
    'notIn',
    'contains',
    'notContains',
    'some',        // alias for any
    'any',
    // Pattern matching
    'regex',
    // Type checking
    'isArray',
    'notArray',
    'isObject',
    'notObject',
    'isNumber',
    'isNaN',
    // Null checking
    'notNull',
    // Property checking
    'hasProperty'
] as const;

/**
 * Value types for IKeyValue
 * From official apt-yuj/docs/value-types-documentation.md
 */
export const VALUE_TYPES = {
    Literal: 'Literal',       // Static/constant value (strings, numbers, booleans)
    Property: 'Property',     // Dynamic reference using path expression {$.path.to.value}
    Array: 'Array',           // Array value type
    Object: 'Object',         // Object value type
    Calculated: 'Calculated', // JavaScript-like expressions (Resolver)
    Rule: 'Rule',             // Rule-based value (Resolver)
    Workflow: 'Workflow',     // Workflow reference
    Condition: 'Condition',   // Conditional value
    Switch: 'Switch'          // Switch-based value
} as const;

// =============================================================================
// DOCUMENT RESOLVER DEEP DIVE - How State Resolution Works
// =============================================================================

/**
 * CORE RESOLUTION FUNCTIONS
 * 
 * The workflow engine uses two core functions for state resolution:
 * 
 * 1. getValueByPath(document, path) - Resolves a single path expression
 *    - Input: document (state object), path (string like "{$.body.name}")
 *    - Returns: { resolved: boolean, value: any }
 *    - Supports array indices [0-127]: {$.items[0].name}
 * 
 * 2. resolveDocument(fields, document) - Resolves array of IKeyValue fields
 *    - Input: fields (IKeyValue[]), document (state object)
 *    - Returns: object with all resolved key-value pairs
 *    - Handles all ValueTypes: Literal, Property, Object, Calculated, etc.
 */

/**
 * PATH EXPRESSION SYNTAX
 * 
 * Path expressions follow the pattern: {$.path.to.value}
 * 
 * RULES:
 * - Must start with {$. and end with }
 * - $ refers to the root state/document object
 * - Dot notation for nested properties
 * - Bracket notation for array indices [0-127]
 * - If path cannot be resolved, value is undefined/not set
 * 
 * EXAMPLES:
 * {$}                    â†’ Returns entire state object
 * {$.body}               â†’ Request body
 * {$.body.email}         â†’ Nested property in body
 * {$.params.documentId}  â†’ URL parameter (document ID)
 * {$.query.page}         â†’ Query string parameter
 * {$.headers.authorization} â†’ Request header
 * {$.auth.userId}        â†’ Authenticated user's ID
 * {$.auth.roles}         â†’ User's roles array
 * {$.env.API_KEY}        â†’ Environment variable
 * {$.const.true}         â†’ Boolean true constant
 * {$.const.now}          â†’ Current ISO timestamp
 * {$.myTask.data}        â†’ Previous task result data
 * {$.myTask.success}     â†’ Previous task success status
 * {$.items[0]}           â†’ First array element
 * {$.items[0].name}      â†’ Property of first element
 * {$.data.nested.deep}   â†’ Deep nested access
 */
export const PATH_RESOLUTION_EXAMPLES = {
    // Request context
    requestBody: '{$.body}',
    bodyField: '{$.body.fieldName}',
    urlParam: '{$.params.paramName}',
    queryString: '{$.query.queryParam}',
    header: '{$.headers.headerName}',
    cookie: '{$.cookies.cookieName}',

    // Authentication
    userId: '{$.auth.userId}',
    userRoles: '{$.auth.roles}',
    userEmail: '{$.auth.email}',
    application: '{$.auth.application}',

    // Environment & Config
    envVar: '{$.env.VARIABLE_NAME}',
    subscriptionId: '{$.subscription.id}',

    // Constants
    trueValue: '{$.const.true}',
    falseValue: '{$.const.false}',
    nullValue: '{$.const.null}',
    currentTime: '{$.const.now}',

    // Previous task results
    taskData: '{$.previousTaskId.data}',
    taskSuccess: '{$.previousTaskId.success}',
    taskMessage: '{$.previousTaskId.message}',
    nestedTaskData: '{$.taskId.data.items}',

    // Array access
    firstElement: '{$.array[0]}',
    elementProperty: '{$.array[0].property}',
    nestedArray: '{$.data.items[5].values[0]}'
};

/**
 * VALUE TYPES DETAILED EXPLANATION
 * 
 * Each IKeyValue has a Type that determines how its Value is resolved:
 */
export const VALUE_TYPE_DETAILS = {
    /**
     * LITERAL - Static value used as-is
     * No resolution needed, value is passed directly
     * 
     * Example:
     * { Id: "d4e5f6a7-1234-4b56-8c78-9a0b1c2d3e4f", Key: "status", Value: "active", Type: "Literal" }
     * â†’ { status: "active" }
     */
    Literal: {
        description: 'Static value - strings, numbers, booleans, null',
        resolution: 'Value is used directly without any transformation',
        examples: [
            '{ Id: "b3c4d5e6-2345-4c67-8d89-0a1b2c3d4e5f", Key: "name", Value: "John", Type: "Literal" }',
            '{ Id: "c4d5e6f7-3456-4d78-8e9a-1b2c3d4e5f6a", Key: "count", Value: 10, Type: "Literal" }',
            '{ Id: "e5f6a7b8-4567-4e89-8fab-2c3d4e5f6a7b", Key: "active", Value: true, Type: "Literal" }'
        ]
    },

    /**
     * PROPERTY - Dynamic path expression
     * Value is a path that gets resolved against state
     * 
     * Example:
     * { Id: "f6a7b8c9-5678-4f9a-80bc-3d4e5f6a7b8c", Key: "userId", Value: "{$.auth.userId}", Type: "Property" }
     * â†’ { userId: "user-123" } (resolved from state.auth.userId)
     */
    Property: {
        description: 'Dynamic reference using path expression',
        resolution: 'Path is resolved using getValueByPath(state, path)',
        rules: [
            'Single path: getValueByPath resolves entire value',
            'Multiple paths in string: resolveString substitutes each path',
            '{$} special case: returns entire state object'
        ],
        examples: [
            '{ Id: "a7b8c9d0-6789-40ab-81cd-4e5f6a7b8c9d", Key: "userId", Value: "{$.auth.userId}", Type: "Property" }',
            '{ Id: "b8c9d0e1-789a-41bc-82de-5f6a7b8c9d0e", Key: "items", Value: "{$.query.data.items}", Type: "Property" }',
            '{ Id: "c9d0e1f2-89ab-42cd-83ef-6a7b8c9d0e1f", Key: "fullName", Value: "{$.firstName} {$.lastName}", Type: "Property" }'
        ]
    },

    /**
     * CALCULATED - JavaScript-like expression evaluation
     * Uses math.js evaluate() for expressions
     * 
     * Example:
     * { Id: "d0e1f2a3-9abc-43de-8401-7b8c9d0e1f2a", Key: "total", Value: "{$.price} * {$.quantity}", Type: "Calculated" }
     * â†’ { total: 150 } (if price=10, quantity=15)
     */
    Calculated: {
        description: 'JavaScript-like mathematical/logical expressions',
        resolution: 'Expression is parsed and evaluated with math.js',
        supportedOperations: [
            'Arithmetic: +, -, *, /, %, ^',
            'Comparison: ==, !==, <, >, <=, >=',
            'Logical: and, or, not',
            'Functions: abs, ceil, floor, round, sqrt, etc.'
        ],
        examples: [
            '{ Id: "e1f2a3b4-abcd-44ef-8512-8c9d0e1f2a3b", Key: "total", Value: "{$.price} * {$.quantity}", Type: "Calculated" }',
            '{ Id: "f2a3b4c5-bcde-45fa-8623-9d0e1f2a3b4c", Key: "isValid", Value: "{$.age} >= 18", Type: "Calculated" }',
            '{ Id: "a3b4c5d6-cdef-46ab-8734-0e1f2a3b4c5d", Key: "discount", Value: "{$.total} * 0.1", Type: "Calculated" }'
        ]
    },

    /**
     * OBJECT - Nested object resolution
     * Value is an array of IKeyValue that gets recursively resolved
     * 
     * Example:
     * { Id: "b4c5d6e7-defa-47bc-8845-1f2a3b4c5d6e", Key: "user", Value: [
     *     { Id: "c5d6e7f8-efab-48cd-8956-2a3b4c5d6e7f", Key: "id", Value: "{$.auth.userId}", Type: "Property" },
     *     { Id: "d6e7f8a9-fabc-49de-8a67-3b4c5d6e7f8a", Key: "email", Value: "{$.body.email}", Type: "Property" }
     * ], Type: "Object" }
     * â†’ { user: { id: "123", email: "test@example.com" } }
     */
    Object: {
        description: 'Nested object with recursive resolution',
        resolution: 'resolveDocument is called recursively on Value array',
        examples: [
            '{ Id: "e7f8a9b0-abcd-4aef-8b78-4c5d6e7f8a9b", Key: "address", Value: [{ Id: "f8a9b0c1-bcde-4bfa-8c89-5d6e7f8a9b0c", Key: "city", Value: "{$.body.city}", Type: "Property" }], Type: "Object" }'
        ]
    },

    /**
     * RULE - Reference to a stored rule definition
     * Loads rule from RuleRepository and resolves it
     */
    Rule: {
        description: 'Reference to stored rule for resolution',
        resolution: 'Loads rule from database, then resolves with current context',
        properties: ['Subscription', 'Schema', 'Rule', 'Key', 'Value'],
        examples: [
            '{ Id: "a9b0c1d2-cdef-4cab-8d9a-6e7f8a9b0c1d", Key: "discount", Schema: "pricing", Rule: "calculate-discount", Type: "Rule" }'
        ]
    },

    /**
     * WORKFLOW - Call another action and use its response
     * Executes another schema/action and maps the response
     */
    Workflow: {
        description: 'Call another workflow action and use response',
        resolution: 'Executes RequestService.action and resolves response',
        properties: ['Subscription', 'Schema', 'Action', 'DocumentId', 'Body', 'Response'],
        examples: [
            '{ Id: "b0c1d2e3-defa-4dbc-8eab-7f8a9b0c1d2e", Key: "user", Schema: "users", Action: "get", DocumentId: "{$.params.userId}", Type: "Workflow" }'
        ]
    },

    /**
     * CONDITION - Conditional value based on condition evaluation
     * Evaluates condition and returns onSuccess or onFailure
     */
    Condition: {
        description: 'Conditional resolution based on condition evaluation',
        resolution: 'checkCondition evaluates conditions, returns onSuccess or onFailure',
        properties: ['conditions', 'onSuccess', 'onFailure', 'Value'],
        examples: [
            '{ Id: "c1d2e3f4-efab-4ecd-8fbc-8a9b0c1d2e3f", Key: "status", conditions: { operator: "equals", fact: "{$.active}", value: "true" }, onSuccess: { Id: "d2e3f4a5-fabc-4fde-80cd-9b0c1d2e3f4a", Key: "status", Value: "Active" }, onFailure: { Id: "e3f4a5b6-abcd-40ef-81de-0c1d2e3f4a5b", Key: "status", Value: "Inactive" }, Type: "Condition" }'
        ]
    },

    /**
     * SWITCH - Switch/case based value selection
     * Matches Value against Case items, returns matching Rule
     */
    Switch: {
        description: 'Switch-case pattern for value selection',
        resolution: 'Value is evaluated, matched against Case array, Rule is resolved',
        properties: ['Value', 'Case[]'],
        caseStructure: '{ Case: string, Rule: IKeyValue, Break: boolean }',
        examples: [
            '{ Id: "f4a5b6c7-bcde-41fa-82ef-1d2e3f4a5b6c", Key: "message", Value: "{$.status}", Case: [{ Case: "active", Rule: { Id: "a5b6c7d8-cdef-42ab-8301-2e3f4a5b6c7d", Key: "message", Value: "Active" }, Break: true }], Type: "Switch" }'
        ]
    }
};

/**
 * HOW EACH TASK TYPE USES STATE
 * 
 * Every task receives the full state object and can:
 * 1. READ from state using path expressions in its properties
 * 2. WRITE to state (via workflow engine storing result as state[task.id])
 */
export const TASK_STATE_USAGE = {
    /**
     * DOCUMENT TASK - Database CRUD operations
     */
    Document: {
        stateReads: [
            'subscriptionId: getValueByPath(state, task.subscriptionId)',
            'schemaId: getValueByPath(state, task.schemaId)',
            'documentId: getValueByPath(state, task.documentId)',
            'payload: resolveDocument(task.payload, state)'
        ],
        stateWrites: 'Result stored as state[task.id] = { success, data: document }',
        specialBehavior: [
            'Post: Creates new document with resolved payload',
            'Put: Updates document, merges resolved payload with existing',
            'Get: Retrieves document, loads relations if addRelation=true',
            'Paging: Resolves where, sort, select from state'
        ],
        example: `
// Task definition
{ type: "Document", id: "getUser", method: "Get",
  subscriptionId: "{$.subscription.id}",
  schemaId: "{$.params.schema}",
  documentId: "{$.params.userId}" }

// After execution, state contains:
state.getUser = { success: true, data: { id: "...", name: "John" } }

// Access in later tasks:
{$.getUser.data.name} â†’ "John"
`
    },

    /**
     * QUERY TASK - Database queries
     */
    Query: {
        stateReads: [
            'repository: getValueByPath(state, task.repository)',
            'where: resolveWhere(task.where, state) or resolveDocument(task.where, state)',
            'select: resolveDocument(task.select, state)',
            'sort/order: resolveDocument(task.sort, state)',
            'take/skip/page: getValueByPath for pagination'
        ],
        stateWrites: 'Result stored as state[task.id] = { success, data: results[], count? }',
        specialBehavior: [
            'Find: Resolves where conditions with operators (Like, In, Between, etc.)',
            'FindPaging: Includes count and pagination metadata',
            'Builder: Uses TypeORM QueryBuilder with resolved conditions',
            'RawQuery: Path expressions resolved in SQL string'
        ]
    },

    /**
     * RESOLVER TASK - Data transformation
     */
    Resolver: {
        stateReads: [
            'Object method: resolveDocument(task.payload, state)',
            'Object with isArray: getValueByPath(state, task.path), then maps each item',
            'String method: getValueByPath for task.string, resolveString for substitution'
        ],
        stateWrites: 'Result stored as state[task.id] = { success, data: transformedData }',
        contextCreation: [
            'When isArray=true: Each item gets its own context { ...item, _type: "$" }',
            'This allows {$.fieldName} to reference current item fields'
        ],
        example: `
// Object resolver - transform single object
{ type: "Resolver", method: "Object", id: "mapUser",
  payload: [
    { Id: "b6c7d8e9-defa-43bc-8412-3f4a5b6c7d8e", Key: "userId", Value: "{$.getUser.data.id}", Type: "Property" },
    { Id: "c7d8e9fa-efab-44cd-8523-4a5b6c7d8e9f", Key: "fullName", Value: "{$.getUser.data.firstName} {$.getUser.data.lastName}", Type: "Property" }
  ] }

// Array resolver - transform each item
{ type: "Resolver", method: "Object", id: "mapItems", isArray: true,
  path: "{$.query.data}",
  payload: [
    { Id: "d8e9fa0b-fabc-45de-8634-5b6c7d8e9fa0", Key: "id", Value: "{$.id}", Type: "Property" },     // {$.id} refers to current item
    { Id: "e9fa0b1c-abcd-46ef-8745-6c7d8e9fa0b1", Key: "name", Value: "{$.name}", Type: "Property" }  // Not {$.query.data[i].name}!
  ] }

// String resolver - template strings
{ type: "Resolver", method: "String", id: "greeting",
  string: "Hello {$.user.name}, you have {$.count} messages",
  payload: [] }
`
    },

    /**
     * RESPONSE TASK - Final workflow output
     */
    Response: {
        stateReads: [
            'payload: resolveDocument(task.payload, state)',
            'All previous task results available via {$.taskId.data}'
        ],
        stateWrites: 'Returns resolved payload as final Response',
        example: `
{ type: "Response", id: "result",
  payload: [
    { Id: "fa0b1c2d-bcde-47fa-8856-7d8e9fa0b1c2", Key: "success", Value: true, Type: "Literal" },
    { Id: "0b1c2d3e-cdef-48ab-8967-8e9fa0b1c2d3", Key: "statusCode", Value: 200, Type: "Literal" },
    { Id: "1c2d3e4f-defa-49bc-8a78-9fa0b1c2d3e4", Key: "data", Value: "{$.resolver.data}", Type: "Property" },
    { Id: "2d3e4f5a-efab-4acd-8b89-0ab1c2d3e4f5", Key: "message", Value: "Operation completed", Type: "Literal" }
  ] }

// Returns: { success: true, statusCode: 200, data: {...}, message: "..." }
`
    },

    /**
     * ARRAY TASK - Array operations
     */
    Array: {
        stateReads: [
            'path: getValueByPath(state, task.path) - source array',
            'value: getValueByPath for Push method',
            'index: getValueByPath for Index/Slice/Splice methods',
            'payload: resolveDocument for Map method',
            'conditions: checkCondition for Find/Filter methods'
        ],
        contextCreation: [
            'Map: { ...state, [task.var]: currentItem }',
            'Filter: { ...state, [task.var]: currentItem }',
            'Find: { ...state, [task.var]: currentItem }',
            'Sort: { ...state, [task.var]: currentItem }',
            'Default var name if not specified: "map", "filter", "find", "sort"'
        ],
        example: `
// Array Map - transform array items
{ type: "Array", method: "Map", id: "mappedItems",
  path: "{$.query.data}",        // Source array
  var: "item",                   // Variable name for current item
  payload: [
    { Id: "3e4f5a6b-fabc-4bde-8c9a-1b2c3d4e5f6a", Key: "id", Value: "{$.item.id}", Type: "Property" },      // Access via var name
    { Id: "4f5a6b7c-abcd-4cef-8dab-2c3d4e5f6a7b", Key: "label", Value: "{$.item.name}", Type: "Property" }
  ] }

// Array Filter - filter based on condition
{ type: "Array", method: "Filter", id: "activeItems",
  path: "{$.items.data}",
  var: "item",
  conditions: { operator: "equals", fact: "{$.item.isActive}", value: "true" } }
`
    },

    /**
     * REQUEST TASK - Service calls
     */
    Request: {
        stateReads: [
            'payload: resolveDocument or getValueByPath depending on type',
            'schema: getValueByPath(state, task.schema)',
            'action: getValueByPath(state, task.action)',
            'documentId: getValueByPath(state, task.documentId)',
            'subscription: getValueByPath(state, task.subscription) for Proxy'
        ],
        arrayIteration: [
            'When isArray=true and path is set:',
            'getValueByPath(state, task.path) gets source array',
            'Each item creates context: { ...item, _type: "$" }',
            'Payload resolved for each item separately'
        ],
        example: `
// Action - call another action
{ type: "Request", method: "Action", id: "createOrder",
  schema: "orders", action: "create",
  payload: [
    { Id: "5a6b7c8d-bcde-4dfa-8ebc-3d4e5f6a7b8c", Key: "userId", Value: "{$.auth.userId}", Type: "Property" },
    { Id: "6b7c8d9e-cdef-4eab-8fcd-4e5f6a7b8c9d", Key: "items", Value: "{$.body.items}", Type: "Property" }
  ] }

// Iterate and create multiple
{ type: "Request", method: "Post", id: "createItems",
  schema: "items", isArray: true,
  path: "{$.body.items}",
  payload: [
    { Id: "7c8d9e0f-defa-4fbc-80de-5f6a7b8c9d0e", Key: "name", Value: "{$.name}", Type: "Property" },  // Current item's name
    { Id: "8d9e0f1a-efab-40cd-81ef-6a7b8c9d0e1f", Key: "orderId", Value: "{$.createOrder.data.id}", Type: "Property" }
  ] }
`
    },

    /**
     * LOOP/ITERATOR TASK - Iteration with nested tasks
     */
    LoopIterator: {
        stateReads: [
            'path: getValueByPath(state, task.path) - source array',
            'break conditions evaluated against enriched state'
        ],
        contextCreation: [
            'Each iteration: { ...state, [task.var]: currentItem, [task.index]: currentIndex }',
            'Nested tasks execute with enriched state',
            'Nested task results available to subsequent nested tasks'
        ],
        example: `
// Loop through items
{ type: "Loop", id: "processItems",
  path: "{$.items.data}",
  var: "currentItem",
  tasks: [
    { type: "Document", id: "updateItem", method: "Put",
      documentId: "{$.currentItem.id}",
      payload: [{ Id: "9e0f1a2b-fabc-41de-8201-7b8c9d0e1f2a", Key: "processed", Value: true, Type: "Literal" }] }
  ] }

// Iterator with break condition
{ type: "Iterator", id: "findFirst",
  path: "{$.items.data}",
  var: "item", index: "idx",
  breakConditions: { operator: "equals", fact: "{$.item.status}", value: "found" },
  tasks: [...] }
`
    },

    /**
     * SWITCH TASK - Conditional branching
     */
    Switch: {
        stateReads: [
            'switch: resolveDocument(task.switch, state) evaluates switch value',
            'case conditions: checkCondition with state'
        ],
        contextCreation: [
            'Enriched state: { ...state, switch: resolvedSwitchValue }',
            'Case tasks execute with this enriched state'
        ]
    },

    /**
     * CONDITION TASK - Condition evaluation
     */
    Condition: {
        stateReads: [
            'conditions: checkCondition(state, task.conditions)',
            'Facts resolved: getValueByPath(state, condition.fact)',
            'Values resolved: getValueByPath(state, condition.value)'
        ],
        example: `
// Simple condition check
{ type: "Condition", id: "checkAuth",
  conditions: {
    operator: "notNull",
    fact: "{$.auth.userId}"
  },
  success: { statusCode: 200, success: true },
  failed: { statusCode: 401, success: false, message: "Unauthorized" } }

// Complex condition with AND/OR
{ type: "Condition", id: "checkPermission",
  conditions: {
    and: [
      { operator: "notNull", fact: "{$.auth.userId}" },
      { operator: "in", fact: "{$.params.schema}", value: "{$.auth.allowedSchemas}" }
    ]
  } }
`
    }
};

/**
 * STATE RESOLUTION FLOW DIAGRAM
 * 
 * Task Definition                     State Object                      Result
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * 
 * { Key: "name",                      state = {
 *   Value: "{$.body.name}",     â†’       body: { name: "John" },    â†’    { name: "John" }
 *   Type: "Property" }                  auth: { userId: "123" }
 *                                     }
 * 
 * { Key: "fullName",                  state = {
 *   Value: "{$.first} {$.last}",  â†’     first: "John",             â†’    { fullName: "John Doe" }
 *   Type: "Property" }                  last: "Doe"
 *                                     }
 * 
 * { Key: "total",                     state = {
 *   Value: "{$.price} * 1.1",     â†’     price: 100                 â†’    { total: 110 }
 *   Type: "Calculated" }              }
 */

/**
 * Path expression syntax:
 * - {$.path.to.value} - Access nested properties
 * - {$.array[0]} - Access array index (0-127 supported)
 * - {$.taskId.data} - Access previous task result
 */

// =============================================================================
// WORKFLOW EXECUTION FLOW
// =============================================================================

/**
 * WORKFLOW ENGINE EXECUTION FLOW
 * 
 * The workflow engine executes requests through a well-defined pipeline:
 * 
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚                        1. REQUEST ENTRY POINT                           â”‚
 * â”‚                        execWorkflow(request)                            â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 *                                 â”‚
 *                                 â–¼
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚                        2. ROUTE RESOLUTION                              â”‚
 * â”‚  - Resolves subscription, schema, provider from request params          â”‚
 * â”‚  - Sets request.subscription, request.schema, request.provider          â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 *                                 â”‚
 *                                 â–¼
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚                    3. PAYLOAD VALIDATION (AJV)                          â”‚
 * â”‚  - Validates request.body against action.Body JSON Schema               â”‚
 * â”‚  - Validates request.params against action.Params JSON Schema           â”‚
 * â”‚  - Validates request.query against action.Query JSON Schema             â”‚
 * â”‚  - Returns 400 PayloadValidationError if validation fails               â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 *                                 â”‚
 *                                 â–¼
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚                        4. exec(request)                                 â”‚
 * â”‚  - Core workflow execution begins                                       â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 *                                 â”‚
 *                                 â–¼
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚                    5. CACHE CHECK (if enabled)                          â”‚
 * â”‚  - Checks if action.Cache.Enabled === true                               â”‚
 * â”‚  - Computes cache key from headers, subscriptionId, schemaId, actionId  â”‚
 * â”‚  - Returns cached response if found (short-circuits execution)          â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 *                                 â”‚
 *                                 â–¼
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚                     6. STATE INITIALIZATION                             â”‚
 * â”‚  Creates IState object with all request context                         â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 *                                 â”‚
 *                                 â–¼
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚                    7. GET REPOSITORY                                    â”‚
 * â”‚  - Connects to database based on schema.provider                        â”‚
 * â”‚  - Creates TypeORM repository for the schema                            â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 *                                 â”‚
 *                                 â–¼
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚              8. CONTEXT TASKS EXECUTION (if defined)                    â”‚
 * â”‚  - Executes action.ContextTasks[] sequentially                          â”‚
 * â”‚  - Results stored in state.context                                      â”‚
 * â”‚  - Used for loading shared data needed by main tasks                    â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 *                                 â”‚
 *                                 â–¼
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚              9. VALIDATION RULES (if defined)                           â”‚
 * â”‚  - Executes action.Rules.Validation[]                                   â”‚
 * â”‚  - Loads existing document if params.documentId is valid UUID           â”‚
 * â”‚  - Evaluates each rule against {$.body, $root: existingDocument}        â”‚
 * â”‚  - Returns 400 RuleValidationError if any rule fails                    â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 *                                 â”‚
 *                                 â–¼
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚                   10. MAIN TASKS EXECUTION                              â”‚
 * â”‚  execTasks(span, request, tasks, state, repository)                     â”‚
 * â”‚                                                                         â”‚
 * â”‚  for (let task of tasks) {                                              â”‚
 * â”‚      response = await execTask(span, request, task, state, repository); â”‚
 * â”‚      state[task.id] = response;  // Store result for later tasks        â”‚
 * â”‚      if (!response.success) break; // Stop on first failure             â”‚
 * â”‚  }                                                                      â”‚
 * â”‚                                                                         â”‚
 * â”‚  SPECIAL CASES:                                                         â”‚
 * â”‚  - Request.Forward/ForwardProxy: Returns immediately after success      â”‚
 * â”‚  - Control flow tasks (Switch, Loop, Iterator, etc.) manage own flow    â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 *                                 â”‚
 *                                 â–¼
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚                    11. POST-EXECUTION                                   â”‚
 * â”‚  - If success & cache enabled: Cache.setResponse(response, TTL)         â”‚
 * â”‚  - If failed & DLQ enabled: Forward to Dead Letter Queue topic          â”‚
 * â”‚  - Return response to caller                                            â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 */

/**
 * STATE OBJECT (IState) - Available to all tasks via {$.path} syntax
 * 
 * The state object is the execution context shared across all tasks.
 * Each task can read from state and write its result to state.
 */
export const STATE_OBJECT_STRUCTURE = {
    // Request Context - Available from start
    auth: 'Authentication context (user info, roles, permissions)',
    subscription: 'Full subscription entity with configuration',
    subscriptionId: 'Current subscription UUID',
    body: 'Request body - {$.body.fieldName}',
    params: 'URL params - {$.params.documentId}, {$.params.schema}, {$.params.action}',
    query: 'Query string - {$.query.page}, {$.query.limit}',
    cookies: 'Request cookies - {$.cookies.sessionId}',
    headers: 'Request headers - {$.headers.authorization}',

    // Environment & Configuration
    env: 'Subscription environment variables - {$.env.API_KEY}',
    topic: 'Kafka topic for data events',
    elasticsearch: 'Elasticsearch config { enable: boolean, index: string }',

    // Built-in Constants - {$.const.*}
    const: {
        true: 'Boolean true - {$.const.true}',
        false: 'Boolean false - {$.const.false}',
        null: 'Null value - {$.const.null}',
        now: 'Current ISO timestamp - {$.const.now}'
    },

    // Metadata - Available from start
    _type: '"$" - Always set to $ for path resolution',
    _action: 'Current action SystemName - {$._action}',
    _schema: 'Current schema name - {$._schema}',
    _table: 'Database table name - {$._table}',
    _namespace: 'Subscription name - {$._namespace}',
    _cache_ttl: 'Schema cache TTL setting',
    _silver: 'Silver tier configuration',

    // Dynamic - Added during execution
    context: 'Results from ContextTasks - {$.context.taskId.data}',
    '[taskId]': 'Each task result stored by its ID - {$.myTask.data}, {$.myTask.success}'
};

/**
 * TASK RESULT STRUCTURE
 * 
 * Every task execution returns a Response object:
 * {
 *   statusCode: number,    // HTTP status code (200, 400, 404, 500, etc.)
 *   success: boolean,      // true if task succeeded
 *   code: string,          // Error/success code for identification
 *   message: string,       // Human-readable message
 *   data: any,             // Task result data (access via {$.taskId.data})
 *   name?: string,         // Error name (for failures)
 *   error?: any            // Detailed error info (for failures)
 * }
 * 
 * ACCESS PATTERNS:
 * - {$.taskId.data} - Get the result data from a task
 * - {$.taskId.success} - Check if task succeeded
 * - {$.taskId.data.items} - Access nested data
 * - {$.taskId.data[0]} - Access array element (indices 0-127 supported)
 */

/**
 * EXECUTION RULES
 * 
 * 1. SEQUENTIAL EXECUTION:
 *    - Tasks execute in order (index 0, 1, 2, ...)
 *    - Each task waits for previous task to complete
 *    - Use Promise task for parallel execution
 * 
 * 2. FAIL-FAST BEHAVIOR:
 *    - If any task returns success: false, execution stops immediately
 *    - Subsequent tasks are NOT executed
 *    - The failing task's response becomes the workflow response
 * 
 * 3. STATE ACCUMULATION:
 *    - Each task result is stored: state[task.id] = response
 *    - Later tasks can access earlier results via {$.earlierTaskId.data}
 *    - State persists for the entire request lifecycle
 * 
 * 4. SPECIAL TASK BEHAVIORS:
 *    - Response: Should be last task, defines final output
 *    - Request.Forward/ForwardProxy: Returns immediately, skips remaining tasks
 *    - Switch/State/Loop/Iterator: Execute nested tasks internally
 *    - Promise: Executes multiple task branches in parallel
 *    - Transaction: Provides rollback on failure
 * 
 * 5. ERROR PROPAGATION:
 *    - Task failures propagate up immediately
 *    - Use Condition task to handle expected failures gracefully
 *    - Use Transaction for atomic operations with rollback
 */

/**
 * CONTROL FLOW PATTERNS
 */
export const CONTROL_FLOW_PATTERNS = {
    // Sequential (default) - tasks run one after another
    sequential: {
        description: 'Default flow - tasks execute in order',
        example: '["Task1", "Task2", "Task3"] - executes 1, then 2, then 3'
    },

    // Conditional branching with Switch
    switch: {
        description: 'Execute different task branches based on conditions',
        example: 'Switch task evaluates conditions, runs matching case tasks'
    },

    // Iteration with Loop
    loop: {
        description: 'Repeat tasks for each item in an array',
        example: 'Loop over {$.items}, execute nested tasks for each item'
    },

    // Iteration with Iterator (with break support)
    iterator: {
        description: 'Iterate with ability to break early based on conditions',
        example: 'Iterator with breakConditions to stop when condition met'
    },

    // Parallel execution with Promise
    promise: {
        description: 'Execute multiple task branches simultaneously',
        example: 'PromiseAll executes all branches, waits for all to complete'
    },

    // State-based flow
    state: {
        description: 'Navigate state paths and execute tasks at path',
        example: 'State task resolves path and executes tasks at that location'
    },

    // Transactional execution
    transaction: {
        description: 'Execute tasks with rollback on failure',
        example: 'Transaction executes tasks, runs rollback tasks if any fail'
    },

    // Nested workflow
    workflow: {
        description: 'Call another workflow template or custom tasks',
        example: 'Workflow.Template calls predefined workflow, Workflow.Custom runs inline tasks'
    }
};

/**
 * TASK EXECUTION ORDER EXAMPLE
 * 
 * Given tasks: [Validator, Query, Condition, Document, Resolver, Response]
 * 
 * Step 1: Validator executes
 *         state.validator = { success: true, data: {...} }
 * 
 * Step 2: Query executes (can use {$.validator.data})
 *         state.query = { success: true, data: [...] }
 * 
 * Step 3: Condition executes (can use {$.query.data})
 *         state.condition = { success: true, data: true }
 * 
 * Step 4: Document executes (can use {$.condition.data}, {$.query.data})
 *         state.document = { success: true, data: {...} }
 * 
 * Step 5: Resolver executes (can use all previous results)
 *         state.resolver = { success: true, data: {...transformed...} }
 * 
 * Step 6: Response executes (uses {$.resolver.data} for final output)
 *         Returns final response to client
 * 
 * IF Step 2 (Query) fails:
 *         Query returns { success: false, message: "Not found" }
 *         Steps 3-6 are SKIPPED
 *         Client receives Query's error response
 */

// =============================================================================
// WORKFLOW BEST PRACTICES
// =============================================================================

// Workflow best practices
export const WORKFLOW_BEST_PRACTICES = [
    {
        category: 'Error Handling',
        practices: [
            'Always define success, failed, and error handlers for each task',
            'Use Condition tasks to validate data before processing',
            'Implement proper error responses with meaningful messages',
            'Log errors with context using the History task'
        ]
    },
    {
        category: 'Performance',
        practices: [
            'Use Cache tasks for frequently accessed data',
            'Use Promise task for parallel operations',
            'Minimize Query tasks by selecting only needed fields',
            'Use paging for large result sets'
        ]
    },
    {
        category: 'Security',
        practices: [
            'Use Validator task to validate all input data',
            'Use Security task for authentication/authorization',
            'Never expose sensitive data in Response payload',
            'Use Crypto/RSA tasks for sensitive data encryption'
        ]
    },
    {
        category: 'Maintainability',
        practices: [
            'Use descriptive names for tasks and IDs',
            'Always include a Resolver before Response',
            'Group related operations in Sequence tasks',
            'Use Variable tasks for reusable values'
        ]
    }
];

// Common workflow patterns
export const WORKFLOW_PATTERNS = [
    {
        name: 'CRUD - Create',
        description: 'Create entity with validation pattern',
        template: ['Validator', 'Entity (Post)', 'Cache (Set)', 'Resolver', 'Response']
    },
    {
        name: 'CRUD - Read',
        description: 'Read entity with caching pattern',
        template: ['Cache (Get)', 'Condition', 'Entity (Get)', 'Cache (Set)', 'Resolver', 'Response']
    },
    {
        name: 'CRUD - Update',
        description: 'Update entity pattern',
        template: ['Validator', 'Entity (Get)', 'Condition', 'Entity (Put)', 'Cache (Clear)', 'Resolver', 'Response']
    },
    {
        name: 'CRUD - Delete',
        description: 'Delete entity pattern',
        template: ['Entity (Get)', 'Condition', 'Entity (Delete)', 'Cache (Clear)', 'Resolver', 'Response']
    },
    {
        name: 'List with Paging',
        description: 'Paginated list pattern',
        template: ['Entity (Paging)', 'Array (Map)', 'Resolver', 'Response']
    },
    {
        name: 'External API Integration',
        description: 'Call external API with error handling',
        template: ['Validator', 'HTTP', 'Condition', 'Resolver', 'Response']
    },
    {
        name: 'Batch Processing',
        description: 'Process items in a loop',
        template: ['Query', 'Loop', 'Array (Map)', 'Resolver', 'Response']
    },
    {
        name: 'Parallel Fetch',
        description: 'Fetch multiple data sources in parallel',
        template: ['Promise', 'Resolver', 'Response']
    }
];

export const getTaskDocumentation = (taskType: string): TaskDocumentation | undefined => {
    return TASK_DOCUMENTATION[taskType as TaskType];
};

export const getAllTaskTypes = (): TaskType[] => {
    return Object.keys(TASK_DOCUMENTATION) as TaskType[];
};

export const getTaskExamples = (taskType: string): string[] => {
    const doc = getTaskDocumentation(taskType);
    return doc?.examples || [];
};

/**
 * Get execution flow information for the AI assistant
 */
/**
 * DEEP TASK EXECUTION DETAILS
 * Documents exactly how each task type executes based on source code analysis
 * from apt-yuj/src/workflow/task.*.ts files
 */
export const TASK_EXECUTION_DETAILS: Record<string, {
    methods: Record<string, {
        description: string;
        stateReads: string[];
        stateWrites: string[];
        executionFlow: string[];
        specialBehaviors?: string[];
    }>;
}> = {
    // =========================================================================
    // CONTROL FLOW TASKS
    // =========================================================================

    Condition: {
        methods: {
            default: {
                description: 'Evaluates conditions and branches to onSuccess or onFailure tasks',
                stateReads: ['task.conditions.fact paths resolved via getValueByPath'],
                stateWrites: ['state[task.id] = result of last executed branch task'],
                executionFlow: [
                    '1. checkCondition(state, task.conditions) evaluates the condition tree',
                    '2. If true: executes all tasks in onSuccess[] sequentially',
                    '3. If false: executes all tasks in onFailure[] sequentially',
                    '4. Each nested task result stored as state[nestedTask.id]',
                    '5. Parent task result = last executed nested task result'
                ],
                specialBehaviors: [
                    'Supports nested "and" and "any" (or) arrays for complex logic',
                    'Operators: equals, notEquals, greaterThan, lessThan, contains, notNull, isNull, in, notIn',
                    'If onFailure is empty and condition fails, returns task.failed response'
                ]
            }
        }
    },

    Switch: {
        methods: {
            default: {
                description: 'Routes execution based on path value matching case keys',
                stateReads: ['task.path resolved via getValueByPath to get switch value'],
                stateWrites: ['state[task.id] = result of matched case tasks'],
                executionFlow: [
                    '1. getValueByPath(state, task.path) resolves the switch value',
                    '2. Looks for matching key in task.case object',
                    '3. If match found: executes all tasks in case[value][] sequentially',
                    '4. If no match: executes all tasks in task.default[] sequentially',
                    '5. Each nested task stored as state[nestedTask.id]'
                ],
                specialBehaviors: [
                    'case object keys are string values to match against',
                    'Comparison is exact match (no partial matching)',
                    'default is optional - if missing and no match, returns task.failed'
                ]
            }
        }
    },

    Loop: {
        methods: {
            default: {
                description: 'Executes tasks N times with index tracking',
                stateReads: ['task.iterations resolved via getValueByPath'],
                stateWrites: ['state[task.id-{i}] for each iteration', 'state[task.index || "i"] = current index'],
                executionFlow: [
                    '1. Resolve iterations count from state if path expression',
                    '2. For i = task.start (default 0) to iterations:',
                    '   a. Set state[task.index || "i"] = current i',
                    '   b. Execute all tasks in task.tasks[] sequentially',
                    '   c. Store iteration result as state[task.id + "-" + i]',
                    '3. Final state[task.id] = last iteration result'
                ],
                specialBehaviors: [
                    'task.index sets the variable name for current index (default: "i")',
                    'task.start sets the starting index (default: 0)',
                    'Results from all iterations are preserved in state with suffix'
                ]
            }
        }
    },

    Iterator: {
        methods: {
            Iterate: {
                description: 'Iterates over array items with per-item task execution',
                stateReads: ['task.path resolved to get array', 'item assigned to task.var'],
                stateWrites: ['state[task.var] = current item', 'state[task.index] = current index'],
                executionFlow: [
                    '1. getValueByPath(state, task.path) gets the array',
                    '2. For each item in array:',
                    '   a. state[task.var || "iterate"] = current item',
                    '   b. state[task.index || "i"] = current index',
                    '   c. If task.async: push task execution to promises array',
                    '   d. If !task.async: execute tasks sequentially',
                    '   e. Check breakConditions if task.break is true',
                    '3. If async: await Promise.all(promises)',
                    '4. Final result aggregates all iteration results'
                ],
                specialBehaviors: [
                    'task.async = true enables parallel execution of all iterations',
                    'task.break = true enables checking breakConditions after each iteration',
                    'breakConditions use same condition syntax as Condition task',
                    'Access current item via {$.var.property} or {$.iterate.property}'
                ]
            }
        }
    },

    Promise: {
        methods: {
            PromiseAll: {
                description: 'Executes all tasks in parallel, fails if any fail',
                stateReads: ['All task paths resolved in parallel'],
                stateWrites: ['state[task.id] = array of all results'],
                executionFlow: [
                    '1. Create Promise for each task in task.tasks[]',
                    '2. await Promise.all(promises)',
                    '3. If any task fails, entire Promise.all fails',
                    '4. Results array stored in task.success.data'
                ]
            },
            PromiseAllSettled: {
                description: 'Executes all tasks in parallel, returns all results (success/failure)',
                stateReads: ['All task paths resolved in parallel'],
                stateWrites: ['state[task.id] = array of {status, value/reason}'],
                executionFlow: [
                    '1. Create Promise for each task in task.tasks[]',
                    '2. await Promise.allSettled(promises)',
                    '3. Returns all results regardless of success/failure',
                    '4. Each result has status: "fulfilled" or "rejected"'
                ]
            },
            PromiseRace: {
                description: 'Returns result of first task to complete',
                stateReads: ['All task paths resolved in parallel'],
                stateWrites: ['state[task.id] = first completed result'],
                executionFlow: [
                    '1. Create Promise for each task in task.tasks[]',
                    '2. await Promise.race(promises)',
                    '3. Returns as soon as any task completes',
                    '4. Other tasks may still be running'
                ]
            },
            PromiseResolve: {
                description: 'Wraps value in resolved promise',
                stateReads: ['task.tasks for values to resolve'],
                stateWrites: ['state[task.id] = resolved value'],
                executionFlow: ['1. Promise.resolve(value)']
            },
            PromiseReject: {
                description: 'Wraps value in rejected promise',
                stateReads: ['task.tasks for rejection reason'],
                stateWrites: ['state[task.id] = rejection error'],
                executionFlow: ['1. Promise.reject(reason)']
            }
        }
    },

    State: {
        methods: {
            default: {
                description: 'Executes tasks and writes result to specific state path',
                stateReads: ['task.path pattern to determine write location'],
                stateWrites: ['Writes to resolved path in state object'],
                executionFlow: [
                    '1. Execute all tasks in task.tasks[] sequentially',
                    '2. Store each task result as state[_task.id]',
                    '3. Parse task.path pattern like {$.type.path.to.target}',
                    '4. Navigate to parent object in state',
                    '5. Set final property to task.success.data'
                ],
                specialBehaviors: [
                    'Path must match pattern {$.type.nested.path}',
                    'Creates intermediate objects if needed',
                    'Only writes if state._type matches first path segment'
                ]
            }
        }
    },

    Transaction: {
        methods: {
            default: {
                description: 'Executes tasks with mutex lock and rollback on failure',
                stateReads: ['task.key resolved for mutex identifier'],
                stateWrites: ['state[task.id] = transaction result'],
                executionFlow: [
                    '1. Generate SHA256 hash of task.key for mutex name',
                    '2. Acquire mutex lock via Cache.mutex()',
                    '3. Execute all tasks in task.tasks[] sequentially',
                    '4. If any task fails:',
                    '   a. Execute all tasks in task.rollback[] sequentially',
                    '   b. Return failure response',
                    '5. Release mutex in finally block',
                    '6. Return success with last task result'
                ],
                specialBehaviors: [
                    'Provides distributed locking via Redis mutex',
                    'Rollback tasks execute even if main tasks fail',
                    'Mutex ensures only one transaction per key runs at a time'
                ]
            }
        }
    },

    Workflow: {
        methods: {
            Template: {
                description: 'Loads and executes a workflow template by ID',
                stateReads: ['task.template resolved to get template ID'],
                stateWrites: ['state[task.id] = template execution result'],
                executionFlow: [
                    '1. getValueByPath(state, task.template) gets template ID',
                    '2. TemplateRepository.get() loads the workflow template',
                    '3. Execute all Tasks in loaded template.action.Tasks[]',
                    '4. Return final task result'
                ],
                specialBehaviors: [
                    'Template workflows can be reused across multiple schemas',
                    'Template is loaded from database at runtime'
                ]
            },
            Custom: {
                description: 'Executes tasks array from state path',
                stateReads: ['task.tasks path resolved to get task array', 'task.state path for additional state'],
                stateWrites: ['state[task.id] = execution result'],
                executionFlow: [
                    '1. getValueByPath(state, task.tasks) gets dynamic task array',
                    '2. If task.state: getValueByPath(state, task.state) and merge into state',
                    '3. Execute all resolved tasks sequentially',
                    '4. Return final task result'
                ],
                specialBehaviors: [
                    'Allows dynamic task composition at runtime',
                    'task.state allows injecting additional context'
                ]
            }
        }
    },

    // =========================================================================
    // DATA OPERATION TASKS
    // =========================================================================

    Document: {
        methods: {
            Get: {
                description: 'Retrieves a document by ID with optional relations',
                stateReads: ['task.subscriptionId', 'task.schemaId', 'task.documentId via getValueByPath'],
                stateWrites: ['state[task.id] = {success, data: document}'],
                executionFlow: [
                    '1. Resolve subscriptionId, schemaId, documentId from state',
                    '2. ORMProvider.getDocument() fetches from database',
                    '3. If task.addRelation: load relations via ORMProvider.loadRelations()',
                    '4. Return document in task.success.data'
                ]
            },
            Post: {
                description: 'Creates a new document',
                stateReads: ['task.subscriptionId', 'task.schemaId', 'task.payload via resolveDocument'],
                stateWrites: ['state[task.id] = {success, data: newDocument, documentId}'],
                executionFlow: [
                    '1. resolveDocument(task.payload, state) builds document object',
                    '2. Generate documentId via v4() UUID',
                    '3. Add system fields: SubscriptionId, SchemaId, CreatedBy, CreatedOn, etc.',
                    '4. Apply schema action rules (Rules.Create)',
                    '5. repository.insert() saves to database',
                    '6. RequestService.produce() sends Kafka message',
                    '7. Cache.setDocument() updates cache',
                    '8. Return created entity in task.success.data'
                ]
            },
            Put: {
                description: 'Updates an existing document',
                stateReads: ['task.subscriptionId', 'task.schemaId', 'task.documentId', 'task.payload'],
                stateWrites: ['state[task.id] = {success, data: updatedDocument}'],
                executionFlow: [
                    '1. Resolve payload and documentId from state',
                    '2. Apply schema action rules (Rules.Update)',
                    '3. repository.update() saves changes',
                    '4. Invalidate and update cache',
                    '5. Return updated entity'
                ]
            },
            Paging: {
                description: 'Retrieves paginated list of documents',
                stateReads: ['task.where', 'task.take', 'task.skip', 'task.sort', 'task.select'],
                stateWrites: ['state[task.id] = {success, data: documents[], count}'],
                executionFlow: [
                    '1. Build query with where conditions, pagination, sorting',
                    '2. Execute query with take/skip/select',
                    '3. Return array of documents with total count'
                ]
            },
            UpsertAll: {
                description: 'Bulk insert or update documents from array',
                stateReads: ['task.path for source array', 'task.payload for field mapping'],
                stateWrites: ['state[task.id] = {success, data: results[]}'],
                executionFlow: [
                    '1. getValueByPath(state, task.path) gets source array',
                    '2. For each document in array:',
                    '   a. resolveDocument(task.payload, {...state, $document: doc})',
                    '   b. If doc.id exists: update, else: insert',
                    '   c. Track action type (insert/update)',
                    '3. Return aggregated results'
                ]
            }
        }
    },

    Query: {
        methods: {
            Find: {
                description: 'Finds documents matching WHERE conditions',
                stateReads: ['task.repository', 'task.where', 'task.take'],
                stateWrites: ['state[task.id] = {success, data: documents[]}'],
                executionFlow: [
                    '1. Get repository from state or use default',
                    '2. resolveWhere(task.where, state) builds TypeORM where clause',
                    '3. repository.find({where, take}) executes query',
                    '4. Return matching documents (default limit: 25)'
                ]
            },
            FindOne: {
                description: 'Finds single document matching conditions',
                stateReads: ['task.repository', 'task.where', 'task.sort', 'task.select'],
                stateWrites: ['state[task.id] = {success, data: document}'],
                executionFlow: [
                    '1. Build where clause from task.where',
                    '2. Apply select and sort options',
                    '3. repository.findOne() returns first match',
                    '4. Return document or task.failed if not found'
                ]
            },
            FindPaging: {
                description: 'Finds documents with pagination',
                stateReads: ['task.payload', 'task.where', 'task.take', 'task.skip', 'task.orderby', 'task.asc'],
                stateWrites: ['state[task.id] = {success, data: documents[], count, page}'],
                executionFlow: [
                    '1. Resolve pagination parameters from state',
                    '2. Build query with where, order, take, skip',
                    '3. Execute query and count total',
                    '4. Return paginated results with metadata'
                ]
            },
            RawQuery: {
                description: 'Executes raw SQL query',
                stateReads: ['task.query resolved via resolveString'],
                stateWrites: ['state[task.id] = {success, data: queryResults}'],
                executionFlow: [
                    '1. resolveString(task.query, state) replaces path expressions',
                    '2. Get database connection pool',
                    '3. Execute raw query (supports MSSQL, PostgreSQL)',
                    '4. Return query results'
                ],
                specialBehaviors: ['Not supported for MongoDB (returns task.failed)']
            },
            Builder: {
                description: 'Uses TypeORM QueryBuilder for complex queries',
                stateReads: ['task.repository', 'task.select', 'task.where', 'task.selectType'],
                stateWrites: ['state[task.id] = {success, data, count?}'],
                executionFlow: [
                    '1. Create QueryBuilder from repository',
                    '2. Apply select, where clauses',
                    '3. Execute based on selectType: Distinct, GetOne, GetMany, GetManyCount',
                    '4. Return results (GetManyCount includes count)'
                ]
            },
            Where: {
                description: 'Finds documents with pre-built where object',
                stateReads: ['task.where from state path', 'task.select', 'task.order'],
                stateWrites: ['state[task.id] = {success, data: documents[]}'],
                executionFlow: [
                    '1. getValueByPath(state, task.where) gets where object',
                    '2. resolveDocument for select and order',
                    '3. repository.find({where, select, order})',
                    '4. Return matching documents'
                ]
            },
            NotExist: {
                description: 'Checks if no documents match conditions',
                stateReads: ['task.where'],
                stateWrites: ['state[task.id] = {success: true if no match}'],
                executionFlow: [
                    '1. Build where clause',
                    '2. Execute findOne query',
                    '3. Return success if no document found'
                ]
            }
        }
    },

    // =========================================================================
    // UTILITY TASKS
    // =========================================================================

    Array: {
        methods: {
            Get: {
                description: 'Returns empty array',
                stateReads: [],
                stateWrites: ['state[task.id] = {success, data: []}'],
                executionFlow: ['1. Return empty array in task.success.data']
            },
            Index: {
                description: 'Gets array element at index',
                stateReads: ['task.path for array', 'task.index'],
                stateWrites: ['state[task.id] = {success, data: element}'],
                executionFlow: [
                    '1. getValueByPath(state, task.path) gets array',
                    '2. Resolve task.index if path expression',
                    '3. array.at(task.index) gets element',
                    '4. Return element or task.failed if not found'
                ]
            },
            Push: {
                description: 'Pushes value to array (mutates original)',
                stateReads: ['task.path for array', 'task.value'],
                stateWrites: ['Mutates array at path', 'state[task.id] = {success, data: newLength}'],
                executionFlow: [
                    '1. getValueByPath for both path and value',
                    '2. array.push(value)',
                    '3. Return new array length'
                ]
            },
            Find: {
                description: 'Finds first element matching conditions',
                stateReads: ['task.path for array', 'task.var', 'task.conditions'],
                stateWrites: ['state[task.id] = {success, data: foundElement}'],
                executionFlow: [
                    '1. getValueByPath(state, task.path) gets array',
                    '2. array.find() with callback that:',
                    '   a. Sets state[task.var || "find"] = current element',
                    '   b. Calls checkCondition(state, task.conditions)',
                    '3. Return found element or undefined'
                ]
            },
            Filter: {
                description: 'Filters array by conditions',
                stateReads: ['task.path for array', 'task.var', 'task.conditions'],
                stateWrites: ['state[task.id] = {success, data: filteredArray}'],
                executionFlow: [
                    '1. getValueByPath(state, task.path) gets array',
                    '2. array.filter() with callback that:',
                    '   a. Sets state[task.var || "filter"] = current element',
                    '   b. Calls checkCondition(state, task.conditions)',
                    '3. Return filtered array'
                ]
            },
            Map: {
                description: 'Transforms array elements',
                stateReads: ['task.path for array', 'task.var', 'task.payload'],
                stateWrites: ['state[task.id] = {success, data: mappedArray}'],
                executionFlow: [
                    '1. getValueByPath(state, task.path) gets array',
                    '2. array.map() with callback that:',
                    '   a. Sets state[task.var || "map"] = current element',
                    '   b. resolveDocument(task.payload, state) creates new object',
                    '3. Return transformed array'
                ]
            },
            Sort: {
                description: 'Sorts array by key',
                stateReads: ['task.path for array', 'task.key', 'task.asc'],
                stateWrites: ['state[task.id] = {success, data: sortedArray}'],
                executionFlow: [
                    '1. getValueByPath(state, task.path) gets array',
                    '2. Clone array and sort by task.key',
                    '3. Direction based on task.asc (true=ascending)',
                    '4. Return sorted array'
                ]
            },
            Count: {
                description: 'Returns array length',
                stateReads: ['task.path for array'],
                stateWrites: ['state[task.id] = {success, data: length}'],
                executionFlow: [
                    '1. getValueByPath(state, task.path) gets array',
                    '2. Return array.length'
                ]
            },
            Slice: {
                description: 'Returns array slice',
                stateReads: ['task.path', 'task.fromIndex', 'task.index'],
                stateWrites: ['state[task.id] = {success, data: slicedArray}'],
                executionFlow: [
                    '1. Resolve path, fromIndex, and index (end)',
                    '2. array.slice(fromIndex, index)',
                    '3. Return sliced array (non-mutating)'
                ]
            },
            Splice: {
                description: 'Removes/replaces array elements (mutates)',
                stateReads: ['task.path', 'task.fromIndex', 'task.index'],
                stateWrites: ['Mutates original array', 'state[task.id] = {success, data: removedElements}'],
                executionFlow: [
                    '1. Resolve path, fromIndex, and index (deleteCount)',
                    '2. array.splice(fromIndex, index)',
                    '3. Return removed elements'
                ]
            },
            Join: {
                description: 'Joins array to string',
                stateReads: ['task.path', 'task.separator'],
                stateWrites: ['state[task.id] = {success, data: joinedString}'],
                executionFlow: [
                    '1. getValueByPath(state, task.path) gets array',
                    '2. array.join(task.separator)',
                    '3. Return joined string'
                ]
            },
            Merge: {
                description: 'Merges multiple arrays',
                stateReads: ['task.paths array of state paths'],
                stateWrites: ['state[task.id] = {success, data: mergedArray}'],
                executionFlow: [
                    '1. For each path in task.paths:',
                    '   getValueByPath(state, path)',
                    '2. Concatenate all arrays',
                    '3. Return merged array'
                ]
            },
            IsArray: {
                description: 'Checks if value is array',
                stateReads: ['task.path'],
                stateWrites: ['state[task.id] = {success, data: boolean}'],
                executionFlow: [
                    '1. getValueByPath(state, task.path)',
                    '2. Array.isArray(value)',
                    '3. Return boolean'
                ]
            },
            ToArray: {
                description: 'Converts object values to array',
                stateReads: ['task.path', 'task.property', 'task.distinct'],
                stateWrites: ['state[task.id] = {success, data: array}'],
                executionFlow: [
                    '1. getValueByPath(state, task.path)',
                    '2. Extract task.property from each object',
                    '3. If task.distinct: remove duplicates',
                    '4. Return array of values'
                ]
            },
            Distinct: {
                description: 'Removes duplicate values',
                stateReads: ['task.path'],
                stateWrites: ['state[task.id] = {success, data: uniqueArray}'],
                executionFlow: [
                    '1. getValueByPath(state, task.path) gets array',
                    '2. [...new Set(array)] removes duplicates',
                    '3. Return unique array'
                ]
            }
        }
    },

    String: {
        methods: {
            toLowerCase: {
                description: 'Converts string to lowercase',
                stateReads: ['task.path'],
                stateWrites: ['state[task.id] = {success, data: lowercaseString}'],
                executionFlow: ['1. Resolve path', '2. string.toLowerCase()', '3. Return result']
            },
            toUpperCase: {
                description: 'Converts string to uppercase',
                stateReads: ['task.path'],
                stateWrites: ['state[task.id] = {success, data: uppercaseString}'],
                executionFlow: ['1. Resolve path', '2. string.toUpperCase()', '3. Return result']
            },
            substring: {
                description: 'Extracts substring',
                stateReads: ['task.path', 'task.start', 'task.end'],
                stateWrites: ['state[task.id] = {success, data: substring}'],
                executionFlow: ['1. Resolve all paths', '2. string.substring(start, end)', '3. Return result']
            },
            concat: {
                description: 'Concatenates multiple strings',
                stateReads: ['task.strings array', 'task.char separator'],
                stateWrites: ['state[task.id] = {success, data: concatenatedString}'],
                executionFlow: [
                    '1. For each string in task.strings:',
                    '   resolveString(str, state)',
                    '2. Join with task.char separator',
                    '3. Return concatenated result'
                ]
            },
            split: {
                description: 'Splits string into array',
                stateReads: ['task.path', 'task.splitValue'],
                stateWrites: ['state[task.id] = {success, data: array}'],
                executionFlow: ['1. Resolve path', '2. string.split(splitValue)', '3. Return array']
            },
            replace: {
                description: 'Replaces text in string',
                stateReads: ['task.path', 'task.searchValue', 'task.replaceValue'],
                stateWrites: ['state[task.id] = {success, data: replacedString}'],
                executionFlow: [
                    '1. Resolve all paths',
                    '2. Create regex with word boundaries for searchValue',
                    '3. string.replace(regex, replaceValue)',
                    '4. Return result'
                ]
            },
            trim: {
                description: 'Removes whitespace from both ends',
                stateReads: ['task.path'],
                stateWrites: ['state[task.id] = {success, data: trimmedString}'],
                executionFlow: ['1. Resolve path', '2. string.trim()', '3. Return result']
            },
            length: {
                description: 'Returns string length',
                stateReads: ['task.path'],
                stateWrites: ['state[task.id] = {success, data: length}'],
                executionFlow: ['1. Resolve path', '2. Return string.length']
            },
            toObject: {
                description: 'Parses string as query string to object',
                stateReads: ['task.path'],
                stateWrites: ['state[task.id] = {success, data: object}'],
                executionFlow: ['1. Resolve path', '2. qs.parse(string)', '3. Return object']
            },
            toQueryString: {
                description: 'Converts object to query string',
                stateReads: ['task.path'],
                stateWrites: ['state[task.id] = {success, data: queryString}'],
                executionFlow: ['1. Resolve path', '2. qs.stringify(object)', '3. Return string']
            },
            padStart: {
                description: 'Pads string at start',
                stateReads: ['task.path', 'task.maxLength', 'task.fillString'],
                stateWrites: ['state[task.id] = {success, data: paddedString}'],
                executionFlow: ['1. Resolve all', '2. string.padStart(maxLength, fillString)', '3. Return']
            },
            padEnd: {
                description: 'Pads string at end',
                stateReads: ['task.path', 'task.maxLength', 'task.fillString'],
                stateWrites: ['state[task.id] = {success, data: paddedString}'],
                executionFlow: ['1. Resolve all', '2. string.padEnd(maxLength, fillString)', '3. Return']
            }
        }
    },

    JSON: {
        methods: {
            Parse: {
                description: 'Parses JSON string to object',
                stateReads: ['task.payload'],
                stateWrites: ['state[task.id] = {success, data: parsedObject}'],
                executionFlow: [
                    '1. getValueByPath(state, task.payload) gets JSON string',
                    '2. JSON.parse(payload)',
                    '3. Return parsed object'
                ]
            },
            Stringify: {
                description: 'Converts object to JSON string',
                stateReads: ['task.payload'],
                stateWrites: ['state[task.id] = {success, data: jsonString}'],
                executionFlow: [
                    '1. getValueByPath(state, task.payload) gets object',
                    '2. JSON.stringify(payload, null, TAB)',
                    '3. Return formatted JSON string'
                ]
            }
        }
    },

    Math: {
        methods: {
            Evaluate: {
                description: 'Evaluates math expression',
                stateReads: ['task.expression', 'task.payload for variables'],
                stateWrites: ['state[task.id] = {success, data: result}'],
                executionFlow: [
                    '1. resolveDocument(task.payload, state) creates variable context',
                    '2. resolveString(task.expression, payload) substitutes variables',
                    '3. evaluate(expression, state) computes result',
                    '4. Return numeric result'
                ]
            },
            Round: {
                description: 'Rounds number to nearest integer',
                stateReads: ['task.expression'],
                stateWrites: ['state[task.id] = {success, data: roundedNumber}'],
                executionFlow: [
                    '1. getValueByPath(state, task.expression)',
                    '2. parseFloat(value)',
                    '3. Math.round(number)',
                    '4. Return rounded value'
                ]
            },
            Ceil: {
                description: 'Rounds up to nearest integer',
                stateReads: ['task.expression'],
                stateWrites: ['state[task.id] = {success, data: ceiledNumber}'],
                executionFlow: ['1. Resolve', '2. parseFloat', '3. Math.ceil', '4. Return']
            },
            Floor: {
                description: 'Rounds down to nearest integer',
                stateReads: ['task.expression'],
                stateWrites: ['state[task.id] = {success, data: flooredNumber}'],
                executionFlow: ['1. Resolve', '2. parseFloat', '3. Math.floor', '4. Return']
            }
        }
    },

    Date: {
        methods: {
            GetDate: {
                description: 'Returns current date/time',
                stateReads: [],
                stateWrites: ['state[task.id] = {success, data: currentDate}'],
                executionFlow: ['1. new Date()', '2. Return current timestamp']
            },
            Add: {
                description: 'Adds duration to date',
                stateReads: ['task.date', 'task.amount', 'task.unit'],
                stateWrites: ['state[task.id] = {success, data: newDateISO}'],
                executionFlow: [
                    '1. Resolve date and amount from state',
                    '2. moment(date).add(amount, unit)',
                    '3. Return ISO string'
                ]
            },
            Diff: {
                description: 'Calculates difference between dates',
                stateReads: ['task.from', 'task.to', 'task.unitOfTime'],
                stateWrites: ['state[task.id] = {success, data: difference}'],
                executionFlow: [
                    '1. Resolve from and to dates',
                    '2. moment(to).diff(moment(from), unitOfTime)',
                    '3. Return numeric difference'
                ]
            },
            Format: {
                description: 'Formats date to string',
                stateReads: ['task.date', 'task.format'],
                stateWrites: ['state[task.id] = {success, data: formattedString}'],
                executionFlow: [
                    '1. Resolve date from state',
                    '2. moment(date).format(task.format)',
                    '3. Return formatted string'
                ]
            },
            LessThan: {
                description: 'Checks if date is before another',
                stateReads: ['task.date', 'task.comparisionDate'],
                stateWrites: ['state[task.id] = {success, data: boolean}'],
                executionFlow: [
                    '1. Resolve both dates',
                    '2. Compare: date < comparisionDate',
                    '3. Return boolean'
                ]
            },
            GreaterThan: {
                description: 'Checks if date is after another',
                stateReads: ['task.date', 'task.comparisionDate'],
                stateWrites: ['state[task.id] = {success, data: boolean}'],
                executionFlow: [
                    '1. Resolve both dates',
                    '2. Compare: date > comparisionDate',
                    '3. Return boolean'
                ]
            },
            Parse: {
                description: 'Parses date string',
                stateReads: ['task.date'],
                stateWrites: ['state[task.id] = {success, data: parsedDate}'],
                executionFlow: ['1. Resolve date string', '2. moment(date)', '3. Return moment object']
            },
            GetDay: {
                description: 'Gets day of week',
                stateReads: ['task.date'],
                stateWrites: ['state[task.id] = {success, data: dayNumber}'],
                executionFlow: ['1. Resolve date', '2. moment(date).day()', '3. Return 0-6']
            }
        }
    },

    // =========================================================================
    // SECURITY TASKS
    // =========================================================================

    Security: {
        methods: {
            JWTSign: {
                description: 'Signs JWT token',
                stateReads: ['task.payload', 'task.options', 'task.secret'],
                stateWrites: ['state[task.id] = {success, data: jwtToken}'],
                executionFlow: [
                    '1. resolveDocument(task.payload, state) builds payload',
                    '2. resolveDocument(task.options, state) builds options',
                    '3. getValueByPath for secret',
                    '4. If !task.selfSign: append DataStore.token.secret',
                    '5. jwt.sign(payload, secret, options)',
                    '6. Return JWT token string'
                ]
            },
            JWTVerify: {
                description: 'Verifies JWT token',
                stateReads: ['task.token', 'task.options', 'task.secret'],
                stateWrites: ['state[task.id] = {success, data: decodedPayload}'],
                executionFlow: [
                    '1. Resolve token and secret from state',
                    '2. jwt.verify(token, secret, options)',
                    '3. Return decoded payload or task.failed'
                ]
            },
            hashPassword: {
                description: 'Hashes password with bcrypt',
                stateReads: ['task.password'],
                stateWrites: ['state[task.id] = {success, data: hashedPassword}'],
                executionFlow: [
                    '1. getValueByPath(state, task.password)',
                    '2. hashPassword(password) - bcrypt hash',
                    '3. Return hashed string'
                ]
            },
            matchPassword: {
                description: 'Compares password with hash',
                stateReads: ['task.password', 'task.hash'],
                stateWrites: ['state[task.id] = {success: isMatch}'],
                executionFlow: [
                    '1. Resolve password and hash',
                    '2. matchPassword(password, hash) - bcrypt compare',
                    '3. Return success/failed based on match'
                ]
            }
        }
    },

    RSA: {
        methods: {
            Generate: {
                description: 'Generates RSA key pair',
                stateReads: [],
                stateWrites: ['state[task.id] = {success, data: {publicKey, privateKey}}'],
                executionFlow: ['1. generateKey()', '2. Return {publicKey, privateKey}']
            },
            PublicEncrypt: {
                description: 'Encrypts with public key',
                stateReads: ['task.publicKey', 'task.str'],
                stateWrites: ['state[task.id] = {success, data: encryptedString}'],
                executionFlow: [
                    '1. Resolve publicKey and str',
                    '2. rsaPublicEncrypt(str, publicKey)',
                    '3. Return encrypted string'
                ]
            },
            PublicDecrypt: {
                description: 'Decrypts with public key',
                stateReads: ['task.publicKey', 'task.str'],
                stateWrites: ['state[task.id] = {success, data: decryptedString}'],
                executionFlow: ['1. Resolve', '2. rsaPublicDecrypt', '3. Return']
            },
            PrivateEncrypt: {
                description: 'Encrypts with private key',
                stateReads: ['task.privateKey', 'task.str'],
                stateWrites: ['state[task.id] = {success, data: encryptedString}'],
                executionFlow: ['1. Resolve', '2. rsaPrivateEncrypt', '3. Return']
            },
            PrivateDecrypt: {
                description: 'Decrypts with private key',
                stateReads: ['task.privateKey', 'task.str'],
                stateWrites: ['state[task.id] = {success, data: decryptedString}'],
                executionFlow: ['1. Resolve', '2. rsaPrivateDecrypt', '3. Return']
            }
        }
    },

    Validator: {
        methods: {
            JSON: {
                description: 'Validates data against JSON schema',
                stateReads: ['task.schema', 'task.data'],
                stateWrites: ['state[task.id] = {success, data: validationResult}'],
                executionFlow: [
                    '1. getValueByPath for schema and data',
                    '2. validate(data, schema) using JSON schema validator',
                    '3. Return {success: boolean, errors: []} result'
                ]
            },
            UUID: {
                description: 'Validates UUID format',
                stateReads: ['task.payload'],
                stateWrites: ['state[task.id] = {success, data: isValid}'],
                executionFlow: [
                    '1. getValueByPath(state, task.payload)',
                    '2. ValidateGuid(payload) from uuid library',
                    '3. Return boolean'
                ]
            }
        }
    },

    // =========================================================================
    // INTEGRATION TASKS
    // =========================================================================

    HTTP: {
        methods: {
            Get: {
                description: 'Makes HTTP GET request',
                stateReads: ['task.url', 'task.headers', 'task.params'],
                stateWrites: ['state[task.id] = {success, data, cookies, mime}'],
                executionFlow: [
                    '1. resolveString(task.url, state) substitutes URL placeholders',
                    '2. resolveDocument(task.headers, state) builds headers',
                    '3. resolveDocument(task.params, state) builds query params',
                    '4. fetch(url + queryString, {method: "Get", headers})',
                    '5. Handle response based on Content-Type',
                    '6. Return {data, cookies, mime, statusCode}'
                ]
            },
            Post: {
                description: 'Makes HTTP POST request',
                stateReads: ['task.url', 'task.headers', 'task.body', 'task.params'],
                stateWrites: ['state[task.id] = {success, data, cookies, mime}'],
                executionFlow: [
                    '1. Resolve URL, headers, params',
                    '2. Based on Content-Type header:',
                    '   - text/plain: URLSearchParams or raw string',
                    '   - application/x-www-form-urlencoded: URLSearchParams',
                    '   - default: JSON.stringify(body)',
                    '3. fetch(url, {method: "Post", headers, body})',
                    '4. Parse response based on MIME type',
                    '5. Return {data, cookies, mime, statusCode}'
                ]
            },
            Put: {
                description: 'Makes HTTP PUT request',
                stateReads: ['task.url', 'task.headers', 'task.body', 'task.params'],
                stateWrites: ['state[task.id] = {success, data}'],
                executionFlow: ['Same as Post with method: "Put"']
            },
            Delete: {
                description: 'Makes HTTP DELETE request',
                stateReads: ['task.url', 'task.headers', 'task.params'],
                stateWrites: ['state[task.id] = {success, data}'],
                executionFlow: ['Same as Get with method: "Delete"']
            }
        }
    },

    SMTP: {
        methods: {
            default: {
                description: 'Sends email via SMTP',
                stateReads: ['task.To', 'task.From', 'task.CC', 'task.HtmlBody', 'task.Body', 'task.Subject'],
                stateWrites: ['state[task.id] = {success, data: sendResult}'],
                executionFlow: [
                    '1. Create nodemailer transporter with SMTP config',
                    '2. Resolve all email fields from state',
                    '3. transporter.sendMail({to, from, cc, html, text, subject})',
                    '4. Return send result or task.failed on error'
                ]
            }
        }
    },

    Cache: {
        methods: {
            Get: {
                description: 'Gets cached document',
                stateReads: ['task.partitionKey', 'task.schemaId', 'task.documentId'],
                stateWrites: ['state[task.id] = {success, data: cachedValue}'],
                executionFlow: [
                    '1. Resolve partitionKey, schemaId, documentId',
                    '2. Cache.getDocument(partitionKey, schemaId, documentId)',
                    '3. Return cached value or null'
                ]
            },
            Set: {
                description: 'Sets cached document with TTL',
                stateReads: ['task.partitionKey', 'task.schemaId', 'task.documentId', 'task.value', 'task.seconds'],
                stateWrites: ['state[task.id] = {success}'],
                executionFlow: [
                    '1. Resolve all parameters',
                    '2. Cache.setDocument(partitionKey, schemaId, documentId, value, seconds)',
                    '3. Return success'
                ]
            },
            Clear: {
                description: 'Clears cache by pattern',
                stateReads: ['task.pattern'],
                stateWrites: ['state[task.id] = {success}'],
                executionFlow: [
                    '1. Resolve pattern',
                    '2. Cache.clear(pattern) - supports wildcards',
                    '3. Return success'
                ]
            },
            Emit: {
                description: 'Emits Socket.io event',
                stateReads: ['task.room', 'task.key', 'task.value'],
                stateWrites: ['state[task.id] = {success}'],
                executionFlow: [
                    '1. Resolve room, key, value',
                    '2. Cache.emit(room, key, value) - Socket.io broadcast',
                    '3. Return success'
                ]
            }
        }
    },

    Request: {
        methods: {
            Action: {
                description: 'Invokes schema action',
                stateReads: ['task.schema', 'task.action', 'task.payload'],
                stateWrites: ['state[task.id] = action execution result'],
                executionFlow: [
                    '1. Resolve schema, action, payload',
                    '2. DocumentAction.exec() processes the action',
                    '3. If task.async: returns immediately',
                    '4. Return action result'
                ]
            },
            Forward: {
                description: 'Forwards to another action in same subscription',
                stateReads: ['task.schema', 'task.action', 'task.payload'],
                stateWrites: ['state[task.id] = forwarded result'],
                executionFlow: [
                    '1. Build forward request',
                    '2. DocumentAction.exec() with current subscription',
                    '3. Return result'
                ]
            },
            Proxy: {
                description: 'Proxies to action in different subscription',
                stateReads: ['task.subscription', 'task.schema', 'task.action', 'task.payload'],
                stateWrites: ['state[task.id] = proxied result'],
                executionFlow: [
                    '1. Resolve target subscription',
                    '2. Build proxy request',
                    '3. Execute in target subscription context',
                    '4. Return result'
                ]
            },
            Service: {
                description: 'Calls service via message queue',
                stateReads: ['task.topic', 'task.payload'],
                stateWrites: ['state[task.id] = service result'],
                executionFlow: [
                    '1. Resolve topic and payload',
                    '2. WorkflowEngine.exec() via service routing',
                    '3. If task.async: returns immediately',
                    '4. Return service result'
                ]
            },
            Schedule: {
                description: 'Schedules action for later execution',
                stateReads: ['task.schema', 'task.action', 'task.scheduler', 'task.pattern/dateTime'],
                stateWrites: ['state[task.id] = {success, jobId}'],
                executionFlow: [
                    '1. scheduler type determines behavior:',
                    '   - "cron": schedule with cron pattern',
                    '   - "delayed": schedule at specific dateTime',
                    '   - "remove": cancel existing job',
                    '2. Create job with payload',
                    '3. Return job ID'
                ]
            },
            Produce: {
                description: 'Produces Kafka message',
                stateReads: ['task.topic', 'task.key', 'task.headers', 'task.payload'],
                stateWrites: ['state[task.id] = {success}'],
                executionFlow: [
                    '1. Resolve topic, key, headers, payload',
                    '2. RequestService.produce() sends to Kafka',
                    '3. Return success'
                ]
            }
        }
    },

    // =========================================================================
    // ID GENERATION TASKS
    // =========================================================================

    UUID: {
        methods: {
            default: {
                description: 'Generates UUID v4',
                stateReads: [],
                stateWrites: ['state[task.id] = {success, data: uuidString}'],
                executionFlow: ['1. v4() from uuid library', '2. Return UUID string']
            }
        }
    },

    Sequence: {
        methods: {
            default: {
                description: 'Generates sequential number with prefix',
                stateReads: ['task.subscription', 'task.schema', 'task.prefix', 'task.paddingLength', 'task.paddingCharacter'],
                stateWrites: ['state[task.id] = {success, data: sequenceString, prefix, sequence}'],
                executionFlow: [
                    '1. Resolve all parameters',
                    '2. Build key: subscription + ":" + schema + ":" + prefix',
                    '3. Hash key with SHA256 for sequence name',
                    '4. If !task.readonly: findOneAndUpdate with $inc',
                    '5. If task.readonly: findOne and add 1',
                    '6. Pad sequence number to paddingLength',
                    '7. Return prefix + paddedSequence'
                ],
                specialBehaviors: [
                    'Sequences are stored in MongoDB "Counters" collection',
                    'readonly=true returns next value without incrementing',
                    'Default padding: 10 characters with "0"'
                ]
            }
        }
    },

    Identifier: {
        methods: {
            UUID: {
                description: 'Generates UUID v4',
                stateReads: [],
                stateWrites: ['state[task.id] = {success, data: uuid}'],
                executionFlow: ['1. uuidv4()', '2. Return UUID']
            },
            NanoId: {
                description: 'Generates NanoID with custom format',
                stateReads: ['task.format', 'task.size'],
                stateWrites: ['state[task.id] = {success, data: nanoId}'],
                executionFlow: [
                    '1. Select alphabet based on task.format:',
                    '   - AlphaNumeric: a-zA-Z0-9',
                    '   - Alphabet: a-zA-Z',
                    '   - Number: 0-9',
                    '   - Password: special chars included',
                    '2. customAlphabet(alphabet, size)()',
                    '3. Return NanoID string'
                ]
            }
        }
    }
};

/**
 * Get deep execution details for a specific task type
 */
export const getTaskExecutionDetails = (taskType: string, method?: string) => {
    const taskDetails = TASK_EXECUTION_DETAILS[taskType];
    if (!taskDetails) return null;

    if (method && taskDetails.methods[method]) {
        return taskDetails.methods[method];
    }

    // Return default or first method
    return taskDetails.methods['default'] || Object.values(taskDetails.methods)[0];
};

/**
 * Get all state interaction patterns for a task
 */
export const getTaskStatePatterns = (taskType: string) => {
    const details = TASK_EXECUTION_DETAILS[taskType];
    if (!details) return null;

    const patterns: { reads: string[], writes: string[] } = { reads: [], writes: [] };

    for (const method of Object.values(details.methods)) {
        patterns.reads.push(...method.stateReads);
        patterns.writes.push(...method.stateWrites);
    }

    return {
        reads: Array.from(new Set(patterns.reads)),
        writes: Array.from(new Set(patterns.writes))
    };
};

export const getExecutionFlowInfo = () => {
    return {
        stateStructure: STATE_OBJECT_STRUCTURE,
        controlFlowPatterns: CONTROL_FLOW_PATTERNS,
        executionRules: [
            'Tasks execute sequentially in order (index 0, 1, 2, ...)',
            'Each task result is stored in state[task.id] for later access',
            'If any task returns success: false, execution stops immediately',
            'Later tasks can access earlier results via {$.earlierTaskId.data}',
            'Response task should be last and defines final workflow output',
            'Use Promise task for parallel execution of independent tasks',
            'Use Transaction task for atomic operations with rollback support'
        ],
        stateAccessPatterns: [
            '{$.body.fieldName} - Access request body',
            '{$.params.documentId} - Access URL params (document ID)',
            '{$.query.page} - Access query string',
            '{$.headers.authorization} - Access headers',
            '{$.auth.userId} - Access authenticated user',
            '{$.env.API_KEY} - Access environment variables',
            '{$.taskId.data} - Access previous task result',
            '{$.taskId.data.items[0]} - Access nested array element',
            '{$.const.now} - Access current timestamp'
        ]
    };
};

/**
 * Get information about how tasks interact with state
 */
export const getStateInteractionInfo = () => {
    return {
        readFromState: 'Tasks read values using {$.path} syntax in their properties',
        writeToState: 'Task results are automatically stored as state[task.id]',
        resultStructure: {
            statusCode: 'HTTP status code (200, 400, 404, 500)',
            success: 'boolean - true if task succeeded',
            code: 'string - Error/success code',
            message: 'string - Human readable message',
            data: 'any - The actual result data (access via {$.taskId.data})'
        }
    };
};

/**
 * Get detailed documentation about how resolvers work
 */
export const getResolverDocumentation = () => {
    return {
        coreFunctions: {
            getValueByPath: {
                description: 'Resolves a single path expression against state',
                signature: 'getValueByPath(document: IDocument, path: string): { resolved: boolean, value: any }',
                usage: 'Used for simple property access like "{$.body.name}"'
            },
            resolveDocument: {
                description: 'Resolves an array of IKeyValue fields against state',
                signature: 'resolveDocument(fields: IKeyValue[], document: IDocument): Promise<object>',
                usage: 'Used for payload resolution in most tasks'
            },
            resolveString: {
                description: 'Substitutes all path expressions in a string',
                signature: 'resolveString(str: string, document: any): string',
                usage: 'Used for template strings with multiple placeholders'
            },
            resolveWhere: {
                description: 'Resolves WHERE conditions with TypeORM operators',
                signature: 'resolveWhere(fields: IKeyValueSearch[], document: IDocument): FindOptionsWhere[]',
                usage: 'Used for Query task where conditions'
            }
        },
        pathSyntax: PATH_RESOLUTION_EXAMPLES,
        valueTypes: VALUE_TYPE_DETAILS,
        taskStateUsage: TASK_STATE_USAGE
    };
};

/**
 * Get path expression examples for common use cases
 */
export const getPathExpressionGuide = () => {
    return {
        requestContext: {
            body: '{$.body}',
            bodyField: '{$.body.fieldName}',
            params: '{$.params.paramName}',
            query: '{$.query.queryParam}',
            headers: '{$.headers.headerName}',
            cookies: '{$.cookies.cookieName}'
        },
        authentication: {
            userId: '{$.auth.userId}',
            email: '{$.auth.email}',
            roles: '{$.auth.roles}',
            application: '{$.auth.application}'
        },
        environment: {
            variable: '{$.env.VARIABLE_NAME}',
            subscriptionId: '{$.subscription.id}'
        },
        constants: {
            true: '{$.const.true}',
            false: '{$.const.false}',
            null: '{$.const.null}',
            now: '{$.const.now}'
        },
        previousTaskResults: {
            data: '{$.taskId.data}',
            success: '{$.taskId.success}',
            nested: '{$.taskId.data.propertyName}',
            arrayElement: '{$.taskId.data[0]}',
            deepNested: '{$.taskId.data.items[0].name}'
        },
        arrayAccess: {
            note: 'Array indices 0-127 are supported',
            firstElement: '{$.array[0]}',
            elementProperty: '{$.array[0].property}',
            nestedArray: '{$.data.items[5].values[0]}'
        }
    };
};

/**
 * Get examples of how to build IKeyValue payloads
 */
export const getPayloadBuildingGuide = () => {
    return {
        simpleObject: [
            { Id: '0f1a2b3c-abcd-42ef-8312-8c9d0e1f2a3b', Key: 'name', Value: '{$.body.name}', Type: 'Property' },
            { Id: '1a2b3c4d-bcde-43fa-8423-9d0e1f2a3b4c', Key: 'status', Value: 'active', Type: 'Literal' },
            { Id: '2b3c4d5e-cdef-44ab-8534-0e1f2a3b4c5d', Key: 'count', Value: 10, Type: 'Literal' }
        ],
        withCalculation: [
            { Id: '3c4d5e6f-defa-45bc-8645-1f2a3b4c5d6e', Key: 'total', Value: '{$.price} * {$.quantity}', Type: 'Calculated' },
            { Id: '4d5e6f7a-efab-46cd-8756-2a3b4c5d6e7f', Key: 'discount', Value: '{$.total} * 0.1', Type: 'Calculated' }
        ],
        nestedObject: [
            {
                Id: '5e6f7a8b-fabc-47de-8867-3b4c5d6e7f8a', Key: 'user', Value: [
                    { Id: '6f7a8b9c-abcd-48ef-8978-4c5d6e7f8a9b', Key: 'id', Value: '{$.auth.userId}', Type: 'Property' },
                    { Id: '7a8b9c0d-bcde-49fa-8a89-5d6e7f8a9b0c', Key: 'name', Value: '{$.auth.name}', Type: 'Property' }
                ], Type: 'Object'
            }
        ],
        conditionalValue: [
            {
                Id: '8b9c0d1e-cdef-4aab-8b9a-6e7f8a9b0c1d', Key: 'status', Value: '{$.body.isActive}', Type: 'Property',
                conditions: { operator: 'equals', fact: '{$.body.isActive}', value: 'true' },
                onSuccess: { Id: '9c0d1e2f-defa-4bbc-8cab-7f8a9b0c1d2e', Key: 'status', Value: 'Active', Type: 'Literal' },
                onFailure: { Id: '0d1e2f3a-efab-4ccd-8dbc-8a9b0c1d2e3f', Key: 'status', Value: 'Inactive', Type: 'Literal' }
            }
        ],
        templateString: {
            note: 'Multiple path expressions in one string',
            example: { Id: '1e2f3a4b-fabc-4dde-8ecd-9b0c1d2e3f4a', Key: 'fullName', Value: '{$.firstName} {$.lastName}', Type: 'Property' }
        }
    };
};

/**
 * Get context enrichment patterns for iteration tasks
 */
export const getContextEnrichmentPatterns = () => {
    return {
        description: 'When iterating over arrays, tasks create enriched contexts for each item',
        patterns: {
            arrayMap: {
                task: 'Array.Map',
                contextVariable: 'task.var (default: "map")',
                access: '{$.map.propertyName} or {$.customVar.propertyName}',
                example: 'path: "{$.items}", var: "item" â†’ access via {$.item.name}'
            },
            arrayFilter: {
                task: 'Array.Filter',
                contextVariable: 'task.var (default: "filter")',
                access: 'Used in conditions: fact: "{$.filter.status}"'
            },
            arrayFind: {
                task: 'Array.Find',
                contextVariable: 'task.var (default: "find")',
                access: 'Used in conditions to find matching item'
            },
            loop: {
                task: 'Loop',
                contextVariable: 'task.var',
                indexVariable: 'task.index (optional)',
                access: '{$.var.property}, {$.index} for current index'
            },
            iterator: {
                task: 'Iterator',
                contextVariable: 'task.var',
                indexVariable: 'task.index',
                access: '{$.var.property}, {$.index}, breakConditions evaluated per iteration'
            },
            resolverIsArray: {
                task: 'Resolver with isArray=true',
                contextBehavior: 'Each item becomes root context with _type: "$"',
                access: '{$.propertyName} refers to current item, not state'
            },
            requestIsArray: {
                task: 'Request with isArray=true',
                contextBehavior: 'Each item in path array processed separately',
                access: '{$.propertyName} refers to current item'
            }
        },
        importantNote: 'In iteration contexts, {$.fieldName} refers to the CURRENT ITEM, not the global state. Use {$.taskId.data} syntax to access global state within iterations.'
    };
};
/**
 * KNOWLEDGE BASE SUMMARY
 * Quick reference for AI assistant task selection and execution understanding
 */
export const KNOWLEDGE_BASE_SUMMARY = {
    taskCategories: {
        controlFlow: ['Condition', 'Switch', 'Loop', 'Iterator', 'Promise', 'State', 'Transaction', 'Workflow'],
        dataOperations: ['Document', 'Query', 'Entity', 'ORM', 'ESQuery', 'Trino', 'Repository'],
        transformation: ['Array', 'Object', 'String', 'JSON', 'Math', 'Date', 'Filter', 'Resolver'],
        security: ['Security', 'RSA', 'Crypto', 'Validator'],
        integration: ['HTTP', 'SMTP', 'Cache', 'Request'],
        identity: ['UUID', 'Sequence', 'Identifier'],
        workflow: ['Response', 'Variable']
    },

    coreConcepts: {
        stateAccess: 'All tasks read from state using {$.path} syntax in their properties',
        stateWrite: 'Task results automatically stored as state[task.id] with {success, statusCode, data, message}',
        pathResolution: 'getValueByPath() resolves single paths, resolveDocument() resolves IKeyValue[] arrays',
        sequentialExecution: 'Tasks execute in order; if any returns success:false, execution stops',
        nestedTasks: 'Control flow tasks (Condition, Switch, Loop, Iterator) can contain nested task arrays'
    },

    commonPatterns: {
        fetchAndTransform: 'Query/Document â†’ Array.Map â†’ Resolver â†’ Response',
        conditionalBranching: 'Condition â†’ onSuccess[...] / onFailure[...]',
        parallelExecution: 'Promise.PromiseAll â†’ [Task1, Task2, Task3]',
        iterateAndProcess: 'Iterator.Iterate â†’ path: array, var: item â†’ tasks[...]',
        atomicOperation: 'Transaction â†’ tasks[...] + rollback[...]'
    },

    keyMethods: {
        Document: ['Get', 'Post', 'Put', 'Paging', 'UpsertAll'],
        Query: ['Find', 'FindOne', 'FindPaging', 'RawQuery', 'Builder', 'Where', 'NotExist'],
        Array: ['Map', 'Filter', 'Find', 'Sort', 'Count', 'Merge', 'Join', 'Slice', 'Distinct'],
        String: ['toLowerCase', 'toUpperCase', 'concat', 'split', 'replace', 'trim', 'substring'],
        Date: ['GetDate', 'Add', 'Diff', 'Format', 'LessThan', 'GreaterThan'],
        Security: ['JWTSign', 'JWTVerify', 'hashPassword', 'matchPassword'],
        Cache: ['Get', 'Set', 'Clear', 'Emit'],
        Request: ['Action', 'Forward', 'Proxy', 'Service', 'Schedule', 'Produce']
    }
};