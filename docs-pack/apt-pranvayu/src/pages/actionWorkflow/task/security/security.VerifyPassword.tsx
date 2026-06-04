import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { MethodType } from ".";
import { DXForm } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import { isRequiredField } from "../../../../utility/utils";
import {
  errorDefinition,
  errorStatusCode,
  failedDefinition,
  failedStatusCode,
  successDefinition,
  successStatusCode
} from "../../common.entity";
import { TaskType } from "../../rule";
import { ITaskMatch } from "../../rule/task.security";

export function VerifyPassword() {
  let { id: stepId, name: stepName, setId, setName, properties, setProperty } = useStepEditor();
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    type: TaskType.Security,
    method: MethodType.verifyPassword,
    password: "",
    hash: "",
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  useEffect(() => {
    if (properties?.taskSettings) {
      const data = properties?.taskSettings as ITaskMatch;
      setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, method: properties.type as MethodType.verifyPassword, name: stepName || data.name || '' }));
    } else {
      setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

  return (
    <>

      
        <DXForm
          onFieldDataChanged={onFieldDataChanged}
          formData={formData}
          stylingMode="outlined"
          items={[
            {
              itemType: "group",
              caption: "",
              cssClass: "no-margin",
              colCount: 1,
              items: [
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
                  label: { text: "Password", location: "top" },
                  dataField: "password",
                  validationRules: [
                    {
                      type: "required",
                      message: isRequiredField("password"),
                    },
                    // {
                    // 	type: "pattern",
                    // 	pattern: regEx.pattern,
                    // 	message: isValidField("secret"),
                    // },
                  ],
                },
                {
                  label: { text: "Hash", location: "top" },
                  dataField: "hash",
                  validationRules: [
                    {
                      type: "required",
                      message: isRequiredField("hash"),
                    },
                  ],
                },
              ],
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
