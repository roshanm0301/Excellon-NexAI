import { DXSelect } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import { ParseJSON } from "./json.parse";
import { StringifyJSON } from "./json.stringify";

export const JSON = () => {
  const items: any[] = ["Select JSON Type", "Stringify", "Parse"];
  const { properties, setProperty } = useStepEditor();

  const onValueChanged = (value: any) => {
    
    if (value !== "Select JSON Type") setProperty("type", value);
  };

  const render = () => {
    switch (properties["type"]) {
      case "Stringify":
        return <StringifyJSON />;
      case "Parse":
        return <ParseJSON />;
      default:
        return <h4 className={"content-block"}>Select JSON Type</h4>;
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
      {/* Based on JSON type render the relevant component */}
      {render()}
    </>
  );
};
