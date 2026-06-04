import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { DXForm } from "../../../../components/atoms";
import { regEx } from "../../../../components/constant/regex/regex";
import { regexEx } from "../../../../components/constant/regex/regexEx";
import { useStepEditor } from "../../../../react";
import { isRequiredField, isValidField } from "../../../../utility/utils";
import {
  errorDefinition,
  errorStatusCode,
  failedDefinition,
  failedStatusCode,
  successDefinition,
  successStatusCode
} from "../../common.entity";
import { DateMethodType, ITaskDiff, TaskType } from "../../rule";
import { Unit } from "./date.entity";

export function DiffDate() {
  let { id: stepId, name: stepName, properties, setId, setName, setProperty } = useStepEditor();
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    method: "Diff",
    from: "",
    to: "",
    unitOfTime: "year",
    type: TaskType.Date,
    precise: false,
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  useEffect(() => {
    if (properties?.taskSettings) {
      const data = properties?.taskSettings as ITaskDiff;
      setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, method: properties.type as DateMethodType.Diff, name: stepName || data.name || '' }));
    } else {
      setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

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
              label: { text: "From", location: "top" },
              dataField: "from",
              validationRules: [
                {
                  type: "required",
                  message: isRequiredField("from"),
                },
                {
                  type: "pattern",
                  pattern: regEx.pattern,
                  message: isValidField(`from ${regexEx.pattern}`),
                },
              ],
            },

            {
              label: { text: "To", location: "top" },
              dataField: "to",
              // editorType: "dxDateBox",
              // isRequired: true,
              validationRules: [
                {
                  type: "required",
                  message: isRequiredField("to"),
                },
                {
                  type: "pattern",
                  pattern: regEx.pattern,
                  message: isValidField(`to ${regexEx.pattern}`),
                },
              ],
            },

            {
              label: { text: "UnitOfTime", location: "top" },
              dataField: "unitOfTime",
              editorType: "dxSelectBox",
              editorOptions: {
                dataSource: Unit,
                searchEnabled: true
              },
              isRequired: true,
            },

            {
              label: { text: "Is Precise", location: "left" },
              dataField: "precise",
              editorType: "dxCheckBox",
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
