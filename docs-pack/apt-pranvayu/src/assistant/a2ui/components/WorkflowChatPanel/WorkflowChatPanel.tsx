/**
 * WorkflowChatPanel Component
 * Main chat interface for the AI workflow assistant
 * Enhanced with Copilot-like animations
 */

import React, { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import { useWorkflowChat, useWorkflowAssistant } from '../../hooks';
import type { LLMTodoItem, ActiveToolCall } from '../../hooks';
import type { WorkflowChatPanelProps, WorkflowSuggestion } from '../../types';
import { QUICK_PROMPTS } from '../../config';
import './WorkflowChatPanel.scss';

// Processing status messages that cycle through
const PROCESSING_MESSAGES = [
  { icon: 'ðŸ”', text: 'Analyzing your request...' },
  { icon: 'ðŸ§ ', text: 'Understanding context...' },
  { icon: 'âš™ï¸', text: 'Processing workflow data...' },
  { icon: 'ðŸ’¡', text: 'Generating response...' },
  { icon: 'âœ¨', text: 'Preparing suggestions...' },
];

// Enhanced Processing Indicator with rotating messages
const ProcessingIndicator: React.FC<{ isStreaming?: boolean }> = ({ isStreaming }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Cycle through messages
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % PROCESSING_MESSAGES.length);
    }, 2000);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 100);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const currentMessage = PROCESSING_MESSAGES[messageIndex];

  return (
    <div className="processing-indicator">
      <div className="processing-indicator__avatar">
        <span className="avatar-icon processing-avatar">{currentMessage.icon}</span>
      </div>
      <div className="processing-indicator__content">
        <div className="processing-indicator__header">
          <div className="processing-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <span className="processing-badge">Working</span>
        </div>
        <div className="processing-indicator__message">
          {currentMessage.text}
        </div>
        <div className="processing-indicator__progress">
          <div 
            className="processing-indicator__progress-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="processing-indicator__steps">
          {PROCESSING_MESSAGES.map((msg, idx) => {
            let stepIcon = 'â—‹';
            if (idx < messageIndex) stepIcon = 'âœ“';
            else if (idx === messageIndex) stepIcon = msg.icon;
            
            return (
              <span 
                key={`step-${msg.text}`} 
                className={`processing-step ${idx === messageIndex ? 'processing-step--active' : ''} ${idx < messageIndex ? 'processing-step--done' : ''}`}
              >
                {stepIcon}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Simple typing indicator for streaming
const TypingIndicator: React.FC = () => (
  <div className="typing-indicator">
    <div className="typing-indicator__avatar">
      <span className="avatar-icon">âœ¨</span>
    </div>
    <div className="typing-indicator__content">
      <div className="typing-dots">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
      <span className="typing-text">AI is responding...</span>
    </div>
  </div>
);

// Friendly tool name map
const TOOL_DISPLAY_NAMES: Record<string, string> = {
  getTaskTypes: 'Fetching task types',
  getTaskDocumentation: 'Reading documentation',
  getSchemaFields: 'Loading schema fields',
  addTask: 'Adding task',
  removeTask: 'Removing task',
  modifyTask: 'Modifying task',
  addBranch: 'Creating branch',
  removeBranch: 'Removing branch',
  getDefinition: 'Reading workflow',
  setDefinition: 'Updating workflow',
  setActionProperties: 'Setting action properties',
  getActionProperties: 'Reading action properties',
  presentExecutionPlan: 'Validating plan',
  manageTodoList: 'Updating progress',
  getBodyQuerySchema: 'Loading body/query schema',
  updateBodyQuerySchema: 'Updating body/query schema',
  validateWorkflow: 'Validating workflow',
};

const getToolDisplayName = (toolName: string): string =>
  TOOL_DISPLAY_NAMES[toolName] || toolName.replace(/([A-Z])/g, ' $1').trim();

// Status icons for todo items
const TODO_STATUS_CONFIG: Record<LLMTodoItem['status'], { icon: string; label: string }> = {
  'not-started': { icon: 'â—‹', label: 'Pending' },
  'in-progress': { icon: 'â—‰', label: 'Working' },
  'completed':   { icon: 'âœ“', label: 'Done' },
  'skipped':     { icon: 'âŠ˜', label: 'Skipped' },
};

// Active Tool Call Indicator (inline pill showing current tool)
const ActiveToolBadge: React.FC<{ toolCalls: ActiveToolCall[] }> = ({ toolCalls }) => {
  const running = toolCalls.filter(tc => tc.status === 'running' || tc.status === 'pending');
  if (running.length === 0) return null;

  return (
    <div className="active-tool-badge">
      <span className="active-tool-badge__spinner" />
      <span className="active-tool-badge__label">
        {getToolDisplayName(running[0].name)}
        {running.length > 1 && <span className="active-tool-badge__more"> +{running.length - 1}</span>}
      </span>
    </div>
  );
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Persistent Todo List Panel
// Always visible when todoList has items, regardless of streaming/submitted state.
// Sits between suggestions and messages area.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TodoListPanel: React.FC<{
  todoList: LLMTodoItem[];
  activeToolCalls: ActiveToolCall[];
  isWorking: boolean;
}> = ({ todoList, activeToolCalls, isWorking }) => {
  const [collapsed, setCollapsed] = useState(false);

  if (todoList.length === 0) return null;

  const completedCount = todoList.filter(t => t.status === 'completed').length;
  const totalCount = todoList.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = completedCount === totalCount;

  // Find the current in-progress item
  const activeItem = todoList.find(t => t.status === 'in-progress');

  return (
    <div className={`todo-list-panel ${allDone ? 'todo-list-panel--done' : ''} ${isWorking ? 'todo-list-panel--working' : ''}`}>
      {/* Header â€” always visible, click to collapse/expand */}
      <button
        className="todo-list-panel__header"
        onClick={() => setCollapsed(prev => !prev)}
        type="button"
      >
        <div className="todo-list-panel__header-left">
          <span className="todo-list-panel__icon">
            {allDone ? 'âœ…' : isWorking ? 'âš¡' : 'ðŸ“‹'}
          </span>
          <span className="todo-list-panel__title">
            {allDone ? 'All steps completed' : activeItem ? activeItem.title : 'AI Plan'}
          </span>
          {isWorking && !allDone && (
            <ActiveToolBadge toolCalls={activeToolCalls} />
          )}
        </div>
        <div className="todo-list-panel__header-right">
          <span className="todo-list-panel__counter">
            {completedCount}/{totalCount}
          </span>
          <span className={`todo-list-panel__chevron ${collapsed ? '' : 'todo-list-panel__chevron--open'}`}>
            â–¸
          </span>
        </div>
      </button>

      {/* Progress bar â€” always visible */}
      <div className="todo-list-panel__progress">
        <div
          className={`todo-list-panel__progress-bar ${allDone ? 'todo-list-panel__progress-bar--done' : ''}`}
          style={{ width: `${progressPct}%` } as React.CSSProperties}
        />
      </div>

      {/* Collapsible body */}
      {!collapsed && (
        <div className="todo-list-panel__body">
          {todoList.map((item, idx) => {
            const cfg = TODO_STATUS_CONFIG[item.status];
            return (
              <div
                key={item.id}
                className={`todo-item todo-item--${item.status}`}
                style={{ animationDelay: `${idx * 0.04}s` } as React.CSSProperties}
              >
                <span className="todo-item__icon">{cfg.icon}</span>
                <span className="todo-item__title">{item.title}</span>
                {item.status === 'in-progress' && isWorking && (
                  <span className="todo-item__working-dot" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Slim inline indicator shown inside the messages area during processing
const CurrentStepIndicator: React.FC<{
  todoList: LLMTodoItem[];
  activeToolCalls: ActiveToolCall[];
}> = ({ todoList, activeToolCalls }) => {
  const activeItem = todoList.find(t => t.status === 'in-progress');
  const running = activeToolCalls.filter(tc => tc.status === 'running' || tc.status === 'pending');

  const label = running.length > 0
    ? getToolDisplayName(running[0].name)
    : activeItem?.title || 'Workingâ€¦';

  return (
    <div className="current-step-indicator">
      <span className="current-step-indicator__spinner" />
      <span className="current-step-indicator__label">{label}</span>
    </div>
  );
};

// Sparkle animation component
const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <span className={`sparkle-icon ${className || ''}`}>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"/>
    </svg>
  </span>
);

// Message component with enhanced animations
const ChatMessage: React.FC<{
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  index?: number;
}> = ({ role, content, isStreaming, index = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 50);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div 
      className={`chat-message chat-message--${role} ${isVisible ? 'chat-message--visible' : ''}`}
      style={{ '--animation-delay': `${index * 0.05}s` } as React.CSSProperties}
    >
      <div className="chat-message__avatar">
        {role === 'user' ? (
          <span className="avatar-user">ðŸ‘¤</span>
        ) : (
          <span className="avatar-ai">
            <SparkleIcon />
          </span>
        )}
      </div>
      <div className="chat-message__content">
        <div className="chat-message__role">
          {role === 'user' ? 'You' : 'Copilot'}
          {role === 'assistant' && <span className="role-badge">AI</span>}
        </div>
        <div className="chat-message__text">
          {isStreaming ? (
            <span className="streaming-text">{content}</span>
          ) : (
            content
          )}
          {isStreaming && <span className="chat-message__cursor"></span>}
        </div>
      </div>
    </div>
  );
};

// Quick prompt button with hover animation
const QuickPromptButton: React.FC<{
  label: string;
  onClick: () => void;
  index?: number;
}> = ({ label, onClick, index = 0 }) => {
  return (
    <button 
      className="quick-prompt-btn"
      onClick={onClick}
      style={{ animationDelay: `${0.35 + index * 0.05}s` }}
    >
      {label}
    </button>
  );
};

// Suggestion card
const SuggestionCard: React.FC<{
  suggestion: WorkflowSuggestion;
  onApply?: (suggestion: WorkflowSuggestion) => void;
}> = ({ suggestion, onApply }) => {
  const typeIcons: Record<string, string> = {
    task: 'ðŸ“‹',
    improvement: 'ðŸ’¡',
    validation: 'âš ï¸',
    explanation: 'ðŸ“–',
  };

  return (
    <div className={`suggestion-card suggestion-card--${suggestion.type}`}>
      <div className="suggestion-card__icon">
        {typeIcons[suggestion.type] || 'ðŸ’¡'}
      </div>
      <div className="suggestion-card__content">
        <div className="suggestion-card__title">{suggestion.title}</div>
        <div className="suggestion-card__description">{suggestion.description}</div>
        {suggestion.code && (
          <pre className="suggestion-card__code">
            <code>{suggestion.code}</code>
          </pre>
        )}
      </div>
      {onApply && (
        <button 
          className="suggestion-card__apply-btn"
          onClick={() => onApply(suggestion)}
        >
          Apply
        </button>
      )}
    </div>
  );
};

// Main component
export const WorkflowChatPanel: React.FC<WorkflowChatPanelProps> = ({
  workflowContext,
  onSuggestionApply,
  onTaskCreate,
  onTaskModify,
  currentDefinition,
  className = '',
  isOpen = true,
  onToggle,
  designer,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  // Chat hook
  const {
    messages,
    input,
    setInput,
    sendMessage,
    status,
    stop,
    clearMessages,
    isStreaming,
    todoList,
    activeToolCalls,
  } = useWorkflowChat({
    workflowContext,
    currentDefinition,
    onTaskCreate,
    onTaskModify,
    designer,
    onSuggestionGenerated: (suggestion) => {
      // Handle generated suggestions
    },
    onError: (err) => {
      console.error('Chat error:', err);
    },
  });

  // Assistant hook for suggestions
  const {
    suggestions,
    generateSuggestions,
    clearSuggestions,
    validateCurrentWorkflow,
  } = useWorkflowAssistant({
    workflowContext,
    currentDefinition,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Generate suggestions on mount
  useEffect(() => {
    if (currentDefinition) {
      const def = currentDefinition as { sequence?: unknown[] };
      generateSuggestions(def.sequence);
    }
  }, [currentDefinition, generateSuggestions]);

  // Handle form submit
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      sendMessage(input);
      setShowQuickPrompts(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  // Handle quick prompt click
  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
    setShowQuickPrompts(false);
  };

  // Handle suggestion apply
  const handleSuggestionApply = (suggestion: WorkflowSuggestion) => {
    if (suggestion.code && onTaskCreate) {
      try {
        const parsed = JSON.parse(suggestion.code);
        // Use id as execution ID, name as display name
        const executionId = parsed.id || parsed.type;
        onTaskCreate(parsed.type, executionId, parsed.properties, parsed.name);
      } catch {
        // Not valid JSON
      }
    }
    onSuggestionApply?.(suggestion);
  };

  // Handle validation
  const handleValidate = async () => {
    const result = await validateCurrentWorkflow();
    const message = result.valid
      ? 'âœ… Workflow is valid!'
      : `âŒ Validation issues:\n${result.issues.join('\n')}\n\nWarnings:\n${result.warnings.join('\n')}`;
    
    sendMessage(`Validate my workflow: ${message}`);
  };

  if (!isOpen) {
    return (
      <button className="chat-panel-toggle" onClick={onToggle}>
        <span className="chat-panel-toggle__icon">ðŸ¤–</span>
        <span className="chat-panel-toggle__text">AI Assistant</span>
      </button>
    );
  }

  return (
    <div className={`workflow-chat-panel ${className}`}>
      {/* Header */}
      <div className="chat-panel__header">
        <div className="chat-panel__title">
          <span className="chat-panel__icon">ðŸ¤–</span>{' '}
          Workflow AI Assistant
        </div>
        <div className="chat-panel__actions">
          <button 
            className="chat-panel__action-btn"
            onClick={handleValidate}
            title="Validate Workflow"
          >
            âœ“
          </button>
          <button 
            className="chat-panel__action-btn"
            onClick={clearMessages}
            title="Clear Chat"
          >
            ðŸ—‘ï¸
          </button>
          {onToggle && (
            <button 
              className="chat-panel__action-btn"
              onClick={onToggle}
              title="Close"
            >
              âœ•
            </button>
          )}
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="chat-panel__suggestions">
          <div className="suggestions__header">
            <span>ðŸ’¡ Suggestions</span>
            <button onClick={clearSuggestions}>Dismiss</button>
          </div>
          <div className="suggestions__list">
            {suggestions.map(suggestion => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onApply={handleSuggestionApply}
              />
            ))}
          </div>
        </div>
      )}

      {/* Persistent Todo List â€” always visible when items exist */}
      <TodoListPanel
        todoList={todoList}
        activeToolCalls={activeToolCalls}
        isWorking={status === 'submitted' || isStreaming}
      />

      {/* Messages */}
      <div className="chat-panel__messages">
        {messages.length === 0 && showQuickPrompts && (
          <div className="chat-panel__welcome">
            <div className="welcome__icon">
              <SparkleIcon />
            </div>
            <div className="welcome__title">
              Hi! I'm your Workflow Copilot
            </div>
            <div className="welcome__description">
              I can help you create and manage workflow tasks, explain task types,
              suggest improvements, and validate your workflows.
            </div>
            <div className="welcome__quick-prompts">
              <div className="quick-prompts__title">Try asking:</div>
              <div className="quick-prompts__list">
                {QUICK_PROMPTS.map((prompt, index) => (
                  <QuickPromptButton
                    key={prompt.id}
                    label={prompt.label}
                    index={index}
                    onClick={() => handleQuickPrompt(prompt.prompt)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => {
          const content = message.parts
            .filter(part => part.type === 'text')
            .map(part => (part as { type: 'text'; text: string }).text)
            .join('');

          return (
            <ChatMessage
              key={message.id || index}
              role={message.role as 'user' | 'assistant'}
              content={content}
              index={index}
              isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
            />
          );
        })}

        {status === 'submitted' && (
          todoList.length > 0
            ? <CurrentStepIndicator todoList={todoList} activeToolCalls={activeToolCalls} />
            : <ProcessingIndicator />
        )}
        {isStreaming && (
          todoList.length > 0
            ? <CurrentStepIndicator todoList={todoList} activeToolCalls={activeToolCalls} />
            : <TypingIndicator />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="chat-panel__input" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about workflows, tasks, or request help..."
          disabled={isStreaming}
          rows={2}
        />
        <div className="input__actions">
          {isStreaming ? (
            <button type="button" className="input__stop-btn" onClick={stop}>
              â¬› Stop
            </button>
          ) : (
            <button 
              type="submit" 
              className="input__send-btn"
              disabled={!input.trim()}
            >
              Send â†’
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default WorkflowChatPanel;
