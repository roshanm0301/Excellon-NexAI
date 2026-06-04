import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { createRoot } from "react-dom/client";
import { DXForm } from "../../../../components/atoms";
import { Payload } from "../../../../components/molecules";
import { useStepEditor } from "../../../../react";
import {
  errorDefinition,
  errorStatusCode,
  failedDefinition,
  failedStatusCode,
  successDefinition,
  successStatusCode,
} from "../../common.entity";
import { QueryMethodType, TaskType } from "../../rule";
import { QueryBuilderTemplate } from "../../../../components/template";
import { QueryBuilderTemplateV2 } from "../../../../components/template/query-builder/query-builder-v2";

export function WhereQuery() {
  let { id: stepId, name: stepName, setId, setName, properties, setProperty } =
    useStepEditor();

  let advancedCondition = {
    And: [],
    Any: [],
    Operator: "",
    Key: "",
    Value: "",
  };

  let condition = { and: [], any: [], operator: "", key: "", value: "" };

  const [formData, setFormData] = useState({
    id: "",
    type: TaskType.Query,
    name: "",
    method: "Where",
    where: "",
    select: [],
    order: [],
    advancedQuery: false,
    conditions: {},
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  useEffect(() => {
    if (properties?.taskSettings) {
      const data: any = properties?.taskSettings;
      setFormData(prev => ({
        ...prev,
        ...data, id: stepId || data.id || prev.id, method: properties.type as QueryMethodType.Where,
      }));
    }
  }, [stepId, stepName, properties]);

  const onPayloadCallbackForSelect = (payload: any) => {
    const _formData = { ...formData, select: payload };
    autoSave(_formData);
  };
  
  const onPayloadCallbackForOrder = (payload: any) => {
    const _formData = { ...formData, order: payload };
    autoSave(_formData);
  };

  const onQueryCallBack = (conditions: any) => {
    const _formData = { ...formData, conditions: conditions };
    autoSave(_formData);
  };

  const onChange = (e: any) => {
    if (e.event) {
      if (e.value === true) {
        setFormData({
          ...formData,
          conditions: advancedCondition,
        });
      } else {
        setFormData({
          ...formData,
          conditions: condition,
        });
      }
    }
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
              label: { text: "Where", location: "top" },
              dataField: "where",
              isRequired: true,
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
                    title={"Select"}
                    data={formData.select}
                    callback={onPayloadCallbackForSelect}
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
                    title={"Order"}
                    data={formData.order}
                    callback={onPayloadCallbackForOrder}
                  />
                );
              },
            },
            {
              label: { text: "AdvancedQuery", location: "left" },
              dataField: "advancedQuery",
              editorType: "dxCheckBox",
              editorOptions: {
                onValueChanged: (e: any) => onChange(e),
              },
            },
            {
              label: "Condition",
              dataField: "conditions",
              isRequired: true,
              visible: !formData?.advancedQuery,
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
              label: "Condition",
              dataField: "conditions",
              isRequired: true,
              visible: formData?.advancedQuery,
              template: async (data: any, itemElement: any) => {
                const root = createRoot(itemElement!);
                root.render(
                  <QueryBuilderTemplateV2
                    conditions={data.editorOptions.value}
                    callBack={onQueryCallBack}
                  ></QueryBuilderTemplateV2>
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
