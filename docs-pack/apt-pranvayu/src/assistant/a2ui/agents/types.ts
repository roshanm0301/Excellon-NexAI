/**
 * Task-wise Agent Architecture — Shared Types
 *
 * Every tool handler receives a ToolContext at execution time
 * and returns a plain object (sync or async).
 */

import type { DesignerCallbacks, WorkflowContext } from '../types';

// ─── LLM Todo ────────────────────────────────────────────────────────────────

/** Todo item for LLM progress tracking (displayed in chat UI) */
export interface LLMTodoItem {
    id: number;
    title: string;
    description: string;
    status: 'not-started' | 'in-progress' | 'completed' | 'skipped';
}

// ─── Tool Context ────────────────────────────────────────────────────────────

/**
 * Runtime context passed to every tool handler.
 * Built fresh on each invocation from React refs so values are never stale.
 */
export interface ToolContext {
    /** Designer callbacks for UI control (may be undefined in read-only mode) */
    designer?: DesignerCallbacks;
    /** Current workflow context (schema ID, subscription, mode, etc.) */
    workflowContext?: WorkflowContext;
    /** LLM todo list state — read `current`, call `update` to persist */
    todoState: {
        current: LLMTodoItem[];
        update: (list: LLMTodoItem[]) => void;
    };
    /** Legacy: create a task via confirmation UI */
    onTaskCreate?: (
        taskType: string,
        taskId: string,
        properties?: Record<string, unknown>,
        taskName?: string,
    ) => void;
    /** Legacy: modify a task via confirmation UI */
    onTaskModify?: (taskId: string, properties: Record<string, unknown>) => void;
}

// ─── Tool Handler ────────────────────────────────────────────────────────────

/**
 * A single tool handler that the registry can dispatch to.
 * `execute` may return synchronously or return a Promise.
 */
export interface ToolHandler {
    /** Tool name — must match the `name` field in WORKFLOW_TOOLS config */
    name: string;
    /** Execute the tool. Returning `null` skips addToolResult. */
    execute: (
        args: Record<string, unknown>,
        ctx: ToolContext,
    ) => unknown | Promise<unknown>;
}

// ─── Task Agent ──────────────────────────────────────────────────────────────

/**
 * A domain-specific agent that provides a cohesive group of tool handlers.
 * Agents are registered with the central ToolRegistry at startup.
 */
export interface TaskAgent {
    /** Agent name (e.g., 'knowledge', 'designer', 'schema', 'planning') */
    name: string;
    /** Human-readable description of this agent's responsibility */
    description: string;
    /** Tools provided by this agent */
    tools: ToolHandler[];
}
