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
  successStatusCode,
} from "../../common.entity";
import { DateMethodType, ITaskAddDate, TaskType } from "../../rule";
import { Unit } from "./date.entity";

export function AddDate() {
  let { id: stepId, name: stepName, setId, setName, properties, setProperty } = useStepEditor();
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    method: "Add",
    amount: "",
    date: "",
    unit: "year",
    type: TaskType.Date,
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  useEffect(() => {
    if (properties?.taskSettings) {
      const data = properties?.taskSettings as ITaskAddDate;
      setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, method: properties.type as DateMethodType.Add, name: stepName || data.name || '' }));
    } else {
      setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
    }
  }, [stepId, stepName, properties]);

  // const [  ref, {width} ] = useMeasure<HTMLDivElement>();
  // console.log('Current width of element', width);

  // //const ref = useRef<any>(null);
  // const ref: any = React.createRef();
  // const [width, setWidth] = useState(0)
  // console.log("current.....width", width);

  // useEffect(() => {
  //    if(ref.current){
  //       setWidth(ref.current.getBoundingClientRect().width)
  //    }
  // }, [ref])


  return (
    <div
    //  ref={ref}
    >
      {/* The width is: {width}       */}
      
        <DXForm
          onFieldDataChanged={onFieldDataChanged}
          // colCount={width >= 300 ? 2 : 1}
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
              label: { text: "Amount", location: "top" },
              dataField: "amount",
              isRequired: true,
              editorType: "dxTextBox",

            },

            {
              label: { text: "Date", location: "top" },
              dataField: "date",
              // isRequired: true,
              validationRules: [
                {
                  type: "required",
                  message: isRequiredField("date"),
                },
                {
                  type: "pattern",
                  pattern: regEx.pattern,
                  message: isValidField(`date ${regexEx.pattern}`),
                },
              ],
            },

            {
              label: { text: "Unit", location: "top" },
              dataField: "unit",
              isRequired: true,
              editorType: "dxSelectBox",
              editorOptions: {
                dataSource: Unit,
                searchEnabled: true
              },
            },
            {
              itemType: "group",
              caption: "Success",
              cssClass: "no-margin",
              colCount: 1,
              // colCount : width > 300 ? 2 : 1,
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
              // colCount : width > 300 ? 2 : 1,
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
              // colCount : width > 300 ? 2 : 1,
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
</div>
  );
}
