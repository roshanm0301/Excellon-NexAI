import { DXSelect } from "../../../../components/atoms/select";
import { useStepEditor } from "../../../../react";
import { capitalizeFirstLetter } from "../../../../utility/utils";
import { GetProvider } from "./provider.get";
import { ListProvider } from "./provider.list";
import { PagingProvider } from "./provider.paging";
import { PostProvider } from "./provider.post";
import { PutProvider } from "./provider.put";

export const Provider = () => {
  const items: any[] = ["Select Provider Type", "Get", "Put", "Post", "List", "Paging"];
  const { properties, setProperty } = useStepEditor();

  const onValueChanged = (value: any) => {
    let _formData: any = properties?.taskSettings
    delete _formData?.schema
    delete _formData?.documentId
    delete _formData?.take
    delete _formData?.skip
    delete _formData?.orderby
    delete _formData?.asc
    if (value !== "Post" || value !== "Put" || value!=="Paging") {
      delete _formData?.payload
    }
    if (value !== "Select Provider Type") setProperty("type", value);
  };

  const render = () => {
    switch (
    capitalizeFirstLetter(properties["type"]?.toString().toLowerCase())
    ) {
      case "Get":
        return <GetProvider />;
      case "Put":
        return <PutProvider />;
      case "Post":
        return <PostProvider />;
      case "List":
        return <ListProvider />;
      case "Paging":
        return <PagingProvider />;
      default:
        return <h4 className={"content-block"}>Select Provider Type</h4>;
    }
  };

  return (
    <div>
      <DXSelect
        items={items}
        value={capitalizeFirstLetter(
          properties["type"]?.toString().toLowerCase()
        )}
        onValueChange={onValueChanged}
      />
      <br></br>
      {/* Based on Provider type render the relevant component */}
      {render()}
    </div>
  );
};
