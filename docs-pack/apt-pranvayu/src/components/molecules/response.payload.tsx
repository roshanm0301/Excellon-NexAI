import React, { useEffect, useState } from "react";
import { ValueTypes } from "../../pages/actionWorkflow/rule";
import { DXAccordion,DXForm ,DXButton} from "../atoms";

interface IPayload{
  data:any[], callback:any, title?:string
}

const payloadFormItems = {
  itemType: "group",
  cssClass: "no-margin",
  colCount: 1,
  items: [
    {
      label: { text: "statusCode" },
      dataField: "statusCode",
      isRequired: true,
    },
    {
      label: { text: "Success", location: "left" },
      dataField: "success",
      editorType: "dxCheckBox",
      isRequired: true,
    },
    {
      label: { text: "Code" },
      dataField: "code",
      isRequired: true,
    },
    {
      itemType: "group",
      colCount: 2,
      items: [
        {
          label: { text: "Data" },
          dataField: "data",
          isRequired: true,
        },
        {
          label: { text: "Type" },
          dataField: "type",
          editorType: "dxSelectBox",
          isRequired: true,
          editorOptions: {
            dataSource: Object.values(ValueTypes),
            searchEnabled: true
          },
        },
      ],
    },
  ],
};

const payloadDef = {
  success: true,
  statusCode: 200,
  code: "",
  data: "",
  type: ValueTypes.Literal,
};

export const Payload = React.memo((props: IPayload) => {
  const { data = [], callback, title } = props;
  const [payload, setPayload] = useState<any>(payloadDef);
  const [errorMsg, setErrorMessage] = useState("");

  useEffect(() => {
    if (data.length > 0) {
      let singleObject = data.reduce((acc: any, obj: any) => {
        acc[obj.Key] = obj.Value;
        return acc;
      }, {});
      const item = data.find((item: any) => {
        return item.Key === "data";
      });
      singleObject["type"] = item.Type;
      setPayload(singleObject);
    }
  }, [data]);

  const savePayload = () => {
    if (!payload.statusCode || !payload.code || !payload.data) {
      setErrorMessage("statusCode, code or data should not be empty");
      return;
    }
    let resultArray = Object.keys(payload).map(function (key) {
      let value = payload[key];
      if (key === "data") {
        return {
          Key: key,
          Value: value,
          Type: payload.type ? payload.type : "Literal",
        };
      } else {
        return { Key: key, Value: value, Type: "Literal" };
      }
    });

    let resArray = resultArray.filter((i: any) => {
      return i.Key !== "type";
    });
    callback(resArray);
  };

  const onFormDataChange = (e: any) => {
    setErrorMessage("");
  };

  return (
    <DXAccordion title={title || "Payload"}>
      <DXForm
        onFormDataChange={onFormDataChange}
        formData={payload}
        colCount={1}
        stylingMode="outlined"
        items={[payloadFormItems]}
      />
      {errorMsg && (
        <span style={{ color: "var(--color-error, #f14c4c)", fontSize: "12px" }}>{errorMsg}</span>
      )}
      <br />
      <DXButton
        text={"Save"}
        icon="save"
        onClick={savePayload}
        type="default"
      />
    </DXAccordion>
  );
});
