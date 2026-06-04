/**
 * useWorkflowAssistant Hook
 * Provides workflow-specific AI assistance features
 */

import { useState, useCallback } from 'react';
import type { WorkflowContext, WorkflowSuggestion, TaskType } from '../types';
import { generateQuickSuggestion } from '../services';
import { getAllTaskTypes, WORKFLOW_PATTERNS } from '../knowledge';

interface UseWorkflowAssistantOptions {
    workflowContext?: WorkflowContext;
    currentDefinition?: unknown;
}

interface UseWorkflowAssistantReturn {
    // Task documentation
    getTaskHelp: (taskType: string) => Promise<string>;
    availableTaskTypes: TaskType[];

    // Suggestions
    suggestions: WorkflowSuggestion[];
    generateSuggestions: (currentSequence?: unknown[]) => Promise<void>;
    clearSuggestions: () => void;

    // Validation
    validateCurrentWorkflow: () => Promise<ValidationResult>;

    // Quick actions
    suggestNextTask: (currentTasks: string[]) => TaskType[];
    getWorkflowPattern: (patternName: string) => WorkflowPattern | undefined;

    // Loading state
    isLoading: boolean;
}

interface ValidationResult {
    valid: boolean;
    issues: string[];
    warnings: string[];
}

interface WorkflowPattern {
    name: string;
    description: string;
    template: unknown;
}

export const useWorkflowAssistant = (
    options: UseWorkflowAssistantOptions = {}
): UseWorkflowAssistantReturn => {
    const { currentDefinition } = options;
    const [suggestions, setSuggestions] = useState<WorkflowSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Get help for a specific task type
    const getTaskHelp = useCallback(async (taskType: string): Promise<string> => {
        setIsLoading(true);
        try {
            const help = await generateQuickSuggestion(taskType);
            return help;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Generate suggestions based on current workflow
    const generateSuggestions = useCallback(async (currentSequence?: unknown[]) => {
        setIsLoading(true);
        try {
            const newSuggestions: WorkflowSuggestion[] = [];

            // Analyze current sequence
            const sequence = currentSequence || [];
            const taskTypes = (sequence as Array<{ type?: string }>).map(s => s?.type).filter(Boolean);

            // Suggest error handling if not present
            if (!taskTypes.includes('Condition')) {
                newSuggestions.push({
                    id: 'add-error-handling',
                    type: 'improvement',
                    title: 'Add Error Handling',
                    description: 'Consider adding conditional error handling to your workflow',
                });
            }

            // Suggest caching for DB queries
            if (taskTypes.includes('DBQuery') && !taskTypes.includes('Cache')) {
                newSuggestions.push({
                    id: 'add-caching',
                    type: 'improvement',
                    title: 'Add Caching',
                    description: 'Add caching to improve performance for database queries',
                });
            }

            // Suggest validation if not present
            if (!taskTypes.includes('Validation') && taskTypes.length > 2) {
                newSuggestions.push({
                    id: 'add-validation',
                    type: 'improvement',
                    title: 'Add Input Validation',
                    description: 'Add input validation to ensure data integrity',
                });
            }

            // Check for Response task
            if (!taskTypes.includes('Response')) {
                newSuggestions.push({
                    id: 'add-response',
                    type: 'validation',
                    title: 'Missing Response Task',
                    description: 'Workflow should end with a Response task',
                });
            }

            setSuggestions(newSuggestions);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Clear suggestions
    const clearSuggestions = useCallback(() => {
        setSuggestions([]);
    }, []);

    // Validate current workflow
    const validateCurrentWorkflow = useCallback(async (): Promise<ValidationResult> => {
        setIsLoading(true);
        try {
            const issues: string[] = [];
            const warnings: string[] = [];

            if (!currentDefinition) {
                return { valid: false, issues: ['No workflow definition provided'], warnings: [] };
            }

            const def = currentDefinition as { sequence?: unknown[]; properties?: unknown };

            // Check sequence
            if (!def.sequence || !Array.isArray(def.sequence)) {
                issues.push('Workflow must have a valid sequence array');
            } else {
                // Check for required tasks
                const types = new Set(
                    (def.sequence as Array<{ type?: string }>)
                        .map(s => s?.type)
                        .filter(Boolean)
                );

                if (!types.has('Resolver')) {
                    warnings.push('Consider adding a Resolver task to process data');
                }

                if (!types.has('Response')) {
                    issues.push('Workflow must include a Response task');
                }

                // Check for empty tasks
                (def.sequence as Array<{ id?: string; type?: string }>).forEach((task, index) => {
                    if (!task.id) {
                        issues.push(`Task at index ${index} is missing an ID`);
                    }
                    if (!task.type) {
                        issues.push(`Task at index ${index} is missing a type`);
                    }
                });

                // Check for duplicate IDs
                const ids = (def.sequence as Array<{ id?: string }>).map(s => s?.id).filter(Boolean);
                const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
                if (duplicates.length > 0) {
                    issues.push(`Duplicate task IDs found: ${Array.from(new Set(duplicates)).join(', ')}`);
                }
            }

            return {
                valid: issues.length === 0,
                issues,
                warnings,
            };
        } finally {
            setIsLoading(false);
        }
    }, [currentDefinition]);

    // Suggest next task based on current tasks
    const suggestNextTask = useCallback((currentTasks: string[]): TaskType[] => {
        const suggestedTasks: TaskType[] = [];
        const lastTask = currentTasks.at(-1);

        // Task flow suggestions - using valid TaskType values
        const taskFlow: Record<string, TaskType[]> = {
            'Validator': ['Query', 'HTTP', 'Resolver'],
            'Query': ['Resolver', 'Array', 'Condition', 'Cache'],
            'HTTP': ['Resolver', 'Array', 'Condition'],
            'Array': ['Resolver', 'Query', 'HTTP', 'Response'],
            'Condition': ['Query', 'HTTP', 'SMTP', 'Response'],
            'Cache': ['Resolver', 'Response'],
            'Resolver': ['Response', 'Array'],
            'Loop': ['Query', 'HTTP', 'Array'],
            'SMTP': ['Response'],
            'Request': ['Response'],
            'Document': ['Resolver', 'Array', 'Condition', 'Cache'],
            'Entity': ['Resolver', 'Array', 'Condition'],
            'ORM': ['Resolver', 'Array', 'Condition'],
        };

        if (lastTask && taskFlow[lastTask]) {
            suggestedTasks.push(...taskFlow[lastTask]);
        }

        // If no specific suggestions, return common next tasks
        if (suggestedTasks.length === 0) {
            if (!currentTasks.includes('Resolver')) {
                suggestedTasks.push('Resolver');
            }
            if (!currentTasks.includes('Response')) {
                suggestedTasks.push('Response');
            }
        }

        return Array.from(new Set(suggestedTasks));
    }, []);

    // Get workflow pattern
    const getWorkflowPattern = useCallback((patternName: string): WorkflowPattern | undefined => {
        const pattern = WORKFLOW_PATTERNS.find(
            p => p.name.toLowerCase() === patternName.toLowerCase()
        );

        if (pattern) {
            return {
                name: pattern.name,
                description: pattern.description,
                template: pattern.template,
            };
        }

        return undefined;
    }, []);

    return {
        getTaskHelp,
        availableTaskTypes: getAllTaskTypes(),
        suggestions,
        generateSuggestions,
        clearSuggestions,
        validateCurrentWorkflow,
        suggestNextTask,
        getWorkflowPattern,
        isLoading,
    };
};
