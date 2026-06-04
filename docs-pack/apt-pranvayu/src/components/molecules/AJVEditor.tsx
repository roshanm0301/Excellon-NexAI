import { ScrollView } from "devextreme-react";
import DataGrid, { Column, Editing, Scrolling } from "devextreme-react/data-grid";
import { useState } from "react";
import { v4 } from "uuid";
import { KeyType } from "../../pages/actionWorkflow/rule";
import { showNotification } from "../../redux/actions";
import { useAppDispatch } from "../../store/customHooks";
import { DXButton,DXForm } from "../atoms";

interface IAJVEditor{
  data:any[], callback:any, title?:string, columns?:any
}

const propertiesCloumn = [
  {
    dataField: "key",
    caption: "Key",
    visible: true,
  },
  {
    dataField: "keyType",
    caption: "Type",
    visible: true,
  },
  {
    dataField: "required",
    caption: "Required",
    visible: true,
  },
  {
    dataField: "minLength",
    caption: "MinLength",
    visible: true,
  },
  {
    dataField: "maxLength",
    caption: "MaxLength",
    visible: true,
  },
  {
    dataField: "error",
    caption: "Error Message",
    visible: true,
  },
  {
    dataField: "pattern",
    caption: "Pattern",
    visible: true,
  },
];

export function AVJEditor(props: IAJVEditor) {
  const { data = [], callback, title, columns } = props;

  const payloadFormItems = [
    // {
    //   label: { text: "Type" },
    //   dataField: "type",
    //   editorType: "dxSelectBox",
    //   editorOptions: {
    //     dataSource: Object.values(AvjType),
    //   },
    // },

    {
      label: { text: "Key" },
      dataField: "key",
      isRequired: true,

    },

    {
      label: { text: " Key-Type" },
      dataField: "keyType",
      editorType: "dxSelectBox",
      isRequired: true,
      editorOptions: {
        dataSource: Object.values(KeyType),
      },
    }, 
    {
      label: { text: "Error Message" },
      dataField: "errorMessage",                                              
      isRequired: true,
    },
    {
      label: { text: "Pattern" },
      dataField: "pattern",
      isRequired: true,
    },
    {
      label: { text: "MinLength" },
      dataField: "minLength",
    },
    {
      label: { text: "MaxLength" },
      dataField: "maxLength",
    },
   
    {
      label: { text: "Additional Properties", location: "left" },
      dataField: "additionalProperties",
      editorType: "dxCheckBox",
    },
    {
      label: { text: "Required", location: "left" },
      dataField: "required",
      editorType: "dxCheckBox",
    }
  ];

  const payloadDefinition = {
    id: v4(),
    type: "",
    additionalProperties: false,
    key: "",
    keyType: "",
    required: false,
    minLenght: 0,
    maxLength: 0,
    errorMessage: "",
    pattern: "",
  };
  
  const dispatch = useAppDispatch();
  const [payload, setPayload] = useState<any>(payloadDefinition);
  const [payloads, setPayloads] = useState<any[]>(data);
  const [row, setRow] = useState<any>("");

  const savePayload = () => {

    let req: any = []
    let err: any = {}
    let properties: any = {}
    let allOf: any = []
    let _payloads: any[] = [];
    let _payload = payload;
    let found;
    let convertedPayload = {}

    if (!payload.key ||!payload.errorMessage||!payload.pattern||!payload.keyType) {
      dispatch(showNotification({
        isOpen: true,
        message: "Enter required fields.",
        type: "error",
      }));
      return
    }

    if (row !== "") {
      _payloads = payloads?.map((item: any) => {
        if (item.id === row) {
          return { ...item, ..._payload };
        }
        return item;
      });
    } else {
      //Check for duplicate entries
      found = payloads.find(
        (element) => element.key === payload.key
      );
      if (found) {
        _payloads = [...payloads];
        dispatch(showNotification({
          isOpen: true,
          message: "Duplicate entries not allowed!!!",
          type: "error",
        }));
      } else {
        _payloads = [...payloads, _payload];
      }
    }

    setPayloads(_payloads);
    _payloads.map((i: any) => {
      
      // setting required
      if (i.required === true) {
        req.push(i.key) 
      }

      //setting ErrorMessage
      if (i.errorMessage) {
        let properties: any = {...err.properties}
        properties = { ...properties, [i.key]: i.errorMessage }
        err={properties}
      }

      //setting AllOf
      if (i.pattern) {
        properties = { ...allOf.properties}
        properties = { ...properties, [i.key]: { type: i.keyType, pattern: i.pattern } }
        allOf = {properties}    
         }
    })
    convertedPayload = { ...convertedPayload,type:"object", required: req ,allOf: [allOf], errorMessage: err}
    // Update parent
    callback(_payloads, convertedPayload);
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
    <>
      <ScrollView>
        <div>
          <DXForm
            formData={payload}
            colCount={3}
            items={payloadFormItems}
            stylingMode="outlined"
          />
          <div
            style={{
              padding: "10px 0px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <DXButton
              text={row !== "" ? "Update" : "Save"}
              icon="save"
              onClick={savePayload}
              type="default"
            />
            &nbsp;&nbsp;

            <DXButton
              text="Add"
              icon="add"
              onClick={addNewPayload}
            />
          </div>
          <div>
            {payloads?.length > 0 && (
              <DataGrid
              height={120}

              showBorders={true}
                hoverStateEnabled={true}
                dataSource={payloads}
                keyExpr="id"
                columns={propertiesCloumn}
                onRowClick={onRowClick}
              >
                <Editing
                  allowDeleting={true}
                  mode="row"
                />
                  <Scrolling columnRenderingMode="virtual" />
                <Column dataField="id" allowEditing={false} />
              </DataGrid>
            )}</div>

        </div>
      </ScrollView>
    </>
  );
}

