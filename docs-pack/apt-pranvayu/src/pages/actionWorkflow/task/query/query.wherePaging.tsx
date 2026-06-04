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
import { QueryMethodType, TaskType } from "../../rule";

export function WherePagingQuery() {
  let { id: stepId, name: stepName, setId, setName, properties, setProperty } =
    useStepEditor();
  const [formData, setFormData] = useState({
    id: "",
    method: "WherePaging",
    type: TaskType.Query,
    name: "",
    take: "",
    skip: "",
    page: "",
    where: "",
    select: [],
    sort: [],
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  useEffect(() => {
    if (properties?.taskSettings) {
      const data: any = properties?.taskSettings;
      setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, method: properties.type as QueryMethodType.WherePaging, name: stepName || data.name || '' }));
    } else {
      setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

  const onSelectCallback = (payload: any) => {
    const _formData = { ...formData, select: payload };
    autoSave(_formData);
  };
  const onSortCallback = (payload: any) => {
    const _formData = { ...formData, sort: payload };
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
              label: { text: "Where", location: "top" },
              dataField: "where",
              validationRules: [
                {
                  type: "required",
                  message: isRequiredField("where"),
                },
                // {
                //   type: "pattern",
                //   pattern: regEx.pattern,
                //   message: isValidField(`where ${regexEx.pattern}`),
                // },
              ],
            },
            {
              label: { text: "Take", location: "top" },
              dataField: "take",
              validationRules: [
                {
                  type: "required",
                  message: isRequiredField("take"),
                },
                // {
                //   type: "pattern",
                //   pattern: regEx.pattern,
                //   message: isValidField(`take ${regexEx.pattern}`),
                // },
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
                // {
                //   type: "pattern",
                //   pattern: regEx.pattern,
                //   message: isValidField(`skip ${regexEx.pattern}`),
                // },
              ],
            },
            {
              label: { text: "Page", location: "top" },
              dataField: "page",
              validationRules: [
                {
                  type: "required",
                  message: isRequiredField("page"),
                },
                // {
                //   type: "pattern",
                //   pattern: regEx.pattern,
                //   message: isValidField(`page ${regexEx.pattern}`),
                // },
              ],
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
                    callback={onSelectCallback}
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
                    title={"Sort"}
                    data={formData.sort}
                    callback={onSortCallback}
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
