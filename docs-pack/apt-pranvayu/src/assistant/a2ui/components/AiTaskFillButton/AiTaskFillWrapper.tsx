/**
 * AiTaskFillWrapper
 *
 * Bridge that connects the AI Fill prompt bar with the StepEditor context.
 *
 * Uses the step editor's OWN update APIs (setProperty / setId / setName) â€”
 * the same path as when the user manually edits a field:
 *
 *   setProperty('taskSettings', data)  â†’ in-place mutation (no forward)
 *   setProperty('type', subType)       â†’ in-place + forward() â†’ new wrapper
 *     â†’ useEffect([properties]) fires â†’ setFormData â†’ DXForm renders immediately
 *   notifyPropertiesChanged() (inside setProperty)
 *     â†’ designer.onDefinitionChanged â†’ forwardDefinition â†’ setDefinition
 *     â†’ definition saved for persistence / save
 *
 * This is the established mechanism every manual edit uses, ensuring both
 * real-time UI refresh AND definition persistence.
 */

import React, { useCallback, useState } from 'react';
import { useStepEditor } from '../../../../react/StepEditorWrapper';
import { AiTaskFillButton } from './AiTaskFillButton';
import { useTaskAutoFill } from '../../hooks/useTaskAutoFill';
import { useAiAutoFillContext } from './AiAutoFillContext';

export interface AiTaskFillWrapperProps {
    readOnly?: boolean;
}

export const AiTaskFillWrapper: React.FC<AiTaskFillWrapperProps> = React.memo(({
    readOnly: readOnlyProp,
}) => {
    const { designer, workflowContext, readOnly: ctxReadOnly } = useAiAutoFillContext();
    const isReadOnly = readOnlyProp ?? ctxReadOnly ?? false;

    const {
        id: stepId,
        name: stepName,
        type,
        properties,
        setProperty,
        setId,
        setName,
    } = useStepEditor();

    const { autoFill, status } = useTaskAutoFill({ designer, workflowContext });

    const [open, setOpen] = useState(false);

    const handleToggle = useCallback(() => {
        setOpen(prev => !prev);
    }, []);

    const handleSubmit = useCallback((userPrompt: string) => {
        const subType = (properties as Record<string, unknown>)?.type as string | undefined;
        const currentProps = properties as Record<string, unknown>;

        autoFill(
            type,
            subType,
            currentProps,
            stepId,
            stepName,
            userPrompt,
            (taskSettings: Record<string, unknown>) => {

                // Resolve the sub-type (method) for the dropdown selector.
                // taskSettings.method is the SUB-TYPE (e.g. "Put", "Get").
                // properties["type"] drives the parent switch (document.tsx, variable.tsx, etc.)
                //
                // PRIORITY: AI's explicit method WINS over existing sub-type.
                // The AI analyzed the workflow and chose this method intentionally.
                // Example: existing type="Get", AI chose method="Put" â†’ resolvedSubType="Put"
                const resolvedSubType = (taskSettings.method as string)
                    || subType
                    || '';

                // ─── Use the step editor's OWN API
                //
                // 1. setProperty('taskSettings', data) â†’ in-place mutation on
                //    step.properties.taskSettings. Intentionally NO forward()
                //    (avoids DXForm/grid destruction on taskSettings writes).
                //
                // 2. setProperty('type', subType) â†’ in-place mutation on
                //    step.properties.type, THEN forward() which:
                //    a) creates new wrapper â†’ new `properties` clone
                //    b) triggers useEffect([properties]) in Document/etc.
                //    c) useEffect reads properties.taskSettings â†’ setFormData
                //    d) DXForm renders with AI data IMMEDIATELY
                //
                // Both calls also trigger props.context.notifyPropertiesChanged()
                // â†’ designer.onDefinitionChanged â†’ forwardDefinition â†’
                // setDefinition â†’ definition saved for persistence.

                // 1. Write taskSettings (in-place, no forward â€” by design)
                setProperty('taskSettings', taskSettings);

                // 2. Write sub-type (in-place + forward â†’ new wrapper â†’ re-render)
                // This forward() creates a NEW properties clone that includes
                // the taskSettings we just wrote above.
                setProperty('type', resolvedSubType);

                // 3. Sync step-level id and name (designer box label + execution ID)
                const newId = taskSettings.id as string;
                const newName = taskSettings.name as string;
                if (newId && newId !== stepId) {
                    setId(newId);
                }
                if (newName && newName !== stepName) {
                    setName(newName);
                }
            },
        );
    }, [type, properties, stepId, stepName, autoFill, setProperty, setId, setName]);

    return (
        <AiTaskFillButton
            open={open}
            onToggle={handleToggle}
            onSubmit={handleSubmit}
            status={status}
            disabled={isReadOnly}
            tooltip={`AI Auto-Fill ${type}`}
        />
    );
});

AiTaskFillWrapper.displayName = 'AiTaskFillWrapper';
