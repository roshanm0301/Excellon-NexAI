import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { createRoot } from "react-dom/client";
import { DXForm } from "../../../../components/atoms";
import { regEx, regexEx } from "../../../../components/constant/regex";
import { Payload } from "../../../../components/molecules";
import { useStepEditor } from "../../../../react";
import { useAppSelector } from "../../../../store/customHooks";
import { isValidField } from "../../../../utility/utils";
import {
  errorDefinition,
  errorStatusCode,
  failedDefinition,
  failedStatusCode,
  successDefinition,
  successStatusCode,
} from "../../common.entity";
import { ITaskVariable, TaskType } from "../../rule";
import { VariableMethodType, ITaskVariablePickList } from "../../rule/task.variable";

export function VariableList() {
  let { id: stepId, name: stepName, setId, setName, properties, setProperty } =
    useStepEditor();
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    method: VariableMethodType.List,
    type: TaskType.Variable,
    repository: "",
    documentId: "",
    select: [],
    payload: [],
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);
  let SchemasDataSource = useAppSelector((state) => state.schema.schemas);
  const [toggle, setToggle] = useState(false);

  useEffect(() => {
    if (properties?.taskSettings) {
      const data: any = properties?.taskSettings as ITaskVariablePickList;
      setFormData(prev => ({
        ...prev,
        ...data, id: stepId || data.id || prev.id, method: properties.type,
      }));
    }
  }, [stepId, stepName, properties]);

  useEffect(() => {
    if (SchemasDataSource) {
      const data = properties?.taskSettings as ITaskVariable;
    }
  }, [SchemasDataSource]);

  const onPayloadCallback = (payload: any) => {
    const _formData = { ...formData, payload };
    autoSave(_formData);
  };
  const onSelectCallback = (select: any) => {
    const _formData = { ...formData, select: select };
    autoSave(_formData);
  };

  const onChange = (e: any) => {
    setToggle(!toggle);
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
            },
            {
              label: { text: "Name", location: "top" },
              dataField: "name",
              isRequired: true,
            },
            {
              label: { text: "Document Id", location: "top" },
              dataField: "documentId",
              validationRules: [
                {
                  type: "pattern",
                  pattern: regEx.pattern,
                  message: isValidField(`documentId ${regexEx.pattern}`),
                },
              ],
            },
            {
              label: { text: "Repository" },
              dataField: "repository",
            },
            {
              itemType: "group",
              caption: "",
              cssClass: "no-margin",
              colCount: 1,
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
              caption: "",
              cssClass: "no-margin",
              colCount: 1,
              template: async (data: any, itemElement: any) => {
                const root = createRoot(itemElement!);
                root.render(
                  <Payload
                    title="Select"
                    data={formData.select}
                    callback={onSelectCallback}
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
