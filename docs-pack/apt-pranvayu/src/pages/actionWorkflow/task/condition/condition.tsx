import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { createRoot } from "react-dom/client";
import { DXForm } from "../../../../components/atoms";
import { QueryBuilderTemplate } from "../../../../components/template";
import { useStepEditor } from "../../../../react";
import {
  errorDefinition,
  errorStatusCode,
  failedDefinition,
  successDefinition,
  successStatusCode,
} from "../../common.entity";
import { TaskType } from "../../rule";
import { conditionOperator } from "./condition.entity";

export const Condition = () => {
  let { id: stepId, name: stepName, step, properties, setId, setName, setProperty } = useStepEditor();

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    type: TaskType.Condition,
    conditions: {
      and: [],
      any: [],
      operator: "",
      fact: "",
      value: "",
    },
    onSuccess: [],
    onFailure: [],
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  let taskSettings: any = properties?.taskSettings;

  useEffect(() => {
    if (taskSettings) {
      // Include step's id and name from useStepEditor (not from taskSettings)
      setFormData(prev => ({ ...prev, ...taskSettings, id: stepId || taskSettings.id || prev.id, name: stepName || taskSettings.name || '' }));
    } else {
      // Initialize id and name from step even if no taskSettings
      setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

  const onQueryCallBack = (conditions: any) => {
    const _formData = { ...formData, conditions: conditions };
    autoSave(_formData);
  };

  return (
    <>
      
        <DXForm
          onFieldDataChanged={onFieldDataChanged}
          stylingMode="outlined"
          formData={formData}
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
              label: { text: "Fact", location: "top" },
              dataField: "conditions.fact",
            },
            {
              label: { text: "Operator", location: "top" },
              dataField: "conditions.operator",

              editorType: "dxSelectBox",
              editorOptions: {
                dataSource: conditionOperator,
                searchEnabled: true
              },
            },
            {
              label: { text: "Value", location: "top" },
              dataField: "conditions.value",
            },
            {
              label: { text: "Conditions", location: "top" },
              dataField: "conditions",
              isRequired: true,
              template: async (data: any, itemElement: any) => {
                const root = createRoot(itemElement!);
                root.render(
                  <QueryBuilderTemplate
                    conditions={data.editorOptions.value}
                    callBack={onQueryCallBack}
                  ></QueryBuilderTemplate>
                );
              },
            },
            {
              itemType: "group",
              caption: "Success",
              cssClass: "no-margin",
              colCount: 1,
              name: `${step.id}.Success`,
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
              name: `${step.id}.Error`,
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
              name: `${step.id}.Failed`,
              items: [
                {
                  label: { text: "Status Code" },
                  dataField: "failed.statusCode",
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
};
