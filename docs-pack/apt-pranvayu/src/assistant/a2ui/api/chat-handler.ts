/**
 * Workflow Assistant Chat API Handler
 * Server-side handler for AI chat using Vercel AI SDK
 * 
 * Note: This file is designed for a Node.js/Express backend.
 * For React-only apps, use the client-side DirectChatTransport instead.
 */

import { streamText, convertToModelMessages, UIMessage, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import {
    TASK_DOCUMENTATION,
    getTaskDocumentation,
    getAllTaskTypes,
    WORKFLOW_PATTERNS,
    WORKFLOW_BEST_PRACTICES
} from '../knowledge';
import { AI_CONFIG, WORKFLOW_ASSISTANT_SYSTEM_PROMPT } from '../config';

// Initialize OpenAI with API key
const createModel = (apiKey: string) => {
    const openai = createOpenAI({ apiKey });
    return openai(AI_CONFIG.model);
};

// Tool definitions (AI SDK v6 compatible using tool() helper)
const createWorkflowTools = () => ({
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
            taskType: z.string().describe('The task type to explain')
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
                name: `${taskType} Task`,
                componentType: 'task'
            };

            doc.properties.forEach(prop => {
                if (prop.required) {
                    config[prop.name] = `<${prop.description}>`;
                }
            });

            return {
                suggestion: config,
                properties: doc.properties,
                hint: `Configure based on: ${requirements}`
            };
        }
    }),

    getWorkflowPatterns: tool({
        description: 'Get common workflow patterns and templates',
        inputSchema: z.object({
            patternName: z.string().optional().describe('Specific pattern name')
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
        description: 'Get workflow best practices',
        inputSchema: z.object({
            category: z.string().optional().describe('Category name')
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

    generateTaskCode: tool({
        description: 'Generate code snippet for a task',
        inputSchema: z.object({
            taskType: z.string().describe('The type of task'),
            taskId: z.string().describe('Execution ID (camelCase, no spaces) - state storage key: {$.taskId.data}'),
            taskName: z.string().optional().describe('Display name (optional, can have spaces) - shown in designer UI'),
            config: z.record(z.string(), z.unknown()).optional().describe('Configuration overrides')
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
                usage: 'Add this task to your workflow sequence'
            };
        }
    })
});

/**
 * Request handler interface
 */
interface ChatRequest {
    messages: UIMessage[];
    context?: {
        currentWorkflowId?: string;
        currentSchemaId?: string;
        selectedTaskId?: string;
        workflowMode?: string;
    };
}

/**
 * Handle chat request (for Express/Node.js backend)
 */
export const handleChatRequest = async (
    request: ChatRequest,
    apiKey: string
) => {
    const { messages, context } = request;
    const model = createModel(apiKey);
    const tools = createWorkflowTools();

    // Build context-aware system prompt
    let systemPrompt = WORKFLOW_ASSISTANT_SYSTEM_PROMPT;
    if (context) {
        systemPrompt += `\n\nCurrent Context:`;
        if (context.currentWorkflowId) {
            systemPrompt += `\n- Workflow ID: ${context.currentWorkflowId}`;
        }
        if (context.currentSchemaId) {
            systemPrompt += `\n- Schema ID: ${context.currentSchemaId}`;
        }
        if (context.selectedTaskId) {
            systemPrompt += `\n- Selected Task: ${context.selectedTaskId}`;
        }
        if (context.workflowMode) {
            systemPrompt += `\n- Mode: ${context.workflowMode}`;
        }
    }

    const result = streamText({
        model,
        system: systemPrompt,
        messages: await convertToModelMessages(messages),
        tools,
        temperature: AI_CONFIG.temperature,
    });

    return result;
};

/**
 * Express route handler example
 */
export const chatRouteHandler = async (req: any, res: any) => {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }

        const { messages, context } = req.body as ChatRequest;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid messages format' });
        }

        const result = await handleChatRequest({ messages, context }, apiKey);

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error('Chat API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export default chatRouteHandler;
