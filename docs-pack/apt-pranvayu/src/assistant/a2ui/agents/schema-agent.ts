/**
 * Schema Agent
 *
 * Handles all asynchronous schema/workflow discovery tools
 * that call the backend API via schema-service.
 */

import type { TaskAgent, ToolContext } from './types';
import {
    listSchemas,
    getSchemaActions,
    getWorkflowDetails,
    getSchemaDetails,
    fetchWorkflowAction,
    listTemplates,
    getTemplateById,
    formatSchemasForLLM,
    formatActionsForLLM,
    formatWorkflowForLLM,
    formatActionForLLM,
    formatSchemaColumnsForLLM,
    getSchemaColumnNames,
    formatTemplatesForLLM,
    formatTemplateForLLM,
} from '../services/schema-service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Resolve subscription: explicit arg → workflowContext → null */
function resolveSub(args: Record<string, unknown>, ctx: ToolContext): string | undefined {
    return (args.subscription as string) || ctx.workflowContext?.subscription || undefined;
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async function handleListSchemas(args: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
    const subscription = resolveSub(args, ctx);
    const result = await listSchemas(subscription);
    if (result.error) return { success: false, error: result.error };
    return {
        success: true,
        schemas: result.schemas,
        count: result.schemas.length,
        formatted: formatSchemasForLLM(result.schemas),
    };
}

async function handleGetSchemaActions(args: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
    const { schemaId } = args as { schemaId: string };
    const subscription = resolveSub(args, ctx);
    const result = await getSchemaActions(schemaId, subscription);
    if (result.error) return { success: false, error: result.error };
    return {
        success: true,
        schemaId,
        actions: result.actions,
        count: result.actions.length,
        formatted: formatActionsForLLM(schemaId, result.actions),
        usage: `Use Request task with method: "Action", schema: "${schemaId}", action: "<action_name>" to call these`,
    };
}

async function handleGetWorkflowDetails(args: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
    const { schemaId, workflowId } = args as { schemaId: string; workflowId: string };
    const subscription = resolveSub(args, ctx);
    const result = await getWorkflowDetails(schemaId, workflowId, subscription);
    if (result.error) return { success: false, error: result.error };
    return {
        success: true,
        workflow: result.workflow,
        formatted: result.workflow ? formatWorkflowForLLM(result.workflow) : '',
        requestTaskUsage: {
            method: 'Action', schema: schemaId, action: workflowId,
            hint: 'Use these values in a Request task to call this workflow',
        },
    };
}

async function handleFetchWorkflowAction(args: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
    const { actionId } = args as { actionId: string };
    const subscription = resolveSub(args, ctx);
    const result = await fetchWorkflowAction(actionId, subscription);
    if (result.error) return { success: false, error: result.error };
    return {
        success: true,
        action: result.action,
        formatted: result.action ? formatActionForLLM(result.action) : '',
    };
}

async function handleGetCurrentSchemaDetails(args: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
    const targetSchemaId = (args.schemaId as string) || ctx.workflowContext?.currentSchemaId;
    const subscription = resolveSub(args, ctx);

    if (!targetSchemaId) {
        return {
            success: false,
            error: 'No schema ID provided and no currentSchemaId in workflow context. Please provide a schemaId parameter.',
            hint: 'Call getCurrentSchemaDetails({ schemaId: "your-schema-id" })',
        };
    }

    const result = await getSchemaDetails(targetSchemaId, subscription);
    if (result.error || !result.schema) {
        return { success: false, error: result.error || 'Schema not found' };
    }

    const columnNames = getSchemaColumnNames(result.schema);
    return {
        success: true,
        schemaId: targetSchemaId,
        schemaName: result.schema.DisplayName || result.schema.SystemName,
        tableName: result.schema.TableName,
        columns: result.schema.Columns,
        columnNames,
        formatted: formatSchemaColumnsForLLM(result.schema),
        usage: {
            forPayload: `Use these column names in payload[] IKeyValue array: ${columnNames.join(', ')}`,
            forWhere: `Use these column names in where[] for filtering: ${columnNames.join(', ')}`,
            forSelect: `Use these column names in select[] to choose fields: ${columnNames.join(', ')}`,
            example: {
                payload: columnNames.slice(0, 3).map(name => ({ Key: name, Value: `{$.body.${name}}`, Type: 'Property' })),
                where: [{ Key: columnNames[0] || '_id', Value: '{$.params.documentId}', Type: 'Property' }],
                select: columnNames.slice(0, 5).map(name => ({ Key: name })),
            },
        },
    };
}

async function handleListTemplates(args: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
    const subscription = resolveSub(args, ctx);
    const result = await listTemplates(subscription);
    if (result.error) return { success: false, error: result.error };
    return {
        success: true,
        templates: result.templates,
        count: result.templates.length,
        formatted: formatTemplatesForLLM(result.templates),
    };
}

async function handleGetTemplateById(args: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
    const { templateId } = args as { templateId: string };
    const subscription = resolveSub(args, ctx);
    const result = await getTemplateById(templateId, subscription);
    if (result.error) return { success: false, error: result.error };
    return {
        success: true,
        template: result.template,
        formatted: result.template ? formatTemplateForLLM(result.template) : '',
    };
}

// ─── Agent factory ───────────────────────────────────────────────────────────

export function createSchemaAgent(): TaskAgent {
    return {
        name: 'schema',
        description: 'Asynchronous schema/workflow/template discovery via backend API',
        tools: [
            { name: 'listSchemas', execute: handleListSchemas },
            { name: 'getSchemaActions', execute: handleGetSchemaActions },
            { name: 'getWorkflowDetails', execute: handleGetWorkflowDetails },
            { name: 'fetchWorkflowAction', execute: handleFetchWorkflowAction },
            { name: 'getCurrentSchemaDetails', execute: handleGetCurrentSchemaDetails },
            { name: 'discoverSchema', execute: handleGetCurrentSchemaDetails }, // alias
            { name: 'listTemplates', execute: handleListTemplates },
            { name: 'getTemplateById', execute: handleGetTemplateById },
        ],
    };
}
