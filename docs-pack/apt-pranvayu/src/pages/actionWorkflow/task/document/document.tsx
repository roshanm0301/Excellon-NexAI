import { DXSelect } from "../../../../components/atoms/select";
import { useStepEditor } from "../../../../react";
import { GetDocument } from "./document.get";
import { PostDocument } from "./document.post";
import { PutDocument } from "./document.put";
import { UpsertAllDocument } from "./document.upsertAll";

export const Document = () => {
  const items: any[] = ["Select Document Type", "Get", "Put", "Post", "UpsertAll"];
  const { properties, setProperty } = useStepEditor();

  const onValueChanged = (value: any) => {
    let _formData: any = properties?.taskSettings
    delete _formData?.subscriptionId
    delete _formData?.schemaId
    delete _formData?.documentId
    if (value === "Get") {
      delete _formData?.payload

    }
    if (value !== "Select Document Type") setProperty("type", value);
  };


  const render = () => {
    switch (properties["type"]) {
      case "Get":
        return <GetDocument />;
      case "Put":
        return <PutDocument />;
      case "Post":
        return <PostDocument />;
      case "UpsertAll":
        return <UpsertAllDocument />;
      default:
        return <h4 className={"content-block"}>Select Document Type</h4>;
    }
  };

  return (
    <div>
      <DXSelect
        items={items}
        value={properties["type"] || ""}
        onValueChange={onValueChanged}
      />
      <br></br>
      {/* Based on document type render the relevant component */}
      {render()}
    </div>
  );
};
