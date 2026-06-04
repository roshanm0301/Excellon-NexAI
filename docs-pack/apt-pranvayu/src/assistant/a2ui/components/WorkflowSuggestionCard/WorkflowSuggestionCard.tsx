/**
 * WorkflowSuggestionCard Component
 * Displays AI-generated suggestions for workflow improvements
 */

import React from 'react';
import type { WorkflowSuggestion } from '../../types';
import './WorkflowSuggestionCard.scss';

interface WorkflowSuggestionCardProps {
  suggestion: WorkflowSuggestion;
  onApply?: (suggestion: WorkflowSuggestion) => void;
  onDismiss?: (id: string) => void;
  showCode?: boolean;
}

export const WorkflowSuggestionCard: React.FC<WorkflowSuggestionCardProps> = ({
  suggestion,
  onApply,
  onDismiss,
  showCode = true,
}) => {
  const typeConfig: Record<string, { icon: string; className: string; label: string }> = {
    task: { icon: '📋', className: 'suggestion--task', label: 'Task Suggestion' },
    improvement: { icon: '💡', className: 'suggestion--improvement', label: 'Improvement' },
    validation: { icon: '⚠️', className: 'suggestion--validation', label: 'Validation Issue' },
    explanation: { icon: '📖', className: 'suggestion--explanation', label: 'Explanation' },
  };

  const config = typeConfig[suggestion.type] || typeConfig.task;

  return (
    <div 
      className={`workflow-suggestion-card ${config.className}`}
    >
      <div className="suggestion-header">
        <div className="suggestion-type">
          <span className="suggestion-icon">{config.icon}</span>
          <span className="suggestion-label">{config.label}</span>
        </div>
        {onDismiss && (
          <button 
            className="suggestion-dismiss"
            onClick={() => onDismiss(suggestion.id)}
            aria-label="Dismiss suggestion"
          >
            ×
          </button>
        )}
      </div>

      <div className="suggestion-content">
        <h4 className="suggestion-title">{suggestion.title}</h4>
        <p className="suggestion-description">{suggestion.description}</p>

        {showCode && suggestion.code && (
          <div className="suggestion-code">
            <div className="code-header">
              <span>Configuration</span>
              <button 
                className="code-copy"
                onClick={() => navigator.clipboard.writeText(suggestion.code || '')}
                title="Copy to clipboard"
              >
                📋 Copy
              </button>
            </div>
            <pre>
              <code>{suggestion.code}</code>
            </pre>
          </div>
        )}
      </div>

      {onApply && (
        <div className="suggestion-actions">
          <button 
            className="suggestion-apply-btn"
            onClick={() => onApply(suggestion)}
          >
            Apply Suggestion
          </button>
        </div>
      )}
    </div>
  );
};

// List component for multiple suggestions
interface WorkflowSuggestionsListProps {
  suggestions: WorkflowSuggestion[];
  onApply?: (suggestion: WorkflowSuggestion) => void;
  onDismiss?: (id: string) => void;
  onDismissAll?: () => void;
  title?: string;
}

export const WorkflowSuggestionsList: React.FC<WorkflowSuggestionsListProps> = ({
  suggestions,
  onApply,
  onDismiss,
  onDismissAll,
  title = 'AI Suggestions',
}) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="workflow-suggestions-list">
      <div className="suggestions-list-header">
        <h3>{title}</h3>
        <span className="suggestions-count">{suggestions.length} suggestions</span>
        {onDismissAll && (
          <button 
            className="dismiss-all-btn"
            onClick={onDismissAll}
          >
            Dismiss All
          </button>
        )}
      </div>
      <div className="suggestions-list-content">
        {suggestions.map(suggestion => (
          <WorkflowSuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onApply={onApply}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
};

export default WorkflowSuggestionCard;
