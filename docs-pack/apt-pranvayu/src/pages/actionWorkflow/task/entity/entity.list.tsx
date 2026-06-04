import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { createRoot } from "react-dom/client";
import { DXForm } from "../../../../components/atoms";
import { regEx } from "../../../../components/constant/regex/regex";
import { regexEx } from "../../../../components/constant/regex/regexEx";
import { Payload } from "../../../../components/molecules";
import { useStepEditor } from "../../../../react";
import { useAppSelector } from "../../../../store/customHooks";
import { isRequiredField, isValidField } from "../../../../utility/utils";
import {
    errorDefinition,
    errorStatusCode,
    failedDefinition,
    failedStatusCode,
    successDefinition,
    successStatusCode,
} from "../../common.entity";
import { EntityMethodType, TaskType } from "../../rule";

export function ListEntity() {
    let { id: stepId, name: stepName, setId, setName, step, properties, setProperty } =
        useStepEditor();
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        type: TaskType.Entity,
        method: EntityMethodType.List,

        containerId: "",
        subscriptionId: "{$.auth.subscriptionId}",
        where: [],
        select: [],

        success: { ...successDefinition },
        failed: { ...failedDefinition },
        error: { ...errorDefinition },
    });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

    let selectedSchema = useAppSelector((state) => state.schema.schema);

    useEffect(() => {
        if (properties?.taskSettings) {
            const data: any = properties?.taskSettings;
            setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, method: properties.type as EntityMethodType.List, name: stepName || data.name || '' }));
        } else {
            setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
        }
    }, [stepId, stepName, properties]);

    const onWhereCallback = (where: any) => {
        const _formData = { ...formData, where };
    autoSave(_formData);
    };

    const onSelectCallback = (select: any) => {
        const _formData = { ...formData, select };
    autoSave(_formData);
    };

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
                            label: { text: "Container Id", location: "top" },
                            dataField: "containerId",
                            isRequired: true,
                        },
                        {
                            itemType: "group",
                            caption: "",
                            cssClass: "no-margin",
                            colCount: 1,
                            template: async (data: any, itemElement: any) => {
                                // console.log("Params...", data, itemElement);
                                const root = createRoot(itemElement!);
                                root.render(
                                    <Payload
                                        title="Where"
                                        data={formData.where}
                                        callback={onWhereCallback}
                                    />
                                );
                            },
                        },
                        {
                            itemType: "group",
                            caption: "",
                            cssClass: "no-margin",
                            colCount: 1,
                            template: async (data: any, itemElement: any) => {
                                // console.log("Params...", data, itemElement);
                                const root = createRoot(itemElement!);
                                root.render(
                                    <Payload
                                        title="Select"
                                        data={formData.select}
                                        callback={onSelectCallback}
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
                                    validationRules: [
                                        {
                                            type: "pattern",
                                            pattern: regEx.stringWithSpace,
                                            message: isValidField("data"),
                                        },
                                    ],
                                },
                                {
                                    label: { text: "Code" },
                                    dataField: "success.code",
                                },
                                {
                                    label: { text: "Cookies" },
                                    dataField: "success.cookies",
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
