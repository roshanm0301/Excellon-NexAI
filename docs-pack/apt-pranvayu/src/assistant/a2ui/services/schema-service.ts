/**
 * Schema and Workflow Discovery Service
 * Provides API calls to discover schemas, actions, and workflows
 * Used by the AI assistant to understand what can be called via Request task
 */

import { getSubscription, getBaseApiUrl } from '../config';

/**
 * Get auth token from localStorage (OIDC or legacy)
 */
const getAuthToken = (): string | null => {
    const oidcToken = localStorage.getItem('OIDC_TOKEN');
    const legacyToken = localStorage.getItem('accessToken');
    return oidcToken || legacyToken;
};

/**
 * Silent token refresh - reuses in-flight refresh to avoid multiple concurrent refreshes
 */
let refreshPromise: Promise<boolean> | null = null;

const silentTokenRefresh = async (): Promise<boolean> => {
    if (refreshPromise) return refreshPromise; // Reuse in-flight refresh

    refreshPromise = (async () => {
        try {
            // Dynamically import to avoid circular dependency
            const { authService } = await import('../../../services/authService');
            const user = await authService.signinSilent();

            if (user?.access_token) {
                localStorage.setItem('OIDC_TOKEN', user.access_token);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[schema-service] Silent token refresh failed:', error);
            return false;
        } finally {
            // Allow new refresh attempts after current microtask
            setTimeout(() => { refreshPromise = null; }, 0);
        }
    })();

    return refreshPromise;
};

/**
 * Build common headers for API requests
 */
const buildHeaders = (subscription: string): Record<string, string> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'subscription': subscription,
    };
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

/**
 * Fetch with automatic 401 retry after silent token refresh
 */
const fetchWithTokenRefresh = async (
    url: string,
    options: RequestInit,
    subscription: string
): Promise<Response> => {
    let response = await fetch(url, options);

    // If 401, try silent refresh and retry once
    if (response.status === 401) {
        const refreshed = await silentTokenRefresh();

        if (refreshed) {
            // Rebuild headers with new token and retry
            const newHeaders = buildHeaders(subscription);
            response = await fetch(url, {
                ...options,
                headers: newHeaders,
            });
        }
    }

    return response;
};

interface SchemaColumn {
    name: string;
    type: string;
    primary?: boolean;
    objectId?: boolean;
    generated?: string;
    nullable?: boolean;
    default?: unknown;
}

interface SchemaDetails {
    id: string;
    SystemName: string;
    DisplayName: string;
    TableName?: string;
    Columns: SchemaColumn[];
    Provider?: string;
    SubscriptionId?: string;
}

interface Schema {
    id: string;
    name: string;
    description?: string;
    type?: string;
}

interface WorkflowAction {
    id: string;
    name: string;
    method?: string;
    description?: string;
    path?: string;
}

interface WorkflowDetails {
    id: string;
    name: string;
    description?: string;
    method?: string;
    path?: string;
    inputSchema?: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
    tasks?: Array<{
        id: string;
        type: string;
        name: string;
    }>;
}

interface TemplateItem {
    id: string;
    SystemName: string;
    DisplayName: string;
    SchemaId?: string;
    ParentSchemaId?: string;
    Tasks?: unknown[];
    ModifiedOn?: string;
    ModifiedBy?: string;
}

/**
 * List all available schemas in the subscription
 */
export const listSchemas = async (subscriptionId?: string): Promise<{ schemas: Schema[]; error?: string }> => {
    const subscription = subscriptionId || getSubscription() || '';
    const baseUrl = getBaseApiUrl();

    if (!subscription) {
        return { schemas: [], error: 'No subscription available' };
    }

    try {
        const response = await fetchWithTokenRefresh(
            `${baseUrl}/Schema/List`,
            {
                method: 'GET',
                headers: buildHeaders(subscription),
            },
            subscription
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                schemas: [],
                error: errorData.message || `Failed to fetch schemas: ${response.status}`
            };
        }

        const data = await response.json();

        // Handle different response formats
        if (Array.isArray(data)) {
            return { schemas: data };
        } else if (data.data && Array.isArray(data.data)) {
            return { schemas: data.data };
        } else if (data.schemas && Array.isArray(data.schemas)) {
            return { schemas: data.schemas };
        }

        return { schemas: [], error: 'Unexpected response format' };
    } catch (error) {
        console.error('[schema-service] Error fetching schemas:', error);
        return {
            schemas: [],
            error: error instanceof Error ? error.message : 'Failed to fetch schemas'
        };
    }
};

/**
 * Get available actions/workflows for a specific schema
 */
export const getSchemaActions = async (
    schemaId: string,
    subscriptionId?: string
): Promise<{ actions: WorkflowAction[]; error?: string }> => {
    const subscription = subscriptionId || getSubscription() || '';
    const baseUrl = getBaseApiUrl();

    if (!subscription) {
        return { actions: [], error: 'No subscription available' };
    }

    try {
        const response = await fetchWithTokenRefresh(
            `${baseUrl}/Action/${schemaId}/List`,
            {
                method: 'GET',
                headers: buildHeaders(subscription),
            },
            subscription
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                actions: [],
                error: errorData.message || `Failed to fetch actions: ${response.status}`
            };
        }

        const data = await response.json();

        // Handle different response formats
        if (Array.isArray(data)) {
            return { actions: data };
        } else if (data.data && Array.isArray(data.data)) {
            return { actions: data.data };
        } else if (data.workflows && Array.isArray(data.workflows)) {
            return { actions: data.workflows };
        } else if (data.actions && Array.isArray(data.actions)) {
            return { actions: data.actions };
        }

        return { actions: [], error: 'Unexpected response format' };
    } catch (error) {
        console.error('[schema-service] Error fetching schema actions:', error);
        return {
            actions: [],
            error: error instanceof Error ? error.message : 'Failed to fetch schema actions'
        };
    }
};

/**
 * Get detailed information about a specific workflow
 */
export const getWorkflowDetails = async (
    schemaId: string,
    workflowId: string,
    subscriptionId?: string
): Promise<{ workflow: WorkflowDetails | null; error?: string }> => {
    const subscription = subscriptionId || getSubscription() || '';
    const baseUrl = getBaseApiUrl();

    if (!subscription) {
        return { workflow: null, error: 'No subscription available' };
    }

    try {
        const response = await fetchWithTokenRefresh(
            `${baseUrl}/Action/${workflowId}/Get`,
            {
                method: 'GET',
                headers: buildHeaders(subscription),
            },
            subscription
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                workflow: null,
                error: errorData.message || `Failed to fetch workflow: ${response.status}`
            };
        }

        const data = await response.json();

        // Handle different response formats
        if (data.workflow) {
            return { workflow: data.workflow };
        } else if (data.data) {
            return { workflow: data.data };
        } else if (data.id) {
            return { workflow: data };
        }

        return { workflow: null, error: 'Unexpected response format' };
    } catch (error) {
        console.error('[schema-service] Error fetching workflow details:', error);
        return {
            workflow: null,
            error: error instanceof Error ? error.message : 'Failed to fetch workflow details'
        };
    }
};

/**
 * Fetch a specific workflow/action by ID with full definition including sequence/tasks
 * This provides the complete workflow structure that can be analyzed or modified
 */
export const fetchWorkflowAction = async (
    actionId: string,
    subscriptionId?: string
): Promise<{ action: WorkflowAction & { definition?: Record<string, unknown>; sequence?: unknown[] } | null; error?: string }> => {
    const subscription = subscriptionId || getSubscription() || '';
    const baseUrl = getBaseApiUrl();

    if (!subscription) {
        return { action: null, error: 'No subscription available' };
    }

    if (!actionId) {
        return { action: null, error: 'Action ID is required' };
    }

    try {
        const response = await fetchWithTokenRefresh(
            `${baseUrl}/Action/${actionId}/Get`,
            {
                method: 'GET',
                headers: buildHeaders(subscription),
            },
            subscription
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                action: null,
                error: errorData.message || `Failed to fetch action: ${response.status}`
            };
        }

        const data = await response.json();

        // Handle different response formats
        const actionData = data.data || data;

        return {
            action: {
                id: actionData._id || actionData.id,
                name: actionData.SystemName || actionData.name,
                method: actionData.Method || actionData.method,
                description: actionData.DisplayName || actionData.description,
                path: actionData.Path || actionData.path,
                definition: actionData.Definition || actionData.definition,
                sequence: actionData.Definition?.sequence || actionData.sequence
            }
        };
    } catch (error) {
        console.error('[schema-service] Error fetching action:', error);
        return {
            action: null,
            error: error instanceof Error ? error.message : 'Failed to fetch action'
        };
    }
};

/**
 * Format fetched action/workflow for LLM consumption
 */
export const formatActionForLLM = (action: WorkflowAction & { definition?: Record<string, unknown>; sequence?: unknown[] }): string => {
    let output = `## Action/Workflow: ${action.name}\n`;
    output += `**ID**: ${action.id}\n`;

    if (action.description) {
        output += `**Description**: ${action.description}\n`;
    }

    if (action.method) {
        output += `**Method**: ${action.method}\n`;
    }

    if (action.path) {
        output += `**Path**: ${action.path}\n`;
    }

    if (action.sequence && Array.isArray(action.sequence)) {
        output += `\n### Task Sequence (${action.sequence.length} tasks):\n`;
        action.sequence.forEach((task: unknown, i: number) => {
            const t = task as { id?: string; name?: string; type?: string; taskType?: string };
            output += `${i + 1}. **${t.name || t.id}** (${t.type || t.taskType})\n`;
        });
    }

    if (action.definition) {
        output += `\n### Full Definition:\n\`\`\`json\n${JSON.stringify(action.definition, null, 2)}\n\`\`\`\n`;
    }

    return output;
};

/**
 * Get detailed schema information including columns/fields
 * This is essential for the AI assistant to know what fields to use in IKeyValue arrays
 */
export const getSchemaDetails = async (
    schemaId: string,
    subscriptionId?: string
): Promise<{ schema: SchemaDetails | null; error?: string }> => {
    const subscription = subscriptionId || getSubscription() || '';
    const baseUrl = getBaseApiUrl();

    if (!subscription) {
        return { schema: null, error: 'No subscription available' };
    }

    if (!schemaId) {
        return { schema: null, error: 'Schema ID is required' };
    }

    try {
        const response = await fetchWithTokenRefresh(
            `${baseUrl}/Schema/${schemaId}/Get`,
            {
                method: 'GET',
                headers: buildHeaders(subscription),
            },
            subscription
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                schema: null,
                error: errorData.message || `Failed to fetch schema: ${response.status}`
            };
        }

        const data = await response.json();

        // Handle different response formats
        if (data.data) {
            return { schema: data.data };
        } else if (data._id || data.id) {
            return { schema: data };
        }

        return { schema: null, error: 'Unexpected response format' };
    } catch (error) {
        console.error('[schema-service] Error fetching schema details:', error);
        return {
            schema: null,
            error: error instanceof Error ? error.message : 'Failed to fetch schema details'
        };
    }
};

/**
 * Format schema columns for LLM consumption - shows available fields for IKeyValue mappings
 */
export const formatSchemaColumnsForLLM = (schema: SchemaDetails): string => {
    if (!schema?.Columns?.length) {
        return 'No columns/fields found for this schema.';
    }

    let output = `## Schema: ${schema.DisplayName || schema.SystemName}\n`;
    output += `**ID**: ${schema.id}\n`;
    if (schema.TableName) {
        output += `**Table**: ${schema.TableName}\n`;
    }
    output += `\n### Available Columns/Fields (use these in IKeyValue Key):\n`;

    // Group columns by type
    const primaryColumns = schema.Columns.filter(c => c.primary);
    const regularColumns = schema.Columns.filter(c => !c.primary && !c.name.startsWith('_'));
    const systemColumns = schema.Columns.filter(c => c.name.startsWith('_') || ['SchemaId', 'PartitionKey'].includes(c.name));

    if (primaryColumns.length > 0) {
        output += `\n**Primary/ID Fields:**\n`;
        primaryColumns.forEach(c => {
            output += `- \`${c.name}\` (${c.type})${c.generated ? ' [auto-generated]' : ''}\n`;
        });
    }

    if (regularColumns.length > 0) {
        output += `\n**Data Fields (use these in payload/where/select):**\n`;
        regularColumns.forEach(c => {
            output += `- \`${c.name}\` (${c.type})\n`;
        });
    }

    if (systemColumns.length > 0) {
        output += `\n**System Fields (usually auto-managed):**\n`;
        systemColumns.forEach(c => {
            output += `- \`${c.name}\` (${c.type})\n`;
        });
    }

    // Add instruction for LLM
    const dataFieldNames = regularColumns.map(c => c.name);
    if (dataFieldNames.length > 0) {
        output += `\n### âš ï¸ IMPORTANT: Use ALL relevant fields!\n`;
        output += `Available data fields: ${dataFieldNames.join(', ')}\n`;
        output += `- For POST: Include ALL fields from user input in payload[]\n`;
        output += `- For GET/Query: Include ALL fields in select[] for complete data\n`;
        output += `- Don't skip fields - use the complete list above!\n`;
    }

    return output;
};

/**
 * Get columns as a simple array for quick reference
 * Returns ALL data fields (non-system, non-primary)
 */
export const getSchemaColumnNames = (schema: SchemaDetails): string[] => {
    if (!schema?.Columns) return [];
    return schema.Columns
        .filter(c => !c.primary && !c.name.startsWith('_') && !['SchemaId', 'PartitionKey'].includes(c.name))
        .map(c => c.name);
};

/**
 * Format schema list for LLM consumption
 */
export const formatSchemasForLLM = (schemas: Schema[]): string => {
    if (schemas.length === 0) {
        return 'No schemas found in the current subscription.';
    }

    return schemas.map(s => {
        const desc = s.description ? `: ${s.description}` : '';
        return `- **${s.name}** (id: ${s.id})${desc}`;
    }).join('\n');
};

/**
 * Format actions list for LLM consumption
 */
export const formatActionsForLLM = (schemaName: string, actions: WorkflowAction[]): string => {
    if (actions.length === 0) {
        return `No actions found for schema "${schemaName}".`;
    }

    return `Actions available for **${schemaName}**:\n` +
        actions.map(a => {
            const desc = a.description ? `: ${a.description}` : '';
            return `- **${a.name}** (${a.method || 'POST'})${desc}`;
        }).join('\n');
};

/**
 * Format workflow details for LLM consumption
 */
export const formatWorkflowForLLM = (workflow: WorkflowDetails): string => {
    let output = `## Workflow: ${workflow.name}\n`;

    if (workflow.description) {
        output += `**Description**: ${workflow.description}\n`;
    }

    if (workflow.method) {
        output += `**Method**: ${workflow.method}\n`;
    }

    if (workflow.path) {
        output += `**Path**: ${workflow.path}\n`;
    }

    if (workflow.inputSchema) {
        output += `\n**Input Schema**:\n\`\`\`json\n${JSON.stringify(workflow.inputSchema, null, 2)}\n\`\`\`\n`;
    }

    if (workflow.outputSchema) {
        output += `\n**Output Schema**:\n\`\`\`json\n${JSON.stringify(workflow.outputSchema, null, 2)}\n\`\`\`\n`;
    }

    if (workflow.tasks && workflow.tasks.length > 0) {
        output += `\n**Tasks**:\n`;
        workflow.tasks.forEach((t, i) => {
            output += `${i + 1}. ${t.name} (${t.type})\n`;
        });
    }

    return output;
};

/**
 * List all templates in the subscription
 */
export const listTemplates = async (subscriptionId?: string): Promise<{ templates: TemplateItem[]; error?: string }> => {
    const subscription = subscriptionId || getSubscription() || '';
    const baseUrl = getBaseApiUrl();

    if (!subscription) {
        return { templates: [], error: 'No subscription available' };
    }

    try {
        const response = await fetchWithTokenRefresh(
            `${baseUrl}/Template/List`,
            {
                method: 'GET',
                headers: buildHeaders(subscription),
            },
            subscription
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                templates: [],
                error: errorData.message || `Failed to fetch templates: ${response.status}`
            };
        }

        const data = await response.json();

        // Handle different response formats
        if (Array.isArray(data)) {
            return { templates: data };
        } else if (data.data && Array.isArray(data.data)) {
            return { templates: data.data };
        } else if (data.templates && Array.isArray(data.templates)) {
            return { templates: data.templates };
        }

        return { templates: [], error: 'Unexpected response format' };
    } catch (error) {
        console.error('[schema-service] Error fetching templates:', error);
        return {
            templates: [],
            error: error instanceof Error ? error.message : 'Failed to fetch templates'
        };
    }
};

/**
 * Get a specific template by ID or SystemName
 */
export const getTemplateById = async (
    templateId: string,
    subscriptionId?: string
): Promise<{ template: TemplateItem | null; error?: string }> => {
    const subscription = subscriptionId || getSubscription() || '';
    const baseUrl = getBaseApiUrl();

    if (!subscription) {
        return { template: null, error: 'No subscription available' };
    }

    if (!templateId) {
        return { template: null, error: 'Template ID is required' };
    }

    try {
        const response = await fetchWithTokenRefresh(
            `${baseUrl}/Template/${templateId}/Get`,
            {
                method: 'GET',
                headers: buildHeaders(subscription),
            },
            subscription
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                template: null,
                error: errorData.message || `Failed to fetch template: ${response.status}`
            };
        }

        const data = await response.json();

        // Handle different response formats
        if (data.data) {
            return { template: data.data };
        } else if (data.template) {
            return { template: data.template };
        } else if (data.id) {
            return { template: data };
        }

        return { template: null, error: 'Unexpected response format' };
    } catch (error) {
        console.error('[schema-service] Error fetching template:', error);
        return {
            template: null,
            error: error instanceof Error ? error.message : 'Failed to fetch template'
        };
    }
};

/**
 * Format templates list for LLM consumption
 */
export const formatTemplatesForLLM = (templates: TemplateItem[]): string => {
    if (templates.length === 0) {
        return 'No templates found in the current subscription.';
    }

    return `**Available Templates (${templates.length}):**\n` +
        templates.map(t => {
            const taskCount = t.Tasks?.length || 0;
            return `- **${t.DisplayName || t.SystemName}** (id: ${t.id})${taskCount ? ` â€” ${taskCount} task(s)` : ''}`;
        }).join('\n');
};

/**
 * Format a single template detail for LLM consumption
 */
export const formatTemplateForLLM = (template: TemplateItem): string => {
    let output = `## Template: ${template.DisplayName || template.SystemName}\n`;
    output += `**SystemName**: ${template.SystemName}\n`;
    output += `**ID**: ${template.id}\n`;

    if (template.SchemaId) {
        output += `**SchemaId**: ${template.SchemaId}\n`;
    }

    if (template.Tasks && template.Tasks.length > 0) {
        output += `\n**Tasks (${template.Tasks.length}):**\n`;
        output += '```json\n' + JSON.stringify(template.Tasks, null, 2) + '\n```\n';
    } else {
        output += '\nNo tasks defined.\n';
    }

    return output;
};
