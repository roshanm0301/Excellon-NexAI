import DataGrid, { Column, Editing } from "devextreme-react/data-grid";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { v4 } from "uuid";
import { ValueTypes } from "../../pages/actionWorkflow/rule";
import { DXAccordion ,DXButton,DXLookup,DXForm} from "../atoms";

interface IPayload{
  step?:any,
  properties?:any,
  data:any[],
  callback:any,
  title?:string,
  selectedSchema?:any,
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
  },
  {
    dataField: "Type",
    caption: "Type",
    visible: true,
  },
];

export const PayloadV2 = React.memo((props: IPayload) => {
  const {
    step,
    properties,
    data = [],
    callback,
    title,
    selectedSchema,
  } = props;

  // Ensure every item has a lowercase 'id' for DevExtreme DataGrid keyExpr
  const normalizeIds = (items: any[]) =>
    (items || []).map((it: any) => ({ ...it, id: it.id || it.Id || v4() }));

  const payloadDefinition = {
    id: v4(),
    Key: "",
    Value: "",
    Type: ValueTypes.Literal,
    IsResolved: false,
  };

  //let selectedSchema = useAppSelector((state) => state.schema.schema);
  const [keys, setKeys] = useState<any>([]);
  const [values, setValues] = useState<any>([]);

  const [payload, setPayload] = useState<any>(payloadDefinition);
  const [payloads, setPayloads] = useState<any[]>(normalizeIds(data));
  const [row, setRow] = useState<any>("");
  const [errorMsg, setErrorMessage] = useState("");

  useEffect(() => {
    if (selectedSchema?.Columns) {
      setKeys(selectedSchema?.Columns);
      const body = selectedSchema?.Columns?.map((item: any) => {
        return { ...item, name: `{$.body.${item.name}}` };
      });
      const param = selectedSchema?.Columns?.map((item: any) => {
        return { ...item, name: `{$.params.${item.name}}` };
      });
      const query = selectedSchema?.Columns?.map((item: any) => {
        return { ...item, name: `{$.query.${item.name}}` };
      });
      if (param && body) setValues([...body, ...param, ...query]);
    }
  }, [selectedSchema]);

  // console.log("properties...", selectedSchema);
  const savePayload = () => {
    let _payloads: any[] = [];

    if (payload.Key === "" || payload.Value === "") {
      setErrorMessage("Key or Value should not be empty");
      return;
    }

    let _payload = payload;
    if (/true/i.test(_payload.Value)) {
      _payload.Value = true;
    } else if (/false/i.test(_payload.Value)) {
      _payload.Value = false;
    }

    if (payload.Key === "statusCode") {
      //Converted statusCode into integer
      payload.Value = parseInt(payload.Value);
    }

    if (row !== "") {
      _payloads = payloads?.map((item: any) => {
        if (item.id === row) {
          return { ...item, ..._payload };
        }
        return item;
      });
    } else {
      _payloads = [...(payloads || []), _payload];
    }

    setPayloads(_payloads);

    // Update parent
    callback(_payloads);
  };

  const addNewPayload = () => {
    setRow("");
    setErrorMessage("");
    setPayload({ ...payloadDefinition });
  };

  const onRowClick = (e: any) => {
    setRow(e.data.id);
    setPayload({ ...e.data });
  };

  const onFormDataChange = () => {
    setErrorMessage("");
  };

  const onValueChange = (value: string, field: string) => {
    setPayload({ ...payload, [field]: value });
  };

  return (
    <DXAccordion title={title || "Payload"}>
      <DXForm
        onFormDataChange={onFormDataChange}
        formData={payload}
        colCount={1}
        stylingMode="outlined"
        items={[
          {
            label: { text: "Key" },
            dataField: "Key",
            isRequired: true,
            template: async (data: any, itemElement: any) => {
              const root = createRoot(itemElement!);
              root.render(
                <DXLookup
                  label="Key"
                  displayExpr="name"
                  valueExpr="name"
                  items={keys}
                  defaultValue={data?.editorOptions?.value}
                  callBack={(value: string) => {
                    onValueChange(value, "Key");
                  }}
                />
              );
            },
          },
          {
            label: { text: "Value" },
            dataField: "Value",
            isRequired: true,
            template: async (data: any, itemElement: any) => {
              //console.log("payload v2 template data...", data);
              const root = createRoot(itemElement!);
              root.render(
                <DXLookup
                  label="Value"
                  displayExpr="name"
                  valueExpr="name"
                  items={values}
                  defaultValue={data?.editorOptions?.value}
                  callBack={(value: string) => {
                    onValueChange(value, "Value");
                  }}
                />
              );
            },
          },
          {
            label: { text: "Type" },
            dataField: "Type",
            editorType: "dxSelectBox",
            editorOptions: {
              searchEnabled: true,
              dataSource: Object.values(ValueTypes),
            },
          },
        ]}
      />

      {errorMsg && (
        <span style={{ color: "var(--color-error, #f14c4c)", fontSize: "12px" }}>{errorMsg}</span>
      )}

      <div
        style={{
          padding: "10px 0px",
          display: "flex",
          justifyContent: "space-between",
          //   flexDirection: "column",
        }}
      >
        <DXButton
          text={row !== "" ? "Update" : "Save"}
          icon="save"
          onClick={savePayload}
          type="default"
        />
        <DXButton
          text="Add New"
          icon="add"
          type="default"
          onClick={addNewPayload}
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
            // allowUpdating={true}
            allowDeleting={true}
            mode="row"
          />
          {/* 'batch' | 'cell' | 'form' | 'popup' */}
          <Column dataField="id" allowEditing={false} />
        </DataGrid>
      )}
    </DXAccordion>
  );
});
