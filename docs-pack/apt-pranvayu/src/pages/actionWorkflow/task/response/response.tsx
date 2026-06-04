import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { createRoot } from "react-dom/client";
import { v4 } from "uuid";
import { DXForm } from "../../../../components/atoms";
import { Payload } from "../../../../components/molecules";
import { useStepEditor } from "../../../../react";
import { DefaultPayload } from "../../action.definition";
import { errorDefinition, failedDefinition, failedStatusCode, successDefinition } from "../../common.entity";
import { ITaskResponse, TaskType } from "../../rule";
import { useAppSelector } from "../../../../store/customHooks";

export function Response() {
  let { id: stepId, name: stepName, setId, setName, properties, setProperty ,
    definition,
  } = useStepEditor();
  
  const [formData, setFormData] = useState({
    id: "", // hardcode for now
    name: "",
    type: TaskType.Response,
    payload: DefaultPayload,
    success: successDefinition,
    failed: failedDefinition,
    error: errorDefinition,
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);
  let { subscriptionListByIdentity } = useAppSelector((state) => state.subscription);
  let { config } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (properties?.taskSettings) {
      const data = properties?.taskSettings as ITaskResponse;
      setFormData((prev: any) => ({
        ...prev,
        ...data,
        id: stepId || data.id || prev.id,
        name: stepName || data.name || prev.name,
        payload: data.payload?.map((item: any) => {
          return { ...item, id: v4() };
        }),
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

  const onPayloadCallback = (payload: any) => {
    const _formData = { ...formData, payload };
    autoSave(_formData);
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
                  isCallFromResolver={true}
                  SubscriptionList={subscriptionListByIdentity}
                  config={config}
                />
              );
            },
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

