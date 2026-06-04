/**
 * Knowledge Agent
 *
 * Handles all tools related to workflow documentation, task interfaces,
 * generation context, context awareness, and validation.
 * All tools execute synchronously against local knowledge modules.
 */

import type { TaskAgent } from './types';
import {
    TASK_DOCUMENTATION,
    WORKFLOW_PATTERNS,
    WORKFLOW_BEST_PRACTICES,
    getTaskDocumentation,
    getAllTaskTypes,
    TASK_INTERFACE_DOCS,
} from '../knowledge';
import {
    TASK_GENERATION_CONTEXTS,
    CORE_TYPES,
    getTaskGenerationContext,
} from '../knowledge/task-generation-context';
import {
    analyzeWorkflow,
    getContextualHelp,
    validateTaskAddition,
    getPathSuggestions,
    generateWorkflowSummary,
    getWorkflowContext,
    type WorkflowDefinition,
} from '../knowledge/workflow-context-awareness';

// ─── Handlers ────────────────────────────────────────────────────────────────

function handleGetAvailableTasks(): unknown {
    return {
        tasks: getAllTaskTypes().map(type => ({
            type,
            description: TASK_DOCUMENTATION[type]?.description || 'No description',
        })),
    };
}

function handleExplainTask(args: Record<string, unknown>): unknown {
    const { taskType } = args as { taskType: string };
    const doc = getTaskDocumentation(taskType);
    if (!doc) return { error: `Unknown task type: ${taskType}` };
    return {
        type: doc.type,
        description: doc.description,
        properties: doc.properties,
        examples: doc.examples,
    };
}

function handleGenerateTaskConfiguration(args: Record<string, unknown>): unknown {
    const { taskType, taskName, requirements } = args as {
        taskType: string;
        taskName?: string;
        requirements?: string;
    };
    const doc = getTaskDocumentation(taskType);
    if (!doc) return { error: `Unknown task type: ${taskType}` };

    const config: Record<string, unknown> = {
        id: `${taskName?.toLowerCase().replaceAll(/\s+/g, '_') || taskType.toLowerCase()}_${Date.now()}`,
        type: taskType,
        name: taskName || `${taskType} Task`,
        componentType: 'task',
    };
    doc.properties.forEach(prop => {
        if (prop.required) config[prop.name] = `<${prop.description}>`;
    });
    return {
        suggestion: config,
        properties: doc.properties,
        hint: requirements ? `Configure based on: ${requirements}` : 'Configure required properties',
    };
}

function handleGetWorkflowPatterns(args: Record<string, unknown>): unknown {
    const { patternName } = args as { patternName?: string };
    if (patternName) {
        const pattern = WORKFLOW_PATTERNS.find(p => p.name.toLowerCase() === patternName.toLowerCase());
        return pattern || { error: `Pattern not found: ${patternName}` };
    }
    return { patterns: WORKFLOW_PATTERNS };
}

function handleGetBestPractices(args: Record<string, unknown>): unknown {
    const { category } = args as { category?: string };
    if (category) {
        const practices = WORKFLOW_BEST_PRACTICES.find(p => p.category.toLowerCase() === category.toLowerCase());
        return practices || { error: `Category not found: ${category}` };
    }
    return { bestPractices: WORKFLOW_BEST_PRACTICES };
}

function handleGetTaskInterface(args: Record<string, unknown>): unknown {
    const { taskType } = args as { taskType: string };
    const interfaceDoc = TASK_INTERFACE_DOCS[taskType as keyof typeof TASK_INTERFACE_DOCS];
    const taskDoc = getTaskDocumentation(taskType);

    if (!interfaceDoc && !taskDoc) return { error: `Unknown task type: ${taskType}` };

    return {
        taskType,
        interface: interfaceDoc || {
            description: taskDoc?.description,
            methods: [],
            requiredProps: taskDoc?.properties?.filter(p => p.required).map(p => p.name) || [],
        },
        properties: taskDoc?.properties || [],
        examples: taskDoc?.examples || [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tips: (interfaceDoc as any)?.tips || [],
    };
}

function handleGetTaskGenerationContext(args: Record<string, unknown>): unknown {
    const { taskType } = args as { taskType: string };

    if (!taskType) {
        return {
            error: 'taskType parameter is REQUIRED. You must specify which task type you need context for.',
            usage: 'Call getTaskGenerationContext({ taskType: "Query" }) or getTaskGenerationContext({ taskType: "Entity" })',
            availableTypes: Object.keys(TASK_GENERATION_CONTEXTS),
            quickReference: {
                Query: 'Database queries - requires: repository, method',
                Entity: 'Entity CRUD - requires: method, subscriptionId, containerId',
                Resolver: 'Data transformation - requires: payload (IKeyValue[])',
                Response: 'Workflow output - requires: statusCode, payload',
                HTTP: 'External API calls - requires: url, method',
                Condition: 'If/else branching - requires: conditions',
                Request: 'Call other schemas - requires: method, schema, action',
                Cache: 'Caching operations - requires: method, key',
                Iterator: 'Array iteration - requires: method, path, var',
                Array: 'Array manipulation - requires: method, path',
                Document: 'Document CRUD - requires: method, subscriptionId, schemaId',
            },
            hint: 'Call this tool again with a specific taskType to get complete generation context',
        };
    }

    const context = getTaskGenerationContext(taskType);
    const taskDoc = getTaskDocumentation(taskType);

    if (!context && !taskDoc) {
        return {
            error: `Unknown task type: ${taskType}`,
            availableTypes: Object.keys(TASK_GENERATION_CONTEXTS),
            hint: 'Use one of the available task types listed above',
        };
    }

    if (context) {
        return {
            taskType: context.taskType,
            description: context.description,
            interface: context.interface,
            requiredProperties: context.requiredProperties,
            optionalProperties: context.optionalProperties,
            methods: context.methods,
            methodRequirements: context.methodRequirements,
            executionFlow: context.executionFlow,
            completeExamples: context.completeExamples,
            commonMistakes: context.commonMistakes,
            tips: context.tips,
            coreTypes: {
                IKeyValue: CORE_TYPES.IKeyValue,
                Condition: CORE_TYPES.Condition,
            },
            additionalProperties: taskDoc?.properties || [],
            generationInstructions: `
STRICT RULES for ${taskType} task generation:
1. Use ONLY property names from the interface above — do NOT invent properties that aren't listed.
2. REQUIRED properties (MUST include ALL): ${context.requiredProperties.join(', ')}${context.methodRequirements ? '\n3. Method-specific requirements: ' + JSON.stringify(context.methodRequirements) : ''}
4. IKeyValue format: { Key: "fieldName", Value: <value>, Type: "Literal" | "Property" | "Calculated" }
   - Use Type: "Property" for path references like "{$.taskId.data}" or "{$.body.field}"
   - Use Type: "Literal" for static values like true, 100, "text"
5. Copy the structure from completeExamples above — they show working configs.
6. Do NOT add properties not in the interface. If you're unsure about a property name, it probably doesn't exist.
7. Data references: {$.taskId.data} can ONLY reference tasks that execute BEFORE this one.

EXECUTION FLOW:
${context.executionFlow}
`,
        };
    }

    // Fallback to basic task documentation
    return {
        taskType,
        description: taskDoc?.description,
        properties: taskDoc?.properties,
        examples: taskDoc?.examples,
        coreTypes: { IKeyValue: CORE_TYPES.IKeyValue },
        generationInstructions: `
Use the properties list to understand required fields.
IKeyValue structure: { Key: "name", Value: "value", Type: "Literal|Property|Calculated" }
`,
    };
}

function handleValidateWorkflow(args: Record<string, unknown>): unknown {
    const { definition } = args as { definition: string };
    try {
        const parsed = JSON.parse(definition);
        const issues: string[] = [];
        if (!parsed.sequence || !Array.isArray(parsed.sequence)) {
            issues.push('Workflow must have a sequence array');
        }
        const hasResolver = parsed.sequence?.some((s: { type?: string }) => s.type === 'Resolver');
        const hasResponse = parsed.sequence?.some((s: { type?: string }) => s.type === 'Response');
        if (!hasResolver) issues.push('Workflow should include a Resolver task');
        if (!hasResponse) issues.push('Workflow should include a Response task');
        const ids = parsed.sequence?.map((s: { id?: string }) => s.id) || [];
        const duplicates = ids.filter((id: string, i: number) => ids.indexOf(id) !== i);
        if (duplicates.length > 0) issues.push(`Duplicate task IDs: ${duplicates.join(', ')}`);
        return { valid: issues.length === 0, issues, taskCount: parsed.sequence?.length || 0 };
    } catch (e) {
        return { valid: false, issues: ['Invalid JSON structure'], error: String(e) };
    }
}

// ── Context-awareness tools ─────────────────────────────────────────────

function handleAnalyzeWorkflowContext(args: Record<string, unknown>): unknown {
    const { workflow } = args as { workflow?: WorkflowDefinition };
    if (!workflow) {
        return {
            error: 'No workflow provided. Use getCurrentWorkflow first to get the workflow definition.',
            hint: 'Call getCurrentWorkflow() then pass the result to analyzeWorkflowContext',
        };
    }
    const context = getWorkflowContext(workflow);
    return {
        analysis: context.analysis,
        summary: context.summary,
        contextualHelp: context.help,
        quickInfo: {
            taskCount: context.analysis.taskCount,
            hasResponse: context.analysis.hasResponse,
            taskSequence: context.analysis.taskOrder,
            availablePaths: context.analysis.availableReferences.map(r => r.path),
            issues: context.analysis.issues.map(i => i.message),
            suggestions: context.analysis.suggestions.map(s => s.title),
        },
    };
}

function handleGetAvailableDataPaths(args: Record<string, unknown>): unknown {
    const { workflow, afterTaskId, filterType } = args as {
        workflow?: WorkflowDefinition;
        afterTaskId?: string;
        filterType?: 'object' | 'array' | 'primitive';
    };
    if (!workflow) {
        return {
            error: 'No workflow provided',
            builtInPaths: [
                '{$.body}', '{$.body.fieldName}', '{$.params}', '{$.params.documentId}',
                '{$.query}', '{$.query.page}', '{$.subscription.id}', '{$.userId}', '{$.now}',
            ],
            hint: 'These built-in paths are always available',
        };
    }
    const paths = getPathSuggestions(workflow, afterTaskId, filterType);
    return {
        availablePaths: paths,
        pathsBySource: {
            builtIn: paths.filter(p => p.source === 'request' || p.source === 'context'),
            fromTasks: paths.filter(p => p.source !== 'request' && p.source !== 'context'),
        },
        usage: 'Use these paths in IKeyValue with Type: "Property"',
    };
}

function handleValidateTaskBeforeAdd(args: Record<string, unknown>): unknown {
    const { workflow, taskType, taskId, taskName, properties, afterTaskId } = args as {
        workflow: WorkflowDefinition;
        taskType: string;
        taskId: string;
        taskName?: string;
        properties: Record<string, unknown>;
        afterTaskId?: string;
    };
    if (!workflow || !taskType || !taskId) {
        return {
            error: 'Missing required parameters: workflow, taskType, taskId',
            hint: 'Provide all parameters to validate task addition. taskId is the execution ID (camelCase, no spaces)',
        };
    }
    const displayName = taskName || taskId;
    const validation = validateTaskAddition(workflow, taskType, displayName, properties || {}, afterTaskId);
    return {
        ...validation,
        canAdd: validation.valid,
        suggestion: validation.valid
            ? 'Task configuration is valid. Proceed with addTaskToSequence.'
            : 'Fix the errors before adding the task.',
    };
}

function handleGetContextualSuggestions(args: Record<string, unknown>): unknown {
    const { workflow, afterTaskId } = args as { workflow?: WorkflowDefinition; afterTaskId?: string };
    if (!workflow) {
        return {
            suggestedTasks: ['Query', 'Entity', 'HTTP', 'Validator'],
            reason: 'No workflow context - these are good starting tasks',
            bestPractices: [
                'Start with data retrieval (Query/Entity) or validation',
                'Always end with a Response task',
                'Use Resolver to transform data before Response',
            ],
        };
    }
    const help = getContextualHelp(workflow, afterTaskId);
    const analysis = analyzeWorkflow(workflow);
    return {
        currentPosition: help.currentPosition,
        suggestedTasks: help.suggestedNextTasks,
        availableReferences: help.availableReferences.slice(0, 10),
        warnings: help.warnings,
        bestPractices: help.bestPractices,
        workflowState: {
            taskCount: analysis.taskCount,
            hasResponse: analysis.hasResponse,
            hasBranching: analysis.hasBranching,
        },
    };
}

function handleGetWorkflowSummary(args: Record<string, unknown>): unknown {
    const { workflow } = args as { workflow?: WorkflowDefinition };
    if (!workflow) {
        return { summary: 'No workflow provided', hint: 'Call getCurrentWorkflow() first to get the workflow definition' };
    }
    return { summary: generateWorkflowSummary(workflow), format: 'markdown' };
}

// ─── Agent factory ───────────────────────────────────────────────────────────

export function createKnowledgeAgent(): TaskAgent {
    return {
        name: 'knowledge',
        description: 'Workflow documentation, task interfaces, generation context, context awareness, and validation',
        tools: [
            { name: 'getAvailableTasks', execute: handleGetAvailableTasks },
            { name: 'explainTask', execute: handleExplainTask },
            { name: 'generateTaskConfiguration', execute: handleGenerateTaskConfiguration },
            { name: 'suggestTaskConfiguration', execute: handleGenerateTaskConfiguration }, // alias
            { name: 'getWorkflowPatterns', execute: handleGetWorkflowPatterns },
            { name: 'getBestPractices', execute: handleGetBestPractices },
            { name: 'getTaskInterface', execute: handleGetTaskInterface },
            { name: 'getTaskGenerationContext', execute: handleGetTaskGenerationContext },
            { name: 'validateWorkflow', execute: handleValidateWorkflow },
            // Context awareness
            { name: 'analyzeWorkflowContext', execute: handleAnalyzeWorkflowContext },
            { name: 'getAvailableDataPaths', execute: handleGetAvailableDataPaths },
            { name: 'validateTaskBeforeAdd', execute: handleValidateTaskBeforeAdd },
            { name: 'getContextualSuggestions', execute: handleGetContextualSuggestions },
            { name: 'getWorkflowSummary', execute: handleGetWorkflowSummary },
        ],
    };
}
