import { ScrollView, TextArea } from "devextreme-react";
import DataGrid, { Column, Editing, Lookup, SearchPanel } from "devextreme-react/data-grid";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { v4 } from "uuid";
import { OperatorTypes, ValueTypes, ValueTypesForResolver } from "../../pages/actionWorkflow/rule";
import { DXAccordion, DXButton } from "../atoms";
import { DXPopup } from "../template";
import { PopupPayload } from "./PopupPayload";

interface IPayload {
    data: any;
    callback: any;
    title?: string;
    item?: any;
    enableOperator?: boolean
    isCallFromResolver?: boolean
    SubscriptionList?: any[],
    config?: any
}

export const Payload = React.memo((props: IPayload) => {
    const { data = [], callback, title, enableOperator = false,
        isCallFromResolver = false } = props;

    // Ensure every item has a lowercase 'id' for DevExtreme DataGrid keyExpr
    const normalizeIds = (items: any[]) =>
        (items || []).map((it: any) => ({ ...it, id: it.id || it.Id || v4() }));

    const [payloads, setPayloads] = useState<any[]>(normalizeIds(data));
    const [isOpen, setIsOpen] = useState(false);
    const [valueRow, setValueRow] = useState<any>([]);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkText, setBulkText] = useState("");
    const [bulkError, setBulkError] = useState("");

    const typeOptions = Object.values(isCallFromResolver ? ValueTypesForResolver : ValueTypes);

    /**
     * Parse a Literal-typed value to its proper JS type:
     * "true"/"false" → boolean, numeric strings → number, "null" → null
     */
    const parseLiteralValue = (value: any): any => {
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        if (trimmed.toLowerCase() === 'true') return true;
        if (trimmed.toLowerCase() === 'false') return false;
        if (trimmed.toLowerCase() === 'null') return null;
        if (trimmed !== '' && !isNaN(Number(trimmed))) return Number(trimmed);
        return value;
    };

    /** If item Type is Literal, coerce its Value to the proper JS type */
    const coerceLiteralItem = (item: any): any =>
        item?.Type === ValueTypes.Literal
            ? { ...item, Value: parseLiteralValue(item.Value) }
            : item;

    const onInitNewRow = (e: any) => {
        e.data.id = v4();
        e.data.Key = "";
        e.data.Value = "";
        e.data.Type = ValueTypes.Literal;
        e.data.IsResolved = false;
    };

    const onRowInserted = (e: any) => {
        const newItem = coerceLiteralItem({ ...e.data, IsResolved: false });
        const updated = payloads.some((item: any) => item.id === newItem.id)
            ? payloads.map((item: any) => item.id === newItem.id ? newItem : item)
            : [...payloads, newItem];
        setPayloads(updated);
        callback(updated);
    };

    const onRowUpdated = (e: any) => {
        const updated = payloads.map((item: any) =>
            item.id === e.key ? coerceLiteralItem({ ...item, ...e.data }) : item
        );
        setPayloads(updated);
        callback(updated);
    };

    const openValuePopup = (e: any, _item: any) => {
        setValueRow(_item?.row?.data)
        setIsOpen(true)
    }

    const onHiding = () => {
        setIsOpen(false)
        callback(payloads)
    }

    const onRowRemoved = (e: any) => {
        const updatedPayloads = payloads.filter((item: any) => item.id !== e.data.id);
        setPayloads(updatedPayloads);
        callback(updatedPayloads);
    };

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

    const onToolbarPreparing = (e: any) => {
        // Style the built-in Add button orange and larger
        e.toolbarOptions.items.forEach((item: any) => {
            if (item.name === 'addRowButton') {
                item.options = { ...item.options, type: 'danger', stylingMode: 'text', elementAttr: { class: 'payload-toolbar-btn' } };
            }
        });
        e.toolbarOptions.items.unshift({
            location: 'after',
            widget: 'dxButton',
            options: {
                icon: 'upload',
                hint: 'Bulk Insert (JSON)',
                stylingMode: 'text',
                type: 'danger',
                elementAttr: { class: 'payload-toolbar-btn' },
                onClick: () => {
                    const existing = payloads.map(({ id, ...rest }: any) => rest);
                    setBulkText(existing.length > 0 ? JSON.stringify(existing, null, 2) : "");
                    setBulkError("");
                    setBulkOpen(true);
                },
            },
        });
    };

    const handleBulkInsert = () => {
        setBulkError("");
        try {
            const parsed = JSON.parse(bulkText);
            if (!Array.isArray(parsed)) {
                setBulkError("Please enter a valid JSON array.");
                return;
            }
            const updated = parsed.map((item: any) => coerceLiteralItem({
                ...item,
                id: item.id || v4(),
                IsResolved: item.IsResolved ?? false,
            }));
            setPayloads(updated);
            callback(updated);
            setBulkOpen(false);
            setBulkText("");
        } catch {
            setBulkError("Invalid JSON format. Please enter a valid JSON array.");
        }
    };

    return (
        <>
            <DXAccordion title={title || "Payload"}>
                <DataGrid
                    showBorders={true}
                    hoverStateEnabled={true}
                    dataSource={payloads}
                    keyExpr={"id"}
                    onInitNewRow={onInitNewRow}
                    onRowInserted={onRowInserted}
                    onRowUpdated={onRowUpdated}
                    onRowRemoved={onRowRemoved}
                    onToolbarPreparing={onToolbarPreparing}
                >
                    <SearchPanel
                        visible={true}
                        width={140}
                        searchVisibleColumnsOnly={true}
                        placeholder="Search..."
                    />
                    <Editing
                        allowAdding={true}
                        allowUpdating={true}
                        allowDeleting={true}
                        mode="row"
                    />
                    <Column dataField="id" visible={false} allowEditing={false} />
                    <Column dataField="Key" caption="Key" />
                    <Column
                        dataField="Value"
                        caption="Value"
                        cellTemplate={(cellElement: any, cellInfo: any) => {
                            const root = createRoot(cellElement!);
                            if (cellInfo?.data?.Type === 'Array') {
                                root.render(
                                    <a href="#" onClick={(e: any) => { e.preventDefault(); openValuePopup(e, cellInfo); }}>Add/Edit Value</a>
                                );
                            } else {
                                root.render(
                                    <span>{cellInfo?.data?.Value?.toString()}</span>
                                );
                            }
                        }}
                    />
                    <Column dataField="Type" caption="Type">
                        <Lookup dataSource={typeOptions} />
                    </Column>
                    <Column dataField="Operator" caption="Operator" visible={enableOperator}>
                        <Lookup dataSource={Object.values(OperatorTypes)} allowClearing={true} />
                    </Column>
                </DataGrid>
            </DXAccordion>
            {isOpen && (
                <DXPopup title="Add Value" width="50vw" height={"40vw"} visible={isOpen} onHiding={onHiding}>
                    <ScrollView>
                        <PopupPayload
                            enableOperator={true}
                            title={"Value"}
                            data={Array.isArray(valueRow?.Value) ? valueRow?.Value : []}
                            callback={onPayloadArrayCallback}
                        />
                    </ScrollView>
                </DXPopup>
            )}
            {bulkOpen && (
                <DXPopup title="Bulk Insert (JSON)" width="50vw" height={"40vw"} visible={bulkOpen} onHiding={() => setBulkOpen(false)}>
                    <ScrollView>
                        <div className="content-block responsive-paddings">
                            <p style={{ marginBottom: "8px", fontSize: "12px", color: "var(--text-secondary, #8b949e)" }}>
                                Edit existing or add new payload items as a JSON array. Each item should have Key, Value, and Type fields.
                            </p>
                            <TextArea
                                height={200}
                                value={bulkText}
                                onValueChanged={(e: any) => setBulkText(e.value)}
                                placeholder={'[\n  { "Key": "key1", "Value": "value1", "Type": "Literal" },\n  { "Key": "key2", "Value": "value2", "Type": "Literal" }\n]'}
                                stylingMode="outlined"
                            />
                            {bulkError && <span style={{ color: "var(--color-error, #ef4444)", fontSize: "12px" }}>{bulkError}</span>}
                            <div style={{ marginTop: "10px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                <DXButton text="Insert" icon="save" type="default" onClick={handleBulkInsert} />
                                <DXButton text="Cancel" type="normal" onClick={() => setBulkOpen(false)} />
                            </div>
                        </div>
                    </ScrollView>
                </DXPopup>
            )}
        </>
    );
});