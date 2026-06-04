import { DXSelect } from "../../../../components/atoms/select";
import { useStepEditor } from "../../../../react";
import { CSV } from "./export.csv";
import { EXCEL } from "./export.excel";

export const Export = () => {
    const items: any[] = ["Select Export Type", "CSV", "EXCEL"];
    const { properties, setProperty } = useStepEditor();

    const onValueChanged = (value: any) => {
        if (value !== "Select Export Type") setProperty("type", value);
    };

    const render = () => {
        switch (properties["type"]) {
            case "CSV":
                return <CSV />;
            case "EXCEL":
                return <EXCEL />;
            default:
                return <h4 className={"content-block"}>Select Export Type</h4>;
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
