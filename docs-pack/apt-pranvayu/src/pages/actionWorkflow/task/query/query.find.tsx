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
import { QueryBuilderTemplateV2 } from "../../../../components/template/query-builder/query-builder-v2";

export function FindQuery() {
  let { id: stepId, name: stepName, setId, setName, properties, setProperty } = useStepEditor();

  // Object format for advancedQuery = true
  let advancedCondition = {
    And: [],
    Any: [],
    Operator: "",
    Key: "",
    Value: "",
  };

  // Array format for advancedQuery = false
  let simpleCondition: any[] = [];

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    type: TaskType.Query,
    method: "Find",
    take: 25,
    where: [] as any[] | object, // Array when advancedQuery=false, Object when advancedQuery=true
    advancedQuery: false,
    elasticsearch: { enable: false },
    sort: [],
    select: [],
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
        ...data, id: stepId || data.id || prev.id, method: properties.type as QueryMethodType.Find,
      }));
    }
  }, [stepId, stepName, properties]);

  const onPayloadCallback = (payload: any) => {
    const _formData = { ...formData, where: payload };
    autoSave(_formData);
  };

  const onSortCallback = (payload: any) => {
    const _formData = { ...formData, sort: payload };
    autoSave(_formData);
  };

  const onSelectCallback = (payload: any) => {
    const _formData = { ...formData, select: payload };
    autoSave(_formData);
  };

  const onChange = (e: any) => {
    if (e.event) {
      if (e.value === true) {
        // advancedQuery checked - store where as object
        setFormData({
          ...formData,
          advancedQuery: true,
          where: advancedCondition,
        });
      } else {
        // advancedQuery unchecked - store where as array
        setFormData({
          ...formData,
          advancedQuery: false,
          where: simpleCondition,
        });
      }
    }
  };

  const onQueryCallBack = (conditions: any) => {
    // Store advanced query conditions in where as object
    const _formData = { ...formData, where: conditions };
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
            label: { text: "Repository" },
            dataField: "repository",
          },
          {
            label: { text: "Take" },
            dataField: "take",
            editorType: "dxNumberBox",
            validationRules: [
              {
                type: "stringLength",
                min: 1,
                max: 3,
                message: "Please enter a value between 1 and 3 characters",
              },
            ],
          },

          {
            label: { text: "Elasticsearch", location: "left" },
            dataField: "elasticsearch.enable",
            editorType: "dxCheckBox",
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
            itemType: "group",
            caption: "",
            cssClass: "no-margin",
            colCount: 1,
            visible: !formData?.advancedQuery,
            template: async (data: any, itemElement: any) => {
              const root = createRoot(itemElement!);
              root.render(
                <Payload
                  enableOperator={true}
                  title={"Where"}
                  data={formData.where}
                  callback={onPayloadCallback}
                />
              );
            },
          },
          {
            label: { text: "Conditions", location: "top" },
            dataField: "where",
            caption: "Condition",
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
            caption: "",
            cssClass: "no-margin",
            colCount: 1,
            template: async (data: any, itemElement: any) => {
              const root = createRoot(itemElement!);
              root.render(
                <Payload
                  enableOperator={true}
                  title={"sort"}
                  data={formData.sort}
                  callback={onSortCallback}
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
                  enableOperator={true}
                  title={"select"}
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
