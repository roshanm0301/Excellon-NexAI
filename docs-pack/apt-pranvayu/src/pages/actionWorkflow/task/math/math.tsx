import { DXSelect } from "../../../../components/atoms/select";
import { useStepEditor } from "../../../../react";
import { MathCeil, MathEvaluate, MathFloor, MathRound } from ".";


export const Math = () => {
  const items: any[] = ["Select Math Type", "Evaluate", "Round", "Ceil", "Floor"];
  const { properties, setProperty } = useStepEditor();

  const onValueChanged = (value: any) => {
    let _formData: any = properties?.taskSettings
    delete _formData?.format
    delete _formData?.size
    if (value !== "Select Math Type") setProperty("type", value);
  };

  const render = () => {
    switch (properties["type"]) {
      case "Evaluate":
        return <MathEvaluate/>;
      case "Round":
        return <MathRound/>;
      case "Ceil":
        return <MathCeil/>;
      case "Floor":
        return <MathFloor/>
      default:
        return <h4 className={"content-block"}>Select Math Type</h4>;
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
