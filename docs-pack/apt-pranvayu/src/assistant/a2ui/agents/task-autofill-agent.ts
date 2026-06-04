/**
 * Task Auto-Fill Agent
 *
 * Provides intelligent per-task-type property generation.
 * When the user clicks the AI sparkle button on a task editor,
 * this agent analyses the workflow context and generates appropriate
 * default values for the selected task's configuration fields.
 *
 * The core tool `autoFillTask` takes taskType + subType + current
 * properties and returns a complete `taskSettings` object.
 */

import type { TaskAgent, ToolContext } from './types';
import {
    getTaskGenerationContext,
    CORE_TYPES,
} from '../knowledge/task-generation-context';
import {
    getTaskDocumentation,
} from '../knowledge/workflow-knowledge';
import {
    TASK_INTERFACE_DOCS,
} from '../knowledge/task-interfaces';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a UUID v4 for IKeyValue entries */
function uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}

/** Build a standard IKeyValue entry */
function kv(
    key: string,
    value: unknown,
    type: 'Literal' | 'Property' | 'Calculated' = 'Property',
): Record<string, unknown> {
    return { Id: uuid(), IsResolved: false, Key: key, Value: value, Type: type };
}

/**
 * Build a success response block matching the DXForm editor default shape.
 * Editor fields: statusCode (select), data (text), code (text).
 * Do NOT add success/cookies — the editor form has no fields for them.
 */
function successResponse(statusCode: number = 200): Record<string, unknown> {
    return {
        statusCode,
        data: 'payload',
        code: String(statusCode),
    };
}

/**
 * Build a failed/error response block matching the DXForm editor default shape.
 * Editor fields: statusCode (select), message (text), code (text), error (text).
 * Do NOT add success boolean — the editor form has no field for it.
 */
function errorResponse(statusCode: number, message: string): Record<string, unknown> {
    return {
        statusCode,
        message,
        code: String(statusCode),
        error: '',
    };
}

/**
 * Infer available data paths from previous tasks in the workflow
 */
function inferDataPaths(ctx: ToolContext): string[] {
    const paths: string[] = ['{$.body}', '{$.params}', '{$.params.documentId}'];
    if (ctx.designer?.onListTasks) {
        const tasks = ctx.designer.onListTasks();
        for (const t of tasks) {
            if (t._id && t.name) {
                // Task name is typically used as the execution ID for data paths
                paths.push(`{$.${t.name}.data}`);
            }
        }
    }
    return paths;
}

/**
 * Get the current workflow's Body schema fields (for generating payload references)
 */
function getBodyFields(ctx: ToolContext): string[] {
    if (!ctx.designer?.onGetBodyQuerySchema) return [];
    const fields = ctx.designer.onGetBodyQuerySchema('Body') || [];
    return fields.map((f: { key: string }) => f.key);
}

/**
 * Get schema column names from the schema registry (via the designer's schema details).
 * Falls back to body fields if schema columns are not available.
 * This ensures payload/where arrays get real column names instead of being empty.
 */
function getPayloadFields(ctx: ToolContext): string[] {
    // 1st priority: body schema fields (explicitly registered by the user)
    const bodyFields = getBodyFields(ctx);
    if (bodyFields.length > 0) return bodyFields;

    // 2nd priority: schema columns from the schema registry agent
    // The designer may expose schema columns via getActionProperties or similar
    if (ctx.designer?.onGetActionProperties) {
        const props = ctx.designer.onGetActionProperties() as Record<string, unknown> | undefined;
        if (props && Array.isArray(props.schemaColumns)) {
            return (props.schemaColumns as string[]).filter(c => !c.startsWith('_'));
        }
    }

    return [];
}

// ─── Per-Task-Type Generators ─────────────────────────────────────────────

type TaskFiller = (
    args: { subType?: string; currentProps?: Record<string, unknown>; taskId?: string; taskName?: string },
    ctx: ToolContext,
) => Record<string, unknown>;

function fillDocument(args: { subType?: string; taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    const method = args.subType || 'Get';
    const base: Record<string, unknown> = {
        id: args.taskId || 'documentTask',
        name: args.taskName || 'Document Task',
        type: 'Document',
        method,
        subscriptionId: ctx.workflowContext?.subscription || '{$.auth.subscriptionId}',
        schemaId: ctx.workflowContext?.currentSchemaId || '',
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };

    switch (method) {
        case 'Get':
        case 'GetById':
            base.documentId = '{$.params.documentId}';
            break;
        case 'Post':
            base.payload = getPayloadFields(ctx).map(f => kv(f, `{$.body.${f}}`));
            break;
        case 'Put':
            base.documentId = '{$.params.documentId}';
            base.payload = getPayloadFields(ctx).map(f => kv(f, `{$.body.${f}}`));
            break;
        case 'Delete':
            base.documentId = '{$.params.documentId}';
            break;
        case 'UpsertAll':
            base.payload = getPayloadFields(ctx).map(f => kv(f, `{$.body.${f}}`));
            break;
        case 'Paging':
            base.where = [];
            base.take = 20;
            base.skip = 0;
            base.orderby = '';
            base.asc = '';
            base.page = '';
            break;
    }
    return base;
}

function fillQuery(args: { subType?: string; taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    const method = args.subType || 'FindOne';
    const base: Record<string, unknown> = {
        id: args.taskId || 'queryTask',
        name: args.taskName || 'Query Task',
        type: 'Query',
        method,
        repository: '',
        success: successResponse(200),
        failed: errorResponse(404, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };

    switch (method) {
        case 'FindOne':
            base.where = [kv('_id', '{$.params.documentId}')];
            break;
        case 'Find':
        case 'FindV2':
            base.where = [kv('status', 'active', 'Literal')];
            base.take = 100;
            break;
        case 'FindPaging':
            base.where = [];
            base.take = 20;
            base.skip = 0;
            base.orderby = 'createdAt';
            break;
        case 'Where':
            base.where = [kv('_id', '{$.params.documentId}')];
            break;
        case 'WherePaging':
            base.where = [];
            base.take = 20;
            base.skip = 0;
            base.orderby = '';
            base.asc = '';
            base.page = '';
            break;
        case 'RawQuery':
            base.query = '';
            break;
        case 'NotExist':
            base.where = [kv('_id', '{$.params.documentId}')];
            break;
        case 'Builder':
            base.selectType = 'GetMany';
            base.where = [];
            base.select = [];
            base.take = 100;
            break;
    }
    return base;
}

function fillResolver(args: { subType?: string; taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    const payloadFields = getPayloadFields(ctx);
    const paths = inferDataPaths(ctx);
    const payload = payloadFields.length > 0
        ? payloadFields.map(f => kv(f, `{$.body.${f}}`))
        : paths.length > 2
            ? [kv('data', paths[paths.length - 1])]
            : [kv('data', '{$.body}')];

    return {
        id: args.taskId || 'resolverTask',
        name: args.taskName || 'Resolver Task',
        type: 'Resolver',
        method: args.subType || 'Object',
        payload,
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
}

function fillResponse(args: { taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    const paths = inferDataPaths(ctx);
    // Try to reference last task's output
    const lastDataPath = paths.length > 2 ? paths[paths.length - 1] : '{$.body}';

    return {
        id: args.taskId || 'responseTask',
        name: args.taskName || 'Response Task',
        type: 'Response',
        payload: [kv('data', lastDataPath)],
    };
}

function fillCondition(args: { taskId?: string; taskName?: string }): Record<string, unknown> {
    return {
        id: args.taskId || 'conditionTask',
        name: args.taskName || 'Condition Task',
        type: 'Condition',
        conditions: {
            operator: 'notNull',
            fact: '{$.body}',
        },
    };
}

function fillSwitch(args: { taskId?: string; taskName?: string }): Record<string, unknown> {
    return {
        id: args.taskId || 'switchTask',
        name: args.taskName || 'Switch Task',
        type: 'Switch',
        conditions: {
            operator: 'equals',
            fact: '{$.body.type}',
            value: '',
        },
    };
}

function fillIterator(args: { subType?: string; taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    const paths = inferDataPaths(ctx);
    const arrayPath = paths.length > 2 ? paths[paths.length - 1] : '{$.body.items}';

    return {
        id: args.taskId || 'iteratorTask',
        name: args.taskName || 'Iterator Task',
        type: 'Iterator',
        method: args.subType || 'ForEach',
        path: arrayPath,
        var: 'item',
    };
}

function fillRequest(args: { subType?: string; taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    const method = args.subType || 'Action';
    const base: Record<string, unknown> = {
        id: args.taskId || 'requestTask',
        name: args.taskName || 'Request Task',
        type: 'Request',
        method,
        schema: ctx.workflowContext?.currentSchemaId || '',
        action: '',
        subscriptionId: ctx.workflowContext?.subscription || '{$.auth.subscriptionId}',
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };

    switch (method) {
        case 'Action':
        case 'Service':
            base.body = getPayloadFields(ctx).map(f => kv(f, `{$.body.${f}}`));
            base.params = [kv('documentId', '{$.params.documentId}')];
            break;
        case 'GetById':
            base.params = [kv('documentId', '{$.params.documentId}')];
            break;
        case 'Post':
        case 'Put':
            base.body = getPayloadFields(ctx).map(f => kv(f, `{$.body.${f}}`));
            base.params = [kv('documentId', '{$.params.documentId}')];
            break;
        case 'Forward':
        case 'ForwardProxy':
        case 'Proxy':
            base.body = getPayloadFields(ctx).map(f => kv(f, `{$.body.${f}}`));
            base.params = [kv('documentId', '{$.params.documentId}')];
            break;
        case 'Schedule':
            base.cron = '';
            base.body = getPayloadFields(ctx).map(f => kv(f, `{$.body.${f}}`));
            break;
        case 'Produce':
            base.topic = '';
            base.body = getPayloadFields(ctx).map(f => kv(f, `{$.body.${f}}`));
            break;
    }
    return base;
}

function fillHTTP(args: { subType?: string; taskId?: string; taskName?: string }): Record<string, unknown> {
    return {
        id: args.taskId || 'httpTask',
        name: args.taskName || 'HTTP Task',
        type: 'HTTP',
        method: args.subType || 'Get',
        url: '',
        headers: [kv('Content-Type', 'application/json', 'Literal')],
        body: [],
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
}

function fillValidator(args: { taskId?: string; taskName?: string }): Record<string, unknown> {
    return {
        id: args.taskId || 'validatorTask',
        name: args.taskName || 'Validator Task',
        type: 'Validator',
        method: 'Validate',
        schema: 'Body',
    };
}

function fillEntity(args: { subType?: string; taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    const method = args.subType || 'Get';
    const base: Record<string, unknown> = {
        id: args.taskId || 'entityTask',
        name: args.taskName || 'Entity Task',
        type: 'Entity',
        method,
        subscriptionId: ctx.workflowContext?.subscription || '{$.auth.subscriptionId}',
        containerId: ctx.workflowContext?.currentSchemaId || '',
        success: successResponse(200),
        failed: errorResponse(404, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };

    switch (method) {
        case 'Get':
            base.documentId = '{$.params.documentId}';
            base.where = [kv('_id', '{$.params.documentId}')];
            break;
        case 'Post':
            base.payload = getPayloadFields(ctx).map(f => kv(f, `{$.body.${f}}`));
            break;
        case 'Put':
            base.documentId = '{$.params.documentId}';
            base.payload = getPayloadFields(ctx).map(f => kv(f, `{$.body.${f}}`));
            break;
        case 'Delete':
            base.documentId = '{$.params.documentId}';
            break;
        case 'List':
            base.where = [];
            base.select = [];
            base.take = 100;
            break;
        case 'Paging':
            base.where = [];
            base.select = [];
            base.take = 20;
            base.skip = 0;
            base.orderby = '';
            base.asc = '';
            base.page = '';
            break;
        case 'Clone':
            base.documentId = '{$.params.documentId}';
            base.destination = '';
            break;
    }
    return base;
}

function fillObject(args: { subType?: string; taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    const method = args.subType || 'Merge';
    const payloadFields = getPayloadFields(ctx);
    const base: Record<string, unknown> = {
        id: args.taskId || 'objectTask',
        name: args.taskName || 'Object Task',
        type: 'Object',
        method,
    };

    switch (method) {
        case 'Merge':
            base.payload = payloadFields.length > 0
                ? payloadFields.map(f => kv(f, `{$.body.${f}}`))
                : [kv('data', '{$.body}')];
            break;
        case 'IsExist':
        case 'IsNaN':
        case 'IsObject':
            base.source = '{$.body}';
            base.key = '';
            break;
    }
    return base;
}

function fillArray(args: { subType?: string; taskId?: string; taskName?: string }): Record<string, unknown> {
    return {
        id: args.taskId || 'arrayTask',
        name: args.taskName || 'Array Task',
        type: 'Array',
        method: args.subType || 'Map',
        path: '{$.body.items}',
        var: 'item',
    };
}

function fillRule(args: { subType?: string; taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    return {
        id: args.taskId || 'ruleTask',
        name: args.taskName || 'Rule Task',
        type: 'Rule',
        method: args.subType || 'Execute',
        subscriptionId: ctx.workflowContext?.subscription || '{$.auth.subscriptionId}',
        schemaId: ctx.workflowContext?.currentSchemaId || '',
        payload: getPayloadFields(ctx).map(f => kv(f, `{$.body.${f}}`)),
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
}

function fillTransaction(args: { taskId?: string; taskName?: string }): Record<string, unknown> {
    return {
        id: args.taskId || 'transactionTask',
        name: args.taskName || 'Transaction Task',
        type: 'Transaction',
        method: 'Begin',
    };
}

function fillCache(args: { subType?: string; taskId?: string; taskName?: string }): Record<string, unknown> {
    return {
        id: args.taskId || 'cacheTask',
        name: args.taskName || 'Cache Task',
        type: 'Cache',
        method: args.subType || 'Get',
        key: '',
        value: '',
    };
}

function fillState(args: { subType?: string; taskId?: string; taskName?: string }): Record<string, unknown> {
    return {
        id: args.taskId || 'stateTask',
        name: args.taskName || 'State Task',
        type: 'State',
        method: args.subType || 'Get',
        key: '',
    };
}

function fillJSON(args: { subType?: string; taskId?: string; taskName?: string }): Record<string, unknown> {
    return {
        id: args.taskId || 'jsonTask',
        name: args.taskName || 'JSON Task',
        type: 'JSON',
        method: args.subType || 'Parse',
        path: '{$.body}',
    };
}

function fillString(args: { subType?: string; taskId?: string; taskName?: string }): Record<string, unknown> {
    return {
        id: args.taskId || 'stringTask',
        name: args.taskName || 'String Task',
        type: 'String',
        method: args.subType || 'Replace',
        path: '',
        value: '',
    };
}

function fillSMTP(args: { taskId?: string; taskName?: string }): Record<string, unknown> {
    return {
        id: args.taskId || 'smtpTask',
        name: args.taskName || 'SMTP Task',
        type: 'SMTP',
        to: '',
        subject: '',
        body: '',
        from: '',
    };
}

function fillSecurity(args: { subType?: string; taskId?: string; taskName?: string }): Record<string, unknown> {
    const method = args.subType || 'JWTSign';
    const base: Record<string, unknown> = {
        id: args.taskId || 'securityTask',
        name: args.taskName || 'Security Task',
        type: 'Security',
        method,
    };

    switch (method) {
        case 'JWTSign':
            base.data = '{$.body}';
            base.secret = '';
            base.options = {};
            break;
        case 'JWTVerify':
            base.data = '';
            base.secret = '';
            break;
        case 'hashPassword':
            base.data = '{$.body.password}';
            break;
        case 'matchPassword':
            base.data = '{$.body.password}';
            base.hash = '';
            break;
        case 'verifyPassword':
            base.data = '{$.body.password}';
            base.hash = '';
            break;
    }
    return base;
}

function fillVariable(args: { taskId?: string; taskName?: string }): Record<string, unknown> {
    return {
        id: args.taskId || 'variableTask',
        name: args.taskName || 'Variable Task',
        type: 'Variable',
        method: 'Set',
        key: '',
        value: '',
    };
}

function fillLoop(args: { taskId?: string; taskName?: string }): Record<string, unknown> {
    return {
        id: args.taskId || 'loopTask',
        name: args.taskName || 'Loop Task',
        type: 'Loop',
        count: 10,
        var: 'index',
    };
}

function fillFilter(args: { taskId?: string; taskName?: string }): Record<string, unknown> {
    return {
        id: args.taskId || 'filterTask',
        name: args.taskName || 'Filter Task',
        type: 'Filter',
        path: '{$.body.items}',
        var: 'item',
        conditions: { operator: 'notNull', fact: '{$.item}' },
    };
}

// ─── Additional Task Fillers (complete coverage) ──────────────────────────

function fillDate(args: { subType?: string; taskId?: string; taskName?: string }): Record<string, unknown> {
    const method = args.subType || 'GetDate';
    const base: Record<string, unknown> = {
        id: args.taskId || 'dateTask',
        name: args.taskName || 'Date Task',
        type: 'Date',
        method,
        path: '',
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
    switch (method) {
        case 'Add':
            base.value = '';
            base.unit = 'day';
            break;
        case 'Diff':
            base.value = '';
            base.unit = 'day';
            break;
        case 'Format':
        case 'Parse':
        case 'LessThan':
        case 'GreaterThan':
            base.value = '';
            base.format = 'YYYY-MM-DD';
            break;
        case 'GetDay':
            base.path = '';
            break;
    }
    return base;
}

function fillMath(args: { subType?: string; taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    const method = args.subType || 'Evaluate';
    const base: Record<string, unknown> = {
        id: args.taskId || 'mathTask',
        name: args.taskName || 'Math Task',
        type: 'Math',
        method,
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
    switch (method) {
        case 'Evaluate':
            base.expression = '';
            base.payload = getPayloadFields(ctx).map(f => kv(f, `{$.body.${f}}`));
            break;
        case 'Round':
        case 'Ceil':
        case 'Floor':
            base.path = '';
            base.precision = '';
            break;
    }
    return base;
}

function fillUUID(args: { taskId?: string; taskName?: string }): Record<string, unknown> {
    return {
        id: args.taskId || 'uuidTask',
        name: args.taskName || 'UUID Task',
        type: 'UUID',
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
}

function fillWorkflow(args: { subType?: string; taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    return {
        id: args.taskId || 'workflowTask',
        name: args.taskName || 'Workflow Task',
        type: 'Workflow',
        method: args.subType || 'Template',
        template: '',
        tasks: '',
        subscription: ctx.workflowContext?.subscription || '{$.auth.subscriptionId}',
        repository: '',
        state: '',
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
}

function fillSchema(args: { subType?: string; taskId?: string; taskName?: string }): Record<string, unknown> {
    const method = args.subType || 'Get';
    const base: Record<string, unknown> = {
        id: args.taskId || 'schemaTask',
        name: args.taskName || 'Schema Task',
        type: 'Schema',
        method,
        documentId: '',
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
    switch (method) {
        case 'Post':
        case 'Put':
            base.payload = [];
            break;
        case 'List':
        case 'Paging':
            base.where = [];
            base.take = 20;
            base.skip = 0;
            break;
    }
    return base;
}

function fillTemplate(args: { subType?: string; taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    const method = args.subType || 'Get';
    const base: Record<string, unknown> = {
        id: args.taskId || 'templateTask',
        name: args.taskName || 'Template Task',
        type: 'Template',
        method,
        schema: ctx.workflowContext?.currentSchemaId || '',
        documentId: '',
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
    switch (method) {
        case 'Post':
        case 'Put':
            base.payload = [];
            break;
        case 'List':
        case 'Paging':
            base.where = [];
            base.take = 20;
            base.skip = 0;
            break;
    }
    return base;
}

function fillORM(args: { subType?: string; taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    const method = args.subType || 'Get';
    const base: Record<string, unknown> = {
        id: args.taskId || 'ormTask',
        name: args.taskName || 'ORM Task',
        type: 'ORM',
        method,
        subscriptionId: ctx.workflowContext?.subscription || '{$.auth.subscriptionId}',
        schema: ctx.workflowContext?.currentSchemaId || '',
        documentId: '',
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
    switch (method) {
        case 'Post':
        case 'Put':
            base.payload = [];
            break;
        case 'List':
        case 'Paging':
            base.where = [];
            base.take = 20;
            base.skip = 0;
            break;
    }
    return base;
}

function fillRepository(args: { subType?: string; taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    const method = args.subType || 'Repository';
    return {
        id: args.taskId || 'repositoryTask',
        name: args.taskName || 'Repository Task',
        type: 'Repository',
        method,
        subscription: method === 'Collection' ? (ctx.workflowContext?.subscription || '{$.auth.subscriptionId}') : '',
        schema: method === 'Repository' ? (ctx.workflowContext?.currentSchemaId || '') : '',
        repository: '',
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
}

function fillProvider(args: { subType?: string; taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    const method = args.subType || 'Get';
    const base: Record<string, unknown> = {
        id: args.taskId || 'providerTask',
        name: args.taskName || 'Provider Task',
        type: 'Provider',
        method,
        schema: ctx.workflowContext?.currentSchemaId || '',
        documentId: '',
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
    switch (method) {
        case 'Post':
        case 'Put':
            base.payload = [];
            break;
        case 'List':
        case 'Paging':
            base.where = [];
            base.take = 20;
            base.skip = 0;
            break;
    }
    return base;
}

function fillSubscription(args: { subType?: string; taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    const method = args.subType || 'Get';
    const base: Record<string, unknown> = {
        id: args.taskId || 'subscriptionTask',
        name: args.taskName || 'Subscription Task',
        type: 'Subscription',
        method,
        schema: ctx.workflowContext?.currentSchemaId || '',
        documentId: '',
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
    if (method === 'Set') {
        base.subscription = ctx.workflowContext?.subscription || '{$.auth.subscriptionId}';
    }
    if (method === 'Post') {
        base.payload = [];
    }
    return base;
}

function fillIdentifier(args: { subType?: string; taskId?: string; taskName?: string }): Record<string, unknown> {
    const method = args.subType || 'UUID';
    const base: Record<string, unknown> = {
        id: args.taskId || 'identifierTask',
        name: args.taskName || 'Identifier Task',
        type: 'Identifier',
        method,
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
    if (method === 'NanoId') {
        base.length = '';
    }
    return base;
}

function fillCrypto(args: { subType?: string; taskId?: string; taskName?: string }): Record<string, unknown> {
    const method = args.subType || 'Hash';
    const base: Record<string, unknown> = {
        id: args.taskId || 'cryptoTask',
        name: args.taskName || 'Crypto Task',
        type: 'Crypto',
        method,
        path: '',
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
    switch (method) {
        case 'Hash':
            base.algorithm = 'sha256';
            break;
        case 'Encrypt':
        case 'Decrypt':
            base.key = '';
            base.encoding = 'base64';
            break;
    }
    return base;
}

function fillRSA(args: { subType?: string; taskId?: string; taskName?: string }): Record<string, unknown> {
    const method = args.subType || 'Generate';
    const base: Record<string, unknown> = {
        id: args.taskId || 'rsaTask',
        name: args.taskName || 'RSA Task',
        type: 'RSA',
        method,
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
    if (method !== 'Generate') {
        base.key = '';
        base.path = '';
    }
    return base;
}

function fillPromise(args: { subType?: string; taskId?: string; taskName?: string }): Record<string, unknown> {
    return {
        id: args.taskId || 'promiseTask',
        name: args.taskName || 'Promise Task',
        type: 'Promise',
        method: args.subType || 'PromiseAll',
        tasks: [],
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
}

function fillSequence(args: { taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    return {
        id: args.taskId || 'sequenceTask',
        name: args.taskName || 'Sequence Task',
        type: 'Sequence',
        subscription: ctx.workflowContext?.subscription || '{$.auth.subscriptionId}',
        schema: ctx.workflowContext?.currentSchemaId || '',
        prefix: '',
        paddingLength: '',
        paddingCharacter: '',
        readonly: false,
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
}

function fillAzure(args: { subType?: string; taskId?: string; taskName?: string }): Record<string, unknown> {
    const method = args.subType || 'GetContainerClient';
    const base: Record<string, unknown> = {
        id: args.taskId || 'azureTask',
        name: args.taskName || 'Azure Task',
        type: 'Azure',
        method,
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
    switch (method) {
        case 'GetContainerClient':
            base.containerName = '';
            break;
        case 'Upload':
            base.containerName = '';
            base.path = '';
            base.blobName = '';
            break;
        case 'GetBlobClient':
        case 'Download':
        case 'Delete':
            base.containerName = '';
            base.blobName = '';
            break;
        default:
            base.containerName = '';
            break;
    }
    return base;
}

function fillMinIO(args: { subType?: string; taskId?: string; taskName?: string }): Record<string, unknown> {
    const method = args.subType || 'PutObject';
    const base: Record<string, unknown> = {
        id: args.taskId || 'minioTask',
        name: args.taskName || 'MinIO Task',
        type: 'MinIO',
        method,
        bucketName: '',
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
    switch (method) {
        case 'PutObject':
            base.objectName = '';
            base.path = '';
            break;
        case 'GetObject':
        case 'RemoveObject':
            base.objectName = '';
            break;
    }
    return base;
}

function fillTrino(args: { taskId?: string; taskName?: string }): Record<string, unknown> {
    return {
        id: args.taskId || 'trinoTask',
        name: args.taskName || 'Trino Task',
        type: 'Trino',
        method: 'Query',
        query: '',
        bucketName: '',
        options: '',
        ObjectLocking: false,
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
}

function fillESQuery(args: { taskId?: string; taskName?: string }): Record<string, unknown> {
    return {
        id: args.taskId || 'esQueryTask',
        name: args.taskName || 'ESQuery Task',
        type: 'ESQuery',
        method: 'Find',
        take: 25,
        where: [],
        advancedQuery: false,
        conditions: {},
        repository: '',
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
}

function fillExport(args: { subType?: string; taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    return {
        id: args.taskId || 'exportTask',
        name: args.taskName || 'Export Task',
        type: 'Export',
        method: args.subType || 'EXCEL',
        schema: ctx.workflowContext?.currentSchemaId || '',
        subscription: ctx.workflowContext?.subscription || '{$.auth.subscriptionId}',
        select: '',
        columns: [],
        where: [],
        relations: [],
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
}

function fillHistory(args: { subType?: string; taskId?: string; taskName?: string }): Record<string, unknown> {
    const method = args.subType || 'Get';
    const base: Record<string, unknown> = {
        id: args.taskId || 'historyTask',
        name: args.taskName || 'History Task',
        type: 'History',
        method,
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
    switch (method) {
        case 'Get':
        case 'Put':
            base.documentId = '';
            if (method === 'Put') base.payload = [];
            break;
        case 'Post':
            base.payload = [];
            break;
        case 'List':
            base.where = [];
            break;
        case 'Paging':
            base.where = [];
            base.take = 20;
            base.skip = 0;
            base.orderby = '';
            base.asc = '';
            base.page = '';
            break;
    }
    return base;
}

function fillVersion(args: { subType?: string; taskId?: string; taskName?: string }): Record<string, unknown> {
    const method = args.subType || 'Get';
    const base: Record<string, unknown> = {
        id: args.taskId || 'versionTask',
        name: args.taskName || 'Version Task',
        type: 'Version',
        method,
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
    if (method === 'Get' || method === 'Upsert') {
        base.documentId = '';
    }
    if (method === 'Upsert') {
        base.payload = [];
    }
    return base;
}

function fillAction(args: { subType?: string; taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    const method = args.subType || 'Get';
    const base: Record<string, unknown> = {
        id: args.taskId || 'actionTask',
        name: args.taskName || 'Action Task',
        type: 'Action',
        method,
        schema: ctx.workflowContext?.currentSchemaId || '',
        documentId: '',
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
    switch (method) {
        case 'Post':
        case 'Put':
            base.payload = [];
            break;
        case 'List':
        case 'Paging':
            base.where = [];
            base.take = 20;
            base.skip = 0;
            break;
    }
    return base;
}

function fillUIComponent(args: { subType?: string; taskId?: string; taskName?: string }, ctx: ToolContext): Record<string, unknown> {
    const method = args.subType || 'Get';
    const base: Record<string, unknown> = {
        id: args.taskId || 'uiComponentTask',
        name: args.taskName || 'UIComponent Task',
        type: 'UIComponent',
        method,
        schema: ctx.workflowContext?.currentSchemaId || '',
        documentId: '',
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
    switch (method) {
        case 'Post':
        case 'Put':
        case 'Clone':
            base.payload = [];
            break;
        case 'List':
        case 'Paging':
            base.where = [];
            base.take = 20;
            base.skip = 0;
            break;
    }
    return base;
}

function fillGeometry(args: { taskId?: string; taskName?: string }): Record<string, unknown> {
    return {
        id: args.taskId || 'geometryTask',
        name: args.taskName || 'Geometry Task',
        type: 'Geometry',
        method: 'Haversine',
        latitude1: 0,
        latitude2: 0,
        longitude1: 0,
        longitude2: 0,
        success: successResponse(200),
        failed: errorResponse(400, 'Bad Request.'),
        error: errorResponse(500, 'Something went wrong!'),
    };
}

/** Registry of all task fillers */
const TASK_FILLERS: Record<string, TaskFiller> = {
    Document: fillDocument,
    Query: fillQuery,
    Resolver: fillResolver,
    Response: fillResponse,
    Condition: fillCondition,
    Switch: fillSwitch,
    Iterator: fillIterator,
    Request: fillRequest,
    HTTP: fillHTTP,
    Validator: fillValidator,
    Entity: fillEntity,
    Object: fillObject,
    Array: fillArray,
    Rule: fillRule,
    Transaction: fillTransaction,
    Cache: fillCache,
    State: fillState,
    JSON: fillJSON,
    String: fillString,
    SMTP: fillSMTP,
    Security: fillSecurity,
    Variable: fillVariable,
    Loop: fillLoop,
    Filter: fillFilter,
    // ── Complete coverage additions ──
    Date: fillDate,
    Math: fillMath,
    UUID: fillUUID,
    Workflow: fillWorkflow,
    Schema: fillSchema,
    Template: fillTemplate,
    ORM: fillORM,
    Repository: fillRepository,
    Provider: fillProvider,
    Subscription: fillSubscription,
    Identifier: fillIdentifier,
    Crypto: fillCrypto,
    RSA: fillRSA,
    Promise: fillPromise,
    Sequence: fillSequence,
    Azure: fillAzure,
    MinIO: fillMinIO,
    Trino: fillTrino,
    ESQuery: fillESQuery,
    Export: fillExport,
    History: fillHistory,
    Version: fillVersion,
    Action: fillAction,
    UIComponent: fillUIComponent,
    Geometry: fillGeometry,
};

// ─── Tool Handlers ───────────────────────────────────────────────────────────

/**
 * autoFillTask — The primary tool. Generates a complete taskSettings object
 * for the given task type, honouring the current workflow context.
 */
function handleAutoFillTask(args: Record<string, unknown>, ctx: ToolContext): unknown {
    const { taskType, subType, currentProperties, taskId, taskName } = args as {
        taskType: string;
        subType?: string;
        currentProperties?: Record<string, unknown>;
        taskId?: string;
        taskName?: string;
    };

    if (!taskType) {
        return { error: 'taskType is required', availableTypes: Object.keys(TASK_FILLERS) };
    }

    const filler = TASK_FILLERS[taskType];
    if (!filler) {
        // For unrecognized types, return a generic skeleton
        return {
            success: true,
            taskSettings: {
                id: taskId || `${taskType.toLowerCase()}Task`,
                name: taskName || `${taskType} Task`,
                type: taskType,
                success: successResponse(200),
                failed: errorResponse(400, `${taskType} failed`),
                error: errorResponse(500, `${taskType} error`),
            },
            isGeneric: true,
            message: `Generated generic skeleton for "${taskType}". No specific filler available — you may need to configure properties manually.`,
        };
    }

    const filled = filler({ subType, currentProps: currentProperties, taskId, taskName }, ctx);

    return {
        success: true,
        taskSettings: filled,
        taskType,
        subType: subType || filled.method || null,
        message: `Auto-filled ${taskType}${subType ? ` (${subType})` : ''} with ${Object.keys(filled).length} properties`,
        filledProperties: Object.keys(filled),
    };
}

/**
 * getAutoFillPreview — preview what auto-fill would generate without applying it
 */
function handleGetPreview(args: Record<string, unknown>, ctx: ToolContext): unknown {
    return handleAutoFillTask(args, ctx);
}

/**
 * getTaskFillContext — return rich context for a task type (interface + examples + generation context)
 * so the LLM or UI can make informed decisions
 */
function handleGetTaskFillContext(args: Record<string, unknown>): unknown {
    const { taskType } = args as { taskType: string };
    if (!taskType) return { error: 'taskType is required' };

    const genContext = getTaskGenerationContext(taskType);
    const doc = getTaskDocumentation(taskType);
    const interfaceDoc = TASK_INTERFACE_DOCS[taskType as keyof typeof TASK_INTERFACE_DOCS];

    return {
        taskType,
        hasFiller: !!TASK_FILLERS[taskType],
        generationContext: genContext ? {
            description: genContext.description,
            requiredProperties: genContext.requiredProperties,
            optionalProperties: genContext.optionalProperties,
            methods: genContext.methods,
            commonMistakes: genContext.commonMistakes,
            tips: genContext.tips,
        } : null,
        documentation: doc ? {
            description: doc.description,
            properties: doc.properties,
            examples: doc.examples,
        } : null,
        interface: interfaceDoc || null,
        coreTypes: {
            IKeyValue: CORE_TYPES.IKeyValue.explanation,
            Condition: CORE_TYPES.Condition.definition,
        },
    };
}

/**
 * listAutoFillableTypes — return all task types that have dedicated fillers
 */
function handleListFillableTypes(): unknown {
    return {
        fillableTypes: Object.keys(TASK_FILLERS),
        totalCount: Object.keys(TASK_FILLERS).length,
        message: `${Object.keys(TASK_FILLERS).length} task types have dedicated auto-fill support. Other types get a generic skeleton.`,
    };
}

// ─── Agent Factory ───────────────────────────────────────────────────────────

export function createTaskAutoFillAgent(): TaskAgent {
    return {
        name: 'task-autofill',
        description: 'AI-powered auto-fill for task editor forms. Generates complete taskSettings based on task type, sub-type, and workflow context.',
        tools: [
            { name: 'autoFillTask', execute: handleAutoFillTask },
            { name: 'getAutoFillPreview', execute: handleGetPreview },
            { name: 'getTaskFillContext', execute: handleGetTaskFillContext },
            { name: 'listAutoFillableTypes', execute: handleListFillableTypes },
        ],
    };
}
