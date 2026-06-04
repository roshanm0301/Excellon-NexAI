import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { DXForm } from "../../../../components/atoms";
import { regEx } from "../../../../components/constant/regex/regex";
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
import { RequestMethodType, TaskType } from "../../rule";
import { Payload } from "../../../../components/molecules";
import { createRoot } from "react-dom/client";

export function RequestProduce() {
    let { id: stepId, name: stepName, setId, setName, properties, setProperty } =
        useStepEditor();
    const [formData, setFormData] = useState({
        id: "",
        name: '',
        type: TaskType.Request,
        method: RequestMethodType.Produce,
        topic: "",
        key: "",
        headers: "",
        success: { ...successDefinition },
        failed: { ...failedDefinition },
        error: { ...errorDefinition },
        overrideError: false,
        async: false,
        isArray: false,
        isPath: false,
        path: "",
        payload: []
    });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

    useEffect(() => {
        if (properties?.taskSettings) {
            const data: any = properties?.taskSettings;
            setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, method: properties.type as RequestMethodType.Produce, name: stepName || data.name || '' }));
        } else {
            setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
        }
    }, [stepId, stepName, properties]);

    const onIsOverrideErrorChange = (e: any) => {
        if (e.event) {
            setFormData(prev => ({ ...prev, overrideError: e.value }));
        }
    }

    const onPayloadCallback = (payload: any) => {
        const _formData = { ...formData, payload };
    autoSave(_formData);
    };


    const onIsArrayChange = (e: any) => {
        if (e.event && e.value === true)
            setFormData(prev => ({ ...prev, isPath: false, payload: [] }));
    }

    const onIsPathChange = (e: any) => {
        if (e.event && e.value === true)
            setFormData(prev => ({ ...prev, isArray: false, payload: [] }));
    }

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
                            validationRules: [
                                {
                                    type: "required",
                                    message: isRequiredField("id"),
                                },
                                {
                                    type: "pattern",
                                    pattern: regEx.validString,
                                    message: isValidField("id"),
                                },
                            ],
                        },
                        {
                            label: { text: "Name", location: "top" },
                            dataField: "name",
                            isRequired: true,
                        },
                        {
                            label: { text: "Topic", location: "top" },
                            dataField: "topic",
                            isRequired: true,
                        },
                        {
                            label: { text: "Key", location: "top" },
                            dataField: "key",
                        },
                        {
                            label: { text: "Headers", location: "top" },
                            dataField: "headers",
                        },
                        {
                            label: { text: "Async", location: "left" },
                            dataField: "async",
                            editorType: "dxCheckBox",
                        },
                        {
                            itemType: "group",
                            colCount: 2,
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
</>
    );
}
