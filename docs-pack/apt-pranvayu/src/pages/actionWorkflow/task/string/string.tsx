import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { createRoot } from "react-dom/client";
import { v4 } from "uuid";
import { DXForm } from "../../../../components/atoms";
import { regEx } from "../../../../components/constant/regex/regex";
import { regexEx } from "../../../../components/constant/regex/regexEx";
import { MergePath } from "../../../../components/molecules";
import { useStepEditor } from "../../../../react";
import { isRequiredField, isValidField } from "../../../../utility/utils";
import { errorDefinition, errorStatusCode, failedDefinition, successDefinition, successStatusCode } from "../../common.entity";
import { TaskType } from "../../rule";
import { StringMethodType } from "./string.entity";

export const String = () => {
  let { id: stepId, name: stepName, setId, properties, setName, setProperty } =
    useStepEditor();

  const [formData, setFormData] = useState<any>({
    type: TaskType.String,
    method: "",
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
    id: "",
    name: ""
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  let data: any;

  useEffect(() => {
    if (properties?.taskSettings) {
      data = properties?.taskSettings;
      if (data.method === "concat") {
        if (data?.strings?.length > 0 && Array.isArray(data?.strings)) {
          let _strings: any = data?.strings?.map((item: any) => {
            if (item?.id) {
              return { id: v4(), Value: item.Value }
            } else {
              return { id: v4(), Value: item }
            }
          })
          setFormData((prev: any) => ({ ...prev, ...data, id: stepId || data.id || prev.id, name: stepName || data.name || prev.name, strings: _strings }));
        } else {
          setFormData((prev: any) => ({ ...prev, ...data, id: stepId || data.id || prev.id, name: stepName || data.name || prev.name }))
        }
      } else {
        setFormData((prev: any) => ({ ...prev, ...data, id: stepId || data.id || prev.id, name: stepName || data.name || prev.name }));
      }
    } else {
      setFormData((prev: any) => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

  const onChange = (e: any) => {
    if (e.event) {
      e.event.preventDefault();
      let _formData: any = formData;
      delete _formData.index;
      delete _formData.path;
      delete _formData.start;
      delete _formData.end;
      delete _formData.strings;
      delete _formData.searchValue;
      delete _formData.replaceValue;
      delete _formData.splitValue;
      delete _formData.char;
      delete _formData.maxLength;
      delete _formData.fillString;
    }
  };
  const onPayloadCallbackMerge = (string: any) => {
    const _formData: any = { ...formData, strings: string };
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
              label: { text: "Method" },
              dataField: "method",
              editorType: "dxSelectBox",
              isRequired: true,
              editorOptions: {
                dataSource: Object.values(StringMethodType),
                onValueChanged: (e: any) => onChange(e),
                searchEnabled: true
              },
            },

            {
              label: { text: "Start" },
              dataField: "start",
              isRequired: true,
              visible:
                formData.method === StringMethodType.substring || formData.method === StringMethodType.slice,
            },
            {
              label: { text: "End" },
              dataField: "end",
              visible:
                formData.method === StringMethodType.substring ||
                formData.method === StringMethodType.slice
            },
            {
              label: { text: "Char", location: "left" },
              dataField: "char",
              visible: formData.method === StringMethodType.concat,
            },
            {
              label: { text: "Strings" },
              dataField: "strings",
              visible: formData.method === StringMethodType.concat,
              template: async (data: any, itemElement: any) => {
                const root = createRoot(itemElement!);
                root.render(
                  <MergePath
                    title={'Strings'}
                    data={formData.strings}
                    callback={onPayloadCallbackMerge}
                  />
                );
              },
            },
            {
              label: { text: "Index", location: "left" },
              dataField: "index",
              visible: formData.method === StringMethodType.indexOf || formData.method === StringMethodType.charAt,
            },
            {
              label: { text: "Path" },
              dataField: "path",
              visible:
                formData.method === StringMethodType.toLowerCase ||
                formData.method === StringMethodType.toUpperCase ||
                formData.method === StringMethodType.substring ||
                formData.method === StringMethodType.charAt ||
                formData.method === StringMethodType.indexOf ||
                formData.method === StringMethodType.replace ||
                formData.method === StringMethodType.slice ||
                formData.method === StringMethodType.split ||
                formData.method === StringMethodType.toString ||
                formData.method === StringMethodType.trim ||
                formData.method === StringMethodType.length ||
                formData.method === StringMethodType.toQueryString ||
                formData.method === StringMethodType.toObject ||
                formData.method === StringMethodType.padEnd ||
                formData.method === StringMethodType.padStart,
              isRequired: true,
              validationRules: [
                {
                  type: "required",
                  message: isRequiredField("path"),
                },
                {
                  type: "pattern",
                  pattern: regEx.pattern,
                  message: isValidField(`path ${regexEx.pattern}`),
                },
              ],
            },
            {
              label: { text: "SearchValue" },
              dataField: "searchValue",
              isRequired: true,
              visible: formData.method === StringMethodType.replace,
            },
            {
              label: { text: "Replace Value", location: "left" },
              dataField: "replaceValue",
              visible: formData.method === StringMethodType.replace,
            },
            {
              label: { text: "SplitValue" },
              dataField: "splitValue",
              isRequired: true,
              visible: formData.method === StringMethodType.split,
            },
            {
              label: { text: "Max Length", location: "left" },
              dataField: "maxLength",
              visible:
                formData.method === StringMethodType.padEnd ||
                formData.method === StringMethodType.padStart,
            },
            {
              label: { text: "Fill String", location: "left" },
              dataField: "fillString",
              visible:
                formData.method === StringMethodType.padEnd ||
                formData.method === StringMethodType.padStart,
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