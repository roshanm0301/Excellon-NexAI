import { DXSelect } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import { JSON } from "./validator.json";
import { UUID } from "./validator.uuid";

export const Validator = () => {
    const items: any[] = ["Select Validator Type", "JSON", "UUID"];
    const { properties, setProperty } = useStepEditor();

    const onValueChanged = (value: any) => {
        let _formData: any = properties?.taskSettings

        if (value === "JSON") {
            delete _formData?.payload
        }
        if (value === "UUID") {
            delete _formData?.schema
            delete _formData?.data
        }
        if (value !== "Select Validator Type") setProperty("type", value);
    };

    const render = () => {
        switch (properties["type"]) {
            case "JSON":
                return <JSON />;
            case "UUID":
                return <UUID />;
            default:
                return <h4 className={"content-block"}>Select Validator Type</h4>;
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
