import { ScrollView } from "devextreme-react";
import DataGrid, { Column, Editing, SearchPanel } from "devextreme-react/data-grid";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { v4 } from "uuid";
import { Get } from "../../api";
import { OperatorTypes, ValueTypesForParentOfRule, ValueTypesForRule } from "../../pages/actionWorkflow/rule";
import { DXAccordion, DXButton, DXForm } from "../atoms";
import { PopupPayload } from "../molecules/PopupPayload";
import { DXPopup } from "../template";
import ConditionBuilder from "./conditionBuilder";

interface IPayload {
    data: any;
    callback: any;
    title?: string;
    item?: any;
    enableOperator?: boolean
    SubscriptionList: any[]
    config: any
}

interface IPayloadDefinition {
    id: string,
    Key: string,
    Value: string,
    Type: string,
    IsResolved: boolean,
    Operator?: string
}

export const RulePayload = React.memo((props: IPayload) => {
    const { data = [], callback, title, item, config, enableOperator = false, SubscriptionList } = props;

    // Ensure every item has a lowercase 'id' for DevExtreme DataGrid keyExpr
    const normalizeIds = (items: any[]) =>
        (items || []).map((it: any) => ({ ...it, id: it.id || it.Id || v4() }));

    const payloadDefinition: IPayloadDefinition = {
        id: v4(),
        Key: "",
        Value: "",
        Type: "",
        IsResolved: false,
    };

    const [payload, setPayload] = useState<any>(payloadDefinition);
    const [payloads, setPayloads] = useState<any[]>(normalizeIds(data));
    const [row, setRow] = useState<any>("");
    const [isOpen, setIsOpen] = useState(false)
    const [valueRow, setValueRow] = useState<any>([])
    const [valueType, setValueType] = useState()
    const [schemaList, setSchemaList] = useState<any>([])
    const [isAddParent, setIsAddParent] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string>("")

    const savePayload = (e: any) => {
        e.preventDefault();
        let _payload = { ...payload };
        let _payloads: any[] = [];

        // Convert value in boolean if true and false
        if (/true/i.test(_payload.Value) || /false/i.test(_payload.Value)) {
            if (!_payload.Value.includes('$'))
                _payload.Value = JSON.parse(payload.Value);
        }
        // Converted statusCode into integer
        if (payload.Key === "statusCode") {
            _payload.Value = parseInt(payload.Value);
        }

        if (row !== "") {
            _payloads = payloads?.map((item: any) => {
                if (item.id === row) {
                    return { ...item, ..._payload, Value: _payload?.Type === ValueTypesForRule.Array ? item?.Value : _payload?.Value };
                }
                return item;
            });
        } else {
            _payloads = [...(payloads || []), _payload];
        }
        setPayloads(_payloads);
        setPayload({ ...payloadDefinition });
        // Update parent
        callback(_payloads);
        setIsAddParent(false)
        setErrorMsg("")
    };

    const addNewPayload = () => {
        setRow("");
        setPayload({ ...payloadDefinition });
        setErrorMsg("")
    };

    const onRowClick = async (e: any) => {
        setRow(e.data.id);
        setPayload({ ...payload, ...e.data, Value: e?.data?.Value?.toString() });
        if (e?.data?.Type === ValueTypesForRule.Rule) {
            setValueType(e?.data?.Type)
            let _defaultConfig = { ...config, Subscription: e.data?.Subscription };
            const result: any = await Get(`${config.BASE_URL}Schema/List`, {
                headers: _defaultConfig
            });
            if (result?.success) {
                setSchemaList(result?.data)
            }
        }
        setIsAddParent(true)
    };

    const openValuePopup = (e: any, _item: any) => {
        setValueRow(_item?.row?.data)
        setIsOpen(true)
    }

    const onHiding = () => {
        setIsOpen(false)
        callback(payloads)
    }

    const onTypeValueChanged = (e: any) => {
        if (e?.event) {
            setValueType(e?.value)
            if (e.value === "Condition") {
                setPayload({ ...payload, conditions: {}, rowType: 'Condition', parentId: null, onSuccess: {}, onFailure: {} })
            }
        }
    }

    const gridColumns = [
        {
            dataField: "Key",
            caption: "Key",
            visible: true,
        },
        {
            dataField: "Value",
            caption: "Value",
            visible: true,
            cellTemplate: async (cellElement: any, cellInfo: any) => {
                // console.log('cellTemplate....', cellElement, cellInfo)
                const root = createRoot(cellElement!)
                if (cellInfo?.row?.data?.Type === 'Array') {
                    root.render(
                        <a href="#" onClick={(e: any) => openValuePopup(e, cellInfo)} >Add/Edit Value</a>
                    );
                } else {
                    root.render(
                        <span >{cellInfo?.row?.data?.Value?.toString()}</span>
                    )
                }
            },
        },
        {
            dataField: "Type",
            caption: "Type",
            visible: true,
        },
    ];

    const payloadFormItems = [
        {
            label: { text: "Key" },
            dataField: "Key",
            isRequired: true,
            editorType: "dxTextBox",
        },
        {
            label: { text: "_type" },
            dataField: "_type",
            isRequired: false,
            editorType: "dxTextBox",
            visible: valueType === ValueTypesForRule.Condition,
        },
        {
            label: { text: "Type" },
            dataField: "Type",
            editorType: "dxSelectBox",
            isRequired: true,
            editorOptions: {
                searchEnabled: true,
                dataSource: Object.values(ValueTypesForParentOfRule),
                onValueChanged: (e: any) => onTypeValueChanged(e)
            },
        },
        {
            label: { text: "Value" },
            dataField: "Value",
            // visible: valueType !== ValueTypesForRule.Array,
            isRequired: true,
            editorType: "dxTextBox",
        },
        {
            label: { text: "Subscription" },
            dataField: "Subscription",
            editorType: "dxSelectBox",
            isRequired: true,
            visible: valueType === ValueTypesForRule.Rule,
            editorOptions: {
                searchEnabled: true,
                dataSource: SubscriptionList,
                displayExpr: "DisplayName",
                valueExpr: "id",
                onValueChanged: async (e: any) => {
                    // SubscriptionSelected(e);
                    let _defaultConfig = { ...config, Subscription: e.value };
                    const result: any = await Get(`${config.BASE_URL}Schema/List`, {
                        headers: _defaultConfig
                    });
                    if (result?.success) {
                        setSchemaList(result?.data)
                    }
                },
            },
        },
        {
            label: { text: "Schema" },
            dataField: "Schema",
            editorType: "dxSelectBox",
            isRequired: true,
            visible: valueType === ValueTypesForRule.Rule,
            editorOptions: {
                searchEnabled: true,
                dataSource: schemaList,
                displayExpr: "DisplayName",
                valueExpr: "id",
                // onValueChanged: (e: any) => {
                //     SubscriptionSelected(e);
                // },
            },
        },
        {
            label: { text: "Rule" },
            dataField: "Rule",
            isRequired: true,
            visible: valueType === ValueTypesForRule.Rule,
            editorType: "dxTextBox",
            // editorOptions: {
            //     searchEnabled: true,
            //     dataSource: Object.values(ValueTypesForRule),
            //     // onValueChanged: (e: any) => onTypeValueChanged(e)
            // },
        },
        {
            label: { text: "Operator" },
            dataField: "Operator",
            editorType: "dxSelectBox",
            visible: enableOperator,
            editorOptions: {
                searchEnabled: true,
                dataSource: Object.values(OperatorTypes),
            },
        },
        {
            itemType: "button",
            horizontalAlignment: "center",
            buttonOptions: {
                text: "Save",
                type: "default",
                useSubmitBehavior: true,
            },
        },
    ];

    const onPayloadArrayCallback = (_data: any) => {
        // _data put into payloads property value and condition is type === array 
        let _payloads = payloads?.map((item: any) => {
            if (item.id === valueRow?.id) {
                return { ...item, Value: _data };
            }
            return item;
        });
        setPayloads(_payloads)
    }

    const onCallBack = (callbackData: any[]) => {

        if (!callbackData || callbackData.length === 0) {
            const filteredPayloads = payloads?.filter((payload) => payload.Type !== "Condition" || payload.Type === "Rule") || [];
            setPayloads(filteredPayloads);
            callback(filteredPayloads);
            return;
        }

        const updatePayloads = (existingPayloads: any[], newPayloads: any[]) => {
            const newIds = new Set(newPayloads?.map(item => item.id));

            const updatedPayloads = existingPayloads?.map(existingPayload => {
                if (newIds.has(existingPayload?.id)) {
                    const newData = newPayloads?.find(item => item?.id === existingPayload?.id);
                    return { ...existingPayload, ...newData };
                }
                return existingPayload;
            });

            const filteredPayloads = updatedPayloads?.filter(payload => newIds?.has(payload?.id) || payload.Type === "Rule");

            newPayloads.forEach(newData => {
                if (!existingPayloads?.some(existing => existing?.id === newData?.id)) {
                    filteredPayloads?.push(newData);
                }
            });

            return filteredPayloads;
        };

        const currentPayloads = payloads || [];
        const updatedPayloads = updatePayloads(currentPayloads, callbackData);

        setPayloads(updatedPayloads);
        callback(updatedPayloads);
    };

    const onRowDelete = (e: any) => {
        const updatedPayloads = payloads?.filter((payload: any) => payload.id !== e.data.id);
        setPayloads(updatedPayloads);
        callback(updatedPayloads ?? [])
    };

    const onHideParentPopup = () => {
        setPayload({ ...payloadDefinition })
        setIsAddParent(false)
        setErrorMsg("")
        setRow(null)
    }

    const onAddParentPopup = () => {
        setPayload({ ...payloadDefinition })
        setIsAddParent(true)
    }

    return (
        <>
            <DXAccordion title={title || "Payload"}>
                <DXButton
                    text="Add Parent"
                    stylingMode="contained"
                    onClick={onAddParentPopup}
                />

                <DXPopup
                    visible={isAddParent}
                    onHiding={onHideParentPopup}
                    title="Add Parent Payload"
                    showCloseButton={true}
                    width={600}
                >
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <DXButton
                            text=""
                            hint='Refresh'
                            icon="refresh"
                            type="default"
                            onClick={addNewPayload}
                        />
                    </div>

                    <form action="your-action" onSubmit={savePayload}>
                        <DXForm
                            formData={payload}
                            items={payloadFormItems}
                            stylingMode="outlined"
                        />
                    </form>
                    {errorMsg && <span style={{ color: "var(--color-error, #ef4444)", fontSize: "12px" }}>{errorMsg}</span>}
                </DXPopup>


                {/* parent Payloads */}
                {payloads?.length > 0 && (
                    <>
                        {payloads?.filter((i: any) => i.Type === "Rule")?.length > 0 && (
                            <>
                                <h5 style={{ fontWeight: "bold", color: 'var(--color-primary, #f97316)' }}>Rule :</h5>
                                <DataGrid
                                    showBorders={true}
                                    hoverStateEnabled={true}
                                    dataSource={payloads?.filter((i: any) => i?.Type === "Rule")}
                                    keyExpr={"id"}
                                    columns={gridColumns}
                                    onRowClick={onRowClick}
                                    onRowRemoved={onRowDelete}
                                >
                                    <SearchPanel
                                        visible={false}
                                        width={140}
                                        searchVisibleColumnsOnly={true}
                                        placeholder="Search..."
                                    />
                                    <Editing
                                        allowDeleting={true}
                                        mode="row"
                                    />
                                    <Column dataField="id" allowEditing={false} />
                                </DataGrid>
                            </>
                        )}

                        {payloads?.filter((i: any) => i.Type === "Condition")?.length > 0 && (
                            <ConditionBuilder
                                onCallback={onCallBack}
                                data={payloads?.filter((i: any) => i.Type === "Condition") ?? []}
                                config={config}
                                SubscriptionList={SubscriptionList}
                            />
                        )}
                    </>
                )}
            </DXAccordion>

            {isOpen && <DXPopup title="Add Value" width="50vw" height={"40vw"} visible={isOpen} onHiding={onHiding} >
                <ScrollView>
                    <PopupPayload
                        enableOperator={true}
                        title={"Value"}
                        data={Array.isArray(valueRow?.Value) ? valueRow?.Value : []}
                        callback={onPayloadArrayCallback}
                    />
                </ScrollView>
            </DXPopup>}
        </>
    );
});
