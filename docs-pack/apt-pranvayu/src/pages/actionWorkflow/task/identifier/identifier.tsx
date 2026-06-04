import { DXSelect } from "../../../../components/atoms/select";
import { useStepEditor } from "../../../../react";
import { IdentifierNanoId } from "./identifier.nanoId";
import { IdentifierUUID } from "./identifier.uuid";

export const Identifier = () => {
  const items: any[] = ["Select Identifier Type", "UUID", "NanoId"];
  const { properties, setProperty } = useStepEditor();

  const onValueChanged = (value: any) => {
    let _formData: any = properties?.taskSettings
    delete _formData?.format
    delete _formData?.size
    if (value !== "Select Identifier Type") setProperty("type", value);
  };

  const render = () => {
    switch (properties["type"]) {
      case "UUID":
        return <IdentifierUUID />;
      case "NanoId":
        return <IdentifierNanoId />;
      default:
        return <h4 className={"content-block"}>Select Identifier Type</h4>;
    }
  };

  return (
    <>
      <DXSelect
        items={items}
        value={properties["type"] || ""}
        onValueChange={onValueChanged}
      />
      <br />
      {/* Based on Identifier type render the relevant component */}
      {render()}
    </>
  );
};
