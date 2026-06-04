import { DXSelect } from "../../../../components/atoms/select";
import { useStepEditor } from "../../../../react";
import { capitalizeFirstLetter } from "../../../../utility/utils";
import EmitCache from "./cache.Emit";
import ClearCache from "./cache.clear";
import GetCache from "./cache.get";
import SetCache from "./cache.set";

export const Cache = () => {
    const items: any[] = ["Select Cache Type", "Get", "Set", "Clear", "Emit"];
    const { properties, setProperty } = useStepEditor();

    const onValueChanged = (value: any) => {
        let _formData: any = properties?.taskSettings
        delete _formData?.partitionKey
        delete _formData?.documentId
        delete _formData?.schemaId
        delete _formData?.value
        delete _formData?.seconds
        delete _formData?.pattern
        delete _formData?.key
        delete _formData?.room
    
        if (value !== "Select Cache Type") setProperty("type", value);
    };

    const render = () => {
        switch (
        capitalizeFirstLetter(properties["type"]?.toString().toLowerCase())
        ) {
            case "Get":
                return <GetCache />;
            case "Set":
                return <SetCache />;
            case "Clear":
                return <ClearCache />;
            case "Emit":
                return <EmitCache />;
            default:
                return <h4 className={"content-block"}>Select Cache Type</h4>;
        }
    };

    return (
        <div>
            <DXSelect
                items={items}
                value={capitalizeFirstLetter(
                    properties["type"]?.toString().toLowerCase()
                )}
                onValueChange={onValueChanged}
            />
            <br></br>
            {/* Based on Cache type render the relevant component */}
            {render()}
        </div>
    );
};
