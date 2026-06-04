import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { DXForm } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import { useAppSelector } from "../../../../store/customHooks";
import { isRequiredField } from "../../../../utility/utils";
import {
  errorDefinition,
  errorStatusCode,
  failedDefinition,
  failedStatusCode,
  successDefinition,
  successStatusCode,
} from "../../common.entity";
import { ITaskGetById, TaskType } from "../../rule";
import { ITaskGetUIComponent, UIComponentMethodType } from "../../rule/task.uiComponent";

export function UIComponentGet() {
  let { id: stepId, name: stepName, setId, setName, properties, setProperty } =
    useStepEditor();
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    method: UIComponentMethodType.Get,
    type: TaskType.UIComponent,
    documentId: "",
    schema: "",
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);
  let SchemasDataSource = useAppSelector((state) => state.schema.schemas);
  const [toggle, setToggle] = useState(false)

  useEffect(() => {
    if (properties?.taskSettings) {
      const data = properties?.taskSettings as ITaskGetUIComponent;
      setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, method: properties.type as UIComponentMethodType.Get, name: stepName || data.name || '' }));
    } else {
      setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

  useEffect(() => {
    if (SchemasDataSource) {
      const data = properties?.taskSettings as ITaskGetById;
      const selectedSchema: any = SchemasDataSource?.find((item: any) => { return item.id === data?.schema })
      // If selected schema (resolved path e.g. {$.body.schemaId}) is available in list then show text box 
      if (selectedSchema) {
        setToggle(false);
      }

    }
  }, [SchemasDataSource]);

  const onChange = (e: any) => {
    setToggle(!toggle)
  }

  return (
      

        <DXForm onFieldDataChanged={onFieldDataChanged}
          stylingMode="outlined"
          formData={formData}
          items={[
            {
              label: { text: "id", location: "top" },
              dataField: "id",
            }, {
              label: { text: "Name", location: "top" },
              dataField: "name",
              isRequired: true,
            },

            {
              label: { text: "Schema", location: "top" },
              dataField: "schema",
              editorType: "dxSelectBox",
              // isRequired: true,
              visible: !toggle,
              editorOptions: {
                dataSource: SchemasDataSource,
                displayExpr: "SystemName",
                valueExpr: "id",
                searchEnabled: true
              },
            },

            {
              label: { text: "Document Id", location: "top" },
              dataField: "documentId",
              validationRules: [
                {
                  type: "required",
                  message: isRequiredField("documentId"),
                },
                // {
                //   type: "pattern",
                //   pattern: regEx.pattern,
                //   message: isValidField(`documentId ${regexEx.pattern}`),
                // },
              ],
            },
            {
              label: { text: "Repository" },
              dataField: "repository",
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
