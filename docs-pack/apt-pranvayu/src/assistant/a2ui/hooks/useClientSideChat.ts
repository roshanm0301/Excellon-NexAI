/**
 * useClientSideChat Hook
 * Client-side only chat for React apps
 * Uses the Vercel AI SDK useChat hook with a simpler approach
 */

import { useState, useCallback } from 'react';
import type { WorkflowContext, WorkflowUIMessage, ChatStatus } from '../types';
import {
    TASK_DOCUMENTATION,
    getTaskDocumentation,
    getAllTaskTypes,
    WORKFLOW_PATTERNS,
    WORKFLOW_BEST_PRACTICES
} from '../knowledge';
import { QUICK_PROMPTS } from '../config';

interface UseClientSideChatOptions {
    apiKey?: string;
    workflowContext?: WorkflowContext;
    onError?: (error: Error) => void;
}

interface UseClientSideChatReturn {
    messages: WorkflowUIMessage[];
    input: string;
    setInput: (input: string) => void;
    sendMessage: (text: string) => void;
    status: ChatStatus;
    error: Error | null;
    stop: () => void;
    clearMessages: () => void;
    quickPrompts: typeof QUICK_PROMPTS;
    applyQuickPrompt: (promptId: string) => void;
    isStreaming: boolean;
    isConfigured: boolean;
    setApiKey: (key: string) => void;
}

// Simple message type for internal state
interface InternalMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
}

// Helper function to convert internal messages to WorkflowUIMessage format
const toWorkflowUIMessage = (msg: InternalMessage): WorkflowUIMessage => ({
    id: msg.id,
    role: msg.role,
    parts: [{ type: 'text' as const, text: msg.content }],
    createdAt: msg.createdAt,
} as WorkflowUIMessage);

// Knowledge-based response generator (no API required)
const generateLocalResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    // Check for task type questions
    const taskTypes = getAllTaskTypes();
    for (const taskType of taskTypes) {
        if (lowerQuery.includes(taskType.toLowerCase())) {
            const doc = getTaskDocumentation(taskType);
            if (doc) {
                const requiredProps = doc.properties
                    .filter(p => p.required)
                    .map(p => `- **${p.name}** (${p.type}): ${p.description}`)
                    .join('\n');

                return `## ${doc.type} Task\n\n${doc.description}\n\n### Required Properties:\n${requiredProps}\n\n### Example:\n\`\`\`json\n${doc.examples[0] || '{}'}\n\`\`\``;
            }
        }
    }

    // Check for pattern questions
    if (lowerQuery.includes('pattern') || lowerQuery.includes('template')) {
        const patterns = WORKFLOW_PATTERNS.map(p => `- **${p.name}**: ${p.description}`).join('\n');
        return `## Workflow Patterns\n\nHere are the available workflow patterns:\n\n${patterns}`;
    }

    // Check for best practices questions
    if (lowerQuery.includes('best practice') || lowerQuery.includes('recommendation')) {
        const practices = WORKFLOW_BEST_PRACTICES.map(bp => {
            const practiceList = bp.practices.map(p => '- ' + p).join('\n');
            return '### ' + bp.category + '\n' + practiceList;
        }).join('\n\n');
        return `## Workflow Best Practices\n\n${practices}`;
    }

    // Check for available tasks question
    if (lowerQuery.includes('available') || lowerQuery.includes('list') || lowerQuery.includes('task type')) {
        const tasks = taskTypes.map(type => {
            const doc = TASK_DOCUMENTATION[type];
            return `- **${type}**: ${doc.description}`;
        }).join('\n');
        return `## Available Task Types\n\n${tasks}`;
    }

    // Default response
    return `I can help you with workflows! Try asking about:\n\n- Specific task types (e.g., "How do I use DBQuery?")\n- Workflow patterns (e.g., "Show me workflow patterns")\n- Best practices (e.g., "What are workflow best practices?")\n- Available tasks (e.g., "What task types are available?")`;
};

export const useClientSideChat = (
    options: UseClientSideChatOptions = {}
): UseClientSideChatReturn => {
    const { onError } = options;
    const [messages, setMessages] = useState<InternalMessage[]>([]);
    const [input, setInput] = useState('');
    const [status, setStatus] = useState<ChatStatus>('ready');
    const [error, setError] = useState<Error | null>(null);
    const [storedApiKey, setStoredApiKey] = useState<string | null>(() => {
        if (options.apiKey) return options.apiKey;
        if (typeof localStorage === 'undefined') return null;
        return localStorage.getItem('OPENAI_API_KEY');
    });

    const isConfigured = Boolean(storedApiKey);

    const setApiKey = useCallback((key: string) => {
        setStoredApiKey(key);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('OPENAI_API_KEY', key);
        }
    }, []);

    const sendMessage = useCallback((text: string) => {
        if (!text.trim()) return;

        // Add user message
        const userMessage: InternalMessage = {
            id: `user_${Date.now()}`,
            role: 'user',
            content: text,
            createdAt: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setStatus('streaming');

        // Generate response (simulated delay for UX)
        setTimeout(() => {
            try {
                const response = generateLocalResponse(text);

                const assistantMessage: InternalMessage = {
                    id: `assistant_${Date.now()}`,
                    role: 'assistant',
                    content: response,
                    createdAt: new Date(),
                };

                setMessages(prev => [...prev, assistantMessage]);
                setStatus('ready');
            } catch (err) {
                const errorObj = err instanceof Error ? err : new Error('Unknown error');
                setError(errorObj);
                onError?.(errorObj);
                setStatus('error');
            }
        }, 500);
    }, [onError]);

    const stop = useCallback(() => {
        setStatus('ready');
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
        setStatus('ready');
    }, []);

    const applyQuickPrompt = useCallback((promptId: string) => {
        const prompt = QUICK_PROMPTS.find(p => p.id === promptId);
        if (prompt) {
            sendMessage(prompt.prompt);
        }
    }, [sendMessage]);

    const isStreaming = status === 'streaming' || status === 'submitted';

    return {
        messages: messages.map(toWorkflowUIMessage),
        input,
        setInput,
        sendMessage,
        status,
        error,
        stop,
        clearMessages,
        quickPrompts: QUICK_PROMPTS,
        applyQuickPrompt,
        isStreaming,
        isConfigured,
        setApiKey,
    };
};

