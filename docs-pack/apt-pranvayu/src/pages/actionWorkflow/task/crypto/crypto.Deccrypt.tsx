import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { v4 } from "uuid";
import { DXForm } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import { errorDefinition, errorStatusCode, failedDefinition, successDefinition, successStatusCode } from "../../common.entity";
import { TaskType } from "../../rule";
import { EncodingType } from "./crypto.entity";

export const CryptoDecrypt = () => {
    let { id: stepId, name: stepName, properties, setId, setName, setProperty } =
        useStepEditor();

    const [formData, setFormData] = useState({
        type: TaskType.Crypto,
        id: "",
        method: "Decrypt",
        hashAlgo: "",
        iv: "",
        algorithm: "",
        data: "",
        secret: "",
        name: "",
        success: { ...successDefinition },
        failed: { ...failedDefinition },
        error: { ...errorDefinition },
        outputEncoding: "",
        inputEncoding: ""
    });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

    let data: any;

    useEffect(() => {
        if (properties?.taskSettings) {
            data = properties?.taskSettings;
            if (data.paths) {
                let obj = data.paths.map((item: any) => { return { id: v4(), Value: item } })
                setFormData(prev => ({ ...prev, ...data, path: obj, method: 'Decrypt', name: stepName || data.name || '' }))
            } else {
                setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, method: 'Decrypt', name: stepName || data.name || '' }));
            }
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
                            label: { text: "Hash Algo", location: "top" },
                            dataField: "hashAlgo",
                            isRequired: true,
                        },
                        {
                            label: { text: "IV", location: "top" },
                            dataField: "iv",
                            isRequired: true,
                        },
                        {
                            label: { text: "Algorithm" },
                            dataField: "algorithm",
                            isRequired: true,
                        },
                        {
                            label: { text: "Data", location: "top" },
                            dataField: "data",
                            isRequired: true,
                        },
                        {
                            label: { text: "Secret", location: "top" },
                            dataField: "secret",
                            isRequired: true,
                        },
                        {
                            label: { text: "Output Encoding" },
                            dataField: "outputEncoding",
                            isRequired: true,
                            editorType: "dxSelectBox",
                            editorOptions: {
                                dataSource: Object.values(EncodingType),
                                // onValueChanged: (e: any) => onChange(e),
                                searchEnabled: true
                            },
                        },
                        {
                            label: { text: "Input Encoding" },
                            dataField: "inputEncoding",
                            isRequired: true, editorType: "dxSelectBox",
                            editorOptions: {
                                dataSource: Object.values(EncodingType),
                                // onValueChanged: (e: any) => onChange(e),
                                searchEnabled: true
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
