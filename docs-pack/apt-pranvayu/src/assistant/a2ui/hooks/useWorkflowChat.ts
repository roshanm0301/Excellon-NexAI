/**
 * useWorkflowChat Hook
 *
 * Custom hook for managing workflow assistant chat using Vercel AI SDK.
 * Connects to apt-yuj backend agent-server chat API.
 *
 * Refactored to use task-wise agent architecture:
 *   - ToolRegistry dispatches every tool call to the correct agent
 *   - KnowledgeAgent: documentation, interfaces, generation context, validation
 *   - DesignerAgent:  workflow designer UI control (task CRUD, schema, rules)
 *   - SchemaAgent:    async API calls for schema/workflow/template discovery
 *   - PlanningAgent:  execution plan validation and todo list tracking
 *
 * The monolithic switch/if-else chains and duplicated dispatch logic have been
 * replaced by a single `registry.execute(toolName, args, ctx)` call.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import {
    DefaultChatTransport,
    lastAssistantMessageIsCompleteWithToolCalls,
    isToolUIPart,
    getToolName,
} from 'ai';
import type {
    WorkflowContext,
    WorkflowUIMessage,
    ChatStatus,
    WorkflowSuggestion,
    DesignerCallbacks,
} from '../types';
import {
    QUICK_PROMPTS,
    getChatApiUrl,
    getSubscription,
    WORKFLOW_ASSISTANT_SYSTEM_PROMPT,
    WORKFLOW_TOOLS,
} from '../config';
import { createWorkflowAgentRegistry } from '../agents';
import type { ToolContext, LLMTodoItem } from '../agents/types';

// â”€â”€â”€ Re-exports for backward compatibility â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// WorkflowChatPanel and other consumers import these types from '../../hooks'
export type { LLMTodoItem } from '../agents/types';

// â”€â”€â”€ Interfaces â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface UseWorkflowChatOptions {
    workflowContext?: WorkflowContext;
    currentDefinition?: unknown;
    onSuggestionGenerated?: (suggestion: WorkflowSuggestion) => void;
    /**
     * Create a new task
     * @param taskType - Task type (Document, Condition, etc.)
     * @param taskId - Execution ID (camelCase, no spaces) â€” used for state storage: {$.taskId.data}
     * @param properties - Task configuration
     * @param taskName - Optional display name (can have spaces)
     */
    onTaskCreate?: (
        taskType: string,
        taskId: string,
        properties?: Record<string, unknown>,
        taskName?: string,
    ) => void;
    onTaskModify?: (taskId: string, properties: Record<string, unknown>) => void;
    onError?: (error: Error) => void;
    /** LLM configuration ID from backend (optional, uses default if not provided) */
    llmConfigId?: string;
    /** Designer control callbacks */
    designer?: DesignerCallbacks;
}

/** Represents an active tool call being executed */
export interface ActiveToolCall {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'success' | 'error';
    startTime: number;
    endTime?: number;
    result?: unknown;
    args?: Record<string, unknown>;
}

interface UseWorkflowChatReturn {
    messages: WorkflowUIMessage[];
    input: string;
    setInput: (input: string) => void;
    sendMessage: (text: string) => void;
    status: ChatStatus;
    error: Error | null;
    stop: () => void;
    regenerate: () => void;
    clearMessages: () => void;
    quickPrompts: typeof QUICK_PROMPTS;
    applyQuickPrompt: (promptId: string) => void;
    isStreaming: boolean;
    /** Active tool calls with their execution status */
    activeToolCalls: ActiveToolCall[];
    /** LLM's progress tracking todo list */
    todoList: LLMTodoItem[];
}

// â”€â”€â”€ Hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const useWorkflowChat = (options: UseWorkflowChatOptions = {}): UseWorkflowChatReturn => {
    const {
        workflowContext,
        currentDefinition,
        onSuggestionGenerated,
        onTaskCreate,
        onTaskModify,
        onError,
        llmConfigId,
        designer,
    } = options;

    // â”€â”€ Local state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [activeToolCalls, setActiveToolCalls] = useState<ActiveToolCall[]>([]);
    const [todoList, setTodoList] = useState<LLMTodoItem[]>([]);

    // â”€â”€ Stable refs (avoids stale closures in callbacks) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const designerRef = useRef(designer);
    designerRef.current = designer;
    const onTaskCreateRef = useRef(onTaskCreate);
    onTaskCreateRef.current = onTaskCreate;
    const onTaskModifyRef = useRef(onTaskModify);
    onTaskModifyRef.current = onTaskModify;
    const todoRef = useRef(todoList);
    todoRef.current = todoList;

    // â”€â”€ Tool registry (created once) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const registry = useMemo(() => createWorkflowAgentRegistry(), []);

    /**
     * Build a fresh ToolContext for each tool execution.
     * Uses refs so values are always current even inside stale closures.
     */
    const getToolContext = useCallback((): ToolContext => ({
        designer: designerRef.current,
        workflowContext,
        todoState: {
            current: todoRef.current,
            update: setTodoList,
        },
        onTaskCreate: onTaskCreateRef.current,
        onTaskModify: onTaskModifyRef.current,
    }), [workflowContext]);

    // â”€â”€ System prompt â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let systemPrompt = WORKFLOW_ASSISTANT_SYSTEM_PROMPT;
    if (workflowContext) {
        systemPrompt += `\n\nCurrent Workflow Context:\n${JSON.stringify(workflowContext, null, 2)}`;
    }
    if (currentDefinition) {
        systemPrompt += `\n\nCurrent Workflow Definition:\n${JSON.stringify(currentDefinition, null, 2)}`;
    }

    // â”€â”€ Vercel AI SDK useChat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const {
        messages,
        sendMessage: sendChatMessage,
        status,
        error,
        stop,
        setMessages,
        addToolResult,
    } = useChat({
        transport: new DefaultChatTransport({
            api: getChatApiUrl(),
            headers: () => {
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                };
                // Auth token (OIDC or legacy)
                const oidcToken = localStorage.getItem('OIDC_TOKEN');
                const legacyToken = localStorage.getItem('accessToken');
                const token = oidcToken || legacyToken;
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                // Subscription
                const subscription = getSubscription();
                if (subscription) {
                    headers['Subscription'] = subscription;
                }
                return headers;
            },
            body: () => ({
                system: systemPrompt,
                llmConfigId,
                temperature: 0.7,
                maxTokens: 16384,
                tools: WORKFLOW_TOOLS,
                sendReasoning: false,
                sendSources: false,
            }),
        }),

        // â”€â”€ Primary tool execution path â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onToolCall: async ({ toolCall }) => {
            const toolName = toolCall.toolName;
            const toolCallId = toolCall.toolCallId;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const args = (toolCall as any).args || (toolCall as any).input || {};


            const ctx = getToolContext();
            const result = await registry.execute(toolName, args, ctx);


            if (result !== null && result !== undefined) {
                addToolResult({ toolCallId, tool: toolName, output: result });
            }
        },

        // Auto-resend after tool calls complete
        sendAutomaticallyWhen: ({ messages: currentMessages }) => {
            const shouldSend = lastAssistantMessageIsCompleteWithToolCalls({ messages: currentMessages });
            if (shouldSend) {
            }
            return shouldSend;
        },

        onFinish: ({ message }) => {
            // Extract suggestions from text content
            const content = message.parts
                .filter(part => part.type === 'text')
                .map(part => (part as { type: 'text'; text: string }).text)
                .join('');

            const codeBlockRegex = /```json\n([\s\S]*?)```/g;
            let match;
            while ((match = codeBlockRegex.exec(content)) !== null) {
                try {
                    const parsed = JSON.parse(match[1]);
                    if (parsed.type && (parsed.id || parsed.name)) {
                        const suggestion: WorkflowSuggestion = {
                            id: `suggestion_${Date.now()}`,
                            type: 'task',
                            title: `Add ${parsed.type} Task`,
                            description: parsed.name || `Create a new ${parsed.type} task`,
                            code: match[1],
                        };
                        onSuggestionGenerated?.(suggestion);
                    }
                } catch {
                    // Not valid JSON, ignore
                }
            }
        },

        onError: (err) => {
            console.error('Chat error:', err);
            onError?.(err);
        },
    });

    // â”€â”€ Message actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const sendMessage = useCallback((text: string) => {
        if (!text.trim()) return;
        sendChatMessage({ text });
        setInput('');
    }, [sendChatMessage]);

    const regenerate = useCallback(() => {
        if (messages.length >= 2) {
            const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
            if (lastUserMessage) {
                const content = lastUserMessage.parts
                    .filter(part => part.type === 'text')
                    .map(part => (part as { type: 'text'; text: string }).text)
                    .join('');
                const newMessages = messages.slice(0, -1);
                setMessages(newMessages);
                sendMessage(content);
            }
        }
    }, [messages, setMessages, sendMessage]);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setTodoList([]);
    }, [setMessages]);

    const applyQuickPrompt = useCallback((promptId: string) => {
        const prompt = QUICK_PROMPTS.find(p => p.id === promptId);
        if (prompt) {
            sendMessage(prompt.prompt);
        }
    }, [sendMessage]);

    // â”€â”€ Fallback: Process tool calls via useEffect â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // When onToolCall doesn't trigger (e.g., streaming edge cases),
    // this effect picks up tools in 'input-available' state.

    const processedToolCalls = useRef<Set<string>>(new Set());

    useEffect(() => {
        const processPendingToolCalls = async () => {
            for (const message of messages) {
                if (message.role !== 'assistant') continue;

                for (const part of message.parts) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if (!isToolUIPart(part as any)) continue;

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const toolPart = part as any;
                    const state = toolPart.state as string;
                    const toolCallId = toolPart.toolCallId as string;

                    // Skip already-processed or finished tool calls
                    if (processedToolCalls.current.has(toolCallId)) continue;
                    if (state === 'output-available' || state === 'output-error') continue;
                    if (state !== 'input-available') continue;

                    const toolName = getToolName(toolPart);
                    const args = (toolPart.input || {}) as Record<string, unknown>;


                    // Mark as processed to avoid duplicate execution
                    processedToolCalls.current.add(toolCallId);

                    // Track in UI
                    setActiveToolCalls(prev => [...prev, {
                        id: toolCallId,
                        name: toolName,
                        status: 'running' as const,
                        startTime: Date.now(),
                        args,
                    }]);

                    const updateToolStatus = (newStatus: 'success' | 'error', result?: unknown) => {
                        setActiveToolCalls(prev => prev.map(tc =>
                            tc.id === toolCallId
                                ? { ...tc, status: newStatus, endTime: Date.now(), result }
                                : tc,
                        ));
                        // Auto-clear after 10 seconds
                        setTimeout(() => {
                            setActiveToolCalls(prev => prev.filter(tc => tc.id !== toolCallId));
                        }, 10000);
                    };

                    // â”€â”€ Single dispatch via registry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                    try {
                        const ctx = getToolContext();
                        const result = await registry.execute(toolName, args, ctx);

                        updateToolStatus('success', result);

                        if (result !== null && result !== undefined) {
                            addToolResult({ toolCallId, tool: toolName, output: result });
                        }
                    } catch (error) {
                        const errMsg = error instanceof Error ? error.message : 'Tool execution failed';
                        console.error('[useEffect] Tool error:', toolName, error);
                        updateToolStatus('error', { error: errMsg });
                        addToolResult({
                            toolCallId,
                            tool: toolName,
                            output: { success: false, error: errMsg },
                        });
                    }
                }
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        processPendingToolCalls();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, addToolResult, getToolContext, registry]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const isStreaming = status === 'streaming' || status === 'submitted';

    return {
        messages: messages as WorkflowUIMessage[],
        input,
        setInput,
        sendMessage,
        status: status as ChatStatus,
        error: error as Error | null,
        stop: () => { stop(); },
        regenerate,
        clearMessages,
        quickPrompts: QUICK_PROMPTS,
        applyQuickPrompt,
        isStreaming,
        activeToolCalls,
        todoList,
    };
};
