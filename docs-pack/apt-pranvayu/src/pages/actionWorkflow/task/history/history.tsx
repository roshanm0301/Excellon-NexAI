import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { createRoot } from "react-dom/client";
import { DXForm } from "../../../../components/atoms";
import { Payload } from "../../../../components/molecules";
import { useStepEditor } from "../../../../react";
import { errorDefinition, errorStatusCode, failedDefinition, successDefinition, successStatusCode } from "../../common.entity";
import { TaskType } from "../../rule";
import { HistoryMethodType } from "./history.entity";

export const HistoryTask = () => {
  let { id: stepId, name: stepName, properties, setId, setName, setProperty } =
    useStepEditor();

  const [formData, setFormData] = useState<any>({
    type: TaskType.History,
    name: "",
    id: "",
    method: "",
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  let data: any;

  useEffect(() => {
    if (properties?.taskSettings) {
      data = properties?.taskSettings;
      setFormData((prev: any) => ({ ...prev, ...data, id: stepId || data.id || prev.id, name: stepName || data.name || prev.name }));
    } else {
      setFormData((prev: any) => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

  const onPayloadCallback = (payload: any) => {
    const _formData: any = { ...formData, payload: payload };

  };

  const onWhereCallback = (where: any) => {
    const _formData: any = { ...formData, where: where };

  };


  const onChange = (e: any) => {
    if (e.event) {
      e.event.preventDefault();
      let _formData = formData;
      delete _formData.payload;
      delete _formData.documentId;
      delete _formData.skip;
      delete _formData.take;
      delete _formData.asc;
      delete _formData.page;
      delete _formData.orderby;
      delete _formData.where
      setFormData({ ..._formData });

    }
  };

  return (
    <>
      
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
                dataSource: Object.values(HistoryMethodType),
                onValueChanged: (e: any) => onChange(e),
                searchEnabled: true
              },
            },
            {
              label: { text: "Take" },
              dataField: "take",
              isRequired: true,
              visible: formData.method === HistoryMethodType.Paging
            },
            {
              label: { text: "Skip" },
              dataField: "skip",
              isRequired: true,
              visible: formData.method === HistoryMethodType.Paging,
            }, {
              label: { text: "Order By" },
              dataField: "orderby",
              isRequired: true,
              visible: formData.method === HistoryMethodType.Paging,
            }, {
              label: { text: "Asc" },
              dataField: "asc",
              isRequired: true,
              visible: formData.method === HistoryMethodType.Paging,
            }, {
              label: { text: "Page" },
              dataField: "page",
              isRequired: true,
              visible: formData.method === HistoryMethodType.Paging,
            }, {
              label: { text: "Document Id" },
              dataField: "documentId",
              isRequired: true,
              visible: formData.method === HistoryMethodType.Get || formData.method === HistoryMethodType.Put,
            },
            {
              label: { text: "Payload" },
              visible: formData.method === HistoryMethodType.Post || formData.method === HistoryMethodType.Put,
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
              label: { text: "Where" },
              visible: formData.method === HistoryMethodType.List,
              template: async (data: any, itemElement: any) => {
                const root = createRoot(itemElement!);
                root.render(
                  <Payload
                    title="Where"
                    data={formData.where}
                    callback={onWhereCallback}
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
        />
</>
  );
};
