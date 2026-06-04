import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { createRoot } from "react-dom/client";
import MDEditor from "@uiw/react-md-editor";
import { DXButton, DXForm } from "../../../../components/atoms";
import { DXPopup } from "../../../../components/template";
import { useStepEditor } from "../../../../react";
import {
  errorDefinition,
  errorStatusCode,
  failedDefinition,
  failedStatusCode,
  successDefinition,
  successStatusCode,
} from "../../common.entity";

import { Payload } from "../../../../components/molecules";
import { useAppSelector } from "../../../../store/customHooks";
import { TaskType } from "../../rule";
import { ActionMethodType } from "../../rule/task.action";

export function ActionPaging() {
  let { id: stepId, name: stepName, setId, setName, properties, setProperty } =
    useStepEditor();
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    method: ActionMethodType.Paging,
    type: TaskType.Action,
    take: "",
    skip: "",
    orderby: "",
    asc: "",
    page: "",
    description: "",
    payload: [],
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  let SchemasDataSource = useAppSelector((state) => state.schema.schemas);

  useEffect(() => {
    if (properties?.taskSettings) {
      const data: any = properties?.taskSettings;
      setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, method: properties.type as ActionMethodType.Paging, name: stepName || data.name || '' }));
    } else {
      setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

  const onPayloadCallback = (payload: any) => {
    const _formData = { ...formData, payload };
    // setProperty("taskSettings", _formData);
    autoSave(_formData);
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
              label: { text: "Take" },
              dataField: "take",
              isRequired: true,
            },
            {
              label: { text: "Skip" },
              dataField: "skip",
              isRequired: true,
            },
            {
              label: { text: "OrderBy" },
              dataField: "orderby",
              isRequired: true,
            },
            {
              label: { text: "Asc" },
              dataField: "asc",
            }, {
              label: { text: "Page" },
              dataField: "page",
            }, {
              label: { text: "Repository" },
              dataField: "repository",
            },
            {
              itemType: "group",
              caption: "",
              cssClass: "no-margin",
              colCount: 1,
              template: (data: any, itemElement: any) => {
                // Ensure DXForm template container allows scrolling
                let el: HTMLElement | null = itemElement;
                while (el) {
                  const overflow = getComputedStyle(el).overflow;
                  if (overflow === 'hidden') el.style.overflow = 'visible';
                  if (el.classList.contains('dx-form')) break;
                  el = el.parentElement;
                }
                const root = createRoot(itemElement!);
                root.render(
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: "block" }}>Description</label>
                    <div data-color-mode="light" style={{ overflow: "auto", position: "relative" }}>
                      <MDEditor
                        height={150}
                        preview="edit"
                        hideToolbar
                        value={formData?.description || ""}
                        onChange={(val: any) => {
                          const _formData = { ...formData, description: val || "" };
                          setFormData(_formData);
                          autoSave(_formData);
                        }}
                      />
                    </div>                    {formData?.description && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                        <button
                          type="button"
                          title="View Description"
                          style={{
                            background: "none",
                            border: "1px solid #ccc",
                            borderRadius: 4,
                            cursor: "pointer",
                            padding: "2px 10px",
                            fontSize: 12,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            color: "#337ab7",
                          }}
                          onClick={() => setIsDescriptionOpen(true)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          View
                        </button>
                      </div>
                    )}                  </div>
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
                    data={formData.payload}
                    callback={onPayloadCallback}
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

      {isDescriptionOpen && (
        <DXPopup
          onHiding={() => setIsDescriptionOpen(false)}
          title="Description"
          visible={isDescriptionOpen}
          fullScreen
        >
          <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 8, boxSizing: "border-box" }}>
            <div data-color-mode="light" style={{ flex: 1, overflow: "auto", position: "relative" }}>
              <MDEditor
                height="100%"
                preview="preview"
                hideToolbar
                value={formData?.description || ""}
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <DXButton
                text="Close"
                type="normal"
                stylingMode="outlined"
                onClick={() => setIsDescriptionOpen(false)}
              />
            </div>
          </div>
        </DXPopup>
      )}
</>
  );
}
