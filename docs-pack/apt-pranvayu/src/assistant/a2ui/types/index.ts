/**
 * AI Assistant Types for Workflow Development
 * Using Vercel AI SDK
 */

import type { UIMessage } from 'ai';

// Import TaskDefinition and BranchDefinition from stepUtils to avoid duplication
import type {
    TaskDefinition as StepUtilsTaskDefinition,
    BranchDefinition as StepUtilsBranchDefinition
} from '../../../pages/actionWorkflow/editor/stepUtils';

// Re-export with same names for consistency
export type TaskDefinition = StepUtilsTaskDefinition;
export type BranchDefinition = StepUtilsBranchDefinition;

// Chat message metadata type
export interface WorkflowMessageMetadata {
    createdAt?: number;
    model?: string;
    totalTokens?: number;
    workflowContext?: WorkflowContext;
}

// Custom UI message type
export type WorkflowUIMessage = UIMessage<WorkflowMessageMetadata>;

// Workflow context for the assistant
export interface WorkflowContext {
    currentWorkflowId?: string;
    currentSchemaId?: string;
    selectedTaskId?: string;
    workflowMode?: 'ADD_ACTION' | 'EDIT_ACTION' | 'CLONE_ACTION' | 'VIEW_ACTION';
    /** Current subscription ID from the workflow editor */
    subscription?: string;
}

// Tool definitions for workflow operations
export interface WorkflowToolInput {
    createTask: {
        taskType: string;
        /** Execution ID (camelCase, no spaces) - state storage key: {$.taskId.data} */
        taskId: string;
        /** Display name (optional, can have spaces) - shown in designer UI */
        taskName?: string;
        properties?: Record<string, unknown>;
    };
    modifyTask: {
        taskId: string;
        properties: Record<string, unknown>;
    };
    deleteTask: {
        taskId: string;
    };
    getWorkflowDefinition: Record<string, never>;
    suggestNextStep: {
        currentContext: string;
    };
    explainTask: {
        taskType: string;
    };
    validateWorkflow: Record<string, never>;
    getAvailableTasks: Record<string, never>;
}

// Assistant suggestion types
export interface WorkflowSuggestion {
    id: string;
    type: 'task' | 'improvement' | 'validation' | 'explanation';
    title: string;
    description: string;
    action?: () => void;
    code?: string;
}

// Designer callbacks for AI assistant to control the workflow designer
// All callbacks support nth-level nested tasks in branching constructs
export interface DesignerCallbacks {
    /** Select a task in the designer by ID */
    onSelectTask?: (taskId: string) => void;
    /** Clear the current selection */
    onClearSelection?: () => void;
    /** Delete a task from the workflow (works at any nesting level) */
    onDeleteTask?: (taskId: string) => void;
    /** Get the current workflow definition */
    onGetWorkflow?: () => unknown;
    /** Get the currently selected task with full path info */
    onGetSelectedTask?: () => TaskLocationInfo | null;
    /** 
     * List all tasks in the workflow with full path information
     * Includes tasks at all nesting levels with their parent/branch context
     */
    onListTasks?: () => TaskInfo[];
    /** Set readonly mode */
    onSetReadonly?: (readonly: boolean) => void;
    /** 
     * Add a task to the sequence
     * For branching tasks (Condition, Switch, Iterator, Loop, Transaction, Promise, State), 
     * use the branches parameter to specify nested tasks
     * @param taskType - The type of task (e.g., "Document", "Condition", "Iterator")
     * @param taskId - Execution ID (camelCase, no spaces) - used for state storage: {$.taskId.data}
     * @param taskName - Optional display name (can have spaces) - shown in designer UI
     * @param afterTaskId - Optional _id of task to insert after
     * @param properties - Task configuration properties
     * @param branches - For branching tasks, specify nested tasks
     */
    onAddTask?: (
        taskType: string,
        taskId: string,
        taskName?: string,
        afterTaskId?: string,
        properties?: Record<string, unknown>,
        branches?: BranchDefinition
    ) => void;
    /** Move a task to a new position */
    onMoveTask?: (taskId: string, afterTaskId: string) => void;
    /** Duplicate a task */
    onDuplicateTask?: (taskId: string, newTaskName: string) => void;
    /** 
     * Add a task to an existing branch at any nesting level
     * (Condition onSuccess/onFailure, Iterator tasks, etc.)
     * Works with deeply nested branching structures
     * @param parentTaskId - _id of the parent branching task
     * @param branchName - Name of the branch (e.g., "onSuccess", "onFailure", "tasks")
     * @param taskType - The type of task
     * @param taskId - Execution ID (camelCase, no spaces) - used for state storage
     * @param taskName - Optional display name (can have spaces)
     * @param properties - Task configuration properties
     * @param branches - For nested branching tasks
     */
    onAddTaskToBranch?: (
        parentTaskId: string,
        branchName: string,
        taskType: string,
        taskId: string,
        taskName?: string,
        properties?: Record<string, unknown>,
        branches?: BranchDefinition
    ) => void;
    /** 
     * Find a task by ID at any nesting level
     * Returns full path info including parent, branch, and depth
     */
    onFindTask?: (taskId: string) => TaskLocationInfo | null;
    /** Update a specific task property (works at any nesting level) */
    onUpdateTaskProperty?: (taskId: string, propertyPath: string, value: unknown) => void;
    /** Batch update multiple task properties in ONE atomic operation (avoids stale-closure with sequential onUpdateTaskProperty calls) */
    onBatchUpdateTask?: (taskId: string, updates: Array<{ path: string; value: unknown }>) => void;
    /** Update Body/Query schema fields for workflow validation. Use replace=true to replace entire schema instead of merging. */
    onUpdateBodyQuerySchema?: (schemaType: 'Body' | 'Query', fields: BodyQueryField[], replace?: boolean) => void;
    /** Get current Body/Query schema fields */
    onGetBodyQuerySchema?: (schemaType: 'Body' | 'Query') => BodyQueryField[];
    /** Set action-level properties (globalSettings): SystemName, DisplayName, Method, ActionType, etc. Only provided fields are updated. */
    onSetActionProperties?: (properties: Record<string, unknown>) => void;
    /** Get current action-level properties (globalSettings) */
    onGetActionProperties?: () => Record<string, unknown> | null;
    /** Get current rule columns (State array from globalSettings) */
    onGetRuleColumns?: () => RuleColumn[];
    /** Set/replace all rule columns (replaces globalSettings.State) */
    onSetRuleColumns?: (columns: RuleColumn[]) => void;
}

/**
 * Rule column definition for Rule Mapping (key-value configuration)
 * Keys = domain-friendly column names from body, query, params, auth, context
 * Values = data paths like {$.body.id}, {$.params.schema}
 */
export interface RuleColumn {
    /** Unique identifier */
    id?: string;
    /** Column name — domain-friendly key (e.g., "Employee Name", "Status") */
    name: string;
    /** Data path — value expression (e.g., "{$.body.name}", "{$.params.id}", "{$.context.templateField}") */
    path: string;
    /** Data source: Body, Params, Header, Auth, Context (Context = executed template data) */
    SourceType: 'Body' | 'Params' | 'Header' | 'Auth' | 'Context';
    /** Whether this column is auto-derived from Body schema (read-only) */
    IsPredefineColumn?: boolean;
    /** Data type of the column value */
    DataType?: 'Date' | 'String' | 'Number' | 'Boolean';
    /** Additional properties/metadata */
    Properties?: unknown[];
    /** PickList configuration for dropdown values */
    PickList?: {
        SubscriptionId?: string;
        SchemaId?: string;
        ActionId?: string;
        Mappings?: {
            DisplayExpr?: string;
            ValueExpr?: string;
            Description?: string;
            Sort?: string;
            Group?: string;
        };
    };
    /** Enum values for the column */
    Enum?: unknown[];
}

/**
 * Task info returned by onListTasks with full location context
 */
export interface TaskInfo {
    /** Unique AI task identifier - use this for all operations (NOT the workflow engine's id) */
    _id: string;
    /** Task type (e.g., 'Document', 'Condition', 'Request') */
    type: string;
    /** Task display name */
    name: string;
    /** Full path to task (e.g., 'parent_id.onSuccess.child_id') */
    path: string;
    /** Nesting depth (0 = root level) */
    depth: number;
    /** Parent task _id (null if at root level) */
    parent_id: string | null;
    /** Branch name containing this task (null if at root level) */
    branchName: string | null;
    /** Whether this task has branches (is a container task) */
    hasBranches: boolean;
    /** Branch names if this is a branching task */
    branchNames?: string[];
}

/**
 * Extended task info with location context for onGetSelectedTask and onFindTask
 */
export interface TaskLocationInfo {
    /** Unique AI task identifier - use this for operations (NOT the workflow engine's id) */
    _id: string;
    /** Task type */
    type: string;
    /** Task display name */
    name: string;
    /** Task properties */
    properties: Record<string, unknown>;
    /** Full path to task */
    path: string;
    /** Nesting depth */
    depth: number;
    /** Parent task _id (null if at root level) */
    parent_id: string | null;
    /** Branch name containing this task (null if at root level) */
    branchName: string | null;
    /** Whether this task has branches */
    hasBranches?: boolean;
}

/**
 * Field definition for Body/Query validation schema (AJV/JTD format)
 */
export interface BodyQueryField {
    /** Field name (e.g., 'name', 'email', 'userId') */
    key: string;
    /** Field type: string, int32, float64, boolean, timestamp */
    keyType: 'string' | 'int8' | 'uint8' | 'int16' | 'uint16' | 'int32' | 'uint32' | 'float32' | 'float64' | 'boolean' | 'timestamp';
    /** Whether the field is required */
    required: boolean;
    /** Validation pattern (regex) */
    pattern?: string;
    /** Error message for validation failure */
    errorMessage?: string;
    /** Minimum length for string fields */
    minLength?: number;
    /** Maximum length for string fields */
    maxLength?: number;
}

// NOTE: BranchDefinition and TaskDefinition are re-exported from stepUtils at top of file
// to avoid type duplication and ensure compatibility with action.workflow.tsx

// Chat panel props
export interface WorkflowChatPanelProps {
    workflowContext?: WorkflowContext;
    onSuggestionApply?: (suggestion: WorkflowSuggestion) => void;
    /** 
     * Create a new task
     * @param taskType - Task type (Document, Condition, etc.)
     * @param taskId - Execution ID (camelCase, no spaces) - used for state storage: {$.taskId.data}
     * @param properties - Task configuration
     * @param taskName - Optional display name (can have spaces)
     */
    onTaskCreate?: (taskType: string, taskId: string, properties?: Record<string, unknown>, taskName?: string) => void;
    onTaskModify?: (taskId: string, properties: Record<string, unknown>) => void;
    currentDefinition?: unknown;
    className?: string;
    isOpen?: boolean;
    onToggle?: () => void;
    /** Designer callbacks for AI to control the workflow designer */
    designer?: DesignerCallbacks;
}

/**
 * Available task types in the workflow system
 * Based on apt-yuj/docs/workflow/README.md official documentation
 */
export const AVAILABLE_TASK_TYPES = [
    // Flow Control Tasks (01-flow-control.md)
    'Condition',     // if/else branching with conditions, onSuccess, onFailure
    'Switch',        // Multi-branch routing based on value match
    'Loop',          // Fixed iteration loop with index variable
    'Iterator',      // Array iteration with var, index, async, break options
    'State',         // Workflow state management
    'Transaction',   // Database transaction management
    'Promise',       // Parallel task execution

    // Data Operations Tasks (02-data-operations.md)
    'Document',      // CRUD on database documents (Get, Post, Put, Paging, UpsertAll)
    'Entity',        // Entity metadata operations (Get, Post, Put, List, Paging, Clone)
    'ORM',           // Object-Relational Mapping operations
    'Query',         // Database queries
    'ESQuery',       // Elasticsearch queries
    'Repository',    // Repository pattern operations
    'History',       // History/audit trail operations
    'Filter',        // Data filtering
    'Export',        // Data export operations
    'Trino',         // Trino/Presto distributed SQL

    // Transformation Tasks (03-transformations.md)
    'Array',         // Array operations (Get, Push, Index, Find, Slice, Join, Map, Sort, Filter, Merge, Distinct)
    'Object',        // Object manipulation (Get, Set, Delete, Merge, Pick, Omit, Keys, Values, Clone, Flatten)
    'String',        // String operations (Concat, Split, ToUpperCase, Trim, Replace, Slugify, Template)
    'JSON',          // JSON parsing/serialization (Parse, Stringify)
    'Resolver',      // Dynamic value resolution (Resolve, ResolveAll)
    'Template',      // Template rendering with Handlebars

    // HTTP & External Tasks (04-http-external.md)
    'HTTP',          // External HTTP requests (Get, Post, Put, Patch, Delete)
    'Request',       // Internal request forwarding (Action, Forward, Proxy, Schedule, Produce)
    'SMTP',          // Email sending
    'Response',      // Final workflow response

    // Security Tasks (05-security.md)
    'Security',      // Authentication/authorization
    'RSA',           // RSA encryption/decryption
    'Crypto',        // Cryptographic operations

    // Utility Tasks (06-utilities.md)
    'UUID',          // UUID generation
    'Sequence',      // Sequential ID generation with prefix/padding
    'Identifier',    // ID generation (UUID, NanoId with formats)
    'Date',          // Date operations (GetDate, Format, Add, Subtract, Diff, IsBefore, IsAfter)
    'Math',          // Math operations (Evaluate, Round, Floor, Ceil, Min, Max, Random, Percentage)
    'Geometry',      // Geographic calculations (Haversine, Distance, Contains)
    'Cache',         // Redis caching & socket emit (Get, Set, Delete, Expire, Increment, Emit, Broadcast)
    'Validator',     // Data validation (Schema, UUID, Email, URL, Custom)

    // System Tasks (08-system.md)
    'Action',        // Execute another action
    'Schema',        // Schema operations
    'Subscription',  // Subscription operations
    'Provider',      // Provider operations
    'Variable',      // Variable assignment
    'Version',       // Version management
    'UIComponent',   // UI component operations

    // Workflow & Rules Tasks (09-workflow-rules.md)
    'Rule',          // Business rule execution
    'Workflow',      // Nested workflow execution
    'MCP',           // Model Context Protocol
    'MCPTool',       // MCP Tool operations
    'MCPResource',   // MCP Resource operations
    'MCPPrompt',     // MCP Prompt operations
] as const;

export type TaskType = typeof AVAILABLE_TASK_TYPES[number];

// Task property interface
export interface TaskProperty {
    name: string;
    type: string;
    required: boolean;
    description: string;
}

// Task documentation for the assistant
export interface TaskDocumentation {
    type: TaskType;
    description: string;
    properties: TaskProperty[];
    examples: string[];
}

// Chat status
export type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error';

// Quick prompt type
export interface QuickPrompt {
    id: string;
    label: string;
    prompt: string;
    category?: string;
}
