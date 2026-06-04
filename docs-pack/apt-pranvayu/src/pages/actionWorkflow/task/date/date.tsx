import { DXSelect } from "../../../../components/atoms/select";
import { useStepEditor } from "../../../../react";
import { AddDate } from "./date.add";
import { DiffDate } from "./date.diff";
import { FormatDate } from "./date.format";
import { GetDate } from "./date.getDate";
import { GetDay } from "./date.getDay";
import { GreaterThanDate } from "./date.greaterThan";
import { LessThanDate } from "./date.lessThan";
import { ParseDate } from "./date.parse";

export const Date = () => {
  const items: any[] = ["Select Date Type", "GetDate", "Add", "Diff", "Format", "Parse", "LessThan", "GreaterThan", "GetDay"];
  const { properties, setProperty } = useStepEditor();

  const onValueChanged = (value: any) => {
    let _formData: any = properties?.taskSettings
    delete _formData?.amount
    delete _formData?.date
    delete _formData?.unit
    delete _formData?.from
    delete _formData?.to
    delete _formData?.format
    delete _formData?.unitOfTime
    delete _formData?.precise
    if (value !== "Select Date Type") setProperty("type", value);
  };

  const render = () => {
    switch (properties["type"]) {
      case "GetDate":
        return <GetDate />;
      case "Add":
        return <AddDate />;
      case "Diff":
        return <DiffDate />;
      case "Format":
        return <FormatDate />;
      case "Parse":
        return <ParseDate />
      case "LessThan":
        return <LessThanDate />
      case "GreaterThan":
        return <GreaterThanDate />
      case "GetDay":
        return <GetDay />
      default:
        return <h4 className={"content-block"}>Select Date Type</h4>;
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
      {/* Based on Date type render the relevant component */}
      {render()}
    </>
  );
};
