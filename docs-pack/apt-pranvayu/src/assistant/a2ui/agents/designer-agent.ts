/**
 * Designer Agent
 *
 * Handles all tools that interact with the workflow designer UI:
 * task CRUD, selection, movement, branch management, schema updates,
 * action properties, and rule mapping.
 *
 * All tools execute synchronously via DesignerCallbacks.
 */

import type { TaskAgent, ToolContext } from './types';
import type { BranchDefinition, BodyQueryField } from '../types';
import { actionToToolDefinition, type ActionDefinitionTask } from '../services/task-converter';

// ─── Helper ──────────────────────────────────────────────────────────────────

function requireDesigner(ctx: ToolContext) {
    if (!ctx.designer) {
        return { error: 'Designer callbacks not provided. Cannot control workflow designer.' };
    }
    return null;
}

// ─── Handlers ────────────────────────────────────────────────────────────────

function handleSelectTask(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    const { taskId } = args as { taskId: string };
    if (ctx.designer!.onSelectTask) {
        ctx.designer!.onSelectTask(taskId);
        return { success: true, message: `Selected task: ${taskId}` };
    }
    return { error: 'selectTask callback not available' };
}

function handleClearSelection(_args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    if (ctx.designer!.onClearSelection) {
        ctx.designer!.onClearSelection();
        return { success: true, message: 'Selection cleared' };
    }
    return { error: 'clearSelection callback not available' };
}

function handleDeleteTask(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    const { taskId } = args as { taskId: string };
    if (ctx.designer!.onDeleteTask) {
        ctx.designer!.onDeleteTask(taskId);
        return { success: true, message: `Deleted task: ${taskId}` };
    }
    return { error: 'deleteTask callback not available' };
}

function handleGetCurrentWorkflow(_args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    if (ctx.designer!.onGetWorkflow) {
        return { success: true, workflow: ctx.designer!.onGetWorkflow() };
    }
    return { error: 'getWorkflow callback not available' };
}

function handleGetSelectedTask(_args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    if (ctx.designer!.onGetSelectedTask) {
        const task = ctx.designer!.onGetSelectedTask();
        return task
            ? { success: true, task }
            : { success: true, task: null, message: 'No task currently selected' };
    }
    return { error: 'getSelectedTask callback not available' };
}

function handleListWorkflowTasks(_args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    if (ctx.designer!.onListTasks) {
        const tasks = ctx.designer!.onListTasks();
        return { success: true, tasks, count: tasks.length, info: 'Tasks include full path info for nth-level nested tasks' };
    }
    return { error: 'listTasks callback not available' };
}

function handleFindTaskById(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    const { taskId } = args as { taskId: string };
    if (!taskId) return { error: 'taskId (_id) is required - use _id not id' };
    if (ctx.designer!.onFindTask) {
        const task = ctx.designer!.onFindTask(taskId);
        if (task) {
            return {
                success: true, task,
                message: task.depth > 0
                    ? `Task found at depth ${task.depth} in branch "${task.branchName}" of parent "${task.parent_id}"`
                    : 'Task found at root level',
            };
        }
        return { success: false, task: null, message: `No task found with _id: ${taskId}. Remember: use _id (AI identifier), not id (workflow engine)` };
    }
    return { error: 'findTaskById callback not available' };
}

function handleSetReadonly(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    const { readonly } = args as { readonly: boolean };
    if (ctx.designer!.onSetReadonly) {
        ctx.designer!.onSetReadonly(readonly);
        return { success: true, message: `Readonly mode set to: ${readonly}` };
    }
    return { error: 'setReadonly callback not available' };
}

function handleAddTaskToSequence(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    const { taskType, taskId, taskName, afterTaskId, properties, branches } = args as {
        taskType: string; taskId: string; taskName?: string; afterTaskId?: string;
        properties?: Record<string, unknown>; branches?: BranchDefinition;
    };
    if (!taskId) return { error: 'Missing required parameter: taskId (execution ID for state storage)' };
    if (ctx.designer!.onAddTask) {
        ctx.designer!.onAddTask(taskType, taskId, taskName, afterTaskId, properties, branches);
        const displayName = taskName || taskId;
        const branchInfo = branches ? ` with branches: ${Object.keys(branches).join(', ')}` : '';
        const position = afterTaskId ? ' after ' + afterTaskId : ' at end';
        return { success: true, message: `Added task: ${displayName} (${taskType}) with execution id '${taskId}'${position}${branchInfo}` };
    }
    return { error: 'addTask callback not available' };
}

function handleAddTaskWithActionFormat(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    const { task, afterTaskId } = args as { task: ActionDefinitionTask; afterTaskId?: string };
    if (!task?.type) return { error: 'Task must have a "type" property' };
    if (ctx.designer!.onAddTask) {
        const toolDef = actionToToolDefinition(task);
        const executionId = toolDef.taskId || task.type;
        ctx.designer!.onAddTask(toolDef.taskType, executionId, toolDef.taskName, afterTaskId, toolDef.properties, toolDef.branches as BranchDefinition | undefined);
        const displayName = task.name || task.id || task.type;
        const branchInfo = toolDef.branches ? ' with branches: ' + Object.keys(toolDef.branches).join(', ') : '';
        const position = afterTaskId ? ' after ' + afterTaskId : ' at end';
        return { success: true, message: `Added task: ${displayName} (${task.type}) with execution id '${executionId}'${position}${branchInfo}`, convertedFormat: 'Action Definition → Tool Definition' };
    }
    return { error: 'addTask callback not available' };
}

function handleMoveTask(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    const { taskId, afterTaskId } = args as { taskId: string; afterTaskId: string };
    if (ctx.designer!.onMoveTask) {
        ctx.designer!.onMoveTask(taskId, afterTaskId);
        return { success: true, message: 'Moved task ' + taskId + (afterTaskId ? ' after ' + afterTaskId : ' to beginning') };
    }
    return { error: 'moveTask callback not available' };
}

function handleDuplicateTask(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    const { taskId, newTaskName } = args as { taskId: string; newTaskName: string };
    if (ctx.designer!.onDuplicateTask) {
        ctx.designer!.onDuplicateTask(taskId, newTaskName);
        return { success: true, message: `Duplicated task ${taskId} as ${newTaskName}` };
    }
    return { error: 'duplicateTask callback not available' };
}

function handleAddTaskToBranch(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    const { parentTaskId, branchName, taskType, taskId, taskName, properties, branches } = args as {
        parentTaskId: string; branchName: string; taskType: string; taskId: string;
        taskName?: string; properties?: Record<string, unknown>; branches?: BranchDefinition;
    };
    if (!parentTaskId || !branchName || !taskType || !taskId) {
        return { error: 'Missing required parameters: parentTaskId, branchName, taskType, and taskId are all required' };
    }
    if (ctx.designer!.onAddTaskToBranch) {
        ctx.designer!.onAddTaskToBranch(parentTaskId, branchName, taskType, taskId, taskName, properties, branches);
        const displayName = taskName || taskId;
        return { success: true, message: `Added task ${displayName} (${taskType}) with execution id '${taskId}' to ${branchName} branch of ${parentTaskId}` };
    }
    return { error: 'addTaskToBranch callback not available' };
}

function handleUpdateTaskProperty(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    const { taskId, propertyPath, value } = args as { taskId: string; propertyPath: string; value: unknown };
    if (!taskId || !propertyPath) {
        return { error: `Missing required parameters: ${!taskId ? 'taskId' : ''} ${!propertyPath ? 'propertyPath' : ''}`.trim() };
    }
    if (ctx.designer!.onUpdateTaskProperty) {
        ctx.designer!.onUpdateTaskProperty(taskId, propertyPath, value);
        return { success: true, message: `Updated ${propertyPath} on task ${taskId}` };
    }
    return { error: 'updateTaskProperty callback not available' };
}

function handleUpdateBodyQuerySchema(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    const { schemaType, fields, replace } = args as { schemaType: 'Body' | 'Query'; fields: BodyQueryField[]; replace?: boolean };

    const rawFields = fields || [];
    const validFields = rawFields
        .filter(f => f && typeof f.key === 'string' && f.key.trim().length > 0)
        .map(f => ({ ...f, key: f.key.trim(), keyType: f.keyType || 'string', required: typeof f.required === 'boolean' ? f.required : false }));

    const skipped = rawFields.length - validFields.length;
    if (skipped > 0) console.warn(`[updateBodyQuerySchema] Skipped ${skipped} field(s) with missing/invalid key`, rawFields);

    if (validFields.length === 0) {
        return { error: `No valid fields provided for ${schemaType} schema. Each field must have a non-empty "key" (field name), "keyType", and "required". Example: { key: "name", keyType: "string", required: true }` };
    }

    if (ctx.designer!.onUpdateBodyQuerySchema) {
        ctx.designer!.onUpdateBodyQuerySchema(schemaType, validFields, replace);
        const mode = replace ? 'Replaced' : 'Updated';
        return {
            success: true,
            message: `${mode} ${schemaType} schema with ${validFields.length} field(s): ${validFields.map(f => `${f.key}(${f.keyType}${f.required ? ',req' : ''})`).join(', ')}${skipped > 0 ? ` (${skipped} invalid field(s) skipped)` : ''}`,
        };
    }
    return { error: 'updateBodyQuerySchema callback not available' };
}

function handleGetBodyQuerySchema(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    const { schemaType } = args as { schemaType: 'Body' | 'Query' };
    if (ctx.designer!.onGetBodyQuerySchema) {
        const fields = ctx.designer!.onGetBodyQuerySchema(schemaType) || [];
        return { success: true, schemaType, fields, count: fields.length };
    }
    return { error: 'getBodyQuerySchema callback not available' };
}

function handleSetActionProperties(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    if (ctx.designer!.onSetActionProperties) {
        ctx.designer!.onSetActionProperties(args);
        const setFields = Object.keys(args).filter(k => args[k] !== undefined);
        return { success: true, message: `Updated action properties: ${setFields.join(', ')}`, updatedFields: setFields };
    }
    return { error: 'setActionProperties callback not available' };
}

function handleGetActionProperties(_args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    if (ctx.designer!.onGetActionProperties) {
        const properties = ctx.designer!.onGetActionProperties();
        return properties
            ? { success: true, properties, message: 'Current action properties retrieved' }
            : { success: true, properties: null, message: 'No action properties configured yet' };
    }
    return { error: 'getActionProperties callback not available' };
}

// ── Auto-fill apply ─────────────────────────────────────────────────────

/**
 * applyTaskSettings — Called by the auto-fill agent as its FINAL step.
 * Stores the generated taskSettings on the selected step.
 *
 * The actual React form-fill (setProperty → forward → useEffect → DXForm)
 * is triggered by the applyFn callback that the hook injects at runtime.
 * This handler just validates and returns the data; the hook layer applies it.
 */
function handleApplyTaskSettings(args: Record<string, unknown>): unknown {
    const { taskSettings } = args as { taskSettings: Record<string, unknown> };
    if (!taskSettings || typeof taskSettings !== 'object') {
        return { error: 'taskSettings must be a non-null object' };
    }
    // Return the settings — the hook's onToolCall handler intercepts this
    // tool name and runs the actual setProperty/forward chain.
    return {
        success: true,
        taskSettings,
        applied: true,
        message: `Generated ${Object.keys(taskSettings).length} properties for task "${taskSettings.name || taskSettings.id || 'unnamed'}"`,
        filledProperties: Object.keys(taskSettings),
    };
}

// ── Legacy tools ────────────────────────────────────────────────────────

function handleCreateTask(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const { taskType, taskId, taskName, properties } = args as {
        taskType: string; taskId: string; taskName?: string; properties?: Record<string, unknown>;
    };
    if (ctx.onTaskCreate) {
        ctx.onTaskCreate(taskType, taskId, properties, taskName);
    }
    return { success: true, message: `Task ${taskName || taskId} (${taskType}) creation initiated` };
}

function handleModifyTask(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const { taskId, properties } = args as { taskId: string; properties: Record<string, unknown> };
    if (ctx.onTaskModify) {
        ctx.onTaskModify(taskId, properties);
    }
    return { success: true, message: `Task ${taskId} modification initiated` };
}

// ─── Agent factory ───────────────────────────────────────────────────────────

export function createDesignerAgent(): TaskAgent {
    return {
        name: 'designer',
        description: 'Workflow designer UI control: task CRUD, selection, movement, branch management, schema/action/rule operations',
        tools: [
            // Selection
            { name: 'selectTask', execute: handleSelectTask },
            { name: 'clearSelection', execute: handleClearSelection },
            // Task CRUD
            { name: 'deleteTask', execute: handleDeleteTask },
            { name: 'addTaskToSequence', execute: handleAddTaskToSequence },
            { name: 'addTaskWithActionFormat', execute: handleAddTaskWithActionFormat },
            { name: 'addTaskToBranch', execute: handleAddTaskToBranch },
            { name: 'moveTask', execute: handleMoveTask },
            { name: 'duplicateTask', execute: handleDuplicateTask },
            { name: 'updateTaskProperty', execute: handleUpdateTaskProperty },
            // Workflow inspection
            { name: 'getCurrentWorkflow', execute: handleGetCurrentWorkflow },
            { name: 'getSelectedTask', execute: handleGetSelectedTask },
            { name: 'listWorkflowTasks', execute: handleListWorkflowTasks },
            { name: 'findTaskById', execute: handleFindTaskById },
            { name: 'setReadonly', execute: handleSetReadonly },
            // Body/Query schema
            { name: 'updateBodyQuerySchema', execute: handleUpdateBodyQuerySchema },
            { name: 'getBodyQuerySchema', execute: handleGetBodyQuerySchema },
            // Action properties
            { name: 'setActionProperties', execute: handleSetActionProperties },
            { name: 'getActionProperties', execute: handleGetActionProperties },
            // Auto-fill apply
            { name: 'applyTaskSettings', execute: handleApplyTaskSettings },
            // Legacy (rule mapping moved to rule-mapping-agent)
            { name: 'createTask', execute: handleCreateTask },
            { name: 'modifyTask', execute: handleModifyTask },
        ],
    };
}
