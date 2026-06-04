import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { DXForm } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import { errorDefinition, failedDefinition, successDefinition } from "../../common.entity";
import { EntityMethodType, ITaskGetEntity, TaskType } from "../../rule";
import { GetEntityFormItems } from "./entity.entity";

export function GetEntity() {
  let { id: stepId, name: stepName, setId, setName, properties, setProperty } =
    useStepEditor();

  const [formData, setFormData] = useState({
    id: "", // Will be synced from step.id
    name: "",
    type: TaskType.Entity, // hardcoded readonly
    method: EntityMethodType.Get, // hardcoded readonly

    containerId: "",
    subscriptionId: "{$.auth.subscriptionId}",
    documentId: "",

    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  useEffect(() => {
    if (properties?.taskSettings) {
      const data = properties?.taskSettings as ITaskGetEntity;
      setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, method: properties.type as EntityMethodType.Get, name: stepName || data.name || '' }));
    } else {
      setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

  return (
    <>
      
        <DXForm onFieldDataChanged={onFieldDataChanged}
          formData={formData} stylingMode="outlined" items={GetEntityFormItems} />
</>
  );
}
