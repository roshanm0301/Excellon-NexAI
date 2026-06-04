import { DXSelect } from "../../../../components/atoms/select";
import { useStepEditor } from "../../../../react";
import { PromiseAll } from "./promise.all";
import { PromiseAllSettled } from "./promise.all.settled";
import { PromiseRace } from "./promise.race";
import { PromiseReject } from "./promise.reject";
import { PromiseResolve } from "./promise.resolve";

export const PromiseTask = () => {
  const items: any[] = [
    "Select Promise Type",
    "PromiseAll",
    "PromiseAllSettled",
    "PromiseRace",
    "PromiseResolve",
    "PromiseReject",
  ];
  const { properties, setProperty } = useStepEditor();

  const onValueChanged = (value: any) => {
    if (value !== "Select Document Type") setProperty("type", value);
  };

  const render = () => {
    switch (properties["type"]) {
      case "PromiseAll":
        return <PromiseAll />;
      case "PromiseRace":
        return <PromiseRace />;
      case "PromiseReject":
        return <PromiseReject />;
      case "PromiseResolve":
        return <PromiseResolve />;
      case "PromiseAllSettled":
        return <PromiseAllSettled />;
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
