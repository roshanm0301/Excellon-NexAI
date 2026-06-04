import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { createRoot } from "react-dom/client";
import { DXForm } from "../../../../components/atoms";
import { Payload } from "../../../../components/molecules";
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
import { ExportMethodType } from "../../rule/task.export";
import { Provider as StoreProvider } from "react-redux";
import { store } from "../../../../store/store";
import { getLocalData } from "../../../../utility/utils";
import { useAppDispatch } from "../../../../store/customHooks";
import { getSchemaAPI } from "../../../../redux/actions";
import { AddRelations } from "../../../schema/schema.addRelations";

export function CSV() {
    let { id: stepId, name: stepName, setId, setName, properties, setProperty } = useStepEditor();

    const [formData, setFormData] = useState({
        id: "",
        name: "",
        type: TaskType.Export,
        method: ExportMethodType.CSV,
        schema: "",
        subscription: "",
        select: "",
        columns: [],
        where: [],
        relations: [],
        success: { ...successDefinition },
        failed: { ...failedDefinition },
        error: { ...errorDefinition },
    });
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);
    const dispatch = useAppDispatch();
    const [columnList, setColumnList] = useState([]);
    let schemaIdForColumnAPICall = getLocalData("params")?.SchemaId ?? "";

    useEffect(() => {
        if (properties?.taskSettings) {
            const data: any = properties?.taskSettings;
            setFormData(prev => ({
                ...prev,
                ...data, id: stepId || data.id || prev.id, method: properties.type as ExportMethodType.CSV,
                name: stepName || data.name || ''
            }));
        } else {
            setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
        }
        handleGetSchema(schemaIdForColumnAPICall);
    }, [stepId, stepName, properties]);


    const handleGetSchema = async (SchemaId: any) => {
        const result: any = await dispatch(getSchemaAPI(SchemaId));
        if (result?.id) {
            setColumnList(result.Columns);
        }
    };

    const onColumnCallback = (columns: any) => {
        const _formData: any = { ...formData, columns: columns };

    };

    const onWhereCallback = (where: any) => {
        const _formData: any = { ...formData, where: where };

    };

    const onRelationsDataCallback = (relations: any) => {
        setFormData((state: any) => {
            return { ...state, relations: relations };
        });
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
                        isRequired: true,
                    },
                    {
                        label: { text: "Name", location: "top" },
                        dataField: "name",
                        isRequired: true,
                    },
                    {
                        label: { text: "Schema", location: "top" },
                        dataField: "schema",
                        isRequired: true,
                    },
                    {
                        label: { text: "Subscription", location: "top" },
                        dataField: "subscription",
                        isRequired: true,
                    },
                    {
                        label: { text: "Select", location: "top" },
                        dataField: "select",
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
                                    title={"Columns"}
                                    data={formData.columns}
                                    callback={onColumnCallback}
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
                            const root = createRoot(itemElement!);
                            root.render(
                                <Payload
                                    enableOperator={true}
                                    title={"Where"}
                                    data={formData.where}
                                    callback={onWhereCallback}
                                />
                            );
                        },
                    },
                    {
                        label: { text: "Relations", location: "top" },
                        dataField: "relations",
                        template: async (data: any, itemElement: any) => {
                            const root = createRoot(itemElement!);
                            root.render(
                                <StoreProvider store={store}>
                                    <AddRelations
                                        disable={false}
                                        title={"Add Relations"}
                                        data={formData.relations}
                                        callback={onRelationsDataCallback}
                                        ParentSchemaColumn={columnList}
                                    />
                                </StoreProvider>
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
);
}
