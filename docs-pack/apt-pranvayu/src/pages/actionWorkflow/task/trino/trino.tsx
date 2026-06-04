import { DXSelect } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import { Query } from "./trino.query";

export const Trino = () => {
    const items: any[] = ["Select Trino Type", "Query"];
    const { properties, setProperty } = useStepEditor();

    const onValueChanged = (value: any) => {

        if (value !== "Select Trino Type") setProperty("type", value);
    };

    const render = () => {
        switch (properties["type"]) {
            case "Query":
                return <Query/>;
            default:
                return <h4 className={"content-block"}>Select Trino Type</h4>;
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
