import { useEffect, useState } from "react";
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
import { useAutoSave } from "../../hooks/useAutoSave";
import { IKeyValue, TaskType } from "../../rule";
import { ITaskKeycloakRoleFind, KeycloakMethodType } from "../../rule/task.keycloak";

export function KeyCloakRoleFind() {
  let { id: stepId, name: stepName, setId, setName, properties, setProperty } =
    useStepEditor();
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    method: KeycloakMethodType.RoleFind,
    type: TaskType.Keycloak,
    baseUrl: "",
    realm: "",
    adminUsername: "",
    password: "",
    grantType: "",
    clientId: "",
    clientSecret: "",
    query: [] as IKeyValue[],
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  useEffect(() => {
    if (properties?.taskSettings) {
      const data = properties?.taskSettings as ITaskKeycloakRoleFind;
      setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, method: properties.type as KeycloakMethodType.RoleFind, name: stepName || data.name || '' }));
    } else {
      setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

  const onPayloadCallback = (payload: any) => {
    const _formData = { ...formData, query: payload };
    autoSave(_formData);
  };

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
          label: { text: "BaseUrl", location: "top" },
          dataField: "baseUrl"
        },
        {
          label: { text: "realm" },
          dataField: "realm",
        },
        {
          label: { text: "adminUsername" },
          dataField: "adminUsername",
        },
        {
          label: { text: "password" },
          dataField: "password",
        },
        {
          label: { text: "grantType" },
          dataField: "grantType",
        },
        {
          label: { text: "clientId" },
          dataField: "clientId",
        },
        {
          label: { text: "clientSecret" },
          dataField: "clientSecret",
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
                data={formData.query}
                callback={onPayloadCallback}
                isCallFromResolver={true}
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
}
