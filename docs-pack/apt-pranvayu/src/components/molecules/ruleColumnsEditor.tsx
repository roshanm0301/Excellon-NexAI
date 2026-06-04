import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { v4 } from "uuid";
import { API, Get } from "../../api";
import { DXButton, DXForm } from "../atoms";
import { Payload } from "./Payload";

interface IPayload {
    callback?: any;
    title?: string;
    value: any[];
    DataTypeList: any[]
    SubscriptionList?: any[],
    config?: any;
    selectedRow?: any;
    onCloseForm?: () => void;
    isFormMode?: boolean;
}

interface IPayloadDefinition {
    id: string;
    name: string;
    path: string;
    SourceType?: string;
    IsPredefineColumn?: boolean;
    DataType: string
    Properties: any[],
    PickList: object
    Enum: any[]
}

export const RuleColumnsEditor = React.memo((props: IPayload) => {
    const { callback, value = [], DataTypeList = [],
        SubscriptionList = [], config, selectedRow, onCloseForm, isFormMode = false
    } = props;

    const payloadDefinition: IPayloadDefinition = {
        id: v4(),
        name: "",
        path: "",
        SourceType: "",
        IsPredefineColumn: false,
        DataType: "",
        Properties: [],
        PickList: {
            SubscriptionId: "",
            SchemaId: "",
            ActionId: "",
            Mappings: {
                DisplayExpr: "",
                ValueExpr: "",
                Description: "",
                Sort: "",
                Group: ""
            }
        },
        Enum: []
    };

    const [payload, setPayload] = useState<any>(payloadDefinition);
    const [row, setRow] = useState<any>("");
    const [errorMsg, setErrorMessage] = useState("");
    const [schemaList, setSchemaList] = useState<any>([])
    const [actionList, setActionList] = useState<any>([])

    // Handle selected row from parent
    useEffect(() => {
        if (selectedRow) {
            onSchemaChange(selectedRow?.PickList?.SchemaId, selectedRow?.PickList?.SubscriptionId)
            onSubscriptionChange(selectedRow?.PickList?.SubscriptionId)

            setRow(selectedRow.id);
            const formattedRow = {
                ...payloadDefinition,
                ...selectedRow,
                PickList: {
                    SubscriptionId: selectedRow?.PickList?.SubscriptionId || "",
                    SchemaId: selectedRow?.PickList?.SchemaId || "",
                    ActionId: selectedRow?.PickList?.ActionId || "",
                    Mappings: {
                        DisplayExpr: selectedRow?.PickList?.Mappings?.DisplayExpr || "",
                        ValueExpr: selectedRow?.PickList?.Mappings?.ValueExpr || "",
                        Description: selectedRow?.PickList?.Mappings?.Description || "",
                        Sort: selectedRow?.PickList?.Mappings?.Sort || "",
                        Group: selectedRow?.PickList?.Mappings?.Group || ""
                    }
                },
                Enum: selectedRow?.Enum || []
            };
            setPayload(formattedRow);
        } else if (isFormMode) {
            setRow("");
            setPayload({ ...payloadDefinition, id: v4() });
        }
    }, [selectedRow, isFormMode]);

    const savePayload = () => {
        setErrorMessage("");

        // Deep clone to capture all nested fields (PickList, Mappings, Enum, Properties)
        const _payload = JSON.parse(JSON.stringify({ ...payload, id: payload.id || v4() }));
        const displayExpr = _payload.PickList?.Mappings?.DisplayExpr?.trim();
        const valueExpr = _payload.PickList?.Mappings?.ValueExpr?.trim();

        if (!_payload?.name || !_payload?.path || !_payload?.DataType) {
            setErrorMessage("Column name ,Path,DataType should not be empty");
            return;
        }

        // Don't allow spaces in column name
        if (/\s/.test(_payload?.name)) {
            setErrorMessage("Column name should not contain spaces");
            return;
        }

        // Duplicate check (for both add and edit)
        const normalizedName = _payload?.name?.trim().toLowerCase();
        const duplicate = value?.find(
            (p: any) => p?.name?.trim()?.toLowerCase() === normalizedName && p?.id !== _payload?.id
        );
        if (duplicate) {
            setErrorMessage("Column with this name already exists");
            return;
        }

        if (_payload?.PickList?.SubscriptionId && !_payload?.PickList?.SchemaId && !_payload?.PickList?.ActionId) {
            setErrorMessage("If a subscription is selected then schema and action ID are required.");
            return;
        }

        if (
            _payload.PickList?.SubscriptionId &&
            _payload.PickList?.SchemaId &&
            _payload.PickList?.ActionId &&
            (!displayExpr || !valueExpr)
        ) {
            setErrorMessage(
                "Display text and value are required when subscription, schema, and action ID are selected."
            );
            return;
        }

        let updatedPayloads: any[] = [];

        if (row) {
            // Update existing row
            updatedPayloads = value.map((p: any) =>
                p.id === row ? { ...p, ..._payload } : p
            );
        } else {
            // Add new row
            updatedPayloads = [...value, _payload];
        }

        setPayload({ ...payloadDefinition, id: v4() });
        setRow("");
        callback && callback(updatedPayloads);
        onCloseForm && onCloseForm();
    };

    const handleCancel = () => {
        setErrorMessage("");
        onCloseForm && onCloseForm();
    };

    const onSubscriptionChange = async (value: string) => {
        let _defaultConfig = { ...config, Subscription: value };
        const result: any = await Get(`${config.BASE_URL}Schema/List`, {
            headers: _defaultConfig
        });
        if (result?.success) {
            setSchemaList(result?.data)
        }
    }

    const onSchemaChange = async (value: string, SubscriptionId: string) => {
        const result: any = await API.Get(
            `${config.BASE_URL}Action/${value}/List`,
            {
                headers: {
                    Subscription: SubscriptionId
                }
            }
        );


        if (result?.success && result?.data?.length > 0) {
            setActionList(result?.data)
        } else {
            setActionList([])
        }
    }

    const onPayloadCallback = (callbackData: any) => {
        const _formData = { ...payload, Enum: callbackData };
        setPayload({ ..._formData });
    };

    const payloadFormItems = [
        {
            label: { text: "Column name" },
            dataField: "name",
            editorType: "dxTextBox",
            isRequired: true,
            disabled: payload?.IsPredefineColumn
        },
        {
            label: { text: "Column type" },
            dataField: "SourceType",
            editorType: "dxSelectBox",
            isRequired: true,
            editorOptions: {
                searchEnabled: true,
                dataSource: ["Body", "Params", "Header", "Auth", "Context", "Const", "ENV"],
                placeholder: "Select SourceType..."
            }
        },
        {
            label: { text: "Column path" },
            dataField: "path",
            editorType: "dxTextBox",
            isRequired: true
        },
        {
            label: { text: "DataType" },
            dataField: "DataType",
            editorType: "dxSelectBox",
            isRequired: true,
            editorOptions: {
                dataSource: ["Date", "String", "Number", "Boolean"],
                // displayExpr: "DisplayName",
                // valueExpr: "SystemName",
                searchEnabled: true,
                placeholder: "Select DataType..."
            }
        },
        {
            itemType: "group",
            caption: "PickList",
            colCount: 4,
            colSpan: 4,
            items: [
                {
                    label: { text: "SubscriptionId" },
                    dataField: "PickList.SubscriptionId",
                    editorType: "dxSelectBox",
                    isRequired: true,
                    editorOptions: {
                        searchEnabled: true,
                        dataSource: SubscriptionList,
                        displayExpr: "DisplayName",
                        valueExpr: "id",
                        onValueChanged: async (e: any) => { onSubscriptionChange(e?.value) },
                    },
                },
                {
                    label: { text: "SchemaId" },
                    dataField: "PickList.SchemaId",
                    editorType: "dxSelectBox",
                    editorOptions: {
                        searchEnabled: true,
                        dataSource: schemaList,
                        displayExpr: "DisplayName",
                        valueExpr: "id",
                        onValueChanged: async (e: any) => { onSchemaChange(e.value, payload?.PickList?.SubscriptionId) },
                    },
                },
                {
                    label: { text: "ActionId" },
                    dataField: "PickList.ActionId",
                    editorType: "dxSelectBox",
                    editorOptions: {
                        searchEnabled: true,
                        dataSource: actionList,
                        displayExpr: "DisplayName",
                        valueExpr: "id",
                    },
                }
            ]
        },
        {
            itemType: "group",
            caption: "PickList Mappings",
            colCount: 4,
            colSpan: 4,
            items: [
                {
                    label: { text: "Picklist display field" },
                    dataField: "PickList.Mappings.DisplayExpr",
                    editorType: "dxTextBox",
                },
                {
                    label: { text: "Picklist value field" },
                    dataField: "PickList.Mappings.ValueExpr",
                    editorType: "dxTextBox",
                },
                {
                    label: { text: "Description" },
                    dataField: "PickList.Mappings.Description",
                    editorType: "dxTextBox",
                },
                {
                    label: { text: "Sort" },
                    dataField: "PickList.Mappings.Sort",
                    editorType: "dxTextBox",
                },
                // {
                //     label: { text: "Group" },
                //     dataField: "PickList.Mappings.Group",
                //     editorType: "dxTextBox",
                //     colSpan: 4
                // },
            ]
        },
        {
            label: { text: "Properties" },
            dataField: "Properties",
            editorType: "dxTagBox",
            colSpan: 4,
            editorOptions: {
                multiline: true,
                dataSource: value,
                displayExpr: "name",
                valueExpr: null,
                showSelectionControls: true,
                searchEnabled: true,
                placeholder: "Select properties..."
            }
        },
        {
            itemType: "group",
            caption: "",
            cssClass: "no-margin",
            colCount: 1,
            colSpan: 4,
            template: (data: any, itemElement: any) => {
                const root = createRoot(itemElement!);
                root.render(
                    <Payload
                        title="Enum"
                        data={payload?.Enum || []}
                        callback={onPayloadCallback}
                    />
                );
            },
        },
    ];

    const onFormDataChange = (e: any) => {
        if (errorMsg) setErrorMessage("");
        const updatedData = e.component.option("formData");
        setPayload((prev: any) => ({ ...prev, ...updatedData }));
    };

    return (
        <div style={{
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            padding: "10px"
        }}>
            {/* Form - Scrollable */}
            <div style={{
                flex: "1 1 auto",
                overflow: "auto",
                marginBottom: "10px"
            }}>
                <DXForm
                    key={payload?.id || 'new'}
                    formData={payload}
                    colCount={4}
                    items={payloadFormItems}
                    stylingMode="outlined"
                    onFormDataChange={onFormDataChange}
                />
            </div>

            {/* Error Message */}
            {errorMsg && (
                <div
                    style={{
                        color: "var(--color-error, #ef4444)",
                        fontSize: "12px",
                        padding: "6px 10px",
                        marginBottom: "10px",
                        backgroundColor: "var(--color-error-light, #ffebee)",
                        borderLeft: "3px solid var(--color-error, #ef4444)",
                        borderRadius: "3px",
                        fontWeight: 500
                    }}
                >
                    {errorMsg}
                </div>
            )}

            {/* Action Buttons */}
            <div
                style={{
                    padding: "10px 0",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "8px",
                    borderTop: "1px solid var(--border-primary, #3c3c3c)",
                    flexShrink: 0
                }}
            >
                <DXButton
                    text="Cancel"
                    onClick={handleCancel}
                />
                <DXButton
                    text={row ? "Update" : "Save"}
                    icon="save"
                    onClick={savePayload}
                    type="default"
                />
            </div>
        </div>
    );
});
