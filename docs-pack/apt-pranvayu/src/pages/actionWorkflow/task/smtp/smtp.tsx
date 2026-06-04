/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { createRoot } from "react-dom/client";
import { DXForm } from "../../../../components/atoms";
import { Payload } from "../../../../components/molecules";
import { useStepEditor } from "../../../../react";
import { isRequiredField } from "../../../../utility/utils";
import { errorDefinition, errorStatusCode, failedDefinition, failedStatusCode, successDefinition, successStatusCode } from "../../common.entity";
import { TaskType } from "../../rule";

export const SMTP = () => {
  let {
    id: stepId,
    name: stepName,
    properties,
    setId,
    setName,
    setProperty ,
    // eslint-disable-next-line react-hooks/rules-of-hooks
  } = useStepEditor();

  const [formData, setFormData] = useState({
    id: 'smtp',
    name: "",
    type: TaskType.SMTP,
    To: "",
    From: "",
    CC: "",
    HtmlBody: "",
    Body: "",
    Subject: "",
    payload: [],
    success: { ...successDefinition },
    failed: { ...failedDefinition },
    error: { ...errorDefinition },
  });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

  useEffect(() => {
    if (properties?.taskSettings) {
      const data: any = properties?.taskSettings;
      setFormData(prev => ({ ...prev, ...data, name: stepName || data.name || '' }));
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
              validationRules: [
                {
                  type: "required",
                  message: isRequiredField("id"),
                }
              ],
            },
            {
              label: { text: "Name", location: "top" },
              dataField: "name",
              isRequired: true,
            },
            {
              label: { text: "To", location: "top" },
              dataField: "To",
              isRequired: true,
              validationRules: [
                {
                  type: "required",
                  message: isRequiredField("To"),
                }
              ],
            },
            {
              label: { text: "From", location: "top" },
              dataField: "From",
              isRequired: true,
              validationRules: [
                {
                  type: "required",
                  message: isRequiredField("From"),
                }
              ],
            },
            {
              label: { text: "CC", location: "top" },
              dataField: "CC",
              isRequired: true,
              validationRules: [
                {
                  type: "required",
                  message: isRequiredField("CC"),
                }
              ],
            },
            {
              label: { text: "HtmlBody", location: "top" },
              dataField: "HtmlBody",
              isRequired: true,
              validationRules: [
                {
                  type: "required",
                  message: isRequiredField("HtmlBody"),
                }
              ],
            },
            {
              label: { text: "Body", location: "top" },
              dataField: "Body",
              isRequired: true,
              validationRules: [
                {
                  type: "required",
                  message: isRequiredField("Body"),
                }
              ],
            },
            {
              label: { text: "Subject", location: "top" },
              dataField: "Subject",
              isRequired: true,
              validationRules: [
                {
                  type: "required",
                  message: isRequiredField("Subject"),
                }
              ],
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
</>
  );
};
