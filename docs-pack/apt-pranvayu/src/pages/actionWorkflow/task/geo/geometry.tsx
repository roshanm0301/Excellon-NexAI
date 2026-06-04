import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { DXForm } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import { errorDefinition, failedDefinition, successDefinition } from "../../common.entity";
import { TaskType } from "../../rule";

export function Geometry() {
  let { id: stepId, name: stepName, setId, setName, properties, setProperty } =
    useStepEditor();
  const [formData, setFormData] = useState({
    id: "", // Will be synced from step.id
    name: "",
    type: TaskType.Geometry, // hardcoded readonly
    method: "Haversine", // hardcoded readonly
    latitude1: 0,
    latitude2: 0,
    longitude1: 0,
    longitude2: 0,
    // path: "", removed from back end
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  useEffect(() => {
    if (properties?.taskSettings) {
      const data: any = properties?.taskSettings;
      setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, name: stepName || data.name || '' }));
    } else {
      setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

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
            }, {
              label: { text: "Name", location: "top" },
              dataField: "name",
              isRequired: true
            },
            {
              label: { text: "Latitude 1", location: "top" },
              dataField: "latitude1",
              isRequired: true,
              editorType: 'dxTextBox'
            },
            {
              label: { text: "Latitude 2", location: "top" },
              dataField: "latitude2",
              isRequired: true,
              editorType: 'dxTextBox'
            },
            {
              label: { text: "Longitude 1", location: "top" },
              dataField: "longitude1",
              isRequired: true,
              editorType: 'dxTextBox'
            },
            {
              label: { text: "Longitude 2", location: "top" },
              dataField: "longitude2",
              isRequired: true,
              editorType: 'dxTextBox'
            },
            // {
            //   label: { text: "Path", location: "top" },
            //   dataField: "path",
            //   isRequired: true,
            // },
            {
              itemType: "group",
              caption: "Success",
              cssClass: "no-margin",
              colCount: 1,
              items: [
                {
                  label: { text: "Status Code" },
                  dataField: "success.statusCode",
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
        ></DXForm>
</>
  );
}
