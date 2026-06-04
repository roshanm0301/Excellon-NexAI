/**
 * AiAutoFillContext
 *
 * React context that provides DesignerCallbacks + WorkflowContext to task
 * editor descendants, enabling the AI auto-fill button in every StepEditor.
 *
 * Provider is placed in action.workflow.tsx (or SequentialWorkflowDesigner wrapper),
 * consumed by AiTaskFillWrapper inside StepEditor.
 */

import React, { createContext, useContext, useMemo } from 'react';
import type { DesignerCallbacks, WorkflowContext } from '../../types';

export interface AiAutoFillContextValue {
    designer?: DesignerCallbacks;
    workflowContext?: WorkflowContext;
    /** Whether the workflow is in a read-only/view mode */
    readOnly?: boolean;
}

const AiAutoFillCtx = createContext<AiAutoFillContextValue>({});

/**
 * Hook to access the AI auto-fill context from within any task editor.
 */
export function useAiAutoFillContext(): AiAutoFillContextValue {
    return useContext(AiAutoFillCtx);
}

/**
 * Provider component — wrap around the step editor tree.
 */
export const AiAutoFillProvider: React.FC<
    AiAutoFillContextValue & { children: React.ReactNode }
> = ({ designer, workflowContext, readOnly, children }) => {
    const value = useMemo(
        () => ({ designer, workflowContext, readOnly }),
        [designer, workflowContext, readOnly],
    );

    return (
        <AiAutoFillCtx.Provider value={value}>
            {children}
        </AiAutoFillCtx.Provider>
    );
};
