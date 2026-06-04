import { DXSelect } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import { GetCollection } from "./repository.getCollection";
import { GetRepository } from "./repository.getRepository";

export const Repository = () => {
  const items: any[] = [
    "Select Repository Type",
    "Collection",
    "Repository",
  ];
  const { properties, setProperty } = useStepEditor();

  const onValueChanged = (value: any) => {
    let _formData: any = properties?.taskSettings
    delete _formData?.subscriptionId
    delete _formData?.containerId

    if (value !== "Select Request Type") setProperty("type", value);
  };

  const render = () => {
    switch (properties["type"]) {
      case "Collection":
        return <GetCollection />;
      case "Repository":
        return <GetRepository />;
      default:
        return <h4 className={"content-block"}>Select Request Type</h4>;
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