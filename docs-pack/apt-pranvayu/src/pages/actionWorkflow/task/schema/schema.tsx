import { DXSelect } from "../../../../components/atoms/select";
import { useStepEditor } from "../../../../react";
import { CreateSchema } from "./schema.create";
import { GetSchema } from "./schema.get";
import { ListSchema } from "./schema.list";
import { PagingSchema } from "./schema.paging";
import { PutSchema } from "./schema.put";

export const Schema = () => {
  const items: any[] = ["Select Schema Type", "Get", "Put", "Post", "List", "Paging"
    // "Dynamic"
  ];
  const { properties, setProperty } = useStepEditor();

  const onValueChanged = (value: any) => {
    let _formData: any = properties?.taskSettings
    delete _formData?.schema
    delete _formData?.documentId
    delete _formData?.path

    delete _formData?.take
    delete _formData?.skip
    delete _formData?.orderby
    delete _formData?.asc
    delete _formData?.page
    if (value !== "Post" || value !== "Put" || value!=="Paging") {
      delete _formData?.payload
    }
    if (value !== "Select Document Type") setProperty("type", value);
  };

  const render = () => {
    switch (properties["type"]) {
      case "Get":
        return <GetSchema />;
      case "Post":
        return <CreateSchema />
      case "Put":
        return <PutSchema />
      case "List":
        return <ListSchema />
      case "Paging":
        return <PagingSchema />
      default:
        return <h4 className={"content-block"}>Select Document Type</h4>;
    }
  };

  return (
    <>
      <DXSelect
        items={items}
        value={properties["type"] || ""}
        onValueChange={onValueChanged}
      />
      <br></br>
      {/* Based on document type render the relevant component */}
      {render()}
    </>
  );
};
