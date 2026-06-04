/**
 * Planning Agent
 *
 * Handles execution plan validation (presentExecutionPlan)
 * and LLM progress tracking (manageTodoList).
 */

import type { TaskAgent, ToolContext, LLMTodoItem } from './types';

// ─── manageTodoList ──────────────────────────────────────────────────────────

function handleManageTodoList(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const { operation, todoList, itemId, newStatus } = args as {
        operation: 'write' | 'update' | 'read';
        todoList?: LLMTodoItem[];
        itemId?: number;
        newStatus?: LLMTodoItem['status'];
    };

    const state = ctx.todoState;

    switch (operation) {
        case 'write': {
            if (!todoList || !Array.isArray(todoList) || todoList.length === 0) {
                return { error: 'todoList array is required for write operation' };
            }
            const items = todoList.map((item, i) => ({
                id: item.id || i + 1,
                title: item.title || `Step ${i + 1}`,
                description: item.description || '',
                status: item.status || 'not-started' as const,
            }));
            state.update([...items]);
            return { success: true, message: `Todo list created with ${items.length} items`, todoList: items };
        }
        case 'update': {
            if (!itemId && itemId !== 0) return { error: 'itemId is required for update operation' };
            if (!newStatus) return { error: 'newStatus is required for update operation' };

            const current = [...state.current];
            const item = current.find(t => t.id === itemId);
            if (!item) return { error: `Todo item with id ${itemId} not found` };

            // Enforce: only one item can be in-progress at a time
            if (newStatus === 'in-progress') {
                current.forEach(t => { if (t.status === 'in-progress') t.status = 'not-started'; });
            }
            item.status = newStatus;
            state.update([...current]);
            return { success: true, message: `Updated "${item.title}" to ${newStatus}`, todoList: current };
        }
        case 'read': {
            const list = state.current;
            return {
                todoList: list,
                summary: {
                    total: list.length,
                    completed: list.filter(t => t.status === 'completed').length,
                    inProgress: list.filter(t => t.status === 'in-progress').length,
                    notStarted: list.filter(t => t.status === 'not-started').length,
                    skipped: list.filter(t => t.status === 'skipped').length,
                },
            };
        }
        default:
            return { error: `Unknown operation: ${operation}. Use write, update, or read.` };
    }
}

// ─── presentExecutionPlan ────────────────────────────────────────────────────

function handlePresentExecutionPlan(args: Record<string, unknown>): unknown {
    const { actionProperties, taskSequence, bodyFields, queryFields } = args as {
        actionProperties?: {
            systemName?: string;
            displayName?: string;
            method?: string;
            actionType?: string;
        };
        taskSequence?: Array<{
            taskId: string;
            taskType: string;
            method?: string;
            purpose?: string;
            dataInputs?: string[];
            dataOutputs?: string[];
            branches?: Record<string, Array<{
                taskId: string;
                taskType: string;
                method?: string;
                purpose?: string;
                dataInputs?: string[];
                dataOutputs?: string[];
            }>>;
        }>;
        bodyFields?: string[];
        queryFields?: string[];
    };

    const issues: string[] = [];

    // ── Validate action properties ──────────────────────────────────────
    if (!actionProperties) {
        issues.push('Missing actionProperties — must include systemName, displayName, method, actionType');
    } else {
        if (!actionProperties.systemName) issues.push('actionProperties.systemName is required');
        if (!actionProperties.method) issues.push('actionProperties.method is required (GET/POST/PUT/DELETE)');
        if (!actionProperties.actionType) issues.push('actionProperties.actionType is required (Atom/Molecule/Template/BusinessWorkflow)');
    }

    // ── Validate task sequence ──────────────────────────────────────────
    if (!taskSequence || taskSequence.length === 0) {
        issues.push('taskSequence is empty — must include at least one task');
    } else {
        const orderedIds: string[] = [];

        const collectIds = (
            tasks: Array<{ taskId: string; branches?: Record<string, Array<{ taskId: string }>> }>,
        ) => {
            for (const t of tasks) {
                orderedIds.push(t.taskId);
                if (t.branches) {
                    for (const branchTasks of Object.values(t.branches)) {
                        if (Array.isArray(branchTasks)) collectIds(branchTasks);
                    }
                }
            }
        };
        collectIds(taskSequence);

        // Duplicate IDs
        const seenIds = new Set<string>();
        for (const id of orderedIds) {
            if (seenIds.has(id)) issues.push(`Duplicate taskId: "${id}" — each task must have a unique execution ID`);
            seenIds.add(id);
        }

        const validateTask = (t: { taskId: string; taskType: string }, path: string) => {
            if (!t.taskId) issues.push(`${path}: missing taskId`);
            if (!t.taskType) issues.push(`${path}: missing taskType`);
            if (t.taskId && /\s/.test(t.taskId)) issues.push(`${path}: taskId "${t.taskId}" contains spaces — must be camelCase`);
        };

        const builtIns = new Set(['body', 'params', 'query', 'subscription', 'userId', 'now', 'headers', 'auth', 'env', 'const', 'context', 'item', 'index', 'i']);

        const validateDataFlow = (
            t: { taskId: string; dataInputs?: string[]; taskType: string },
            precedingIds: Set<string>,
            path: string,
        ) => {
            if (!t.dataInputs) return;
            for (const input of t.dataInputs) {
                const match = input.match(/\{\$\.([^.}]+)/);
                if (match) {
                    const refId = match[1];
                    if (!builtIns.has(refId) && !precedingIds.has(refId)) {
                        issues.push(`${path}: references {$.${refId}.*} but task "${refId}" has not executed yet at this point. Check task ordering.`);
                    }
                }
            }
        };

        const precedingIds = new Set<string>();
        for (let i = 0; i < taskSequence.length; i++) {
            const t = taskSequence[i];
            const path = `Task #${i + 1} (${t.taskId})`;
            validateTask(t, path);
            validateDataFlow(t, precedingIds, path);
            precedingIds.add(t.taskId);

            if (t.branches) {
                for (const [branchName, branchTasks] of Object.entries(t.branches)) {
                    if (!Array.isArray(branchTasks)) continue;
                    const branchPreceding = new Set(precedingIds);
                    for (let j = 0; j < branchTasks.length; j++) {
                        const bt = branchTasks[j];
                        const bPath = `${path} → ${branchName}[${j}] (${bt.taskId})`;
                        validateTask(bt, bPath);
                        validateDataFlow(bt, branchPreceding, bPath);
                        branchPreceding.add(bt.taskId);
                    }
                }
            }
        }

        // Check for Response task
        const flatTypes = taskSequence.map(t => t.taskType);
        if (!flatTypes.includes('Response')) {
            const hasResponseInBranches = taskSequence.some(t =>
                t.branches && Object.values(t.branches).some(branch =>
                    Array.isArray(branch) && branch.some(bt => bt.taskType === 'Response'),
                ),
            );
            if (!hasResponseInBranches) {
                issues.push('Plan has no Response task — every workflow should end with a Response.');
            }
        }
    }

    // ── Format plan text ────────────────────────────────────────────────
    let planText = '';
    if (actionProperties) {
        planText += `**Action:** ${actionProperties.systemName || '?'} (${actionProperties.method || '?'}, ${actionProperties.actionType || '?'})\n\n`;
    }
    if (taskSequence && taskSequence.length > 0) {
        planText += '**Task Sequence:**\n';
        const formatTasks = (tasks: typeof taskSequence, indent = '') => {
            for (let i = 0; i < tasks.length; i++) {
                const t = tasks[i];
                const methodStr = t.method ? `.${t.method}` : '';
                planText += `${indent}${i + 1}. **${t.taskId}** — ${t.taskType}${methodStr}`;
                if (t.purpose) planText += ` — ${t.purpose}`;
                planText += '\n';
                if (t.dataInputs?.length) planText += `${indent}   📥 reads: ${t.dataInputs.join(', ')}\n`;
                if (t.dataOutputs?.length) planText += `${indent}   📤 produces: ${t.dataOutputs.join(', ')}\n`;
                if (t.branches) {
                    for (const [branchName, branchTasks] of Object.entries(t.branches)) {
                        if (!Array.isArray(branchTasks) || branchTasks.length === 0) continue;
                        planText += `${indent}   ├─ **${branchName}:**\n`;
                        formatTasks(branchTasks, `${indent}   │  `);
                    }
                }
            }
        };
        formatTasks(taskSequence);
    }
    if (bodyFields?.length) planText += `\n**Body fields:** ${bodyFields.join(', ')}\n`;
    if (queryFields?.length) planText += `\n**Query fields:** ${queryFields.join(', ')}\n`;

    // ── Result ──────────────────────────────────────────────────────────
    if (issues.length > 0) {
        return {
            approved: false,
            issues,
            plan: planText,
            message: `Plan has ${issues.length} issue(s). Fix them and call presentExecutionPlan again.`,
        };
    }

    return {
        approved: true,
        plan: planText,
        taskCount: taskSequence?.length || 0,
        message: 'Plan approved. Proceed to step 5 (getTaskGenerationContext for each type) then step 6 (build tasks).',
        ...((bodyFields?.length || queryFields?.length) ? {
            schemaReminder:
                `AFTER building tasks, call updateBodyQuerySchema for each schema type. Each field MUST have a non-empty "key" string.` +
                (bodyFields?.length ? ` Body fields to register: ${bodyFields.map(f => `{ key: "${f}", keyType: "string", required: true }`).join(', ')}` : '') +
                (queryFields?.length ? ` Query fields to register: ${queryFields.map(f => `{ key: "${f}", keyType: "string", required: false }`).join(', ')}` : ''),
        } : {}),
    };
}

// ─── Agent factory ───────────────────────────────────────────────────────────

export function createPlanningAgent(): TaskAgent {
    return {
        name: 'planning',
        description: 'Execution plan validation and LLM progress tracking',
        tools: [
            { name: 'manageTodoList', execute: handleManageTodoList },
            { name: 'presentExecutionPlan', execute: handlePresentExecutionPlan },
        ],
    };
}
