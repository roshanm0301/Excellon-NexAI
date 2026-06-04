import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { createRoot } from "react-dom/client";
import { DXForm, } from "../../../../components/atoms";
import { regEx, regexEx } from "../../../../components/constant/regex";
import { Payload } from "../../../../components/molecules";
import { useStepEditor } from "../../../../react";
import { useAppDispatch, useAppSelector } from "../../../../store/customHooks";
import { isRequiredField, isValidField } from "../../../../utility/utils";
import {
  errorDefinition,
  errorStatusCode,
  failedDefinition,
  failedStatusCode,
  successDefinition,
  successStatusCode,
} from "../../common.entity";
import { ITaskAction, RequestMethodType, TaskType } from "../../rule";
import { getActionListAPI, showNotification } from "../../../../redux/actions";

export function RequestAction() {
  let { id: stepId, name: stepName, setId, setName, properties, setProperty } = useStepEditor();

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    method: RequestMethodType.Action,
    type: TaskType.Request,
    schema: "",
    documentId: "",
    async: false,
    action: "",
    payload: [],
    isArray: false,
    isPath: false,
    path: "",
    query: "",
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
    overrideError: false
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);
  let SchemasDataSource = useAppSelector((state) => state.schema.schemas);
  const [toggle, setToggle] = useState(false)
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (properties?.taskSettings) {
      const data: any = properties?.taskSettings;
      // Include step's name from useStepEditor (not from taskSettings)
      setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, method: properties.type as RequestMethodType.Action, name: stepName || data.name || '' }));
    } else {
      // Initialize name from step even if no taskSettings
      setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

  useEffect(() => {
    if (SchemasDataSource.length > 0) {
      const data = properties?.taskSettings as ITaskAction;
      const selectedSchema: any = SchemasDataSource?.find((item: any) => { return item.id === data?.schema })
      // If selected schema (resolved path e.g. {$.body.schemaId}) is available in list then show text box 
      if (selectedSchema) {
        setToggle(false);
      }

    }
  }, [SchemasDataSource]);

  const onPayloadCallback = (payload: any) => {
    const _formData = { ...formData, payload };
    autoSave(_formData);
  };

  const onChange = (e: any) => {
    setToggle(!toggle)
  }

  const onIsArrayChange = (e: any) => {
    if (e.event && e.value === true)
      setFormData(prev => ({ ...prev, isPath: false, payload: [] }));
  }

  const onIsPathChange = (e: any) => {
    if (e.event && e.value === true)
      setFormData(prev => ({ ...prev, isArray: false, payload: [] }));
  }
  const onIsOverrideErrorChange = (e: any) => {
    if (e.event) {
      setFormData(prev => ({ ...prev, overrideError: e.value }));
    }
  }

  const onGoActionButtonClick = async () => {
    const schemaId = formData.schema;
    let actionId;

    try {
      if (schemaId && formData?.action !== "") {
        const res: any = await dispatch(getActionListAPI(schemaId));

        if (res?.length > 0) {
          actionId = res.find((i: any) => i.SystemName === formData.action)?.id;
        }

        if (schemaId && actionId) {
          const url = `/schema/edit-action/${schemaId}/${actionId}`;
          window.open(url, '_blank');
        } else {
          dispatch(showNotification({
            isOpen: true,
            message: "Action No Found",
            type: "error",
          }));
        }
      } else {
        dispatch(showNotification({
          isOpen: true,
          message: "Please select Action and Schema!",
          type: "error",
        }));
      }
    } catch (error) {
      console.error("Error fetching action list:", error);
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
          },
          {
            label: { text: "Name", location: "top" },
            dataField: "name",
            isRequired: true,
          },
          {
            itemType: "group",
            colCount: 4,
            items: [
              {
                label: { text: "Schema", location: "top" },
                dataField: "schema",
                editorType: "dxSelectBox",
                isRequired: true,
                visible: !toggle,
                editorOptions: {
                  dataSource: SchemasDataSource,
                  displayExpr: "SystemName",
                  valueExpr: "id",
                  searchEnabled: true
                },
                colSpan: 3
              },
              {
                label: { text: "Schema", location: "top" },
                dataField: "schema",
                isRequired: true,
                visible: toggle,
                colSpan: 3
              },
              {
                label: { text: " ", location: "top" },
                dataField: "toggle",
                editorType: "dxCheckBox",
                cssClass: "checkBox-toggle",
                editorOptions: {
                  onValueChanged: (e: any) => onChange(e),
                },
              },
            ],
          },
          {
            label: { text: "Document Id", location: "top" },
            dataField: "documentId",
            validationRules: [
              {
                type: "pattern",
                pattern: regEx.pattern,
                message: isValidField(`documentId ${regexEx.pattern}`),
              },
            ],
          },
          {
            itemType: "group",
            colCount: 4,
            items: [
              {
                label: { text: "Action", location: "top" },
                dataField: "action",
                validationRules: [
                  {
                    type: "required",
                    message: isRequiredField("action"),
                  }
                ],
                colSpan: 3
              },
              {
                itemType: "button",
                horizontalAlignment: "right",
                visible: toggle === false,
                buttonOptions: {
                  text: "Go To Action",
                  onClick: onGoActionButtonClick,
                  type: "default",
                  useSubmitBehavior: false,
                },
              },
            ]
          },
          {
            label: { text: "Query", location: "top" },
            dataField: "query",
          },
          {
            itemType: "group",
            colCount: 3,
            items: [
              {
                label: { text: "Is Array", location: "left" },
                dataField: "isArray",
                editorType: "dxCheckBox",
                editorOptions: {
                  onValueChanged: (e: any) => onIsArrayChange(e),
                },
              },
              {
                label: { text: "Is Path", location: "left" },
                dataField: "isPath",
                editorType: "dxCheckBox",
                editorOptions: {
                  onValueChanged: (e: any) => onIsPathChange(e),
                },
              },
              {
                label: { text: "Async", location: "left" },
                dataField: "async",
                editorType: "dxCheckBox",
              },
            ]
          },
          {
            label: { text: "Path", location: "top" },
            dataField: "path",
            isRequired: true,
            visible: formData.isArray === true && formData.isPath === false,
            colSpan: 3
          },
          {
            label: { text: "Payload", location: "top" },
            dataField: "payload",
            isRequired: true,
            visible: formData.isPath === true,
            colSpan: 3
          },
          {
            itemType: "group",
            caption: "",
            cssClass: "no-margin",
            colCount: 1,
            visible: formData.isPath === false,
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
            label: { text: "Override", location: "left" },
            dataField: "overrideError",
            editorType: "dxCheckBox",
            editorOptions: {
              onValueChanged: (e: any) => onIsOverrideErrorChange(e),
            },
          },
          {
            itemType: "group",
            caption: "Failed",
            cssClass: "no-margin",
            colCount: 1,
            visible: formData.overrideError === false,
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
