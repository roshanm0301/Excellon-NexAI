import { DataGrid, Editing } from "devextreme-react/data-grid";
import React, { useState } from "react";
import { v4 } from "uuid";
import { DXButton, DXForm, DXAccordion } from "../atoms";

interface IMergePath {
  data: any[], callback: any, title?: string
}

const gridColumns = [
  {
    dataField: "Value",
    caption: "Value",
    visible: true,
  },
];

const payloadFormItems = [
  {
    label: { text: "Value" },
    dataField: "Value",
  },
];

export const MergePath = React.memo((props: IMergePath) => {
  const { data = [], callback, title } = props;

  // Ensure every item has a lowercase 'id' for DevExtreme DataGrid keyExpr
  const normalizeIds = (items: any[]) =>
    (items || []).map((it: any) => ({ ...it, id: it.id || it.Id || v4() }));

  const payloadDefinition = {
    id: v4(),
    Value: "",
  };

  const [payload, setPayload] = useState<any>({ ...payloadDefinition });
  const [payloads, setPayloads] = useState<any[]>(normalizeIds(data));
  const [row, setRow] = useState<any>("");

  const savePayload = () => {
    // console.log("savePayload...", payload);
    let _payloads: any[] = [];

    if (payload.Value === "") {
      return;
    }

    if (row !== "") {
      _payloads = payloads?.map((item: any) => {
        if (item.id === row) {
          return { ...item, ...payload };
        }
        return item;
      });
    } else {
      _payloads = [...payloads, payload];
    }

    setPayloads(_payloads);
    setPayload({
      Value: "",
      id:v4()
    })
    // Update parent
    callback(_payloads);
  };

  const addNewPayload = () => {
    setRow("");
    setPayload({ ...payloadDefinition });
  };

  const onRowClick = (e: any) => {
    setRow(e.data.id);
    setPayload({ ...e.data });
  };

  return (
    <DXAccordion title={title || "Payload"}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          marginBottom: 3
        }}
      >
        <div style={{ flex: 1, minWidth: "300px" }}>
          <DXForm formData={payload} colCount={1} items={payloadFormItems} stylingMode="outlined" />
        </div>
        <DXButton
          text=""
          icon="save"
          onClick={savePayload}
        />
      </div>

      {payloads?.length > 0 && (
        <DataGrid
          showBorders={true}
          hoverStateEnabled={true}
          dataSource={payloads}
          keyExpr="id"
          columns={gridColumns}
          onRowClick={onRowClick}
        >
          <Editing
            allowDeleting={true}
            mode="row"
          />
        </DataGrid>
      )}
    </DXAccordion>
  );
});
