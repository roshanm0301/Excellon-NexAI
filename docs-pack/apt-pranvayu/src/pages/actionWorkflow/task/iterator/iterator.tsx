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
  failedStatusCode,
  successDefinition,
  successStatusCode,
} from "../../common.entity";
import { TaskType } from "../../rule";

export function Iterator() {
  let { id: stepId, name: stepName, properties, setId, setName, setProperty } =
    useStepEditor();

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    type: TaskType.Iterator,
    method: 'Iterate',
    path: "",
    var: "",
    index: "",
    tasks: [],
    break: false,
    async: false,
    breakConditions: {
      and: [],
      any: [],
      operator: "",
      fact: "",
      value: "",
    },
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition }
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  useEffect(() => {
    if (properties?.taskSettings) {
      const data: any = properties?.taskSettings;
      // Include step's name from useStepEditor (not from taskSettings)
      setFormData(prev => ({ ...prev, ...data, name: stepName || data.name || '' }));
    } else {
      // Initialize name from step even if no taskSettings
      setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

  const onQueryCallBack = (conditions: any) => {
    const _formData = { ...formData, breakConditions: conditions };
    autoSave(_formData);
  };

  const onBreakChange = (e: any) => {
    if (e.event) {
      if (e.value === true) {
        setFormData({
          ...formData,
          break: e.value,
          breakConditions: {
            and: [],
            any: [],
            operator: "",
            fact: "",
            value: "",
          },
        });
      } else {
        let _formData: any = { ...formData, break: e.value }
        delete _formData.breakConditions;
        setFormData({ ..._formData });
      }
    }
  };

  return (
    
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
            label: { text: "Var", location: "top" },
            dataField: "var",
            isRequired: true,
          },
          {
            label: { text: "Index", location: "top" },
            dataField: "index",
            isRequired: true,
          },
          {
            label: { text: "Break", location: "left" },
            dataField: "break",
            editorType: "dxCheckBox",
            editorOptions: {
              onValueChanged: (e: any) => onBreakChange(e),
            },
          },
          {
            label: { text: "Async", location: "left" },
            dataField: "async",
            editorType: "dxCheckBox",
          },
          {
            label: { text: "Break Conditions", location: "top" },
            dataField: "breakConditions",
            isRequired: true,
            visible: formData.break,
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
);
}
