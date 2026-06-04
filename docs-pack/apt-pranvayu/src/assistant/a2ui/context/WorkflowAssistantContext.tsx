/**
 * WorkflowAssistantContext
 * React Context for managing AI assistant state across the application
 */

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { WorkflowContext, WorkflowSuggestion, ChatStatus } from '../types';
import { useWorkflowChat } from '../hooks/useWorkflowChat';
import { useWorkflowAssistant } from '../hooks/useWorkflowAssistant';

interface AssistantContextValue {
  // Chat state
  messages: any[];
  sendMessage: (text: string) => void;
  status: ChatStatus;
  isStreaming: boolean;
  error: Error | null;
  clearMessages: () => void;
  stop: () => void;

  // Suggestions
  suggestions: WorkflowSuggestion[];
  generateSuggestions: (sequence?: unknown[]) => Promise<void>;
  clearSuggestions: () => void;

  // Panel state
  isPanelOpen: boolean;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;

  // Context
  workflowContext: WorkflowContext | undefined;
  setWorkflowContext: (context: WorkflowContext) => void;
  currentDefinition: unknown;
  setCurrentDefinition: (definition: unknown) => void;

  // API Key
  apiKey: string | null;
  setApiKey: (key: string) => void;
  isConfigured: boolean;
}

const AssistantContext = createContext<AssistantContextValue | undefined>(undefined);

interface WorkflowAssistantProviderProps {
  children: ReactNode;
  initialContext?: WorkflowContext;
  initialDefinition?: unknown;
}

export const WorkflowAssistantProvider: React.FC<WorkflowAssistantProviderProps> = ({
  children,
  initialContext,
  initialDefinition,
}) => {
  // Panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Workflow context
  const [workflowContext, setWorkflowContext] = useState<WorkflowContext | undefined>(initialContext);
  const [currentDefinition, setCurrentDefinition] = useState<unknown>(initialDefinition);
  
  // API Key management
  const [storedApiKey, setStoredApiKey] = useState<string | null>(() => {
    return localStorage.getItem('OPENAI_API_KEY');
  });

  const setApiKey = useCallback((key: string) => {
    localStorage.setItem('OPENAI_API_KEY', key);
    setStoredApiKey(key);
  }, []);

  const isConfigured = Boolean(storedApiKey);

  // Chat hook
  const {
    messages,
    sendMessage,
    status,
    error,
    clearMessages,
    stop,
    isStreaming,
  } = useWorkflowChat({
    workflowContext,
  });

  // Assistant hook
  const {
    suggestions,
    generateSuggestions,
    clearSuggestions,
  } = useWorkflowAssistant({
    workflowContext,
    currentDefinition,
  });

  // Panel controls
  const togglePanel = useCallback(() => setIsPanelOpen(prev => !prev), []);
  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);

  const value = useMemo<AssistantContextValue>(() => ({
    // Chat
    messages,
    sendMessage,
    status,
    isStreaming,
    error,
    clearMessages,
    stop,

    // Suggestions
    suggestions,
    generateSuggestions,
    clearSuggestions,

    // Panel
    isPanelOpen,
    togglePanel,
    openPanel,
    closePanel,

    // Context
    workflowContext,
    setWorkflowContext,
    currentDefinition,
    setCurrentDefinition,

    // API
    apiKey: storedApiKey,
    setApiKey,
    isConfigured,
  }), [
    messages,
    sendMessage,
    status,
    isStreaming,
    error,
    clearMessages,
    stop,
    suggestions,
    generateSuggestions,
    clearSuggestions,
    isPanelOpen,
    togglePanel,
    openPanel,
    closePanel,
    workflowContext,
    currentDefinition,
    storedApiKey,
    setApiKey,
    isConfigured,
  ]);

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
};

export const useAssistantContext = (): AssistantContextValue => {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistantContext must be used within WorkflowAssistantProvider');
  }
  return context;
};

export default WorkflowAssistantProvider;
