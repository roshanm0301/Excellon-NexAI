import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { createRoot } from "react-dom/client";
import { v4 } from "uuid";
import { DXForm } from "../../../../components/atoms";
import { regEx } from "../../../../components/constant/regex/regex";
import { regexEx } from "../../../../components/constant/regex/regexEx";
import { MergePath, Payload } from "../../../../components/molecules";
import { QueryBuilderTemplate } from "../../../../components/template";
import { useStepEditor } from "../../../../react";
import { isRequiredField, isValidField } from "../../../../utility/utils";
import { errorDefinition, errorStatusCode, failedDefinition, successDefinition, successStatusCode } from "../../common.entity";
import { TaskType } from "../../rule";
import { ArrayMethodType } from "./array.entity";

export const Array = () => {
  let { id: stepId, name: stepName, setId, properties, setName, setProperty } =
    useStepEditor();

  const [formData, setFormData] = useState<any>({
    type: TaskType.Array,
    name: "",
    id: "",
    method: "",
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  const onPayloadCallbackMerge = (path: any) => {
    const _formData: any = { ...formData, paths: path };
    autoSave(_formData);
  };

  const onPayloadCallback = (payload: any) => {
    const _formData: any = { ...formData, payload: payload };

  };

  let data: any;

  useEffect(() => {
    if (properties?.taskSettings) {
      data = properties?.taskSettings;

      if (data.method === "Merge") {
        if (data.paths.length > 0) {
          let _paths = data?.paths?.map((item: any) => {
            if (item?.id) {
              return { id: v4(), Value: item.Value }
            } else {
              return { id: v4(), Value: item }
            }
          })
          setFormData((prev: any) => ({ ...prev, ...data, id: stepId || data.id || prev.id, name: stepName || data.name || prev.name, paths: _paths }));
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
      delete _formData.value;
      delete _formData.fromIndex;
      delete _formData.path;
      delete _formData.key;
      delete _formData.paths;
      delete _formData.index;
      delete _formData.separator;
      delete _formData.payload;
      delete _formData.operator;
      delete _formData.conditions;
      delete _formData.asc;
      delete _formData.distinct;
      delete _formData.var;
      setFormData({ ..._formData });
      if (e.value === "Sort") {
        setFormData({ ..._formData, asc: false });
      } else if (e.value === "ToArray") {
      }
    }
  };

  const onQueryCallBack = (conditions: any) => {
    const _formData = { ...formData, conditions: conditions };
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
                dataSource: Object.values(ArrayMethodType),
                onValueChanged: (e: any) => onChange(e),
                searchEnabled: true
              },
            },
            {
              label: { text: "Path" },
              isRequired: true,
              visible: formData.method === ArrayMethodType.Merge,
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
              template: async (data: any, itemElement: any) => {
                const root = createRoot(itemElement!);
                root.render(
                  <MergePath
                    title={'Paths'}
                    data={formData.paths}
                    callback={onPayloadCallbackMerge}
                  />
                );
              },
            },
            {
              label: { text: "Value" },
              dataField: "value",
              isRequired: true,
              visible: formData.method === ArrayMethodType.Push,
            },
            {
              label: { text: "Key" },
              dataField: "key",
              isRequired: true,
              visible: formData.method === ArrayMethodType.Sort,
            },
            {
              label: { text: "Separator" },
              dataField: "separator",
              visible: formData.method === ArrayMethodType.Join,
            },
            {
              label: { text: "Asc", location: "left" },
              dataField: "asc",
              editorType: "dxCheckBox",
              visible: formData.method === ArrayMethodType.Sort,
            },
            {
              label: { text: "Path" },
              dataField: "path",
              visible:
                formData.method === ArrayMethodType.Map ||
                formData.method === ArrayMethodType.IsArray ||
                formData.method === ArrayMethodType.Count ||
                formData.method === ArrayMethodType.Find ||
                formData.method === ArrayMethodType.Slice ||
                formData.method === ArrayMethodType.Splice ||
                formData.method === ArrayMethodType.Join ||
                formData.method === ArrayMethodType.Sort ||
                formData.method === ArrayMethodType.Index ||
                formData.method === ArrayMethodType.Filter ||
                formData.method === ArrayMethodType.ToArray ||
                formData.method === ArrayMethodType.Push ||
                formData.method === ArrayMethodType.Distinct,

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
              label: { text: "Property" },
              dataField: "property",
              isRequired: true,
              visible: formData.method === ArrayMethodType.ToArray,
            },
            {
              label: { text: "Distinct", location: "left" },
              defaultValue: true,
              dataField: "distinct",
              editorType: "dxCheckBox",
              visible: formData.method === ArrayMethodType.ToArray,
            },
            {
              label: { text: "FromIndex" },
              dataField: "fromIndex",
              isRequired: true,
              visible: formData.method === ArrayMethodType.Slice,
            },
            {
              label: { text: "Index" },
              dataField: "index",
              isRequired: true,
              visible:
                formData.method === ArrayMethodType.Slice ||
                formData.method === ArrayMethodType.Splice ||
                formData.method === ArrayMethodType.Index,
              validationRules: [
                {
                  type: "required",
                  message: isRequiredField("index"),
                },
              ],
            },
            {
              label: { text: "Var" },
              dataField: "var",
              isRequired: true,
              visible:
                formData.method === ArrayMethodType.Map ||
                formData.method === ArrayMethodType.Sort ||
                formData.method === ArrayMethodType.Filter ||
                formData.method === ArrayMethodType.Find,
            },
            {
              label: { text: "Payload" },
              visible: formData.method === ArrayMethodType.Map,
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
              label: { text: "Conditions", location: "top" },
              dataField: "conditions",
              isRequired: true,
              visible: formData.method === ArrayMethodType.Filter || formData.method === ArrayMethodType.Find,
              template: async (data: any, itemElement: any) => {
                const root = createRoot(itemElement!);
                root.render(
                  <QueryBuilderTemplate
                    conditions={data.editorOptions.value}
                    callBack={onQueryCallBack}
                  ></QueryBuilderTemplate>
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
