import { useEffect, useState } from 'react';
import { useAutoSave } from "../../hooks/useAutoSave";
import { DXForm } from '../../../../components/atoms';
import { regEx, regexEx } from '../../../../components/constant/regex';
import { useStepEditor } from '../../../../react';
import { useAppSelector } from '../../../../store/customHooks';
import { isRequiredField, isValidField } from '../../../../utility/utils';
import { errorDefinition, errorStatusCode, failedDefinition, failedStatusCode, successDefinition, successStatusCode } from '../../common.entity';
import { TaskType } from '../../rule';
import { ITaskSet, MethodType } from '../../rule/task.cache';

export default function SetCache() {
    let { id: stepId, name: stepName, setId, setName, properties, setProperty } =
        useStepEditor();

    let SchemasDataSource = useAppSelector((state) => state.schema.schemas);

    const [formData, setFormData] = useState({
        id: "",
        name: "",
        type: TaskType.Cache,
        method: MethodType.Set,

        partitionKey: "",
        schemaId: "",
        documentId: "",
        value: "",
        seconds: "",

        success: { ...successDefinition },
        failed: { ...failedDefinition },
        error: { ...errorDefinition },
    });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);
    const [toggle, setToggle] = useState(false)

    useEffect(() => {
        if (properties?.taskSettings) {
            const data = properties?.taskSettings as ITaskSet;
            setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, method: properties.type as MethodType.Set, name: stepName || data.name || '' }));
        } else {
            setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
        }
    }, [stepId, stepName, properties]);

    useEffect(() => {
        if (SchemasDataSource) {
            const data = properties?.taskSettings as ITaskSet;
            const selectedSchema: any = SchemasDataSource?.find((item: any) => { return item.id === data?.schemaId })
            // If selected schema (resolved path e.g. {$.body.schemaId}) is available in list then show text box 
            if (selectedSchema) {
                setToggle(false);
            }
        }
    }, [SchemasDataSource]);

    const onChange = (e: any) => {
        setToggle(!toggle)
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
                            isRequired: true,
                        },
                        {
                            label: { text: "Name", location: "top" },
                            dataField: "name",
                            isRequired: true,
                        },
                        {
                            label: { text: "Partition Key", location: "top" },
                            dataField: "partitionKey",
                            isRequired: true,
                            validationRules: [
                                {
                                    type: "required",
                                    message: isRequiredField("partitionKey"),
                                },
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
                                    label: { text: "Schema Id", location: "top" },
                                    dataField: "schemaId",
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
                                    label: { text: "Schema Id", location: "top" },
                                    dataField: "schemaId",
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
                            label: { text: "Value", location: "top" },
                            dataField: "value",
                        },
                        {
                            label: { text: "Seconds", location: "top" },
                            dataField: "seconds",
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
</>
    );
}
