import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { createRoot } from "react-dom/client";
import { SwitchCase } from ".";
import { DXForm } from "../../../../components/atoms";
import { DXAccordion } from "../../../../components/atoms/accordion";
import { useStepEditor } from "../../../../react";
import {
  errorDefinition,
  errorStatusCode,
  failedDefinition,
  failedStatusCode,
  successDefinition,
  successStatusCode,
} from "../../common.entity";
import { TaskType } from "../../rule";
import { ITaskSwitch } from "../../rule/task.switch";

export function Switch() {
  let {
    type,
    id: stepId,
    name: stepName,
    step,
    properties,
    setId,
    setName,
    setProperty,
    notifyPropertiesChanged,
    notifyChildrenChanged,
  } = useStepEditor();

  const [formData, setFormData] = useState({
    id: "",
    name: "Switch",
    type: TaskType.Switch,
    path: "",
    case: {},
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
    success: { ...successDefinition }
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  useEffect(() => {
    if (properties?.taskSettings) {
      const resolverData = properties?.taskSettings as ITaskSwitch;
      // Include step's id and name from useStepEditor (not from taskSettings)
      setFormData(prev => ({ ...prev, ...resolverData, id: stepId || resolverData.id || prev.id, name: stepName || resolverData.name || '' }))
    } else {
      // Initialize id and name from step even if no taskSettings
      setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties])

  return (
    <>
      
        <DXForm
          onFieldDataChanged={onFieldDataChanged}
          formData={formData}
          stylingMode="outlined"
          items={[
            {
              label: { text: "Id", location: "top" },
              dataField: "id",
              isRequired: true,
            },
            {
              label: { text: "Name", location: "top" },
              dataField: "name",
              isRequired: true,
            },
            {
              label: { text: "Path", location: "top" },
              dataField: "path",
              isRequired: true,
            },

            {
              label: { text: "Case", location: "top" },
              dataField: "case",
              isRequired: true,
              template: async (data: any, itemElement: any) => {
                const root = createRoot(itemElement!);
                root.render(
                  <DXAccordion title="Switch Case">
                    <SwitchCase
                      type={type}
                      name={stepName}
                      step={step}
                      properties={properties}
                      setName={setName}
                      setProperty={setProperty}
                      notifyPropertiesChanged={notifyPropertiesChanged}
                      notifyChildrenChanged={notifyChildrenChanged}
                    />
                  </DXAccordion>
                );
              },
            },

            {
              itemType: "group",
              caption: "Success",
              cssClass: "no-margin",
              colCount: 1,
              items: [
                {
                  label: { text: "Status Code" },
                  dataField: "success.statusCode",
                  editorType: "dxSelectBox",
                  editorOptions: {
                    dataSource: successStatusCode,
                  },
                },
                {
                  label: { text: "Data" },
                  dataField: "success.data",
                },
                {
                  label: { text: "Code" },
                  dataField: "success.code",
                },
              ],
            },
            {
              itemType: "group",
              caption: "Error",
              cssClass: "no-margin",
              colCount: 1,
              items: [
                {
                  label: { text: "Status Code" },
                  dataField: "error.statusCode",
                  editorType: "dxSelectBox",
                  editorOptions: {
                    dataSource: errorStatusCode,
                  },
                },
                {
                  label: { text: "Message" },
                  dataField: "error.message",
                },
                {
                  label: { text: "Code" },
                  dataField: "error.code",
                },
                {
                  label: { text: "Error" },
                  dataField: "error.error",
                },
              ],
            },
            {
              itemType: "group",
              caption: "Failed",
              cssClass: "no-margin",
              colCount: 1,
              items: [
                {
                  label: { text: "Status Code" },
                  dataField: "failed.statusCode",
                  editorType: "dxSelectBox",
                  editorOptions: {
                    dataSource: failedStatusCode,
                  },
                },
                {
                  label: { text: "Message" },
                  dataField: "failed.message",
                },
                {
                  label: { text: "Code" },
                  dataField: "failed.code",
                },
                {
                  label: { text: "Error" },
                  dataField: "failed.error",
                },
              ],
            },
          ]}
        ></DXForm>
</>
  );
}
