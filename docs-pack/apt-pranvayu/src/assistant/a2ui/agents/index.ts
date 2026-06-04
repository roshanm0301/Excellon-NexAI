/**
 * Task-wise Agent Architecture â€” Barrel Exports
 *
 * Usage:
 * ```ts
 * import { createWorkflowAgentRegistry } from '../agents';
 * const registry = createWorkflowAgentRegistry();
 * const result = await registry.execute('getAvailableTasks', {}, ctx);
 * ```
 */

import { ToolRegistry } from './tool-registry';
import { createKnowledgeAgent } from './knowledge-agent';
import { createDesignerAgent } from './designer-agent';
import { createSchemaAgent } from './schema-agent';
import { createPlanningAgent } from './planning-agent';
import { createRuleMappingAgent } from './rule-mapping-agent';
import { createTaskAutoFillAgent } from './task-autofill-agent';

// Types
export type { LLMTodoItem, ToolContext, ToolHandler, TaskAgent } from './types';

// Registry
export { ToolRegistry } from './tool-registry';

// Agents
export { createKnowledgeAgent } from './knowledge-agent';
export { createDesignerAgent } from './designer-agent';
export { createSchemaAgent } from './schema-agent';
export { createPlanningAgent } from './planning-agent';
export { createRuleMappingAgent } from './rule-mapping-agent';
export { createTaskAutoFillAgent } from './task-autofill-agent';

// â”€â”€â”€ Factory â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Create a fully-wired ToolRegistry with all workflow agents registered.
 * Call once (e.g., inside useMemo) and reuse across the hook lifetime.
 */
export function createWorkflowAgentRegistry(): ToolRegistry {
    const registry = new ToolRegistry();
    registry.registerAgent(createKnowledgeAgent());
    registry.registerAgent(createPlanningAgent());
    registry.registerAgent(createDesignerAgent());
    registry.registerAgent(createSchemaAgent());
    registry.registerAgent(createRuleMappingAgent());
    registry.registerAgent(createTaskAutoFillAgent());
    return registry;
}
