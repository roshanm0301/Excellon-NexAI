import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { v4 } from "uuid";
import { DXForm } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import { errorDefinition, errorStatusCode, failedDefinition, successDefinition, successStatusCode } from "../../common.entity";
import { TaskType } from "../../rule";
import { MethodList } from "./workflow.entity";

export const WorkFlowTask = () => {
  let { id: stepId, name: stepName, properties, setId, setName, setProperty } =
    useStepEditor();
  const [formData, setFormData] = useState({
    type: TaskType.Workflow,
    id: "",
    name: "",
    tasks: "",
    method: "",
    template: "",
    subscription: "",
    repository: "",
    state: "",
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  let data: any;

  useEffect(() => {
    if (properties?.taskSettings) {
      data = properties?.taskSettings;
      if (data.paths) {
        let obj = data.paths.map((item: any) => { return { id: v4(), Value: item } })
        // Include step's name from useStepEditor (not from taskSettings)
        setFormData(prev => ({ ...prev, ...data, path: obj, name: stepName || data.name || '' }))
      } else {
        // Include step's name from useStepEditor (not from taskSettings)
        setFormData(prev => ({ ...prev, ...data, name: stepName || data.name || '' }));
      }
    } else {
      // Initialize name from step even if no taskSettings
      setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

  const onChange = (e: any) => {
    if (e?.event) {
      e.event.preventDefault();
      let _formData: any = formData;
      if (e?.value === "Template") {
        delete _formData.tasks;
      } else if (e?.value === "Custom") {
        delete _formData.template;
      }
      setFormData({ ..._formData });
    }
  }

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
            label: { text: "Method", location: "top" },
            dataField: "method",
            editorType: "dxSelectBox",
            isRequired: true,
            editorOptions: {
              dataSource: MethodList,
              searchEnabled: true,
              onValueChanged: (e: any) => onChange(e),
            },
          },
          {
            label: { text: "Tasks" },
            dataField: "tasks",
            isRequired: formData?.method === "Custom",
            visible: formData?.method === "Custom"
          },
          {
            label: { text: "Template" },
            dataField: "template",
            isRequired: formData?.method === "Template",
            visible: formData?.method === "Template"
          },
          {
            label: { text: "Subscription", location: "top" },
            dataField: "subscription",
            isRequired: true,
          },
          {
            label: { text: "Repository", location: "top" },
            dataField: "repository",
            isRequired: true,
          },
          {
            label: { text: "State" },
            dataField: "state",
            isRequired: true,
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
      />
);
};
