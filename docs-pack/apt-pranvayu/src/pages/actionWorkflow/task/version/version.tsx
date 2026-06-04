import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { createRoot } from "react-dom/client";
import { DXForm } from "../../../../components/atoms";
import { Payload } from "../../../../components/molecules";
import { useStepEditor } from "../../../../react";
import { errorDefinition, errorStatusCode, failedDefinition, successDefinition, successStatusCode } from "../../common.entity";
import { TaskType } from "../../rule";
import { VersionMethodType } from "./version.entity";

export const VersionTask = () => {
  let { id: stepId, name: stepName, properties, setId, setName, setProperty } =
    useStepEditor();

  const [formData, setFormData] = useState<any>({
    type: TaskType.Version,
    name: "",
    id: "",
    method: "",
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  let data: any;

  useEffect(() => {
    if (properties?.taskSettings) {
      data = properties?.taskSettings;
      // Include step's name from useStepEditor (not from taskSettings)
      setFormData((prev: any) => ({ ...prev, ...data, name: stepName || data.name || '' }));
    } else {
      // Initialize name from step even if no taskSettings
      setFormData((prev: any) => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

  const onPayloadCallback = (payload: any) => {
    const _formData: any = { ...formData, payload: payload };

  };


  const onChange = (e: any) => {
    if (e.event) {
      e.event.preventDefault();
      let _formData = formData;
      delete _formData.payload;
      delete _formData.documentId;
      setFormData({ ..._formData });

    }
  };

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
              label: { text: "Method" },
              dataField: "method",
              editorType: "dxSelectBox",
              isRequired: true,
              editorOptions: {
                dataSource: Object.values(VersionMethodType),
                onValueChanged: (e: any) => onChange(e),
                searchEnabled: true
              },
            },
            {
              label: { text: "Document Id" },
              dataField: "documentId",
              visible: formData.method === VersionMethodType.Get || formData.method === VersionMethodType.Upsert,
            },
            {
              label: { text: "Payload" },
              visible: formData.method === VersionMethodType.Upsert,
              template: async (data: any, itemElement: any) => {
                const root = createRoot(itemElement!);
                root.render(
                  <Payload
                    data={formData.payload}
                    callback={onPayloadCallback}
                  />
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
</>
  );
};
