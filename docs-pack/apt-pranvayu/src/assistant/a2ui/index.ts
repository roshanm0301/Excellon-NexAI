/**
 * AI Workflow Assistant Module
 * 
 * A comprehensive AI-powered assistant for workflow development using Vercel AI SDK.
 * 
 * Features:
 * - Real-time chat with AI for workflow guidance
 * - Task creation and modification suggestions
 * - Workflow validation and best practices
 * - Knowledge base for task documentation
 * 
 * Usage:
 * ```tsx
 * import { 
 *   WorkflowAssistantProvider, 
 *   WorkflowChatPanel, 
 *   useAssistantContext 
 * } from './assistant/a2ui';
 * 
 * // Wrap your app with the provider
 * <WorkflowAssistantProvider>
 *   <YourApp />
 *   <WorkflowChatPanel />
 * </WorkflowAssistantProvider>
 * 
 * // Or use the standalone demo component
 * import { WorkflowAssistantDemo } from './assistant/a2ui';
 * <WorkflowAssistantDemo workflowContext={context} />
 * ```
 */

// Components
export { WorkflowChatPanel } from './components/WorkflowChatPanel';
export {
    WorkflowSuggestionCard,
    WorkflowSuggestionsList
} from './components/WorkflowSuggestionCard';
export { WorkflowAssistantDemo } from './components/WorkflowAssistantDemo';

// Hooks
export { useWorkflowChat } from './hooks/useWorkflowChat';
export { useWorkflowAssistant } from './hooks/useWorkflowAssistant';
export { useClientSideChat } from './hooks/useClientSideChat';

// Context
export {
    WorkflowAssistantProvider,
    useAssistantContext
} from './context/WorkflowAssistantContext';

// Services
export {
    streamChatResponse,
    generateChatResponse,
    generateQuickSuggestion,
    workflowTools
} from './services/assistant-service';

// Knowledge
export {
    TASK_DOCUMENTATION,
    WORKFLOW_BEST_PRACTICES,
    WORKFLOW_PATTERNS,
    CONDITION_OPERATORS,
    VALUE_TYPES,
    getTaskDocumentation,
    getAllTaskTypes,
    getTaskExamples
} from './knowledge/workflow-knowledge';

// Config
export {
    AI_CONFIG,
    WORKFLOW_ASSISTANT_SYSTEM_PROMPT,
    QUICK_PROMPTS,
    API_ENDPOINTS,
    WORKFLOW_TOOLS,
    getSelectedVersion
} from './config/assistant-config';

// Types
export type {
    WorkflowMessageMetadata,
    WorkflowUIMessage,
    WorkflowContext,
    WorkflowToolInput,
    WorkflowSuggestion,
    WorkflowChatPanelProps,
    DesignerCallbacks,
    BranchDefinition,
    TaskDefinition,
    TaskType,
    TaskDocumentation,
    ChatStatus,
} from './types';

// Agents (task-wise agent architecture)
export {
    createWorkflowAgentRegistry,
    ToolRegistry,
    createKnowledgeAgent,
    createDesignerAgent,
    createSchemaAgent,
    createPlanningAgent,
    createRuleMappingAgent,
    createTaskAutoFillAgent,
} from './agents';
export type {
    LLMTodoItem,
    ToolContext,
    ToolHandler,
    TaskAgent,
} from './agents';

// AI Task Fill Button (for embedding in task editors)
export {
    AiTaskFillButton,
    AiTaskFillWrapper,
    AiAutoFillProvider,
    useAiAutoFillContext,
} from './components/AiTaskFillButton';

// Hooks
export { useTaskAutoFill } from './hooks/useTaskAutoFill';

// API (for server-side use)
export {
    handleChatRequest,
    chatRouteHandler
} from './api/chat-handler';
