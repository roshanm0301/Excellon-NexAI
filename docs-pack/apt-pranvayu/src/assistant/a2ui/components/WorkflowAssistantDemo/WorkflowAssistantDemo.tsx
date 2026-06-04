/**
 * WorkflowAssistantDemo Component
 * Enhanced AI assistant with modern UI/UX
 * Features: Glassmorphism, animated gradients, keyboard shortcuts
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { WorkflowSuggestionsList } from '../WorkflowSuggestionCard';
import { useWorkflowChat, ActiveToolCall, LLMTodoItem } from '../../hooks/useWorkflowChat';
import { useWorkflowAssistant } from '../../hooks/useWorkflowAssistant';
import type { WorkflowContext, WorkflowSuggestion, QuickPrompt, DesignerCallbacks } from '../../types';
import './WorkflowAssistantDemo.scss';

interface WorkflowAssistantDemoProps {
  workflowContext?: WorkflowContext;
  currentDefinition?: unknown;
  /** 
   * Create a new task
   * @param taskType - Task type (Document, Condition, etc.)
   * @param taskId - Execution ID (camelCase, no spaces) - used for state storage: {$.taskId.data}
   * @param properties - Task configuration
   * @param taskName - Optional display name (can have spaces)
   */
  onTaskCreate?: (taskType: string, taskId: string, properties?: Record<string, unknown>, taskName?: string) => void;
  onTaskModify?: (taskId: string, properties: Record<string, unknown>) => void;
  /** LLM configuration ID from backend (optional) */
  llmConfigId?: string;
  /** Designer callbacks for AI to control the workflow designer */
  designer?: DesignerCallbacks;
}

// Sparkle/Star SVG Icon component
const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
  </svg>
);

// Gear/Cog SVG Icon for tools
const GearIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" />
  </svg>
);

// Check SVG Icon for completed tools
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
  </svg>
);

// Copy-to-clipboard button with visual feedback
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <button className="msg-action-btn" onClick={handleCopy} title={copied ? 'Copied!' : 'Copy message'}>
      {copied ? '✓ Copied' : '📋 Copy'}
    </button>
  );
};

// ─── Rich tool info: friendly name, description, and category icon ───
interface ToolInfo {
  label: string;
  desc: string;
  icon: string;          // category emoji
  category: 'read' | 'write' | 'validate' | 'plan' | 'navigate';
}

const TOOL_INFO: Record<string, ToolInfo> = {
  // ── Knowledge / Read ──
  getAvailableTasks:       { label: 'Loading task catalogue',       desc: 'Fetching the list of available task types you can use',        icon: '📚', category: 'read' },
  explainTask:             { label: 'Reading documentation',        desc: 'Looking up how this task type works',                         icon: '📖', category: 'read' },
  getTaskInterface:        { label: 'Loading task interface',        desc: 'Checking required and optional properties for the task',      icon: '🔎', category: 'read' },
  getTaskGenerationContext:{ label: 'Gathering context',             desc: 'Collecting information needed to generate the task config',    icon: '🧩', category: 'read' },
  getWorkflowPatterns:     { label: 'Exploring patterns',            desc: 'Searching for workflow patterns that match your request',     icon: '🗺️', category: 'read' },
  getBestPractices:        { label: 'Checking best practices',       desc: 'Reviewing recommended configurations and conventions',        icon: '💡', category: 'read' },
  getWorkflowSummary:      { label: 'Summarizing workflow',          desc: 'Building a summary of your current workflow structure',        icon: '📋', category: 'read' },
  getAvailableDataPaths:   { label: 'Mapping data paths',            desc: 'Finding available data references from previous tasks',       icon: '🔗', category: 'read' },
  getContextualSuggestions:{ label: 'Generating suggestions',        desc: 'Creating smart suggestions based on your workflow context',    icon: '💡', category: 'read' },
  analyzeWorkflowContext:  { label: 'Analyzing workflow',            desc: 'Understanding your workflow structure and dependencies',       icon: '🔍', category: 'read' },
  listSchemas:             { label: 'Listing schemas',               desc: 'Fetching available schemas from your subscription',            icon: '📂', category: 'read' },
  getSchemaActions:        { label: 'Loading schema actions',        desc: 'Getting actions defined for this schema',                     icon: '📂', category: 'read' },
  discoverSchema:          { label: 'Discovering schema',            desc: 'Looking up schema definition and field details',               icon: '🔎', category: 'read' },
  getCurrentSchemaDetails: { label: 'Reading schema details',        desc: 'Loading field definitions for the current schema',             icon: '📑', category: 'read' },
  getBodyQuerySchema:      { label: 'Loading body/query schema',     desc: 'Reading the request body and query parameter schema',          icon: '📑', category: 'read' },
  getCurrentWorkflow:      { label: 'Reading workflow definition',   desc: 'Loading your current workflow to understand its structure',     icon: '📄', category: 'read' },
  getWorkflowDetails:      { label: 'Loading workflow details',      desc: 'Fetching the full workflow definition from the designer',      icon: '📄', category: 'read' },
  fetchWorkflowAction:     { label: 'Fetching action definition',    desc: 'Loading the complete workflow/action definition',              icon: '📄', category: 'read' },
  listTemplates:           { label: 'Listing templates',             desc: 'Fetching available workflow templates',                        icon: '📂', category: 'read' },
  getTemplateById:         { label: 'Loading template',              desc: 'Fetching a specific template with its task sequence',           icon: '📄', category: 'read' },
  getSelectedTask:         { label: 'Inspecting selected task',      desc: 'Reading the currently selected task\'s configuration',         icon: '🔎', category: 'read' },
  listWorkflowTasks:       { label: 'Listing tasks',                 desc: 'Enumerating all tasks in the current workflow',                icon: '📋', category: 'read' },
  getActionProperties:     { label: 'Reading action properties',     desc: 'Loading the action-level global settings',                     icon: '⚙️', category: 'read' },
  getRuleColumns:          { label: 'Reading rule columns',          desc: 'Loading current rule mapping key-value columns',               icon: '📑', category: 'read' },

  // ── Write / Modify ──
  generateTaskConfiguration:{ label: 'Generating task config',       desc: 'Building the task configuration from your requirements',       icon: '🛠️', category: 'write' },
  suggestTaskConfiguration: { label: 'Suggesting configuration',     desc: 'Proposing a recommended configuration for this task',          icon: '✏️', category: 'write' },
  createTask:              { label: 'Creating task',                 desc: 'Adding a new task to the workflow',                            icon: '➕', category: 'write' },
  modifyTask:              { label: 'Modifying task',                desc: 'Updating an existing task\'s configuration',                   icon: '✏️', category: 'write' },
  addTaskToSequence:       { label: 'Adding task to workflow',       desc: 'Inserting a new task into the workflow sequence',              icon: '➕', category: 'write' },
  addTaskWithActionFormat: { label: 'Adding task (action format)',    desc: 'Adding a task using the Action Definition format',             icon: '➕', category: 'write' },
  addTaskToBranch:         { label: 'Adding task to branch',         desc: 'Inserting a task inside a conditional branch',                 icon: '🌿', category: 'write' },
  updateTaskProperty:      { label: 'Updating task property',        desc: 'Changing a specific property on an existing task',             icon: '✏️', category: 'write' },
  updateBodyQuerySchema:   { label: 'Updating body/query schema',    desc: 'Modifying the request body or query parameter schema',         icon: '✏️', category: 'write' },
  moveTask:                { label: 'Moving task',                   desc: 'Reordering a task to a new position in the workflow',          icon: '↕️', category: 'write' },
  duplicateTask:           { label: 'Duplicating task',              desc: 'Creating a copy of an existing task',                          icon: '📋', category: 'write' },
  deleteTask:              { label: 'Removing task',                 desc: 'Deleting a task from the workflow',                            icon: '🗑️', category: 'write' },
  setActionProperties:     { label: 'Setting action properties',     desc: 'Configuring action-level global settings',                     icon: '⚙️', category: 'write' },
  setRuleColumns:          { label: 'Setting rule columns',          desc: 'Configuring rule mapping key-value columns for this action',   icon: '📝', category: 'write' },

  // ── Navigate / Select ──
  selectTask:              { label: 'Selecting task',                desc: 'Highlighting a task in the designer for inspection',           icon: '👆', category: 'navigate' },
  clearSelection:          { label: 'Clearing selection',            desc: 'Deselecting the currently selected task',                      icon: '↩️', category: 'navigate' },
  setReadonly:             { label: 'Setting read-only mode',        desc: 'Toggling the designer between editable and read-only',         icon: '🔒', category: 'navigate' },

  // ── Validate ──
  validateWorkflow:        { label: 'Validating workflow',           desc: 'Checking the workflow for errors and missing configuration',   icon: '✅', category: 'validate' },
  validateTaskBeforeAdd:   { label: 'Pre-validating task',           desc: 'Verifying the task config before adding it to the workflow',   icon: '🛡️', category: 'validate' },

  // ── Plan / Progress ──
  presentExecutionPlan:    { label: 'Validating execution plan',     desc: 'Checking the build plan for correctness before proceeding',    icon: '📐', category: 'plan' },
  manageTodoList:          { label: 'Updating progress',             desc: 'Tracking the current step in the build process',               icon: '☑️', category: 'plan' },
};

const getToolInfo = (name: string): ToolInfo => {
  return TOOL_INFO[name] || {
    label: name.replace(/([A-Z])/g, ' $1').trim(),
    desc: `Executing ${name}`,
    icon: '⚙️',
    category: 'read' as const,
  };
};

// Convenience wrapper used by TodoListPanel
const getToolDisplayName = (toolName: string): string => getToolInfo(toolName).label;

// ─── Elapsed-time display hook ───
const useElapsed = (startTime: number, active: boolean): string => {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick(t => t + 1), 500);
    return () => clearInterval(id);
  }, [active]);
  const ms = Date.now() - startTime;
  return ms < 1000 ? '<1s' : `${Math.round(ms / 1000)}s`;
};

// ─── Extract human-readable detail tags from tool args ───
interface DetailTag { label: string; value: string }

const getToolDetails = (toolName: string, args?: Record<string, unknown>): DetailTag[] => {
  if (!args) return [];
  const tags: DetailTag[] = [];
  const str = (v: unknown): string => typeof v === 'string' ? v : typeof v === 'object' && v !== null ? JSON.stringify(v).slice(0, 60) : String(v ?? '');

  switch (toolName) {
    // ── Adding tasks ──
    case 'addTaskToSequence':
    case 'createTask': {
      if (args.taskType) tags.push({ label: 'Type', value: str(args.taskType) });
      if (args.taskName) tags.push({ label: 'Name', value: str(args.taskName) });
      else if (args.taskId) tags.push({ label: 'ID', value: str(args.taskId) });
      if (args.afterTaskId) tags.push({ label: 'After', value: str(args.afterTaskId) });
      if (args.properties) {
        const keys = Object.keys(args.properties as object);
        if (keys.length > 0) tags.push({ label: 'Props', value: keys.length <= 3 ? keys.join(', ') : `${keys.length} properties` });
      }
      if (args.branches) {
        const bKeys = Object.keys(args.branches as object);
        tags.push({ label: 'Branches', value: bKeys.join(', ') });
      }
      break;
    }
    case 'addTaskWithActionFormat': {
      const task = args.task as Record<string, unknown> | undefined;
      if (task) {
        if (task.type) tags.push({ label: 'Type', value: str(task.type) });
        if (task.name) tags.push({ label: 'Name', value: str(task.name) });
        else if (task.id) tags.push({ label: 'ID', value: str(task.id) });
      }
      if (args.afterTaskId) tags.push({ label: 'After', value: str(args.afterTaskId) });
      break;
    }
    case 'addTaskToBranch': {
      if (args.taskType) tags.push({ label: 'Type', value: str(args.taskType) });
      if (args.taskName) tags.push({ label: 'Name', value: str(args.taskName) });
      else if (args.taskId) tags.push({ label: 'ID', value: str(args.taskId) });
      if (args.parentTaskId) tags.push({ label: 'Parent', value: str(args.parentTaskId) });
      if (args.branchName) tags.push({ label: 'Branch', value: str(args.branchName) });
      break;
    }

    // ── Updating ──
    case 'updateTaskProperty': {
      if (args.taskId) tags.push({ label: 'Task', value: str(args.taskId) });
      if (args.propertyPath) tags.push({ label: 'Property', value: str(args.propertyPath) });
      if (args.value !== undefined) {
        const v = str(args.value);
        tags.push({ label: 'Value', value: v.length > 40 ? v.slice(0, 37) + '…' : v });
      }
      break;
    }
    case 'modifyTask': {
      if (args.taskId) tags.push({ label: 'Task', value: str(args.taskId) });
      if (args.properties) {
        const keys = Object.keys(args.properties as object);
        tags.push({ label: 'Updating', value: keys.length <= 3 ? keys.join(', ') : `${keys.length} properties` });
      }
      break;
    }
    case 'updateBodyQuerySchema': {
      if (args.schemaType) tags.push({ label: 'Schema', value: str(args.schemaType) });
      if (Array.isArray(args.fields)) tags.push({ label: 'Fields', value: `${args.fields.length} field(s)` });
      if (args.replace) tags.push({ label: 'Mode', value: 'Replace' });
      break;
    }
    case 'setActionProperties': {
      const keys = Object.keys(args).filter(k => args[k] !== undefined);
      if (keys.length > 0) tags.push({ label: 'Setting', value: keys.length <= 3 ? keys.join(', ') : `${keys.length} properties` });
      break;
    }
    case 'setRuleColumns': {
      if (Array.isArray(args.columns)) tags.push({ label: 'Columns', value: `${args.columns.length} column(s)` });
      break;
    }
    case 'getRuleColumns': {
      tags.push({ label: 'Action', value: 'Reading rule mapping columns' });
      break;
    }

    // ── Move / Duplicate / Delete ──
    case 'moveTask': {
      if (args.taskId) tags.push({ label: 'Task', value: str(args.taskId) });
      if (args.afterTaskId) tags.push({ label: 'After', value: str(args.afterTaskId) });
      break;
    }
    case 'duplicateTask': {
      if (args.taskId) tags.push({ label: 'Source', value: str(args.taskId) });
      if (args.newTaskName) tags.push({ label: 'New name', value: str(args.newTaskName) });
      break;
    }
    case 'deleteTask': {
      if (args.taskId) tags.push({ label: 'Task', value: str(args.taskId) });
      break;
    }

    // ── Navigate ──
    case 'selectTask': {
      if (args.taskId) tags.push({ label: 'Task', value: str(args.taskId) });
      break;
    }

    // ── Read / Knowledge ──
    case 'explainTask':
    case 'getTaskInterface':
    case 'getTaskGenerationContext': {
      if (args.taskType) tags.push({ label: 'Type', value: str(args.taskType) });
      break;
    }
    case 'validateWorkflow':
    case 'validateTaskBeforeAdd': {
      if (args.taskType) tags.push({ label: 'Type', value: str(args.taskType) });
      if (args.taskId) tags.push({ label: 'Task', value: str(args.taskId) });
      break;
    }
    case 'getBodyQuerySchema': {
      if (args.schemaType) tags.push({ label: 'Schema', value: str(args.schemaType) });
      break;
    }
    case 'discoverSchema':
    case 'listSchemas': {
      if (args.schemaName) tags.push({ label: 'Schema', value: str(args.schemaName) });
      break;
    }
    case 'getTemplateById': {
      if (args.templateId) tags.push({ label: 'Template', value: str(args.templateId) });
      break;
    }
    case 'fetchWorkflowAction': {
      if (args.actionId) tags.push({ label: 'Action', value: str(args.actionId) });
      break;
    }
    default:
      break;
  }

  return tags;
};

// ─── Single tool call row ───
const ToolCallRow: React.FC<{ tool: ActiveToolCall }> = ({ tool }) => {
  const info = getToolInfo(tool.name);
  const elapsed = useElapsed(tool.startTime, tool.status === 'running');
  const details = getToolDetails(tool.name, tool.args);

  return (
    <div className={`tool-call-indicator tool-call-indicator--${tool.status}`}>
      {/* Category icon */}
      <div className="tool-call-icon">
        {tool.status === 'running' ? (
          <GearIcon className="gear-icon spinning" />
        ) : tool.status === 'success' ? (
          <CheckIcon className="check-icon" />
        ) : (
          <span className="error-icon">!</span>
        )}
      </div>

      {/* Main content */}
      <div className="tool-call-content">
        <div className="tool-call-name">
          <span className="tool-call-emoji">{info.icon}</span>
          {info.label}
        </div>
        <div className="tool-call-desc">{info.desc}</div>

        {/* Detail tags — task type, name, properties etc. */}
        {details.length > 0 && (
          <div className="tool-call-details">
            {details.map((d, i) => (
              <span key={i} className="tool-call-tag">
                <span className="tool-call-tag-label">{d.label}:</span>
                <span className="tool-call-tag-value">{d.value}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right side: status + elapsed time */}
      <div className="tool-call-meta">
        <span className={`tool-call-status tool-call-status--${tool.status}`}>
          {tool.status === 'running' ? elapsed :
            tool.status === 'success' ? '✓ Done' : '✗ Failed'}
        </span>
      </div>

      {/* Running progress bar */}
      {tool.status === 'running' && (
        <div className="tool-call-progress">
          <div className="tool-call-progress-bar" />
        </div>
      )}
    </div>
  );
};

// ─── Tool Call Indicator (container) ───
const ToolCallIndicator: React.FC<{ toolCalls: ActiveToolCall[] }> = ({ toolCalls }) => {
  if (toolCalls.length === 0) return null;

  // Separate running/pending from completed
  const active = toolCalls.filter(tc => tc.status === 'running' || tc.status === 'pending');
  const finished = toolCalls.filter(tc => tc.status === 'success' || tc.status === 'error');

  return (
    <div className="tool-calls-container">
      {/* Active tools first */}
      {active.map(tool => <ToolCallRow key={tool.id} tool={tool} />)}

      {/* Completed tools — collapsed summary when more than 2 */}
      {finished.length > 0 && finished.length <= 2 && (
        finished.map(tool => <ToolCallRow key={tool.id} tool={tool} />)
      )}
      {finished.length > 2 && (
        <div className="tool-call-summary">
          <CheckIcon className="check-icon" />
          <span>{finished.length} steps completed</span>
        </div>
      )}
    </div>
  );
};

// Slim Full-Width Thinking Indicator
const ThinkingIndicator: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [thinkingPhase, setThinkingPhase] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const thinkingPhrases = ['Thinking', 'Analyzing', 'Processing'];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 3));
    }, 60);

    const phraseInterval = setInterval(() => {
      setThinkingPhase(prev => (prev + 1) % thinkingPhrases.length);
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(phraseInterval);
    };
  }, []);

  // Update progress bar width via ref to avoid inline style
  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${progress}%`;
    }
  }, [progress]);

  return (
    <div className="thinking-indicator">
      <div className="thinking-avatar">
        <SparkleIcon className="thinking-icon" />
      </div>
      <div className="thinking-bubble">
        <div className="thinking-content">
          <span className="thinking-text">{thinkingPhrases[thinkingPhase]}</span>
          <div className="thinking-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
      <div className="thinking-progress">
        <div className="thinking-progress-bar" ref={progressBarRef} />
      </div>
    </div>
  );
};

// Status icons for todo items
const TODO_STATUS_CONFIG: Record<LLMTodoItem['status'], { icon: string; className: string }> = {
  'not-started': { icon: '○', className: 'pending' },
  'in-progress': { icon: '◉', className: 'active' },
  'completed':   { icon: '✓', className: 'done' },
  'skipped':     { icon: '⊘', className: 'skipped' },
};

// Persistent Todo List Panel
const TodoListPanel: React.FC<{
  todoList: LLMTodoItem[];
  activeToolCalls: ActiveToolCall[];
  isWorking: boolean;
}> = ({ todoList, activeToolCalls, isWorking }) => {
  const [collapsed, setCollapsed] = useState(false);
  const activeRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const completedCount = todoList.filter(t => t.status === 'completed').length;
  const totalCount = todoList.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = completedCount === totalCount;
  const activeItem = todoList.find(t => t.status === 'in-progress');

  // Auto-scroll to the in-progress item
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [todoList]);

  // Update progress bar width via ref to avoid inline style
  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${progressPct}%`;
    }
  }, [progressPct]);

  if (todoList.length === 0) return null;

  // Current running tool
  const runningTool = activeToolCalls.find(tc => tc.status === 'running' || tc.status === 'pending');

  return (
    <div className={`todo-panel ${allDone ? 'todo-panel--done' : ''} ${isWorking ? 'todo-panel--working' : ''}`}>
      <button
        className="todo-panel__header"
        onClick={() => setCollapsed(prev => !prev)}
        type="button"
      >
        <div className="todo-panel__header-left">
          <span className="todo-panel__status-icon">
            {allDone ? '✅' : isWorking ? '⚡' : '📋'}
          </span>
          <span className="todo-panel__title">
            {allDone ? 'All steps completed' : activeItem ? activeItem.title : 'AI Plan'}
          </span>
          {isWorking && runningTool && (
            <span className="todo-panel__tool-badge">
              <span className="todo-panel__tool-spinner" />
              {getToolDisplayName(runningTool.name)}
            </span>
          )}
        </div>
        <div className="todo-panel__header-right">
          <span className={`todo-panel__counter ${allDone ? 'todo-panel__counter--done' : ''}`}>
            {completedCount}/{totalCount}
          </span>
          <span className={`todo-panel__chevron ${collapsed ? '' : 'todo-panel__chevron--open'}`}>
            ▸
          </span>
        </div>
      </button>

      <div className="todo-panel__progress">
        <div
          className={`todo-panel__progress-bar ${allDone ? 'todo-panel__progress-bar--done' : ''}`}
          ref={progressBarRef}
        />
      </div>

      {!collapsed && (
        <div className="todo-panel__body">
          {todoList.map(item => {
            const cfg = TODO_STATUS_CONFIG[item.status];
            return (
              <div
                key={item.id}
                ref={item.status === 'in-progress' ? activeRef : undefined}
                className={`todo-panel__item todo-panel__item--${cfg.className}`}
              >
                <span className="todo-panel__item-icon">{cfg.icon}</span>
                <span className="todo-panel__item-text">{item.title}</span>
                {item.status === 'in-progress' && isWorking && (
                  <span className="todo-panel__item-dot" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const WorkflowAssistantDemo: React.FC<WorkflowAssistantDemoProps> = ({
  workflowContext,
  currentDefinition,
  onTaskCreate,
  onTaskModify,
  llmConfigId,
  designer,
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [togglePortalContainer, setTogglePortalContainer] = useState<HTMLElement | null>(null);

  // Find the designer's sqd-smart-editor-toggle and create a sibling container for the Copilot button.
  // Keeps observing so that when the workflow re-renders (destroying & recreating DOM), the button reattaches.
  useEffect(() => {
    let currentContainer: HTMLElement | null = null;

    const tryAttach = () => {
      // If our container is still in the DOM, nothing to do
      if (currentContainer && currentContainer.isConnected) return;

      const editorToggle = document.querySelector('.sqd-smart-editor-toggle') as HTMLElement | null;
      if (editorToggle?.parentElement) {
        let container = editorToggle.parentElement.querySelector('.copilot-toggle-portal') as HTMLElement | null;
        if (!container) {
          container = document.createElement('div');
          container.className = 'copilot-toggle-portal';
          editorToggle.insertAdjacentElement('afterend', container);
        }
        currentContainer = container;
        setTogglePortalContainer(container);
      } else {
        // Designer not in DOM — clear the portal so the fixed fallback renders
        if (currentContainer) {
          currentContainer = null;
          setTogglePortalContainer(null);
        }
      }
    };

    tryAttach();

    // Keep observing: re-attach after designer re-renders
    const mo = new MutationObserver(() => tryAttach());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      const c = document.querySelector('.copilot-toggle-portal');
      if (c) c.remove();
    };
  }, []);

  // Position toggles to the left of open panels (editor and/or chat).
  // right = editorWidth + (chatPanelWidth if open) + gap
  // ResizeObserver tracks live editor drag-resizing.
  useEffect(() => {
    const PANEL_WIDTH_PX = 520;
    const GAP = 12; // var(--space-3) fallback
    let ro: ResizeObserver | null = null;
    let observedEditor: HTMLElement | null = null;

    const applyOffsets = () => {
      const editor = document.querySelector('.sqd-smart-editor') as HTMLElement | null;

      // Push the editor panel right to make room for the chat panel
      if (editor) {
        const desired = isPanelOpen ? `${PANEL_WIDTH_PX}px` : '';
        if (editor.style.marginRight !== desired) {
          editor.style.marginRight = desired;
        }
      }

      const editorToggle = document.querySelector('.sqd-smart-editor-toggle') as HTMLElement | null;
      const copilotPortal = document.querySelector('.copilot-toggle-portal') as HTMLElement | null;

      // Calculate combined width of panels to the right of the toggles
      const editorVisible = editor && !editor.classList.contains('sqd-hidden');
      const editorWidth = editorVisible ? editor!.offsetWidth : 0;
      const chatWidth = isPanelOpen ? PANEL_WIDTH_PX : 0;
      const totalRight = editorWidth + chatWidth;

      if (totalRight > 0) {
        const rightPx = `${totalRight + GAP}px`;
        if (editorToggle) editorToggle.style.right = rightPx;
        if (copilotPortal) copilotPortal.style.right = rightPx;
      } else {
        // Nothing open — fall back to CSS default
        if (editorToggle) editorToggle.style.right = '';
        if (copilotPortal) copilotPortal.style.right = '';
      }

      // Observe editor resize (user can drag to widen it)
      if (editorVisible && editor !== observedEditor) {
        if (ro) ro.disconnect();
        ro = new ResizeObserver(() => applyOffsets());
        ro.observe(editor!);
        observedEditor = editor;
      } else if (!editorVisible && ro) {
        ro.disconnect();
        ro = null;
        observedEditor = null;
      }
    };

    applyOffsets();

    const mo = new MutationObserver(() => applyOffsets());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      if (ro) ro.disconnect();
      const editor = document.querySelector('.sqd-smart-editor') as HTMLElement | null;
      if (editor) editor.style.marginRight = '';
      const editorToggle = document.querySelector('.sqd-smart-editor-toggle') as HTMLElement | null;
      const copilotPortal = document.querySelector('.copilot-toggle-portal') as HTMLElement | null;
      if (editorToggle) editorToggle.style.right = '';
      if (copilotPortal) copilotPortal.style.right = '';
    };
  }, [isPanelOpen]);

  // Use backend API for chat with tools support
  const {
    messages,
    input,
    setInput,
    sendMessage,
    status,
    error,
    stop,
    clearMessages,
    quickPrompts,
    applyQuickPrompt,
    isStreaming,
    activeToolCalls,
    todoList,
  } = useWorkflowChat({
    workflowContext,
    currentDefinition,
    llmConfigId,
    onTaskCreate,
    onTaskModify,
    designer,
    onError: (err: Error) => console.error('Chat error:', err),
  });

  const {
    suggestions,
    clearSuggestions,
    validateCurrentWorkflow,
  } = useWorkflowAssistant({
    workflowContext,
    currentDefinition,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to toggle panel
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsPanelOpen(prev => !prev);
      }
      // Escape to close panel
      if (e.key === 'Escape' && isPanelOpen) {
        setIsPanelOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPanelOpen]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isPanelOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isPanelOpen]);

  const handleSuggestionApply = useCallback((suggestion: WorkflowSuggestion) => {
    if (suggestion.code && onTaskCreate) {
      try {
        const parsed = JSON.parse(suggestion.code);
        // Use id as execution ID, name as display name
        const executionId = parsed.id || parsed.type;
        onTaskCreate(parsed.type, executionId, parsed.properties, parsed.name);
      } catch {
        console.error('Failed to parse suggestion code');
      }
    }
  }, [onTaskCreate]);

  const togglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev);
  }, []);

  // ── Slash Commands ──
  const SLASH_COMMANDS = useMemo(() => [
    { cmd: '/create',   icon: '➕', label: '/create',   desc: 'Create a new workflow task',       prompt: 'Create a new task: ' },
    { cmd: '/explain',  icon: '📖', label: '/explain',  desc: 'Explain a task or concept',        prompt: 'Explain how this works: ' },
    { cmd: '/validate', icon: '✅', label: '/validate', desc: 'Validate the current workflow',     prompt: 'Validate the current workflow and check for errors' },
    { cmd: '/optimize', icon: '⚡', label: '/optimize', desc: 'Suggest workflow improvements',     prompt: 'Analyze and suggest optimizations for this workflow' },
    { cmd: '/fix',      icon: '🔧', label: '/fix',      desc: 'Fix issues in a task',             prompt: 'Fix the issues in: ' },
    { cmd: '/rule',     icon: '📝', label: '/rule',     desc: 'Configure rule mapping columns',    prompt: 'Set up rule mapping columns for this action' },
  ], []);

  const filteredSlashCommands = useMemo(() => {
    if (!slashFilter) return SLASH_COMMANDS;
    return SLASH_COMMANDS.filter(c => c.cmd.startsWith(slashFilter.toLowerCase()));
  }, [slashFilter, SLASH_COMMANDS]);

  const handleSlashSelect = useCallback((prompt: string) => {
    setInput(prompt);
    setShowSlashMenu(false);
    setSlashFilter('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [setInput]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      sendMessage(input);
      setShowSlashMenu(false);
      setSlashFilter('');
    }
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && showSlashMenu) {
      e.preventDefault();
      setShowSlashMenu(false);
      setSlashFilter('');
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        sendMessage(input);
        setShowSlashMenu(false);
        setSlashFilter('');
      }
    }
  }, [input, isStreaming, sendMessage, showSlashMenu]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    // Detect slash commands
    if (val.startsWith('/') && val.length <= 10 && !val.includes(' ')) {
      setShowSlashMenu(true);
      setSlashFilter(val);
    } else {
      setShowSlashMenu(false);
      setSlashFilter('');
    }

    // Auto-resize textarea
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [setInput]);

  // Copilot toggle button element — icon-only
  const copilotToggleBtn = (
    <button
      className={`assistant-toggle-btn ${isPanelOpen ? 'assistant-toggle-btn--active' : ''} ${!togglePortalContainer ? 'assistant-toggle-btn--fixed' : ''}`}
      onClick={togglePanel}
      aria-label={isPanelOpen ? 'Close Workflow Copilot' : 'Open Workflow Copilot'}
      title="Toggle Copilot (⌘K)"
    >
      <SparkleIcon className="toggle-icon" />
    </button>
  );

  return (
    <div className="workflow-assistant-demo">
      {/* Copilot toggle — portalled next to editor toggle, or fallback to inline */}
      {togglePortalContainer
        ? createPortal(copilotToggleBtn, togglePortalContainer)
        : copilotToggleBtn
      }

      {/* Chat Panel */}
      {isPanelOpen && (
          <div className="assistant-panel" role="dialog" aria-label="Workflow Copilot" ref={panelRef}>
          {/* Header */}
          <div className="assistant-panel__header">
            <div className="panel-title">
              <span className="status-dot" role="status" aria-label="Online" />
              <SparkleIcon className="panel-icon" />
              <span>Workflow Copilot</span>
            </div>
            <div className="panel-actions">
              <button
                onClick={clearMessages}
                title="Clear Chat"
                aria-label="Clear Chat"
              >
                🗑️
              </button>
              <button
                onClick={() => setIsPanelOpen(false)}
                title="Close (Esc)"
                aria-label="Close Panel"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="assistant-suggestions">
              <WorkflowSuggestionsList
                suggestions={suggestions}
                onApply={handleSuggestionApply}
                onDismiss={(_id: string) => clearSuggestions()}
                onDismissAll={clearSuggestions}
              />
            </div>
          )}

          {/* Persistent Todo List */}
          <TodoListPanel
            todoList={todoList}
            activeToolCalls={activeToolCalls}
            isWorking={status === 'submitted' || isStreaming}
          />

          {/* Messages */}
          <div className="assistant-messages">
            {messages.length === 0 && (
              <div className="welcome-message">
                <div className="welcome-icon">
                  <SparkleIcon className="welcome-sparkle" />
                </div>
                <h4>Workflow Copilot</h4>
                <p>Build, debug, and optimize workflows with AI. Ask me to create tasks, explain configurations, or validate your setup.</p>
                <div className="quick-actions">
                  {quickPrompts.slice(0, 4).map((prompt: QuickPrompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => applyQuickPrompt(prompt.id)}
                      className="quick-action-btn"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index: number) => {
              const content = message.parts
                .filter((part: any) => part.type === 'text')
                .map((part: any) => part.text)
                .join('');

              return (
                <div
                  key={message.id || index}
                  className={`message message--${message.role}`}
                >
                  <div className="message-avatar">
                    {message.role === 'user' ? (
                      <span className="avatar-emoji">👤</span>
                    ) : (
                      <SparkleIcon className="avatar-icon" />
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-role">
                      {message.role === 'user' ? 'You' : 'Workflow Copilot'}
                      {message.role === 'assistant' && <span className="ai-badge">AI</span>}
                    </div>
                    <div className="message-text">{content}</div>
                    {message.role === 'assistant' && content && (
                      <div className="message-actions">
                        <CopyButton text={content} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Enhanced thinking indicator - shows when waiting for LLM response */}
            {(() => {
              // Check if last assistant message has any text content yet
              const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
              const hasTextContent = lastAssistantMsg?.parts?.some((p: any) => p.type === 'text' && p.text?.trim());
              // Show thinking when streaming/submitted but no text visible yet
              const shouldShowThinking = isStreaming && !hasTextContent;
              return shouldShowThinking ? <ThinkingIndicator /> : null;
            })()}

            {/* Tool call indicators */}
            <ToolCallIndicator toolCalls={activeToolCalls} />

            {/* Streaming indicator - shows only when text is actively streaming */}
            {(() => {
              const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
              const hasTextContent = lastAssistantMsg?.parts?.some((p: any) => p.type === 'text' && p.text?.trim());
              return isStreaming && hasTextContent ? (
                <div className="streaming-indicator">
                  <span className="streaming-cursor" />
                </div>
              ) : null;
            })()}

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{error.message}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input */}
          <form className="assistant-input" onSubmit={handleSubmit}>
            {/* Slash command menu */}
            {showSlashMenu && filteredSlashCommands.length > 0 && (
              <div className="wa-slash-menu">
                {filteredSlashCommands.map(cmd => (
                  <button
                    key={cmd.cmd}
                    type="button"
                    className="wa-slash-menu__item"
                    onClick={() => handleSlashSelect(cmd.prompt)}
                  >
                    <span className="wa-slash-menu__icon">{cmd.icon}</span>
                    <span>
                      <span className="wa-slash-menu__label">{cmd.label}</span>
                      <br />
                      <span className="wa-slash-menu__desc">{cmd.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about workflows... (type / for commands)"
              disabled={isStreaming}
              rows={1}
              aria-label="Chat message input"
            />
            <div className="input-actions">
              {isStreaming ? (
                <button type="button" onClick={stop} className="stop-btn" aria-label="Stop generating">
                  <span className="stop-icon">⬛</span>
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="send-btn"
                  aria-label="Send message"
                >
                  <span>Send</span>
                  <span className="send-arrow">→</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default WorkflowAssistantDemo;
