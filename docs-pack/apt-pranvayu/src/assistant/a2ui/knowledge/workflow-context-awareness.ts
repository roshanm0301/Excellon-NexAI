/**
 * Workflow Context Awareness System
 * 
 * Provides intelligent analysis of workflow state, data flow,
 * task dependencies, and contextual suggestions for the AI assistant.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface WorkflowTask {
    id: string;
    type: string;
    name?: string;
    componentType?: string;
    properties?: Record<string, unknown>;
    // For branching tasks
    onSuccess?: WorkflowTask[];
    onFailure?: WorkflowTask[];
    branches?: Record<string, WorkflowTask[]>;
    // For container tasks
    sequence?: WorkflowTask[];
    children?: WorkflowTask[];
}

export interface WorkflowDefinition {
    properties?: Record<string, unknown>;
    sequence?: WorkflowTask[];
}

export interface DataReference {
    path: string;
    source: string;
    sourceTaskId: string;
    sourceTaskType: string;
    description: string;
    dataType: 'object' | 'array' | 'primitive' | 'unknown';
}

export interface TaskDependency {
    taskId: string;
    dependsOn: string[];
    referencedPaths: string[];
}

export interface WorkflowAnalysis {
    taskCount: number;
    taskTypes: Record<string, number>;
    taskOrder: string[];
    hasResponse: boolean;
    hasBranching: boolean;
    hasLooping: boolean;
    dataFlow: DataReference[];
    dependencies: TaskDependency[];
    availableReferences: DataReference[];
    issues: WorkflowIssue[];
    suggestions: WorkflowSuggestion[];
}

export interface WorkflowIssue {
    type: 'error' | 'warning' | 'info';
    taskId?: string;
    message: string;
    suggestion?: string;
}

export interface WorkflowSuggestion {
    type: 'add_task' | 'modify_task' | 'reorder' | 'best_practice';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    taskType?: string;
    afterTaskId?: string;
}

export interface ContextualHelp {
    currentPosition: string;
    availableReferences: DataReference[];
    suggestedNextTasks: string[];
    warnings: string[];
    bestPractices: string[];
}

// =============================================================================
// TASK OUTPUT DEFINITIONS
// =============================================================================

/**
 * Defines what data each task type produces
 */
const TASK_OUTPUT_SCHEMA: Record<string, {
    outputPath: string;
    outputType: 'object' | 'array' | 'primitive' | 'varies';
    description: string;
    commonFields?: string[];
}> = {
    Query: {
        outputPath: '{$.TaskId.data}',
        outputType: 'varies',
        description: 'Query result - array for Find/FindPaging, object for FindOne/Post/Put',
        commonFields: ['id', 'createdAt', 'updatedAt']
    },
    Entity: {
        outputPath: '{$.TaskId.data}',
        outputType: 'varies',
        description: 'Entity result - object for Get/Post/Put, array for List/Paging',
        commonFields: ['id', 'createdAt', 'updatedAt']
    },
    Document: {
        outputPath: '{$.TaskId.data}',
        outputType: 'varies',
        description: 'Document result - object for Get/Post/Put, array for Paging',
        commonFields: ['id', 'createdAt', 'updatedAt']
    },
    HTTP: {
        outputPath: '{$.TaskId.data}',
        outputType: 'varies',
        description: 'HTTP response body - structure depends on external API'
    },
    Resolver: {
        outputPath: '{$.TaskId.data}',
        outputType: 'object',
        description: 'Resolved object with transformed data'
    },
    Array: {
        outputPath: '{$.TaskId.data}',
        outputType: 'varies',
        description: 'Array operation result - array for Map/Filter/Sort, varies for others'
    },
    Iterator: {
        outputPath: '{$.TaskId.data}',
        outputType: 'array',
        description: 'Collected results from iteration'
    },
    Cache: {
        outputPath: '{$.TaskId.data}',
        outputType: 'varies',
        description: 'Cached value for Get, confirmation for Set/Clear'
    },
    Request: {
        outputPath: '{$.TaskId.data}',
        outputType: 'varies',
        description: 'Response from called action/workflow'
    },
    Condition: {
        outputPath: '{$.TaskId.data}',
        outputType: 'varies',
        description: 'Result from executed branch (onSuccess or onFailure)'
    },
    Switch: {
        outputPath: '{$.TaskId.data}',
        outputType: 'varies',
        description: 'Result from matched case branch'
    },
    Loop: {
        outputPath: '{$.TaskId.data}',
        outputType: 'array',
        description: 'Collected results from loop iterations'
    },
    Variable: {
        outputPath: '{$.TaskId.data}',
        outputType: 'varies',
        description: 'Variable value'
    },
    Validator: {
        outputPath: '{$.TaskId.data}',
        outputType: 'object',
        description: 'Validation result with valid boolean and errors array'
    },
    UUID: {
        outputPath: '{$.TaskId.data}',
        outputType: 'primitive',
        description: 'Generated UUID string'
    },
    Identifier: {
        outputPath: '{$.TaskId.data}',
        outputType: 'primitive',
        description: 'Generated identifier string'
    },
    Math: {
        outputPath: '{$.TaskId.data}',
        outputType: 'primitive',
        description: 'Mathematical operation result'
    },
    Date: {
        outputPath: '{$.TaskId.data}',
        outputType: 'varies',
        description: 'Date/time value or formatted string'
    },
    String: {
        outputPath: '{$.TaskId.data}',
        outputType: 'primitive',
        description: 'String operation result'
    },
    JSON: {
        outputPath: '{$.TaskId.data}',
        outputType: 'varies',
        description: 'Parsed JSON object/array or stringified result'
    },
    Crypto: {
        outputPath: '{$.TaskId.data}',
        outputType: 'primitive',
        description: 'Encrypted/decrypted/hashed value'
    },
    SMTP: {
        outputPath: '{$.TaskId.data}',
        outputType: 'object',
        description: 'Email send confirmation'
    }
};

// =============================================================================
// BUILT-IN REFERENCES
// =============================================================================

/**
 * References available in every workflow
 */
const BUILT_IN_REFERENCES: DataReference[] = [
    {
        path: '{$.body}',
        source: 'request',
        sourceTaskId: 'request',
        sourceTaskType: 'Request',
        description: 'Request body - POST/PUT payload',
        dataType: 'object'
    },
    {
        path: '{$.params}',
        source: 'request',
        sourceTaskId: 'request',
        sourceTaskType: 'Request',
        description: 'URL parameters (e.g., /documents/:documentId → {$.params.documentId})',
        dataType: 'object'
    },
    {
        path: '{$.query}',
        source: 'request',
        sourceTaskId: 'request',
        sourceTaskType: 'Request',
        description: 'Query string parameters (e.g., ?page=1 → {$.query.page})',
        dataType: 'object'
    },
    {
        path: '{$.headers}',
        source: 'request',
        sourceTaskId: 'request',
        sourceTaskType: 'Request',
        description: 'Request headers',
        dataType: 'object'
    },
    {
        path: '{$.subscription.id}',
        source: 'context',
        sourceTaskId: 'context',
        sourceTaskType: 'Context',
        description: 'Current subscription/tenant ID',
        dataType: 'primitive'
    },
    {
        path: '{$.userId}',
        source: 'context',
        sourceTaskId: 'context',
        sourceTaskType: 'Context',
        description: 'Current authenticated user ID',
        dataType: 'primitive'
    },
    {
        path: '{$.now}',
        source: 'context',
        sourceTaskId: 'context',
        sourceTaskType: 'Context',
        description: 'Current timestamp',
        dataType: 'primitive'
    },
    {
        path: '{$.schemaId}',
        source: 'context',
        sourceTaskId: 'context',
        sourceTaskType: 'Context',
        description: 'Current schema ID',
        dataType: 'primitive'
    }
];

// =============================================================================
// PATH EXTRACTION UTILITIES
// =============================================================================

/**
 * Extract all path references from a value
 */
function extractPaths(value: unknown): string[] {
    const paths: string[] = [];
    const pathRegex = /\{\$\.[^}]+\}/g;

    if (typeof value === 'string') {
        const matches = value.match(pathRegex);
        if (matches) {
            paths.push(...matches);
        }
    } else if (Array.isArray(value)) {
        value.forEach(item => paths.push(...extractPaths(item)));
    } else if (value && typeof value === 'object') {
        Object.values(value).forEach(v => paths.push(...extractPaths(v)));
    }

    return Array.from(new Set(paths));
}

/**
 * Extract task ID from a path reference
 */
function extractTaskIdFromPath(path: string): string | null {
    // Match patterns like {$.TaskName.data} or {$.TaskName.data.field}
    const regex = /\{\$\.([^.}]+)/;
    const match = regex.exec(path);
    if (match) {
        const potentialTaskId = match[1];
        // Filter out built-in references
        const builtIns = ['body', 'params', 'query', 'headers', 'subscriptionId', 'userId', 'now', 'schemaId', 'item', 'index', 'key', 'value'];
        if (!builtIns.includes(potentialTaskId)) {
            return potentialTaskId;
        }
    }
    return null;
}

// =============================================================================
// WORKFLOW ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Analyze a workflow definition and return comprehensive context
 */
export function analyzeWorkflow(workflow: WorkflowDefinition): WorkflowAnalysis {
    const tasks = workflow.sequence || [];
    const taskTypes: Record<string, number> = {};
    const taskOrder: string[] = [];
    const dataFlow: DataReference[] = [];
    const dependencies: TaskDependency[] = [];
    const issues: WorkflowIssue[] = [];
    const suggestions: WorkflowSuggestion[] = [];

    let hasResponse = false;
    let hasBranching = false;
    let hasLooping = false;

    // Collect all task IDs first for dependency analysis
    const allTaskIds = new Set<string>();

    function collectTaskIds(taskList: WorkflowTask[]) {
        taskList.forEach(task => {
            if (task.id) {
                allTaskIds.add(task.id);
            }
            // Recurse into branches
            if (task.onSuccess) collectTaskIds(task.onSuccess);
            if (task.onFailure) collectTaskIds(task.onFailure);
            if (task.sequence) collectTaskIds(task.sequence);
            if (task.branches) {
                Object.values(task.branches).forEach(branch => {
                    if (Array.isArray(branch)) collectTaskIds(branch);
                });
            }
        });
    }
    collectTaskIds(tasks);

    // Analyze each task
    function analyzeTask(task: WorkflowTask, depth: number = 0) {
        const taskId = task.id || task.name || 'unknown';
        const taskType = task.type || 'unknown';

        // Count task types
        taskTypes[taskType] = (taskTypes[taskType] || 0) + 1;

        // Track order (main sequence only)
        if (depth === 0) {
            taskOrder.push(taskId);
        }

        // Check for response
        if (taskType === 'Response') {
            hasResponse = true;
        }

        // Check for branching/looping
        if (['Condition', 'Switch'].includes(taskType)) {
            hasBranching = true;
        }
        if (['Loop', 'Iterator'].includes(taskType)) {
            hasLooping = true;
        }

        // Add data flow reference for this task
        const outputSchema = TASK_OUTPUT_SCHEMA[taskType];
        if (outputSchema) {
            dataFlow.push({
                path: outputSchema.outputPath.replace('TaskId', taskId),
                source: taskId,
                sourceTaskId: taskId,
                sourceTaskType: taskType,
                description: outputSchema.description,
                dataType: outputSchema.outputType === 'varies' ? 'unknown' : outputSchema.outputType
            });
        }

        // Extract dependencies from properties
        const referencedPaths = extractPaths(task.properties);
        const dependsOn: string[] = [];

        referencedPaths.forEach(path => {
            const depTaskId = extractTaskIdFromPath(path);
            if (depTaskId && allTaskIds.has(depTaskId) && depTaskId !== taskId) {
                if (!dependsOn.includes(depTaskId)) {
                    dependsOn.push(depTaskId);
                }
            }
        });

        dependencies.push({
            taskId,
            dependsOn,
            referencedPaths
        });

        // Check for issues
        if (!task.properties || Object.keys(task.properties).length === 0) {
            // Check if it's not a container task
            if (!['Condition', 'Switch', 'Loop', 'Iterator', 'Sequence', 'Promise'].includes(taskType)) {
                issues.push({
                    type: 'warning',
                    taskId,
                    message: `Task "${taskId}" (${taskType}) has empty properties`,
                    suggestion: 'Configure the task properties for proper execution'
                });
            }
        }

        // Recurse into branches
        if (task.onSuccess) {
            task.onSuccess.forEach(t => analyzeTask(t, depth + 1));
        }
        if (task.onFailure) {
            task.onFailure.forEach(t => analyzeTask(t, depth + 1));
        }
        if (task.sequence) {
            task.sequence.forEach(t => analyzeTask(t, depth + 1));
        }
    }

    tasks.forEach(task => analyzeTask(task));

    // Generate suggestions
    if (!hasResponse) {
        suggestions.push({
            type: 'add_task',
            priority: 'high',
            title: 'Add Response Task',
            description: 'Workflow should end with a Response task to return data to the caller',
            taskType: 'Response',
            afterTaskId: taskOrder[taskOrder.length - 1]
        });
    }

    if (tasks.length === 0) {
        suggestions.push({
            type: 'add_task',
            priority: 'high',
            title: 'Start Building Workflow',
            description: 'Add your first task to begin building the workflow',
            taskType: 'Query'
        });
    }

    // Check for common patterns
    const hasQuery = taskTypes['Query'] > 0 || taskTypes['Entity'] > 0 || taskTypes['Document'] > 0;
    const hasResolver = taskTypes['Resolver'] > 0;

    if (hasQuery && !hasResolver && hasResponse) {
        suggestions.push({
            type: 'best_practice',
            priority: 'medium',
            title: 'Consider Adding Resolver',
            description: 'Use a Resolver task to transform data before sending the response',
            taskType: 'Resolver'
        });
    }

    // Build available references
    const availableReferences = [
        ...BUILT_IN_REFERENCES,
        ...dataFlow
    ];

    return {
        taskCount: allTaskIds.size,
        taskTypes,
        taskOrder,
        hasResponse,
        hasBranching,
        hasLooping,
        dataFlow,
        dependencies,
        availableReferences,
        issues,
        suggestions
    };
}

/**
 * Get contextual help for a specific position in the workflow
 */
export function getContextualHelp(
    workflow: WorkflowDefinition,
    afterTaskId?: string
): ContextualHelp {
    const analysis = analyzeWorkflow(workflow);
    const warnings: string[] = [];
    const bestPractices: string[] = [];

    // Determine available references at this position
    let availableReferences = [...BUILT_IN_REFERENCES];

    if (afterTaskId) {
        // Add references from all tasks before this position
        const taskIndex = analysis.taskOrder.indexOf(afterTaskId);
        if (taskIndex >= 0) {
            const precedingTasks = analysis.taskOrder.slice(0, taskIndex + 1);
            availableReferences.push(
                ...analysis.dataFlow.filter(ref => precedingTasks.includes(ref.sourceTaskId))
            );
        }
    } else {
        // At beginning - only built-in references
    }

    // Determine suggested next tasks based on what's already present
    const suggestedNextTasks: string[] = [];

    if (analysis.taskCount === 0) {
        // Empty workflow
        suggestedNextTasks.push('Query', 'Entity', 'HTTP', 'Validator');
        bestPractices.push('Start with a data retrieval task (Query/Entity) or validation');
    } else if (!analysis.hasResponse) {
        // No response yet
        if (analysis.taskTypes['Resolver']) {
            suggestedNextTasks.push('Response');
        } else {
            suggestedNextTasks.push('Resolver', 'Response', 'Condition');
        }
        warnings.push('Workflow needs a Response task to return data');
    } else {
        // Has response - might be adding in middle
        suggestedNextTasks.push('Resolver', 'Condition', 'Query', 'Cache');
    }

    // Add best practices based on analysis
    if (analysis.taskCount > 0 && !analysis.taskTypes['Condition']) {
        bestPractices.push('Consider adding Condition tasks for error handling and validation');
    }

    if (analysis.taskTypes['Query'] > 2) {
        bestPractices.push('Multiple queries detected - consider using Promise task for parallel execution');
    }

    return {
        currentPosition: afterTaskId || 'start',
        availableReferences,
        suggestedNextTasks,
        warnings,
        bestPractices
    };
}

/**
 * Validate a proposed task addition
 */
export function validateTaskAddition(
    workflow: WorkflowDefinition,
    taskType: string,
    taskName: string,
    properties: Record<string, unknown>,
    afterTaskId?: string
): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const analysis = analyzeWorkflow(workflow);

    // Check for duplicate task names
    if (analysis.taskOrder.includes(taskName)) {
        errors.push(`Task name "${taskName}" already exists in workflow`);
    }

    // Validate referenced paths exist
    const referencedPaths = extractPaths(properties);
    const availableTaskIds = new Set([...analysis.taskOrder, 'body', 'params', 'query', 'headers', 'subscriptionId', 'userId', 'now', 'schemaId']);

    referencedPaths.forEach(path => {
        const taskId = extractTaskIdFromPath(path);
        if (taskId && !availableTaskIds.has(taskId)) {
            errors.push(`Referenced task "${taskId}" not found in workflow (path: ${path})`);
        }
    });

    // Check if adding after a task that exists
    if (afterTaskId && !analysis.taskOrder.includes(afterTaskId)) {
        errors.push(`Cannot add after "${afterTaskId}" - task not found`);
    }

    // Validate task-specific requirements
    if (taskType === 'Response' && analysis.hasResponse) {
        warnings.push('Workflow already has a Response task. Multiple Response tasks may cause issues.');
    }

    // Check for required properties
    const requiredPropsMap: Record<string, string[]> = {
        Query: ['repository', 'method'],
        Entity: ['method', 'subscriptionId', 'containerId'],
        Document: ['method', 'subscriptionId', 'schemaId'],
        HTTP: ['url', 'method'],
        Resolver: ['payload'],
        Response: ['statusCode', 'payload'],
        Cache: ['method', 'key'],
        Request: ['method']
    };

    const required = requiredPropsMap[taskType];
    if (required) {
        required.forEach(prop => {
            if (!(prop in properties)) {
                errors.push(`Missing required property "${prop}" for ${taskType} task`);
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Get data path suggestions for a specific task position
 */
export function getPathSuggestions(
    workflow: WorkflowDefinition,
    afterTaskId?: string,
    filterType?: 'object' | 'array' | 'primitive'
): DataReference[] {
    const help = getContextualHelp(workflow, afterTaskId);

    if (filterType) {
        return help.availableReferences.filter(ref =>
            ref.dataType === filterType || ref.dataType === 'unknown'
        );
    }

    return help.availableReferences;
}

/**
 * Generate a workflow summary for the LLM
 */
export function generateWorkflowSummary(workflow: WorkflowDefinition): string {
    const analysis = analyzeWorkflow(workflow);

    const lines: string[] = [
        '## Current Workflow State',
        '',
        `**Tasks:** ${analysis.taskCount}`,
        `**Has Response:** ${analysis.hasResponse ? 'Yes' : 'No (REQUIRED!)'}`,
        `**Has Branching:** ${analysis.hasBranching ? 'Yes' : 'No'}`,
        `**Has Looping:** ${analysis.hasLooping ? 'Yes' : 'No'}`,
        '',
        '### Task Sequence:',
        ...analysis.taskOrder.map((id, i) => {
            const dep = analysis.dependencies.find(d => d.taskId === id);
            const type = Object.entries(analysis.taskTypes).find(([t]) =>
                analysis.dataFlow.some(df => df.sourceTaskId === id && df.sourceTaskType === t)
            )?.[0] || 'unknown';
            return `${i + 1}. **${id}** (${type})${dep?.dependsOn.length ? ` → depends on: ${dep.dependsOn.join(', ')}` : ''}`;
        }),
        '',
        '### Available Data References:',
        '**Built-in:**',
        '- `{$.body}` - Request body',
        '- `{$.params}` - URL parameters',
        '- `{$.query}` - Query string',
        '- `{$.subscription.id}` - Current tenant',
        '',
        '**From Tasks:**',
        ...analysis.dataFlow.map(ref => `- \`${ref.path}\` - ${ref.description}`)
    ];

    if (analysis.issues.length > 0) {
        lines.push('', '### ⚠️ Issues:', ...analysis.issues.map(i => `- ${i.message}`));
    }

    if (analysis.suggestions.length > 0) {
        lines.push('', '### 💡 Suggestions:', ...analysis.suggestions.map(s => `- **${s.title}**: ${s.description}`));
    }

    return lines.join('\n');
}

/**
 * Build execution context for a task at runtime
 */
export function buildTaskContext(
    workflow: WorkflowDefinition,
    targetTaskId: string
): {
    precedingTasks: string[];
    availablePaths: string[];
    suggestedPaths: Record<string, string>;
} {
    const analysis = analyzeWorkflow(workflow);
    const taskIndex = analysis.taskOrder.indexOf(targetTaskId);

    const precedingTasks = taskIndex >= 0
        ? analysis.taskOrder.slice(0, taskIndex)
        : analysis.taskOrder;

    const availablePaths = [
        '{$.body}', '{$.params}', '{$.query}', '{$.headers}',
        '{$.subscription.id}', '{$.userId}', '{$.now}',
        ...precedingTasks.map(id => `{$.${id}.data}`)
    ];

    // Suggest common path patterns
    const suggestedPaths: Record<string, string> = {
        'Request body field': '{$.body.fieldName}',
        'URL parameter': '{$.params.documentId}',
        'Query parameter': '{$.query.page}',
        'Subscription context': '{$.subscription.id}',
        'Current timestamp': '{$.now}'
    };

    precedingTasks.forEach(id => {
        suggestedPaths[`Data from ${id}`] = `{$.${id}.data}`;
    });

    return {
        precedingTasks,
        availablePaths,
        suggestedPaths
    };
}

// =============================================================================
// EXPORT ANALYSIS TOOL FOR LLM
// =============================================================================

/**
 * Get comprehensive context for the LLM to make informed decisions
 */
export function getWorkflowContext(workflow: WorkflowDefinition): {
    analysis: WorkflowAnalysis;
    summary: string;
    help: ContextualHelp;
} {
    const analysis = analyzeWorkflow(workflow);
    const summary = generateWorkflowSummary(workflow);
    const help = getContextualHelp(workflow);

    return { analysis, summary, help };
}
