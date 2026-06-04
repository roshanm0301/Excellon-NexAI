import { useEffect, useState } from 'react';
import { useAutoSave } from "../../hooks/useAutoSave";
import { DXForm } from '../../../../components/atoms';
import { useStepEditor } from '../../../../react';
import { errorDefinition, failedDefinition, successDefinition } from '../../common.entity';
import { TaskType } from '../../rule';
import { ITaskEmit, MethodType } from '../../rule/task.cache';
import { EmitCacheFormItems } from './cache.entity';

export default function EmitCache() {
    let { id: stepId, name: stepName, setId, setName, properties, setProperty } =
        useStepEditor();

    const [formData, setFormData] = useState({
        id: "",
        name: "",
        type: TaskType.Cache,
        method: MethodType.Emit,
        success: { ...successDefinition },
        failed: { ...failedDefinition },
        error: { ...errorDefinition },
        room: "",
        key: "",
        value: ""
    });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

    useEffect(() => {
        if (properties?.taskSettings) {
            const data = properties?.taskSettings as ITaskEmit;
            setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, method: properties.type as MethodType.Emit, name: stepName || data.name || '' }));
        } else {
            setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
        }
    }, [stepId, stepName, properties]);

    return (
        <>
            
                <DXForm onFieldDataChanged={onFieldDataChanged}
          formData={formData} stylingMode="outlined" items={EmitCacheFormItems} />
</>
    );
}
