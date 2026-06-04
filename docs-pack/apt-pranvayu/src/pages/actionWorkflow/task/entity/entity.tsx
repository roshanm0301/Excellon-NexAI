import { DXSelect } from "../../../../components/atoms/select";
import { useStepEditor } from "../../../../react";
import { capitalizeFirstLetter } from "../../../../utility/utils";
import { GetEntity } from "./entity.get";
import { PutEntity } from "./entity.put";
import { PostEntity } from "./entity.post";
import { ListEntity } from "./entity.list";
import { PagingEntity } from "./entity.paging";
import { CloneEntity } from "./entity.Clone";

export const Entity = () => {
    const items: any[] = ["Select Entity Type", "Get", "Put", "Post", "List", "Paging", "Clone"];
    const { properties, setProperty } = useStepEditor();

    const onValueChanged = (value: any) => {
        let _formData: any = properties?.taskSettings
        delete _formData?.subscriptionId
        delete _formData?.containerId
        delete _formData?.documentId
        delete _formData?.take
        delete _formData?.skip
        delete _formData?.orderby
        delete _formData?.asc
        delete _formData?.page
        delete _formData?.destination
        if (value === "Get" || value === "List" || value === "Paging" || value === "Clone") {
            delete _formData?.payload
        }
        if (value === "Get" || value === "Post" || value === "Put" || value === "Clone") {
            delete _formData?.where
            delete _formData?.select
        }
        if (value !== "Select Document Type") setProperty("type", value);
    };

    const render = () => {
        switch (
        capitalizeFirstLetter(properties["type"]?.toString().toLowerCase())
        ) {
            case "Get":
                return <GetEntity />;
            case "Put":
                return <PutEntity />;
            case "Post":
                return <PostEntity />;
            case "List":
                return <ListEntity />;
            case "Paging":
                return <PagingEntity />;
            case "Clone":
                return <CloneEntity />;
            default:
                return <h4 className={"content-block"}>Select Entity Type</h4>;
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
            {/* Based on document type render the relevant component */}
            {render()}
        </div>
    );
};
