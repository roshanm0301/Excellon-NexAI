/**
 * Workflow Assistant Service
 * Handles AI-powered workflow assistance using Vercel AI SDK
 */

import { generateText, streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { AI_CONFIG, WORKFLOW_ASSISTANT_SYSTEM_PROMPT } from '../config';
import {
    TASK_DOCUMENTATION,
    WORKFLOW_BEST_PRACTICES,
    WORKFLOW_PATTERNS,
    getTaskDocumentation,
    getAllTaskTypes
} from '../knowledge';
import type { WorkflowContext, TaskProperty } from '../types';

// Initialize OpenAI provider
const getModel = () => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY || localStorage.getItem('OPENAI_API_KEY');
    if (!apiKey) {
        throw new Error('OpenAI API key not configured');
    }
    const openai = createOpenAI({ apiKey });
    return openai(AI_CONFIG.model);
};

// Tool definitions for workflow operations using AI SDK v6 tool() helper
export const workflowTools = {
    getAvailableTasks: tool({
        description: 'Get a list of all available task types with their descriptions',
        inputSchema: z.object({}),
        execute: async () => {
            const tasks = getAllTaskTypes().map(type => ({
                type,
                description: TASK_DOCUMENTATION[type].description
            }));
            return { tasks };
        }
    }),

    explainTask: tool({
        description: 'Get detailed documentation for a specific task type',
        inputSchema: z.object({
            taskType: z.string().describe('The task type to explain (e.g., DBQuery, APICall)')
        }),
        execute: async ({ taskType }: { taskType: string }) => {
            const doc = getTaskDocumentation(taskType);
            if (!doc) {
                return { error: `Unknown task type: ${taskType}` };
            }
            return {
                type: doc.type,
                description: doc.description,
                properties: doc.properties,
                examples: doc.examples
            };
        }
    }),

    suggestTaskConfiguration: tool({
        description: 'Generate a task configuration based on requirements',
        inputSchema: z.object({
            taskType: z.string().describe('The type of task to configure'),
            requirements: z.string().describe('Description of what the task should do')
        }),
        execute: async ({ taskType, requirements }: { taskType: string; requirements: string }) => {
            const doc = getTaskDocumentation(taskType);
            if (!doc) {
                return { error: `Unknown task type: ${taskType}` };
            }

            const config: Record<string, unknown> = {
                id: `${taskType.toLowerCase()}_${Date.now()}`,
                type: taskType,
                name: `${taskType} Task`
            };

            doc.properties.forEach((prop: TaskProperty) => {
                if (prop.required) {
                    config[prop.name] = `<${prop.description}>`;
                }
            });

            return {
                suggestion: config,
                properties: doc.properties,
                hint: `Configure the required properties based on: ${requirements}`
            };
        }
    }),

    getWorkflowPatterns: tool({
        description: 'Get common workflow patterns and templates',
        inputSchema: z.object({
            patternName: z.string().optional().describe('Specific pattern name to retrieve')
        }),
        execute: async ({ patternName }: { patternName?: string }) => {
            if (patternName) {
                const pattern = WORKFLOW_PATTERNS.find(
                    p => p.name.toLowerCase() === patternName.toLowerCase()
                );
                return pattern || { error: `Pattern not found: ${patternName}` };
            }
            return { patterns: WORKFLOW_PATTERNS };
        }
    }),

    getBestPractices: tool({
        description: 'Get workflow best practices for a specific category',
        inputSchema: z.object({
            category: z.string().optional().describe('Category: Error Handling, Performance, Security, Maintainability')
        }),
        execute: async ({ category }: { category?: string }) => {
            if (category) {
                const practices = WORKFLOW_BEST_PRACTICES.find(
                    p => p.category.toLowerCase() === category.toLowerCase()
                );
                return practices || { error: `Category not found: ${category}` };
            }
            return { bestPractices: WORKFLOW_BEST_PRACTICES };
        }
    }),

    validateWorkflowStructure: tool({
        description: 'Validate a workflow definition structure',
        inputSchema: z.object({
            definition: z.string().describe('JSON string of the workflow definition')
        }),
        execute: async ({ definition }: { definition: string }) => {
            try {
                const parsed = JSON.parse(definition);
                const issues: string[] = [];

                if (!parsed.sequence || !Array.isArray(parsed.sequence)) {
                    issues.push('Workflow must have a sequence array');
                }

                const hasResolver = parsed.sequence?.some((s: { type?: string }) => s.type === 'Resolver');
                const hasResponse = parsed.sequence?.some((s: { type?: string }) => s.type === 'Response');

                if (!hasResolver) {
                    issues.push('Workflow should include a Resolver task');
                }
                if (!hasResponse) {
                    issues.push('Workflow should include a Response task');
                }

                const ids = parsed.sequence?.map((s: { id?: string }) => s.id) || [];
                const duplicates = ids.filter((id: string, index: number) => ids.indexOf(id) !== index);
                if (duplicates.length > 0) {
                    issues.push(`Duplicate task IDs found: ${duplicates.join(', ')}`);
                }

                return {
                    valid: issues.length === 0,
                    issues,
                    taskCount: parsed.sequence?.length || 0
                };
            } catch (error) {
                return {
                    valid: false,
                    issues: ['Invalid JSON structure'],
                    error: String(error)
                };
            }
        }
    }),

    generateTaskCode: tool({
        description: 'Generate code snippet for a task configuration',
        inputSchema: z.object({
            taskType: z.string().describe('The type of task'),
            taskId: z.string().describe('Execution ID (camelCase, no spaces) - state storage key: {$.taskId.data}'),
            taskName: z.string().optional().describe('Display name (optional, can have spaces) - shown in designer UI'),
            config: z.record(z.string(), z.unknown()).optional().describe('Optional configuration overrides')
        }),
        execute: async ({ taskType, taskId, taskName, config }: { taskType: string; taskId: string; taskName?: string; config?: Record<string, unknown> }) => {
            const doc = getTaskDocumentation(taskType);
            if (!doc) {
                return { error: `Unknown task type: ${taskType}` };
            }

            // taskId = execution ID for state storage: state[taskId] = response
            // taskName = display name for UI (defaults to taskId if not provided)
            const executionId = taskId.replaceAll(/\s+/g, '');
            const displayName = taskName || taskId;

            const taskConfig = {
                id: executionId,    // Execution ID: state[task.id] = response
                type: taskType,
                name: displayName,  // Display name: shown in UI
                componentType: 'task',
                properties: config || {},
                success: { next: 'next_task' },
                failed: { next: 'error_handler' },
                error: { next: 'error_handler' }
            };

            return {
                code: JSON.stringify(taskConfig, null, 2),
                usage: `Add this task to your workflow sequence`
            };
        }
    })
};

/**
 * Generate a streaming chat response
 */
export const streamChatResponse = async (
    messages: { role: 'user' | 'assistant'; content: string }[],
    context?: WorkflowContext
) => {
    const model = getModel();

    let systemPrompt = WORKFLOW_ASSISTANT_SYSTEM_PROMPT;
    if (context?.currentWorkflowId) {
        systemPrompt += `\n\nCurrent Context:\n- Workflow ID: ${context.currentWorkflowId}`;
        if (context.currentSchemaId) {
            systemPrompt += `\n- Schema ID: ${context.currentSchemaId}`;
        }
        if (context.selectedTaskId) {
            systemPrompt += `\n- Selected Task ID: ${context.selectedTaskId}`;
        }
        if (context.workflowMode) {
            systemPrompt += `\n- Mode: ${context.workflowMode}`;
        }
    }

    const result = streamText({
        model,
        system: systemPrompt,
        messages,
        tools: workflowTools,
        temperature: AI_CONFIG.temperature,
    });

    return result;
};

/**
 * Generate a single response (non-streaming)
 */
export const generateChatResponse = async (
    prompt: string,
    context?: WorkflowContext
) => {
    const model = getModel();

    let systemPrompt = WORKFLOW_ASSISTANT_SYSTEM_PROMPT;
    if (context) {
        systemPrompt += `\n\nCurrent Context: ${JSON.stringify(context)}`;
    }

    const result = await generateText({
        model,
        system: systemPrompt,
        prompt,
        tools: workflowTools,
        temperature: AI_CONFIG.temperature,
    });

    return result;
};

/**
 * Quick suggestion generator
 */
export const generateQuickSuggestion = async (
    taskType: string,
    _currentDefinition?: unknown
): Promise<string> => {
    const doc = getTaskDocumentation(taskType);
    if (!doc) {
        return `Unknown task type: ${taskType}`;
    }

    const requiredProps = doc.properties
        .filter((p: TaskProperty) => p.required)
        .map((p: TaskProperty) => `- **${p.name}** (${p.type}): ${p.description}`)
        .join('\n');

    const optionalProps = doc.properties
        .filter((p: TaskProperty) => !p.required)
        .map((p: TaskProperty) => `- **${p.name}** (${p.type}): ${p.description}`)
        .join('\n');

    const examples = doc.examples
        .map((e: string) => `\`\`\`json\n${e}\n\`\`\``)
        .join('\n\n');

    const suggestion = `
## ${taskType} Task

${doc.description}

### Required Properties:
${requiredProps}

### Optional Properties:
${optionalProps}

### Examples:
${examples}
`;

    return suggestion;
};
