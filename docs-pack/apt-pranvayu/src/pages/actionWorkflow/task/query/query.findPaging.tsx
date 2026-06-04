import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { createRoot } from "react-dom/client";
import { DXForm } from "../../../../components/atoms";
import { regEx } from "../../../../components/constant/regex/regex";
import { regexEx } from "../../../../components/constant/regex/regexEx";
import { Payload } from "../../../../components/molecules";
import { useStepEditor } from "../../../../react";
import { isRequiredField, isValidField } from "../../../../utility/utils";
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

export function FindPagingQuery() {
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
    name: "",
    type: TaskType.Query,
    where: {},
    method: "FindPaging",
    take: "",
    skip: "",
    orderby: "",
    asc: "",
    page: "",
    advancedQuery: false,
    // conditions: {},
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
        ...data, id: stepId || data.id || prev.id, method: properties.type as QueryMethodType.FindPaging,
      }));
    }
  }, [stepId, stepName, properties]);

  const onPayloadCallbackForWhere = (payload: any) => {
    const _formData = { ...formData, where: payload };
    autoSave(_formData);
  };


  const onQueryCallBack = (conditions: any) => {
    const _formData = { ...formData, where: conditions };
    autoSave(_formData);
  };

  const onChange = (e: any) => {
    if (e.event) {
      if (e.value === true) {
        setFormData({
          ...formData,
          where: advancedCondition,
        });
      } else {
        setFormData({
          ...formData,
          where: [],
        });
      }
    }
  };

  return (
    
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
            label: { text: "Take", location: "top" },
            dataField: "take",
            validationRules: [
              {
                type: "required",
                message: isRequiredField("take"),
              },
              {
                type: "pattern",
                pattern: regEx.pattern,
                message: isValidField(`take ${regexEx.pattern}`),
              },
            ],
          },
          {
            label: { text: "Skip", location: "top" },
            dataField: "skip",
            validationRules: [
              {
                type: "required",
                message: isRequiredField("skip"),
              },
              {
                type: "pattern",
                pattern: regEx.pattern,
                message: isValidField(`skip ${regexEx.pattern}`),
              },
            ],
          },
          {
            label: { text: "Orderby", location: "top" },
            dataField: "orderby",
          },
          {
            label: { text: "Asc", location: "top" },
            dataField: "asc",
          },
          {
            label: { text: "Page", location: "top" },
            dataField: "page",
            validationRules: [
              {
                type: "required",
                message: isRequiredField("page"),
              },
              {
                type: "pattern",
                pattern: regEx.pattern,
                message: isValidField(`page ${regexEx.pattern}`),
              },
            ],
          },
          {
            label: { text: "Repository" },
            dataField: "repository",
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
                  title={"Where"}
                  enableOperator={true}
                  data={!formData?.advancedQuery
                    ? Array.isArray(formData?.where)
                      ? formData?.where
                      : Object.keys(formData?.where || {})?.length ? [formData?.where] : []
                    : formData?.where}
                  callback={onPayloadCallbackForWhere}
                />
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
                  conditions={formData?.where}
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
  );
}
