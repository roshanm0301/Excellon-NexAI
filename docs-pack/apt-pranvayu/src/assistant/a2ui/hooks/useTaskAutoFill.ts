/**
 * useTaskAutoFill Hook â€” Agentic Version
 *
 * Uses Vercel AI SDK `useChat` with a tool-calling loop, mirroring
 * how the main workflow chat works.  The AI autonomously:
 *   1. Calls read-only tools to gather context (listWorkflowTasks,
 *      getBodyQuerySchema, getTaskFillContext, etc.)
 *   2. Generates the taskSettings JSON
 *   3. Calls `applyTaskSettings` to write it to the form
 *
 * The hook intercepts the `applyTaskSettings` tool call, runs the
 * React setProperty â†’ forward() chain, and feeds the result back.
 *
 * Falls back to the local filler agent when the API is unreachable.
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import {
    DefaultChatTransport,
    lastAssistantMessageIsCompleteWithToolCalls,
    isToolUIPart,
    getToolName,
} from 'ai';
import { createWorkflowAgentRegistry } from '../agents';
import type { ToolContext } from '../agents/types';
import type { DesignerCallbacks, WorkflowContext } from '../types';
import type { AiTaskFillStatus } from '../components/AiTaskFillButton/AiTaskFillButton';
import {
    getChatApiUrl,
    getSubscription,
    AUTOFILL_TOOLS,
} from '../config';
import {
    getTaskGenerationContext,
    CORE_TYPES,
} from '../knowledge/task-generation-context';
import {
    TASK_INTERFACE_DOCS,
} from '../knowledge/task-interfaces';

// â”€â”€â”€ Public interfaces â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface UseTaskAutoFillOptions {
    designer?: DesignerCallbacks;
    workflowContext?: WorkflowContext;
}

export interface TaskAutoFillResult {
    status: AiTaskFillStatus;
    error: string | null;
    lastResult: Record<string, unknown> | null;
    /** Kick off the agentic auto-fill flow */
    autoFill: (
        taskType: string,
        subType: string | undefined,
        currentProperties: Record<string, unknown>,
        taskId: string,
        taskName: string,
        userPrompt: string,
        applyFn: (taskSettings: Record<string, unknown>) => void,
    ) => void;
}

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Max agent iterations (safety valve â€” with pre-gathering, only 1-2 rounds expected). */
const MAX_AGENT_ITERATIONS = 5;

// â”€â”€â”€ System prompt builder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function buildAutoFillSystemPrompt(
    taskType: string,
    subType: string | undefined,
    ctx: WorkflowContext | undefined,
): string {
    const parts: string[] = [
        'You are an expert workflow task configuration AI agent.',
        'Your job: generate a **perfect** taskSettings JSON from pre-gathered context and apply it.',
        '',
        '# CONTEXT',
        '',
        'All context is **PRE-GATHERED** and provided in the user message:',
        '- Task fill context (interface, docs, hints, required/optional props, common mistakes, tips)',
        '- Selected task (current configuration â€” preserve non-empty fields)',
        '- Workflow tasks (sibling tasks for {$.taskName.data} references)',
        '- Body/Query schemas (registered fields for payload/where arrays)',
        '- Schema details (columns with types and relations from the schema registry agent)',
        '- Action properties (schemaId, templateId, method)',
        '- Auto-fill skeleton (reference starting point from local filler)',
        '',
        '# YOUR ONLY TOOL',
        '',
        '`applyTaskSettings({ taskSettings })` â€” write the final JSON to the form.',
        '',
        '# HOW TO ENRICH (step by step)',
        '',
        '1. **Start from the Auto-Fill Skeleton** (section 8) as your base object.',
        '2. **Schema Details** (section 7): The `columnNames` array contains the REAL database column names.',
        '   - For Document/Entity/ORM/Provider Put/Post: build `payload[]` with one IKeyValue per column:',
        '     `{ Id: "<uuid>", IsResolved: false, Key: "<columnName>", Value: "{$.body.<columnName>}", Type: "Property" }`',
        '   - For Query/Entity FindOne/Get: build `where[]` using primary key columns.',
        '   - For Select operations: build `select[]` from column names.',
        '3. **Body Schema** (section 4): If `fields` are present, use those field keys for `{$.body.<key>}` data paths.',
        '   If body schema is empty, fall back to schema column names from section 7.',
        '4. **Query Schema** (section 5): Use for query parameter references `{$.query.<key>}`.',
        '5. **Action Properties** (section 6): Copy `schemaId`, `templateId`, `method` into taskSettings.',
        '6. **Workflow Tasks** (section 3): Use sibling task names for `{$.taskName.data}` references.',
        '   Example: if a task named "GetUser" exists, reference its output as `{$.GetUser.data}`.',
        '7. **Selected Task** (section 2): Preserve any non-empty existing values (merge, don\'t overwrite).',
        '8. **Task Fill Context** (section 1): Follow the interface definition and required/optional fields.',
        '',
        '**IMPORTANT: The skeleton may have empty payload/where arrays. You MUST populate them using schema columns.**',
        '',
        '**STOP after calling applyTaskSettings. No text. No explanation. Just the tool call.**',
        '',
        '# CRITICAL RULES',
        '',
        '- You MUST call `applyTaskSettings` exactly ONCE as your ONLY tool call.',
        '- After calling `applyTaskSettings`, STOP IMMEDIATELY. No text. No summary. No explanation.',
        '- Do NOT call any other tool â€” all context is already in the user message.',
        '- Do NOT output raw JSON in text â€” always use `applyTaskSettings`.',
        '- The `method` field in taskSettings is the SUB-TYPE (e.g., "Put", "Get", "Post"). It must match valid sub-types.',
        '- The `type` field in taskSettings is the PARENT type (e.g., "Document", "Variable").',
        '- Use IKeyValue format for payload/where/body arrays:',
        '  `{ Id: "<uuid>", IsResolved: false, Key: "fieldName", Value: "{$.body.field}", Type: "Property" }`',
        '  Type can be: "Property" (data path), "Literal" (hardcoded), "Calculated" (expression).',
        '- Use data paths: {$.body.field}, {$.params.documentId}, {$.auth.subscriptionId}, {$.taskName.data}.',
        '- Always include success/failed/error response blocks where the task type requires them.',
        '- **Response block format (MUST match DXForm editor shape):**',
        '  - success: `{ statusCode: 200, data: "payload", code: "200" }`',
        '  - failed:  `{ statusCode: 400, message: "Bad Request.", code: "400", error: "" }`',
        '  - error:   `{ statusCode: 500, message: "Something went wrong!", code: "500", error: "" }`',
        '  - Do NOT add `success: true/false` or `cookies: []` â€” the editor form has no fields for those.',
        '  - NEVER use `payload: [...]` inside success/failed/error â€” those are NOT the same as task payload.',
        '- Preserve existing non-empty values from the current task unless the user explicitly wants to change them.',
        '- Generate real UUIDs for IKeyValue Id fields (use crypto.randomUUID() format).',
        '- Always set subscriptionId to "{$.auth.subscriptionId}" for Document/Entity/Schema tasks.',
        '',
        `# CURRENT TASK: ${taskType}${subType ? ` / ${subType}` : ''}`,
    ];

    // Static interface fallback
    const iface = TASK_INTERFACE_DOCS[taskType as keyof typeof TASK_INTERFACE_DOCS];
    if (iface) {
        parts.push('', '## TypeScript interface (quick reference)', '```ts', String(iface), '```');
    }

    // Generation hints
    const genCtx = getTaskGenerationContext(taskType);
    if (genCtx) {
        parts.push('', '## Generation hints');
        if (genCtx.requiredProperties?.length) {
            parts.push(`Required properties: ${genCtx.requiredProperties.join(', ')}`);
        }
        if (genCtx.optionalProperties?.length) {
            parts.push(`Optional properties: ${genCtx.optionalProperties.join(', ')}`);
        }
        if (genCtx.methods?.length) {
            parts.push(`Available methods/sub-types: ${JSON.stringify(genCtx.methods)}`);
        }
        if (genCtx.commonMistakes?.length) {
            parts.push(`Common mistakes to AVOID: ${genCtx.commonMistakes.join('; ')}`);
        }
        if (genCtx.tips?.length) {
            parts.push(`Tips: ${genCtx.tips.join('; ')}`);
        }
    }

    // Core types
    parts.push('', '## IKeyValue format', CORE_TYPES.IKeyValue.explanation);

    // Workflow context
    if (ctx) {
        parts.push('', '## Workflow metadata', JSON.stringify(ctx, null, 2));
    }

    return parts.join('\n');
}

// â”€â”€â”€ Hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function useTaskAutoFill(options: UseTaskAutoFillOptions = {}): TaskAutoFillResult {
    const [status, setStatus] = useState<AiTaskFillStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);

    // â”€â”€ Stable refs for closures â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const designerRef = useRef(options.designer);
    designerRef.current = options.designer;
    const workflowContextRef = useRef(options.workflowContext);
    workflowContextRef.current = options.workflowContext;

    // The applyFn callback is set per-invocation and consumed when
    // the AI calls applyTaskSettings.
    const applyFnRef = useRef<((ts: Record<string, unknown>) => void) | null>(null);
    const startTimeRef = useRef(0);
    const iterationRef = useRef(0);
    const appliedRef = useRef(false);

    // Current task info for merging
    const taskInfoRef = useRef<{
        taskType: string;
        subType?: string;
        currentProperties: Record<string, unknown>;
        taskId: string;
        taskName: string;
    } | null>(null);

    // â”€â”€ Full agent registry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const registry = useMemo(() => createWorkflowAgentRegistry(), []);

    /** Build a fresh ToolContext for each tool execution. */
    const getToolContext = useCallback((): ToolContext => ({
        designer: designerRef.current,
        workflowContext: workflowContextRef.current,
        todoState: { current: [], update: () => { /* no-op */ } },
    }), []);

    // â”€â”€ Build system prompt + body for useChat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const systemPromptRef = useRef('');

    // â”€â”€ Local fallback handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleLocalFallback = useCallback(async (apiErr: Error) => {
        const info = taskInfoRef.current;
        if (!info) {
            setError(apiErr.message);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 2000);
            return;
        }

        try {
            const ctx = getToolContext();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fallback = await registry.execute(
                'autoFillTask',
                {
                    taskType: info.taskType,
                    subType: info.subType,
                    currentProperties: info.currentProperties,
                    taskId: info.taskId,
                    taskName: info.taskName,
                },
                ctx,
            ) as any;

            if (fallback?.success && fallback?.taskSettings && applyFnRef.current) {
                const merged = { ...fallback.taskSettings };
                if (info.taskId) merged.id = info.taskId;
                if (info.taskName) merged.name = info.taskName;

                applyFnRef.current(merged);
                setLastResult(merged);
                setStatus('success');
                setTimeout(() => setStatus('idle'), 1200);
                return;
            }
        } catch (fallbackErr) {
            console.error('[autoFillAgent] Local fallback also failed:', fallbackErr);
        }

        setError(apiErr.message);
        setStatus('error');
        setTimeout(() => setStatus('idle'), 2000);
    }, [getToolContext, registry]);

    // Track tool calls for logging
    const toolCallLogRef = useRef<Array<{ tool: string; args: unknown; result: unknown; ms: number }>>([]);
    const processedToolCalls = useRef<Set<string>>(new Set());

    // â”€â”€ Vercel AI SDK useChat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const {
        messages,
        sendMessage: sendChatMessage,
        setMessages,
        addToolResult,
    } = useChat({
        transport: new DefaultChatTransport({
            api: getChatApiUrl(),
            headers: () => {
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                };
                const token = localStorage.getItem('OIDC_TOKEN') || localStorage.getItem('accessToken');
                if (token) headers['Authorization'] = `Bearer ${token}`;
                const sub = getSubscription();
                if (sub) headers['Subscription'] = sub;
                return headers;
            },
            body: () => ({
                system: systemPromptRef.current,
                temperature: 0.3,
                maxTokens: 8192,
                // Only expose applyTaskSettings â€” all other context is pre-gathered locally
                tools: AUTOFILL_TOOLS.filter(t => t.name === 'applyTaskSettings'),
                sendReasoning: false,
                sendSources: false,
            }),
        }),

        // â”€â”€ Tool execution â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        onToolCall: async ({ toolCall }) => {
            const toolName = toolCall.toolName;
            const toolCallId = toolCall.toolCallId;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const args = (toolCall as any).args || (toolCall as any).input || {};
            const t0 = performance.now();

            // Mark as processed so the fallback useEffect won't re-process
            processedToolCalls.current.add(toolCallId);

            console.group(`%c[AutoFill Agent] ðŸ”§ Tool: ${toolName}`, 'color: #00bcd4; font-weight: bold');
            iterationRef.current += 1;

            // Safety valve
            if (iterationRef.current > MAX_AGENT_ITERATIONS) {
                console.groupEnd();
                addToolResult({
                    toolCallId,
                    tool: toolName,
                    output: { error: 'Max tool iterations reached. Please call applyTaskSettings now.' },
                });
                return;
            }

            // â”€â”€ Intercept applyTaskSettings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            if (toolName === 'applyTaskSettings') {
                const taskSettings = args.taskSettings as Record<string, unknown>;

                if (!taskSettings || typeof taskSettings !== 'object') {
                    console.error('âŒ Invalid taskSettings â€” must be a non-null object');
                    console.groupEnd();
                    addToolResult({
                        toolCallId,
                        tool: toolName,
                        output: { error: 'taskSettings must be a non-null object' },
                    });
                    return;
                }

                // Merge: AI values WIN, existing values only fill gaps
                // (fields the AI didn't include in its output).
                const info = taskInfoRef.current;
                const merged = { ...taskSettings };
                const gapsFilled: string[] = [];
                if (info) {
                    const existing = (info.currentProperties?.taskSettings || {}) as Record<string, unknown>;
                    for (const [key, val] of Object.entries(existing)) {
                        // Only use existing value if AI did NOT provide this key
                        if (!(key in taskSettings) && val !== undefined && val !== null && val !== '' && key !== 'type') {
                            merged[key] = val;
                            gapsFilled.push(key);
                        }
                    }
                    // Always use the step's canonical id/name
                    if (info.taskId) merged.id = info.taskId;
                    if (info.taskName) merged.name = info.taskName;
                }
                if (gapsFilled.length) {
                }

                // Apply to form via the callback â€” no delay, render immediately
                appliedRef.current = true;
                if (applyFnRef.current) {
                    try {
                        applyFnRef.current(merged);
                        setLastResult(merged);
                        setStatus('success');
                        const ms = Math.round(performance.now() - startTimeRef.current);
                        // Print tool call summary
                        toolCallLogRef.current.push({ tool: toolName, args, result: merged, ms: Math.round(performance.now() - t0) });
                        console.groupEnd();
                        console.group('%c[AutoFill Agent] ðŸ“Š Tool Call Summary', 'color: #ff9800; font-weight: bold');
                        console.table(toolCallLogRef.current.map(tc => ({
                            'ðŸ”§ Tool': tc.tool,
                            'â±ï¸ Time (ms)': tc.ms,
                            'ðŸ“¦ Result keys': typeof tc.result === 'object' && tc.result ? Object.keys(tc.result).join(', ') : 'â€”',
                        })));
                        console.groupEnd();
                        setTimeout(() => setStatus('idle'), 400);
                    } catch (applyErr) {
                        console.error('âŒ Apply failed:', applyErr);
                        console.groupEnd();
                        setStatus('error');
                        setError(applyErr instanceof Error ? applyErr.message : 'Apply failed');
                        setTimeout(() => setStatus('idle'), 2000);
                    }
                } else {
                    console.error('âŒ applyFnRef.current is null â€” callback was lost!');
                    console.groupEnd();
                }

                addToolResult({
                    toolCallId,
                    tool: toolName,
                    output: {
                        success: true,
                        applied: true,
                        message: `Applied ${Object.keys(merged).length} properties`,
                        filledProperties: Object.keys(merged),
                    },
                });
                return;
            }

            // â”€â”€ All other tools: dispatch via registry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            try {
                const ctx = getToolContext();
                const result = await registry.execute(toolName, args, ctx);
                const ms = Math.round(performance.now() - t0);

                toolCallLogRef.current.push({ tool: toolName, args, result, ms });
                console.groupEnd();

                // ALWAYS call addToolResult â€” even for null â€” otherwise the loop stalls
                addToolResult({
                    toolCallId,
                    tool: toolName,
                    output: result ?? { success: true, data: null },
                });
            } catch (toolErr) {
                const ms = Math.round(performance.now() - t0);
                const errMsg = toolErr instanceof Error ? toolErr.message : 'Tool execution failed';
                console.error(`âŒ Tool error (${ms}ms):`, toolErr);
                toolCallLogRef.current.push({ tool: toolName, args, result: { error: errMsg }, ms });
                console.groupEnd();

                // Feed error back so the AI can recover
                addToolResult({
                    toolCallId,
                    tool: toolName,
                    output: { success: false, error: errMsg },
                });
            }
        },

        // Auto-resend after tool calls complete (drives the agentic loop)
        sendAutomaticallyWhen: ({ messages: currentMessages }) => {
            // Don't auto-send if we've already applied â€” agent is done
            if (appliedRef.current) return false;
            const shouldSend = lastAssistantMessageIsCompleteWithToolCalls({ messages: currentMessages });
            if (shouldSend) {
            }
            return shouldSend;
        },

        onError: (err) => {
            console.error('[AutoFill Agent] âŒ Chat error:', err);
            handleLocalFallback(err);
        },
    });

    // ── Fallback: Process pending tool calls via useEffect ────────────────────
    // When onToolCall doesn't fire (streaming edge cases), this picks up
    // tools in 'input-available' state â€” mirrors useWorkflowChat.
    useEffect(() => {
        const processPending = async () => {
            for (const message of messages) {
                if (message.role !== 'assistant') continue;
                for (const part of message.parts) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if (!isToolUIPart(part as any)) continue;

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const toolPart = part as any;
                    const state = toolPart.state as string;
                    const toolCallId = toolPart.toolCallId as string;

                    if (processedToolCalls.current.has(toolCallId)) continue;
                    if (state === 'output-available' || state === 'output-error') continue;
                    if (state !== 'input-available') continue;

                    const toolName = getToolName(toolPart);
                    const args = (toolPart.input || {}) as Record<string, unknown>;


                    processedToolCalls.current.add(toolCallId);
                    iterationRef.current += 1;

                    if (iterationRef.current > MAX_AGENT_ITERATIONS) {
                        addToolResult({
                            toolCallId,
                            tool: toolName,
                            output: { error: 'Max iterations reached' },
                        });
                        continue;
                    }

                    // â”€â”€ Intercept applyTaskSettings in fallback path â”€â”€
                    if (toolName === 'applyTaskSettings') {
                        // Guard: if onToolCall already applied, just ack and skip
                        if (appliedRef.current) {
                            addToolResult({
                                toolCallId,
                                tool: toolName,
                                output: { success: true, applied: true, skipped: 'already-applied-by-onToolCall' },
                            });
                            continue;
                        }

                        const taskSettings = args.taskSettings as Record<string, unknown>;
                        if (!taskSettings || typeof taskSettings !== 'object') {
                            addToolResult({
                                toolCallId,
                                tool: toolName,
                                output: { error: 'taskSettings must be a non-null object' },
                            });
                            continue;
                        }

                        const info = taskInfoRef.current;
                        const merged = { ...taskSettings };
                        if (info) {
                            const existing = (info.currentProperties?.taskSettings || {}) as Record<string, unknown>;
                            for (const [key, val] of Object.entries(existing)) {
                                // Only fill gaps â€” AI values win for all keys AI provided
                                if (!(key in taskSettings) && val !== undefined && val !== null && val !== '' && key !== 'type') {
                                    merged[key] = val;
                                }
                            }
                            if (info.taskId) merged.id = info.taskId;
                            if (info.taskName) merged.name = info.taskName;
                        }

                        appliedRef.current = true;
                        if (applyFnRef.current) {
                            try {
                                applyFnRef.current(merged);
                                setLastResult(merged);
                                setStatus('success');
                                setTimeout(() => setStatus('idle'), 400);
                            } catch (applyErr) {
                                console.error('âŒ [Fallback] Apply failed:', applyErr);
                                setStatus('error');
                                setError(applyErr instanceof Error ? applyErr.message : 'Apply failed');
                                setTimeout(() => setStatus('idle'), 2000);
                            }
                        }

                        addToolResult({
                            toolCallId,
                            tool: toolName,
                            output: { success: true, applied: true, filledProperties: Object.keys(merged) },
                        });
                        continue;
                    }

                    // â”€â”€ Other tools via registry â”€â”€
                    try {
                        const ctx = getToolContext();
                        const result = await registry.execute(toolName, args, ctx);
                        addToolResult({
                            toolCallId,
                            tool: toolName,
                            output: result ?? { success: true, data: null },
                        });
                    } catch (toolErr) {
                        const errMsg = toolErr instanceof Error ? toolErr.message : 'Tool execution failed';
                        console.error(`[Fallback] ${toolName} error:`, toolErr);
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
        processPending();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, addToolResult, getToolContext, registry]);

    // â”€â”€ Detect stuck runs (timeout safety) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        if (status !== 'loading') return;
        const timeout = setTimeout(() => {
            if (status === 'loading') {
                handleLocalFallback(new Error('Auto-fill timed out'));
            }
        }, 30000);
        return () => clearTimeout(timeout);
    }, [status, handleLocalFallback]);

    // â”€â”€ Public autoFill trigger â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //
    // PRE-GATHERS all context locally (8 tools in parallel), then sends ONE
    // enriched message so the AI can call applyTaskSettings in a single
    // round-trip instead of 7-10 sequential tool calls.

    const autoFill = useCallback((
        taskType: string,
        subType: string | undefined,
        currentProperties: Record<string, unknown>,
        taskId: string,
        taskName: string,
        userPrompt: string,
        applyFn: (taskSettings: Record<string, unknown>) => void,
    ) => {
        // Store refs for use inside tool callbacks
        applyFnRef.current = applyFn;
        startTimeRef.current = performance.now();
        iterationRef.current = 0;
        appliedRef.current = false;
        toolCallLogRef.current = [];
        processedToolCalls.current.clear();
        taskInfoRef.current = { taskType, subType, currentProperties, taskId, taskName };

        // Build the system prompt for this invocation
        systemPromptRef.current = buildAutoFillSystemPrompt(
            taskType, subType, workflowContextRef.current,
        );

        // Reset chat state
        setMessages([]);
        setStatus('loading');
        setError(null);

        // â”€â”€ Pre-gather ALL context locally, then send ONE enriched message â”€â”€
        // 6 tools are synchronous local callbacks, 1 (getCurrentSchemaDetails) is async.
        // This eliminates 7-10 LLM round-trips â†’ replaced by 1 round-trip.
        const gatherAndSend = async () => {
            try {
                const ctx = getToolContext();
                const t0 = performance.now();
                console.group('%c[AutoFill Agent] ðŸ“¦ Pre-gathering context locally...', 'color: #2196f3; font-weight: bold');

                // Fire all 8 tool calls in parallel (6 sync + 1 async API + 1 sync filler)
                const results = await Promise.allSettled([
                    registry.execute('getTaskFillContext', { taskType }, ctx),
                    registry.execute('getSelectedTask', {}, ctx),
                    registry.execute('listWorkflowTasks', {}, ctx),
                    registry.execute('getBodyQuerySchema', { schemaType: 'Body' }, ctx),
                    registry.execute('getBodyQuerySchema', { schemaType: 'Query' }, ctx),
                    registry.execute('getActionProperties', {}, ctx),
                    registry.execute('getCurrentSchemaDetails', {}, ctx),
                    registry.execute('autoFillTask', { taskType, subType, currentProperties, taskId, taskName }, ctx),
                ]);

                const extract = (r: PromiseSettledResult<unknown>) =>
                    r.status === 'fulfilled' ? r.value : { error: (r.reason as Error)?.message ?? 'failed' };

                const [fillCtx, selectedTask, tasks, bodySchema, querySchema, actionProps, schemaDetails, autoFilled] =
                    results.map(extract);

                const gatherMs = Math.round(performance.now() - t0);
                console.groupEnd();

                // Build ONE rich user message with ALL context embedded
                const userMessage = [
                    `Fill the form for task type: **${taskType}**${subType ? ` / **${subType}**` : ''}`,
                    `Step id: \`${taskId}\`, name: \`${taskName}\``,
                    '',
                    `User instruction: ${userPrompt}`,
                    '',
                    '---',
                    '# PRE-GATHERED CONTEXT',
                    '',
                    '## 1. Task Fill Context',
                    '```json',
                    JSON.stringify(fillCtx),
                    '```',
                    '',
                    '## 2. Selected Task (current config â€” preserve non-empty fields)',
                    '```json',
                    JSON.stringify(selectedTask),
                    '```',
                    '',
                    '## 3. Workflow Tasks (siblings for {$.taskName.data} references)',
                    '```json',
                    JSON.stringify(tasks),
                    '```',
                    '',
                    '## 4. Body Schema (for payload/where IKeyValue arrays)',
                    '```json',
                    JSON.stringify(bodySchema),
                    '```',
                    '',
                    '## 5. Query Schema',
                    '```json',
                    JSON.stringify(querySchema),
                    '```',
                    '',
                    '## 6. Action Properties (schemaId, templateId, method)',
                    '```json',
                    JSON.stringify(actionProps),
                    '```',
                    '',
                    '## 7. Schema Details (columns & types for IKeyValue Key fields)',
                    '```json',
                    JSON.stringify(schemaDetails),
                    '```',
                    '',
                    '## 8. Auto-Fill Skeleton (starting point â€” enrich with above data)',
                    '```json',
                    JSON.stringify(autoFilled),
                    '```',
                    '',
                    '---',
                    'All context is above. Call `applyTaskSettings` with the complete taskSettings now.',
                    'Do NOT output any text â€” just the tool call.',
                ].join('\n');

                console.group('%c[AutoFill Agent] ðŸš€ Sending pre-gathered message (1 round-trip)', 'color: #2196f3; font-weight: bold; font-size: 14px');
                console.groupEnd();

                sendChatMessage({ text: userMessage });
            } catch (err) {
                console.error('[AutoFill Agent] âŒ Pre-gather failed, falling back:', err);
                handleLocalFallback(err instanceof Error ? err : new Error(String(err)));
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        gatherAndSend();
    }, [sendChatMessage, setMessages, registry, getToolContext, handleLocalFallback]);

    return { status, error, lastResult, autoFill };
}
