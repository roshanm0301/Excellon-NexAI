import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { DXForm } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import { useAutoSave } from "../../hooks/useAutoSave";
import {
  errorDefinition,
  errorStatusCode,
  failedDefinition,
  failedStatusCode,
  successDefinition,
  successStatusCode,
} from "../../common.entity";
import { TaskType } from "../../rule";
import { resolverMethod } from "./resolver.entity";
import { v4 } from "uuid";
import { regEx, regexEx } from "../../../../components/constant/regex";
import { Payload } from "../../../../components/molecules";
import { isValidField } from "../../../../utility/utils";
import { useAppSelector } from "../../../../store/customHooks";

export const Resolver = React.memo(() => {
  let { id: stepId, name: stepName, setId, setName, properties, setProperty } = useStepEditor();
  let { subscriptionListByIdentity } = useAppSelector((state) => state.subscription);
  let { config } = useAppSelector((state) => state.auth);
  const [formData, setFormData] = useState<any>({
    id: "",
    name: '',
    type: TaskType.Resolver,
    method: "Object",
    payload: [],
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  useEffect(() => {
    if (properties?.taskSettings) {
      const resolverData: any = properties?.taskSettings;
      setFormData((prev: any) => ({
        ...prev,
        ...resolverData,
        id: stepId || resolverData.id || prev.id,
        name: stepName || resolverData.name || prev.name,
        payload: resolverData.payload?.map((item: any) => {
          return { ...item, id: v4() };
        }),
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

  const onPayloadCallback = (payload: any) => {
    const _formData = { ...formData, payload };
    // setProperty("taskSettings", _formData);
    autoSave(_formData);
  };

  const handleChange = (e: any) => {
    if (e.event) {
      e.event.preventDefault();
      if (e.value === "Object") {
        const _formData = formData;
        delete _formData.string;
      } else {
        const _formData = formData;
        delete _formData.isArray;
        delete _formData.path;
      }
    }
  };

  const handleIsArrayChange = (e: any) => {
    if (e.event) {
      e.event.preventDefault();
      setFormData((prev: any) => ({ ...prev, isArray: e.value }));
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
            label: { text: "Method" },
            dataField: "method",
            editorType: "dxSelectBox",
            isRequired: true,
            editorOptions: {
              searchEnabled: true,
              dataSource: resolverMethod,
              onValueChanged: (e: any) => {
                handleChange(e);
              },
            },
          },
          {
            label: { text: "Is Array", location: "left" },
            dataField: "isArray",
            editorType: "dxCheckBox",
            visible: formData.method === "Object",
            editorOptions: {
              onValueChanged: (e: any) => {
                handleIsArrayChange(e);
              },
            },
          },
          {
            label: { text: "Path" },
            dataField: "path",
            visible: formData.method === "Object",
            isRequired: formData?.isArray === true ? true : false,
            validationRules: [
              {
                type: "pattern",
                pattern: regEx.pattern,
                message: isValidField(`path ${regexEx.pattern}`),
              },
            ],
          },
          {
            label: { text: "String" },
            dataField: "string",
            isRequired: true,
            visible: formData.method === "String",
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
                  isCallFromResolver={true}
                  data={formData.payload}
                  callback={(payload: any) => { onPayloadCallback(payload) }}
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
