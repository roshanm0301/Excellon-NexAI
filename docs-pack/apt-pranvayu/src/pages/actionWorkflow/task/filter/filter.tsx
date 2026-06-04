import { DXSelect } from "../../../../components/atoms/select";
import { useStepEditor } from "../../../../react";
import { capitalizeFirstLetter } from "../../../../utility/utils";
import { FilterBuilder } from "./filter.filterBuilder";
// import { GetDocument } from "./document.get";
// import { PostDocument } from "./document.post";
// import { PutDocument } from "./document.put";

export const Filter = () => {
    const items: any[] = ["Select Filter Type", "FilterBuilder"];
    const { properties, setProperty } = useStepEditor();

    const onValueChanged = (value: any) => {
        if (value !== "Select Filter Type") setProperty("type", value);
    };

    const render = () => {
        switch (
        properties['type']
        ) {
            case "FilterBuilder":
                return <FilterBuilder />;
            default:
                return <h4 className={"content-block"}>Select Filter Type</h4>;
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
            {/* Based on Filter type render the relevant component */}
            {render()}
        </div>
    );
};
