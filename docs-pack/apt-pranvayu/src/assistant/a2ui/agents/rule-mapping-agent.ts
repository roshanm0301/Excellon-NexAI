/**
 * Rule Mapping Agent
 *
 * Comprehensive agent for rule-mapping column configuration.
 * Handles the entire lifecycle: reading existing columns, auto-generating
 * from schema/body/params/auth/context sources, validating, and applying
 * rule-mapping columns to the workflow action's globalSettings.State.
 *
 * Context: Rule Mappings define which key-value pairs end users can reference
 * when configuring business rules for an action. Each column maps a
 * **schema column name** (key) → **data path** (value) with metadata
 * (SourceType, DataType, PickList, Enum).
 */

import type { TaskAgent, ToolContext } from './types';
import type { RuleColumn, BodyQueryField } from '../types';
import {
    getSchemaDetails,
    getSchemaColumnNames,
    getTemplateById,
} from '../services/schema-service';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Standard Params columns every action can reference */
const STANDARD_PARAMS_COLUMNS: RuleColumn[] = [
    { name: 'Schema', path: '{$.params.schema}', SourceType: 'Params', DataType: 'String' },
    { name: 'Action', path: '{$.params.action}', SourceType: 'Params', DataType: 'String' },
    { name: 'Document ID', path: '{$.params.documentId}', SourceType: 'Params', DataType: 'String' },
];

/** Standard Auth columns */
const STANDARD_AUTH_COLUMNS: RuleColumn[] = [
    { name: 'User ID', path: '{$.auth.userId}', SourceType: 'Auth', DataType: 'String' },
    { name: 'User Token', path: '{$.auth.token}', SourceType: 'Auth', DataType: 'String' },
    { name: 'User Roles', path: '{$.auth.roles}', SourceType: 'Auth', DataType: 'String' },
];

/** Standard Header columns */
const STANDARD_HEADER_COLUMNS: RuleColumn[] = [
    { name: 'Content Type', path: '{$.headers.content-type}', SourceType: 'Header', DataType: 'String' },
    { name: 'Subscription', path: '{$.headers.subscription}', SourceType: 'Header', DataType: 'String' },
];

/** Map BodyQueryField keyType → RuleColumn DataType */
const KEY_TYPE_TO_DATA_TYPE: Record<string, RuleColumn['DataType']> = {
    string: 'String',
    int8: 'Number', uint8: 'Number', int16: 'Number', uint16: 'Number',
    int32: 'Number', uint32: 'Number', float32: 'Number', float64: 'Number',
    boolean: 'Boolean',
    timestamp: 'Date',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function requireDesigner(ctx: ToolContext) {
    if (!ctx.designer) {
        return { error: 'Designer callbacks not available. Cannot access rule mapping.' };
    }
    return null;
}

/** Resolve subscription: explicit arg → workflowContext → undefined */
function resolveSub(args: Record<string, unknown>, ctx: ToolContext): string | undefined {
    return (args.subscription as string) || ctx.workflowContext?.subscription || undefined;
}

/** Convert a BodyQueryField to a RuleColumn */
function bodyFieldToRuleColumn(field: BodyQueryField): RuleColumn {
    return {
        name: capitalise(field.key),
        path: `{$.body.${field.key}}`,
        SourceType: 'Body',
        DataType: KEY_TYPE_TO_DATA_TYPE[field.keyType] || 'String',
    };
}

/** "firstName" → "First Name" */
function capitalise(str: string): string {
    return str
        .replace(/([A-Z])/g, ' $1')          // camelCase → camel Case
        .replace(/[_-]/g, ' ')               // snake_case / kebab-case
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
}

/** De-duplicate columns by (name+SourceType) keeping the first occurrence */
function deduplicateColumns(columns: RuleColumn[]): RuleColumn[] {
    const seen = new Set<string>();
    return columns.filter(c => {
        const key = `${c.name}|${c.SourceType}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/** Validate a single column object */
function validateColumn(col: unknown, index: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const c = col as Record<string, unknown>;
    const prefix = `Column[${index}]`;

    if (!c || typeof c !== 'object') { errors.push(`${prefix}: not an object`); return { valid: false, errors }; }
    if (typeof c.name !== 'string' || !c.name.toString().trim()) errors.push(`${prefix}: "name" must be a non-empty string`);
    if (typeof c.path !== 'string' || !c.path.toString().trim()) errors.push(`${prefix}: "path" must be a non-empty string`);
    if (typeof c.path === 'string' && !/^\{\$\.\w+/.test(c.path)) errors.push(`${prefix}: "path" must start with {$.  (e.g., {$.body.name})`);
    const validSources = ['Body', 'Params', 'Header', 'Auth', 'Context'];
    if (!validSources.includes(c.SourceType as string)) errors.push(`${prefix}: "SourceType" must be one of ${validSources.join(', ')}`);
    if (c.DataType && !['Date', 'String', 'Number', 'Boolean'].includes(c.DataType as string)) errors.push(`${prefix}: "DataType" must be Date|String|Number|Boolean`);

    // Path ↔ SourceType consistency
    if (typeof c.path === 'string' && typeof c.SourceType === 'string') {
        const pathSource = c.path.match(/^\{\$\.(\w+)\./)?.[1];
        const expectedMap: Record<string, string> = { body: 'Body', params: 'Params', headers: 'Header', auth: 'Auth', context: 'Context' };
        if (pathSource && expectedMap[pathSource] && expectedMap[pathSource] !== c.SourceType) {
            errors.push(`${prefix}: path "{$.${pathSource}.*}" conflicts with SourceType "${c.SourceType}" — expected "${expectedMap[pathSource]}"`);
        }
    }

    return { valid: errors.length === 0, errors };
}

// ─── Tool Handlers ───────────────────────────────────────────────────────────

/**
 * getRuleColumns — read current predefined + custom columns with rich metadata
 */
function handleGetRuleColumns(_args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    if (!ctx.designer!.onGetRuleColumns) return { error: 'getRuleColumns callback not available' };

    const columns = ctx.designer!.onGetRuleColumns();
    const predefined = columns.filter(c => c.IsPredefineColumn);
    const custom = columns.filter(c => !c.IsPredefineColumn);

    return {
        success: true,
        columns,
        totalCount: columns.length,
        predefinedCount: predefined.length,
        customCount: custom.length,
        predefinedColumns: predefined.map(c => ({
            name: c.name, path: c.path, SourceType: c.SourceType, DataType: c.DataType,
        })),
        customColumns: custom.map(c => ({
            name: c.name, path: c.path, SourceType: c.SourceType, DataType: c.DataType,
            PickList: c.PickList, Enum: c.Enum,
        })),
        message: `Found ${columns.length} rule column(s): ${predefined.length} predefined (Body), ${custom.length} custom`,
        sourceTypes: {
            Body: columns.filter(c => c.SourceType === 'Body').length,
            Params: columns.filter(c => c.SourceType === 'Params').length,
            Header: columns.filter(c => c.SourceType === 'Header').length,
            Auth: columns.filter(c => c.SourceType === 'Auth').length,
            Context: columns.filter(c => c.SourceType === 'Context').length,
        },
    };
}

/**
 * setRuleColumns — replace custom columns (predefined are managed automatically)
 */
function handleSetRuleColumns(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { columns } = args as { columns: any[] };

    if (!columns || !Array.isArray(columns)) {
        return {
            error: 'columns array is required. Each column must have: name (string), path (string), SourceType (Body|Params|Header|Auth|Context)',
            example: { name: 'Employee Name', path: '{$.body.name}', SourceType: 'Body', DataType: 'String' },
        };
    }

    // Validate every column
    const allErrors: string[] = [];
    const validColumns: RuleColumn[] = [];

    for (let i = 0; i < columns.length; i++) {
        const { valid, errors } = validateColumn(columns[i], i);
        if (valid) {
            const c = columns[i];
            validColumns.push({
                name: c.name.trim(),
                path: c.path.trim(),
                SourceType: c.SourceType,
                DataType: c.DataType || 'String',
                IsPredefineColumn: false,
                Properties: c.Properties || [],
                PickList: c.PickList || {},
                Enum: c.Enum || [],
            });
        } else {
            allErrors.push(...errors);
        }
    }

    if (validColumns.length === 0) {
        return {
            error: 'No valid columns could be built',
            validationErrors: allErrors,
            hint: 'Each column requires: name (non-empty), path (e.g., {$.body.name}), SourceType (Body|Params|Header|Auth|Context)',
        };
    }

    if (!ctx.designer!.onSetRuleColumns) return { error: 'setRuleColumns callback not available' };

    const deduplicated = deduplicateColumns(validColumns);
    ctx.designer!.onSetRuleColumns(deduplicated);

    return {
        success: true,
        message: `Set ${deduplicated.length} custom rule column(s)`,
        columns: deduplicated.map(c => `${c.name} (${c.SourceType}: ${c.path}, ${c.DataType})`),
        columnsSet: deduplicated.length,
        skipped: columns.length - validColumns.length,
        deduplicated: validColumns.length - deduplicated.length,
        warnings: allErrors.length > 0 ? allErrors : undefined,
    };
}

/**
 * validateRuleColumns — validate an array of columns without writing them
 */
function handleValidateRuleColumns(args: Record<string, unknown>): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { columns } = args as { columns: any[] };
    if (!columns || !Array.isArray(columns)) {
        return { valid: false, errors: ['columns array is required'] };
    }

    const allErrors: string[] = [];
    for (let i = 0; i < columns.length; i++) {
        const { errors } = validateColumn(columns[i], i);
        allErrors.push(...errors);
    }

    // Check for duplicates
    const seen = new Map<string, number>();
    for (let i = 0; i < columns.length; i++) {
        const c = columns[i];
        if (c?.name && c?.SourceType) {
            const key = `${c.name}|${c.SourceType}`;
            if (seen.has(key)) {
                allErrors.push(`Column[${i}]: duplicate of Column[${seen.get(key)}] — same name "${c.name}" + SourceType "${c.SourceType}"`);
            } else {
                seen.set(key, i);
            }
        }
    }

    return {
        valid: allErrors.length === 0,
        errors: allErrors.length > 0 ? allErrors : undefined,
        columnCount: columns.length,
        message: allErrors.length === 0
            ? `All ${columns.length} column(s) are valid`
            : `Found ${allErrors.length} validation error(s)`,
    };
}

/**
 * generateRuleColumnsFromBody — auto-create columns from current Body schema fields
 */
function handleGenerateFromBody(_args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    if (!ctx.designer!.onGetBodyQuerySchema) {
        return { error: 'getBodyQuerySchema callback not available' };
    }

    const bodyFields = ctx.designer!.onGetBodyQuerySchema('Body') || [];
    if (bodyFields.length === 0) {
        return {
            success: false,
            columns: [],
            message: 'No Body schema fields found. Register Body fields with updateBodyQuerySchema first.',
            hint: 'Call updateBodyQuerySchema({ schemaType: "Body", fields: [...] }) before generating rule columns.',
        };
    }

    const bodyColumns = bodyFields.map(bodyFieldToRuleColumn);

    return {
        success: true,
        columns: bodyColumns,
        count: bodyColumns.length,
        message: `Generated ${bodyColumns.length} Body column(s): ${bodyColumns.map(c => c.name).join(', ')}`,
        hint: 'These are Body-source columns. Combine with Params/Auth/Context columns then call setRuleColumns.',
    };
}

/**
 * generateRuleColumnsFromSchema — fetch schema columns via API and create rule columns
 */
async function handleGenerateFromSchema(args: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
    const schemaId = (args.schemaId as string) || ctx.workflowContext?.currentSchemaId;
    const subscription = resolveSub(args, ctx);

    if (!schemaId) {
        return {
            error: 'No schema ID provided and no currentSchemaId in workflow context.',
            hint: 'Call generateRuleColumnsFromSchema({ schemaId: "your-schema-id" })',
        };
    }

    const result = await getSchemaDetails(schemaId, subscription);
    if (result.error || !result.schema) {
        return { success: false, error: result.error || 'Schema not found' };
    }

    const columnNames = getSchemaColumnNames(result.schema);
    const bodyColumns: RuleColumn[] = columnNames.map(name => {
        // Try to infer DataType from schema column type
        const schemaCol = result.schema!.Columns.find(c => c.name === name);
        let dataType: RuleColumn['DataType'] = 'String';
        if (schemaCol?.type) {
            const t = schemaCol.type.toLowerCase();
            if (t.includes('int') || t.includes('float') || t.includes('number') || t.includes('decimal')) dataType = 'Number';
            else if (t.includes('bool')) dataType = 'Boolean';
            else if (t.includes('date') || t.includes('time')) dataType = 'Date';
        }
        return {
            name: capitalise(name),
            path: `{$.body.${name}}`,
            SourceType: 'Body' as const,
            DataType: dataType,
        };
    });

    return {
        success: true,
        schemaId,
        schemaName: result.schema.DisplayName || result.schema.SystemName,
        columns: bodyColumns,
        count: bodyColumns.length,
        message: `Generated ${bodyColumns.length} column(s) from schema "${result.schema.DisplayName || result.schema.SystemName}"`,
        hint: 'Combine with Params/Auth/Context columns then call setRuleColumns.',
    };
}

/**
 * generateRuleColumnsFromTemplate — fetch template, derive Context-source columns
 */
async function handleGenerateFromTemplate(args: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
    const { templateId } = args as { templateId?: string };

    // Try to get template ID from action properties if not provided
    let resolvedTemplateId = templateId;
    if (!resolvedTemplateId && ctx.designer?.onGetActionProperties) {
        const actionProps = ctx.designer.onGetActionProperties();
        resolvedTemplateId = (actionProps?.Template as string) || (actionProps?.template as string) || undefined;
    }

    if (!resolvedTemplateId) {
        return {
            success: false,
            columns: [],
            message: 'No template configured on this action and no templateId provided.',
            hint: 'Set a Template in action properties first, or provide templateId parameter.',
        };
    }

    const subscription = resolveSub(args, ctx);
    const result = await getTemplateById(resolvedTemplateId, subscription);
    if (result.error || !result.template) {
        return { success: false, error: result.error || 'Template not found' };
    }

    // Inspect template to infer context fields
    // Templates typically produce output that becomes state.context
    // We look at Response tasks and Resolver payload keys
    const template = result.template;
    const contextFields: RuleColumn[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractFieldsFromTasks = (tasks: any[]) => {
        if (!Array.isArray(tasks)) return;
        for (const task of tasks) {
            // Resolver tasks often define the shape of the template output
            if (task.type === 'Resolver' && Array.isArray(task.payload)) {
                for (const kv of task.payload) {
                    if (kv.Key && typeof kv.Key === 'string') {
                        contextFields.push({
                            name: capitalise(kv.Key),
                            path: `{$.context.${kv.Key}}`,
                            SourceType: 'Context',
                            DataType: 'String',
                        });
                    }
                }
            }
            // Response tasks may indicate output shape
            if (task.type === 'Response' && Array.isArray(task.payload)) {
                for (const kv of task.payload) {
                    if (kv.Key && typeof kv.Key === 'string') {
                        contextFields.push({
                            name: capitalise(kv.Key),
                            path: `{$.context.${kv.Key}}`,
                            SourceType: 'Context',
                            DataType: 'String',
                        });
                    }
                }
            }
            // Recurse into branches
            if (task.branches) {
                for (const branchTasks of Object.values(task.branches)) {
                    if (Array.isArray(branchTasks)) extractFieldsFromTasks(branchTasks);
                }
            }
            if (task.onSuccess) extractFieldsFromTasks(task.onSuccess);
            if (task.onFailure) extractFieldsFromTasks(task.onFailure);
            if (task.tasks) extractFieldsFromTasks(task.tasks);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const templateDef = (template as any).definition || (template as any).Definition || template;
    if (templateDef.sequence) extractFieldsFromTasks(templateDef.sequence);
    if (templateDef.tasks) extractFieldsFromTasks(templateDef.tasks);

    const deduplicated = deduplicateColumns(contextFields);

    return {
        success: true,
        templateId: resolvedTemplateId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        templateName: (template as any).DisplayName || (template as any).SystemName || resolvedTemplateId,
        columns: deduplicated,
        count: deduplicated.length,
        message: deduplicated.length > 0
            ? `Extracted ${deduplicated.length} Context column(s) from template: ${deduplicated.map(c => c.name).join(', ')}`
            : 'No Context fields could be auto-detected from the template. You may need to add Context columns manually.',
        hint: 'Context columns reference template output via {$.context.fieldName}. Combine with Body/Params/Auth columns then call setRuleColumns.',
    };
}

/**
 * autoGenerateRuleMapping — one-shot: gather all sources and build a complete mapping
 *
 * Reads Body schema, action properties (Template), Params, Auth, and optionally
 * fetches schema details + template to build the most complete set of columns.
 */
async function handleAutoGenerate(args: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
    const err = requireDesigner(ctx); if (err) return err;
    const includeParams = (args.includeParams as boolean) !== false; // default true
    const includeAuth = (args.includeAuth as boolean) !== false;     // default true
    const includeHeaders = (args.includeHeaders as boolean) ?? false; // default false
    const includeContext = (args.includeContext as boolean) !== false; // default true

    const allColumns: RuleColumn[] = [];
    const sources: string[] = [];
    const warnings: string[] = [];

    // 1. Body columns from registered Body schema
    if (ctx.designer!.onGetBodyQuerySchema) {
        const bodyFields = ctx.designer!.onGetBodyQuerySchema('Body') || [];
        if (bodyFields.length > 0) {
            allColumns.push(...bodyFields.map(bodyFieldToRuleColumn));
            sources.push(`Body (${bodyFields.length} fields)`);
        } else {
            warnings.push('No Body schema fields registered — call updateBodyQuerySchema first, or columns will only come from other sources.');
        }
    }

    // 2. Standard Params columns
    if (includeParams) {
        allColumns.push(...STANDARD_PARAMS_COLUMNS);
        sources.push(`Params (${STANDARD_PARAMS_COLUMNS.length} standard)`);
    }

    // 3. Standard Auth columns
    if (includeAuth) {
        allColumns.push(...STANDARD_AUTH_COLUMNS);
        sources.push(`Auth (${STANDARD_AUTH_COLUMNS.length} standard)`);
    }

    // 4. Standard Header columns
    if (includeHeaders) {
        allColumns.push(...STANDARD_HEADER_COLUMNS);
        sources.push(`Header (${STANDARD_HEADER_COLUMNS.length} standard)`);
    }

    // 5. Context from Template (if configured)
    if (includeContext && ctx.designer!.onGetActionProperties) {
        const actionProps = ctx.designer!.onGetActionProperties();
        const templateId = (actionProps?.Template as string) || (actionProps?.template as string);
        if (templateId) {
            try {
                const subscription = resolveSub(args, ctx);
                const result = await getTemplateById(templateId, subscription);
                if (result.template && !result.error) {
                    // Re-use the template extraction logic
                    const templateResult = await handleGenerateFromTemplate({ templateId }, ctx);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const ctxColumns = (templateResult as any)?.columns as RuleColumn[] | undefined;
                    if (ctxColumns && ctxColumns.length > 0) {
                        allColumns.push(...ctxColumns);
                        sources.push(`Context from template (${ctxColumns.length} fields)`);
                    } else {
                        warnings.push(`Template "${templateId}" configured but no Context fields could be auto-detected.`);
                    }
                }
            } catch {
                warnings.push('Failed to fetch template for Context columns.');
            }
        } else {
            warnings.push('No Template configured on action properties — Context columns skipped.');
        }
    }

    // 6. If we have a schema ID, try to enrich Body columns from schema column types
    const schemaId = (args.schemaId as string) || ctx.workflowContext?.currentSchemaId;
    if (schemaId) {
        try {
            const subscription = resolveSub(args, ctx);
            const schemaResult = await getSchemaDetails(schemaId, subscription);
            if (schemaResult.schema) {
                // Enrich DataType for existing Body columns based on schema column definitions
                for (const col of allColumns) {
                    if (col.SourceType === 'Body') {
                        const fieldName = col.path.match(/\{\$\.body\.(\w+)\}/)?.[1];
                        if (fieldName) {
                            const schemaCol = schemaResult.schema.Columns.find(c => c.name === fieldName);
                            if (schemaCol?.type) {
                                const t = schemaCol.type.toLowerCase();
                                if (t.includes('int') || t.includes('float') || t.includes('number')) col.DataType = 'Number';
                                else if (t.includes('bool')) col.DataType = 'Boolean';
                                else if (t.includes('date') || t.includes('time')) col.DataType = 'Date';
                            }
                        }
                    }
                }
                sources.push(`Schema "${schemaResult.schema.DisplayName || schemaResult.schema.SystemName}" (enriched DataTypes)`);
            }
        } catch {
            warnings.push('Could not fetch schema details for DataType enrichment.');
        }
    }

    // De-duplicate and apply
    const deduplicated = deduplicateColumns(allColumns);

    if (deduplicated.length === 0) {
        return {
            success: false,
            columns: [],
            sources,
            warnings,
            message: 'No columns could be generated from any source.',
            hint: 'Register Body fields with updateBodyQuerySchema first.',
        };
    }

    // Auto-apply to designer
    if (ctx.designer!.onSetRuleColumns) {
        ctx.designer!.onSetRuleColumns(deduplicated);
    }

    return {
        success: true,
        columns: deduplicated,
        count: deduplicated.length,
        sources,
        warnings: warnings.length > 0 ? warnings : undefined,
        bySourceType: {
            Body: deduplicated.filter(c => c.SourceType === 'Body').length,
            Params: deduplicated.filter(c => c.SourceType === 'Params').length,
            Header: deduplicated.filter(c => c.SourceType === 'Header').length,
            Auth: deduplicated.filter(c => c.SourceType === 'Auth').length,
            Context: deduplicated.filter(c => c.SourceType === 'Context').length,
        },
        message: `Auto-generated and applied ${deduplicated.length} rule mapping column(s) from: ${sources.join(', ')}`,
        columnDetails: deduplicated.map(c => `${c.name} → ${c.path} (${c.SourceType}, ${c.DataType})`),
    };
}

/**
 * addRuleColumn — add a single column to the existing set (merge, not replace)
 */
function handleAddRuleColumn(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    if (!ctx.designer!.onGetRuleColumns || !ctx.designer!.onSetRuleColumns) {
        return { error: 'Rule column callbacks not available' };
    }

    const { name, path, SourceType, DataType, PickList, Enum } = args as {
        name: string; path: string; SourceType: string;
        DataType?: string; PickList?: RuleColumn['PickList']; Enum?: unknown[];
    };

    const { valid, errors } = validateColumn({ name, path, SourceType, DataType }, 0);
    if (!valid) return { success: false, errors };

    const existing = ctx.designer!.onGetRuleColumns();
    const custom = existing.filter(c => !c.IsPredefineColumn);

    // Check for duplicate
    if (custom.some(c => c.name === name.trim() && c.SourceType === SourceType)) {
        return {
            success: false,
            error: `Column "${name}" with SourceType "${SourceType}" already exists. Use updateRuleColumn to modify it.`,
        };
    }

    const newColumn: RuleColumn = {
        name: name.trim(),
        path: path.trim(),
        SourceType: SourceType as RuleColumn['SourceType'],
        DataType: (DataType as RuleColumn['DataType']) || 'String',
        IsPredefineColumn: false,
        Properties: [],
        PickList: PickList || {},
        Enum: Enum || [],
    };

    const updated = [...custom, newColumn];
    ctx.designer!.onSetRuleColumns(updated);

    return {
        success: true,
        message: `Added column "${newColumn.name}" (${newColumn.SourceType}: ${newColumn.path}, ${newColumn.DataType})`,
        totalCustomColumns: updated.length,
    };
}

/**
 * updateRuleColumn — modify an existing custom column by name
 */
function handleUpdateRuleColumn(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    if (!ctx.designer!.onGetRuleColumns || !ctx.designer!.onSetRuleColumns) {
        return { error: 'Rule column callbacks not available' };
    }

    const { name, updates } = args as { name: string; updates: Partial<RuleColumn> };
    if (!name) return { error: '"name" is required to identify the column to update' };
    if (!updates || Object.keys(updates).length === 0) return { error: '"updates" object must contain at least one field to change' };

    const existing = ctx.designer!.onGetRuleColumns();
    const custom = existing.filter(c => !c.IsPredefineColumn);
    const index = custom.findIndex(c => c.name === name.trim());

    if (index === -1) {
        return {
            success: false,
            error: `Custom column "${name}" not found. Available: ${custom.map(c => c.name).join(', ') || '(none)'}`,
        };
    }

    const updated = [...custom];
    updated[index] = { ...updated[index], ...updates, IsPredefineColumn: false };

    ctx.designer!.onSetRuleColumns(updated);

    return {
        success: true,
        message: `Updated column "${name}": ${Object.keys(updates).join(', ')}`,
        column: updated[index],
    };
}

/**
 * removeRuleColumn — remove a custom column by name
 */
function handleRemoveRuleColumn(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    if (!ctx.designer!.onGetRuleColumns || !ctx.designer!.onSetRuleColumns) {
        return { error: 'Rule column callbacks not available' };
    }

    const { name } = args as { name: string };
    if (!name) return { error: '"name" is required' };

    const existing = ctx.designer!.onGetRuleColumns();
    const custom = existing.filter(c => !c.IsPredefineColumn);
    const filtered = custom.filter(c => c.name !== name.trim());

    if (filtered.length === custom.length) {
        return {
            success: false,
            error: `Column "${name}" not found among custom columns. Available: ${custom.map(c => c.name).join(', ') || '(none)'}`,
        };
    }

    ctx.designer!.onSetRuleColumns(filtered);
    return {
        success: true,
        message: `Removed column "${name}"`,
        remainingCustomColumns: filtered.length,
    };
}

/**
 * configurePickList — set up a PickList dropdown on an existing column
 */
function handleConfigurePickList(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    if (!ctx.designer!.onGetRuleColumns || !ctx.designer!.onSetRuleColumns) {
        return { error: 'Rule column callbacks not available' };
    }

    const { columnName, SubscriptionId, SchemaId, ActionId, Mappings } = args as {
        columnName: string;
        SubscriptionId?: string;
        SchemaId?: string;
        ActionId?: string;
        Mappings?: { DisplayExpr?: string; ValueExpr?: string; Description?: string; Sort?: string; Group?: string };
    };

    if (!columnName) return { error: '"columnName" is required — name of the column to configure' };

    const existing = ctx.designer!.onGetRuleColumns();
    const custom = existing.filter(c => !c.IsPredefineColumn);
    const index = custom.findIndex(c => c.name === columnName.trim());

    if (index === -1) {
        return {
            success: false,
            error: `Column "${columnName}" not found. Available custom columns: ${custom.map(c => c.name).join(', ') || '(none)'}`,
        };
    }

    const pickList: RuleColumn['PickList'] = {
        SubscriptionId: SubscriptionId || ctx.workflowContext?.subscription,
        SchemaId,
        ActionId,
        Mappings: Mappings || {},
    };

    const updated = [...custom];
    updated[index] = { ...updated[index], PickList: pickList };
    ctx.designer!.onSetRuleColumns(updated);

    return {
        success: true,
        message: `Configured PickList on column "${columnName}"`,
        pickList,
        hint: 'PickList enables dropdown selection in the rule UI. SchemaId + ActionId define where dropdown values come from.',
    };
}

/**
 * configureEnum — set enumeration values on an existing column
 */
function handleConfigureEnum(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    if (!ctx.designer!.onGetRuleColumns || !ctx.designer!.onSetRuleColumns) {
        return { error: 'Rule column callbacks not available' };
    }

    const { columnName, values } = args as { columnName: string; values: unknown[] };
    if (!columnName) return { error: '"columnName" is required' };
    if (!values || !Array.isArray(values) || values.length === 0) return { error: '"values" must be a non-empty array of allowed values' };

    const existing = ctx.designer!.onGetRuleColumns();
    const custom = existing.filter(c => !c.IsPredefineColumn);
    const index = custom.findIndex(c => c.name === columnName.trim());

    if (index === -1) {
        return {
            success: false,
            error: `Column "${columnName}" not found. Available: ${custom.map(c => c.name).join(', ') || '(none)'}`,
        };
    }

    const updated = [...custom];
    updated[index] = { ...updated[index], Enum: values };
    ctx.designer!.onSetRuleColumns(updated);

    return {
        success: true,
        message: `Set ${values.length} enum value(s) on column "${columnName}": ${values.join(', ')}`,
    };
}

/**
 * getRuleMappingSummary — formatted overview of all rule columns for LLM/user
 */
function handleGetSummary(_args: Record<string, unknown>, ctx: ToolContext): unknown {
    const err = requireDesigner(ctx); if (err) return err;
    if (!ctx.designer!.onGetRuleColumns) return { error: 'getRuleColumns callback not available' };

    const columns = ctx.designer!.onGetRuleColumns();
    if (columns.length === 0) {
        return {
            summary: 'No rule mapping columns configured.',
            hint: 'Call autoGenerateRuleMapping to generate columns from Body/Params/Auth/Context sources.',
        };
    }

    const predefined = columns.filter(c => c.IsPredefineColumn);
    const custom = columns.filter(c => !c.IsPredefineColumn);

    let md = `## Rule Mapping Summary\n\n`;
    md += `**Total columns:** ${columns.length} (${predefined.length} predefined, ${custom.length} custom)\n\n`;

    if (predefined.length > 0) {
        md += `### Predefined Columns (auto-derived from Body)\n`;
        md += `| Name | Path | DataType |\n|------|------|----------|\n`;
        predefined.forEach(c => { md += `| ${c.name} | \`${c.path}\` | ${c.DataType || 'String'} |\n`; });
        md += '\n';
    }

    if (custom.length > 0) {
        md += `### Custom Columns\n`;
        md += `| Name | Path | SourceType | DataType | PickList | Enum |\n|------|------|------------|----------|----------|------|\n`;
        custom.forEach(c => {
            const hasPL = c.PickList && (c.PickList.SchemaId || c.PickList.ActionId) ? '✓' : '—';
            const hasEnum = c.Enum && c.Enum.length > 0 ? `${c.Enum.length} values` : '—';
            md += `| ${c.name} | \`${c.path}\` | ${c.SourceType} | ${c.DataType || 'String'} | ${hasPL} | ${hasEnum} |\n`;
        });
        md += '\n';
    }

    // Source distribution
    const bySource: Record<string, number> = {};
    columns.forEach(c => { bySource[c.SourceType] = (bySource[c.SourceType] || 0) + 1; });
    md += `### By Source\n`;
    for (const [src, count] of Object.entries(bySource)) {
        md += `- **${src}**: ${count} column(s)\n`;
    }

    return { summary: md, format: 'markdown', totalColumns: columns.length };
}

// ─── Agent factory ───────────────────────────────────────────────────────────

export function createRuleMappingAgent(): TaskAgent {
    return {
        name: 'rule-mapping',
        description: 'Comprehensive rule-mapping column management: CRUD, auto-generation from Body/Schema/Template/Params/Auth/Context, validation, PickList, Enum, and one-shot auto-generate',
        tools: [
            // Read / Write (match existing WORKFLOW_TOOLS names)
            { name: 'getRuleColumns', execute: handleGetRuleColumns },
            { name: 'setRuleColumns', execute: handleSetRuleColumns },

            // Validation
            { name: 'validateRuleColumns', execute: handleValidateRuleColumns },

            // Auto-generation
            { name: 'generateRuleColumnsFromBody', execute: handleGenerateFromBody },
            { name: 'generateRuleColumnsFromSchema', execute: handleGenerateFromSchema },
            { name: 'generateRuleColumnsFromTemplate', execute: handleGenerateFromTemplate },
            { name: 'autoGenerateRuleMapping', execute: handleAutoGenerate },

            // Fine-grained CRUD
            { name: 'addRuleColumn', execute: handleAddRuleColumn },
            { name: 'updateRuleColumn', execute: handleUpdateRuleColumn },
            { name: 'removeRuleColumn', execute: handleRemoveRuleColumn },

            // Rich configuration
            { name: 'configurePickList', execute: handleConfigurePickList },
            { name: 'configureEnum', execute: handleConfigureEnum },

            // Summary
            { name: 'getRuleMappingSummary', execute: handleGetSummary },
        ],
    };
}
