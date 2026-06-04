/**
 * Central Tool Registry
 *
 * Dispatches tool calls to the correct agent handler.
 * Eliminates duplicated tool-name arrays and switch/if-else chains.
 *
 * Usage:
 * ```ts
 * const registry = new ToolRegistry();
 * registry.registerAgent(createKnowledgeAgent());
 * const result = await registry.execute('getAvailableTasks', {}, ctx);
 * ```
 */

import type { ToolContext, ToolHandler, TaskAgent } from './types';

export class ToolRegistry {
    private handlers = new Map<string, ToolHandler>();
    private agentMap = new Map<string, string>(); // toolName â†’ agentName

    // â”€â”€ Registration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /** Register a single tool handler. */
    register(handler: ToolHandler, agentName?: string): void {
        if (this.handlers.has(handler.name)) {
        }
        this.handlers.set(handler.name, handler);
        if (agentName) {
            this.agentMap.set(handler.name, agentName);
        }
    }

    /** Register every tool from a TaskAgent. */
    registerAgent(agent: TaskAgent): void {
        for (const handler of agent.tools) {
            this.register(handler, agent.name);
        }
    }

    // â”€â”€ Execution â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /** Check whether a handler is registered for `toolName`. */
    has(toolName: string): boolean {
        return this.handlers.has(toolName);
    }

    /**
     * Execute a tool by name.
     * Always returns a non-null result (error object for unknown tools).
     * Exceptions inside handlers are caught and returned as error objects.
     */
    async execute(
        toolName: string,
        args: Record<string, unknown>,
        ctx: ToolContext,
    ): Promise<unknown> {
        const handler = this.handlers.get(toolName);

        if (!handler) {
            return {
                error: `Unknown tool: ${toolName}`,
                availableTools: this.getToolNames(),
            };
        }

        try {
            return await handler.execute(args, ctx);
        } catch (error) {
            console.error(`[ToolRegistry] Error executing tool "${toolName}":`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : `Tool "${toolName}" execution failed`,
            };
        }
    }

    // â”€â”€ Introspection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /** All registered tool names. */
    getToolNames(): string[] {
        return Array.from(this.handlers.keys());
    }

    /** Which agent owns a tool. */
    getAgentForTool(toolName: string): string | undefined {
        return this.agentMap.get(toolName);
    }

    /** Total number of registered tools. */
    get size(): number {
        return this.handlers.size;
    }
}
