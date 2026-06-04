import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { createRoot } from "react-dom/client";
import { Provider as StoreProvider } from "react-redux";
import { DXForm } from "../../../../components/atoms";
import { regEx, regexEx } from "../../../../components/constant/regex";
import { useStepEditor } from "../../../../react";
import { getSchemaAPI } from "../../../../redux/actions";
import { useAppDispatch } from "../../../../store/customHooks";
import { store } from "../../../../store/store";
import {
  getLocalData,
  isRequiredField,
  isValidField,
} from "../../../../utility/utils";
import { AddRelations } from "../../../schema/schema.addRelations";
import {
  errorDefinition,
  errorStatusCode,
  failedDefinition,
  failedStatusCode,
  successDefinition,
  successStatusCode,
} from "../../common.entity";
import { ITaskDocumentGet, MethodType, TaskType } from "../../rule";

export function GetDocument() {
  let { id: stepId, name: stepName, setId, setName, properties, setProperty } =
    useStepEditor();
  const [formData, setFormData] = useState<any>({
    id: "", // Will be synced from step.id
    name: "",
    type: TaskType.Document, // hardcoded readonly
    method: MethodType.Get, // hardcoded readonly
    relations: [],
    subscriptionId: "{$.auth.subscriptionId}",
    schemaId: "",
    documentId: "",
    addRelation: false,
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  const dispatch = useAppDispatch();
  let schemaIdForColumnAPICall = getLocalData("params")?.SchemaId ?? "";
  const [columnList, setColumnList] = useState([]);

  useEffect(() => {
    if (properties?.taskSettings) {
      const data = properties?.taskSettings as ITaskDocumentGet;
      // Sync id from step.id (execution taskId) and name from step.name (display name)
      setFormData((prev: any) => ({
        ...prev,
        ...data,
        id: stepId || data.id || prev.id,
        method: properties.type as MethodType.Get,
        name: stepName || data.name || '',
      }));
    } else {
      // Initialize from step even if no taskSettings
      setFormData((prev: any) => ({
        ...prev,
        id: stepId || prev.id,
        name: stepName || prev.name
      }));
    }
    handleGetSchema(schemaIdForColumnAPICall);
  }, [stepId, stepName, properties]);

  const onRelationsDataCallback = (relations: any) => {
    const _formData = { ...formData, relations: relations };
    autoSave(_formData);
  };

  const handleGetSchema = async (SchemaId: any) => {
    const result: any = await dispatch(getSchemaAPI(SchemaId));
    if (result?.id) {
      setColumnList(result.Columns);
    }
  };

  const onChange = (e: any) => {
    if (e.event) {
      const _formData = { ...formData, addRelation: e.value };
      setFormData(_formData);
      autoSave(_formData);
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
          label: { text: "Document Id", location: "top" },
          dataField: "documentId",
          isRequired: true,
          validationRules: [
            {
              type: "required",
              message: isRequiredField("documentId"),
            },
            {
              type: "pattern",
              pattern: regEx.pattern,
              message: isValidField(`documentId ${regexEx.pattern}`),
            },
          ],
        },
        {
          label: { text: "Subscription Id", location: "top" },
          dataField: "subscriptionId",
          validationRules: [
            {
              type: "required",
              message: isRequiredField("subscriptionId"),
            },
            {
              type: "pattern",
              pattern: regEx.pattern,
              message: isValidField(`subscriptionId ${regexEx.pattern}`),
            },
          ],
        },
        {
          label: { text: "Schema Id", location: "top" },
          dataField: "schemaId",
          validationRules: [
            {
              type: "required",
              message: isRequiredField("schemaId"),
            },
            {
              type: "pattern",
              pattern: regEx.pattern,
              message: isValidField(`schemaId ${regexEx.pattern}`),
            },
          ],
        },
        {
          label: { text: "Add Realation", location: "left" },
          dataField: "addRelation",
          editorType: "dxCheckBox",
          editorOptions: {
            onValueChanged: (e: any) => onChange(e),
          },
        },
        {
          label: { text: "Relations", location: "top" },
          dataField: "Relations",
          visible: formData?.addRelation,
          template: async (data: any, itemElement: any) => {
            const root = createRoot(itemElement!);
            root.render(
              <StoreProvider store={store}>
                <AddRelations
                  disable={false}
                  title={"Add Relations"}
                  data={formData.relations}
                  callback={onRelationsDataCallback}
                  ParentSchemaColumn={columnList}
                />
              </StoreProvider>
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
              validationRules: [
                {
                  type: "pattern",
                  pattern: regEx.validString,
                  message: isValidField("data"),
                },
              ],
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
    />
  );
}
