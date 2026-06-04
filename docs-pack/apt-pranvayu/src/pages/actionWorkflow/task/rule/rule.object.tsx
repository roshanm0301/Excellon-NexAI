import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { DXForm } from "../../../../components/atoms";
import { regEx, regexEx } from "../../../../components/constant/regex";
import { Payload } from "../../../../components/molecules";
import { useStepEditor } from "../../../../react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { useAppSelector } from "../../../../store/customHooks";
import { isRequiredField, isValidField } from "../../../../utility/utils";
import {
  errorDefinition,
  errorStatusCode,
  failedDefinition,
  failedStatusCode,
  successDefinition,
  successStatusCode,
} from "../../common.entity";
import { ITaskRuleExecute, ITaskRuleObject, TaskType } from "../../rule";
import { MethodType } from "./rule.entity";

export const RuleObject = React.memo(() => {
  let { id: stepId, name: stepName, setId, setName, properties, setProperty } = useStepEditor();
  const [toggle, setToggle] = useState(true)
  let { subscriptionListByIdentity } = useAppSelector((state) => state.subscription);
  let { config } = useAppSelector((state) => state.auth);
  let SchemasDataSource = useAppSelector((state) => state.schema.schemas);

  const [formData, setFormData] = useState<ITaskRuleObject>({
    id: "",
    name: '',
    type: TaskType.Rule,
    method: MethodType.Object,
    subscription: '{$.subscription.id}',
    schema: '{$.params.schema}',
    documentId: '{$.params.documentId}',
    payload: [],
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  useEffect(() => {
    if (properties?.taskSettings) {
      const data = properties?.taskSettings as ITaskRuleExecute;
      setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, method: properties.type as MethodType.Object, name: stepName || data.name || '' }));
    } else {
      setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

  const onPayloadCallback = (payload: any) => {
    const _formData = { ...formData, payload };
    autoSave(_formData);
  };

  const onChange = (e: any) => {
    setToggle(!toggle)
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
            label: { text: "Subscription Id", location: "top" },
            dataField: "subscription",
            validationRules: [
              {
                type: "required",
                message: isRequiredField("subscription"),
              },
              {
                type: "pattern",
                pattern: regEx.pattern,
                message: isValidField(`subscription ${regexEx.pattern}`),
              },
            ],
          },
          {
            itemType: "group",
            colCount: 4,
            items: [
              {
                label: { text: "Schema", location: "top" },
                dataField: "schema",
                editorType: "dxSelectBox",
                isRequired: true,
                visible: !toggle,
                editorOptions: {
                  dataSource: SchemasDataSource,
                  displayExpr: "SystemName",
                  valueExpr: "id",
                  searchEnabled: true
                },
                colSpan: 3
              },
              {
                label: { text: "Schema", location: "top" },
                dataField: "schema",
                isRequired: true,
                visible: toggle,
                colSpan: 3
              },
              {
                label: { text: " ", location: "top" },
                dataField: "toggle",
                editorType: "dxCheckBox",
                cssClass: "checkBox-toggle",
                editorOptions: {
                  onValueChanged: (e: any) => onChange(e),
                },
              },
            ],
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
            itemType: "group",
            caption: "",
            cssClass: "no-margin",
            colCount: 1,
            template: async (data: any, itemElement: any) => {
              const root = createRoot(itemElement!);
              root.render(
                <Payload
                  data={formData.payload}
                  isCallFromResolver={true}
                  callback={onPayloadCallback}
                  SubscriptionList={subscriptionListByIdentity}
                  config={config}
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
);
})
