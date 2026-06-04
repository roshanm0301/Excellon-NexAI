import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { DXForm } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import {
    errorDefinition,
    errorStatusCode,
    failedDefinition,
    failedStatusCode,
    successDefinition,
    successStatusCode,
} from "../../common.entity";
import { TaskType } from "../../rule";
import { ITaskSequence } from "../../rule/task.sequence";
import { useAppSelector } from "../../../../store/customHooks";

export function Sequence() {
    let { id: stepId, name: stepName, properties, setId, setName, setProperty } =
        useStepEditor();

    const [formData, setFormData] = useState<ITaskSequence>({
        id: "",
        name: "",
        type: TaskType.Sequence,
        subscription: "",
        schema: "",
        prefix: "",
        paddingLength: "",
        paddingCharacter: "",
        readonly: false,
        success: { ...successDefinition },
        failed: { ...failedDefinition },
        error: { ...errorDefinition },
    });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

    const [toggle, setToggle] = useState(false)
    let SchemasDataSource = useAppSelector((state) => state.schema.schemas);

    useEffect(() => {
        if (properties?.taskSettings) {
            const data = properties?.taskSettings as ITaskSequence;
            setFormData(prev => ({ ...prev, ...data, name: stepName || data.name || '' }));
        } else {
            setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
        }
    }, [stepId, stepName, properties]);

    const onChange = (e: any) => {
        setToggle(!toggle)
    }

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
                        label: { text: "Subscription", location: "top" },
                        dataField: "subscription",
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
                        label: { text: "Prefix", location: "top" },
                        dataField: "prefix",
                    },
                    {
                        label: { text: "Padding Length", location: "top" },
                        dataField: "paddingLength",
                    },
                    {
                        label: { text: "Padding Character", location: "top" },
                        dataField: "paddingCharacter",
                    },
                    {
                        label: { text: "Read only", location: "left" },
                        dataField: "readonly",
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
);
}
