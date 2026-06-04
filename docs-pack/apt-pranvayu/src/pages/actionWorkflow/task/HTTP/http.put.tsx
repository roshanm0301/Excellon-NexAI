import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { createRoot } from "react-dom/client";
import { DXForm } from "../../../../components/atoms";
import { Payload } from "../../../../components/molecules";
import { useStepEditor } from "../../../../react";
import { isRequiredField } from "../../../../utility/utils";
import {
  errorDefinition,
  errorStatusCode,
  failedDefinition,
  failedStatusCode,
  successDefinition,
  successStatusCode,
} from "../../common.entity";
import { HttpMethodType, TaskType } from "../../rule";
import { ContentTypes } from "./http.entity";

export function HTTPPut() {
  let { id: stepId, name: stepName, setId, setName, properties, setProperty } =
    useStepEditor();
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    url: "",
    type: TaskType.HTTP,
    method: HttpMethodType.Put,
    contentType: "",
    body: [],
    path: false,
    params: [],
    headers: [],
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  useEffect(() => {
    if (properties?.taskSettings) {
      const data: any = properties?.taskSettings;
      setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, method: properties.type as HttpMethodType.Put, name: stepName || data.name || '' }));
    } else {
      setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

  const onBodyCallback = (payload: any) => {
    const _formData = { ...formData, body: payload };
    autoSave(_formData);
  };
  const onHeaderCallback = (payload: any) => {
    const _formData = { ...formData, headers: payload };
    autoSave(_formData);
  };

  const onParamsCallback = (payload: any) => {
    const _formData = { ...formData, params: payload };
    autoSave(_formData);
  };

  const onChange = (e: any) => {
    if (e.event) {
      e.event.preventDefault();
      let _formData: any = formData;
      delete _formData.body
      setFormData({ ..._formData })
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
            validationRules: [
              {
                type: "required",
                message: isRequiredField("Id"),
              },
            ],
          }, {
            label: { text: "Name", location: "top" },
            dataField: "name",
          },
          {
            label: { text: "URL", location: "top" },
            dataField: "url",
            validationRules: [
              {
                type: "required",
                message: isRequiredField("url"),
              },
            ],
          },
          {
            label: { text: "Content Type", location: "top" },
            dataField: "contentType",
            editorType: "dxSelectBox",
            isRequired: true,
            editorOptions: {
              dataSource: Object.values(ContentTypes),
              onValueChanged: (e: any) => onChange(e),
              searchEnabled: true
            },
          },
          {
            label: { text: "Path", location: "left" },
            dataField: "path",
            editorType: "dxCheckBox",
            cssClass: "checkBox-toggle",
            editorOptions: {
              onValueChanged: (e: any) => onChange(e),
            },
            visible: formData.contentType === ContentTypes.Json
          },
          {
            label: { text: "Body", location: "top" },
            dataField: "body",
            visible: formData.contentType === ContentTypes.Text || (formData.contentType === ContentTypes.Json && formData.path)
          },
          {
            itemType: "group",
            caption: "",
            cssClass: "no-margin",
            colCount: 1,
            visible: (formData.contentType === ContentTypes.Json || formData.contentType === ContentTypes.FormURLEncoded) && !formData.path,
            template: async (data: any, itemElement: any) => {
              const root = createRoot(itemElement!);
              root.render(
                <Payload
                  title={"Body"}
                  data={formData.body}
                  callback={onBodyCallback}
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
                  title={"Header"}
                  data={formData.headers}
                  callback={onHeaderCallback}
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
                  title={"Params"}
                  data={formData.params}
                  callback={onParamsCallback}
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
