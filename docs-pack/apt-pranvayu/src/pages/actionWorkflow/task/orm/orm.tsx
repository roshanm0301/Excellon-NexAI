import { DXSelect } from "../../../../components/atoms/select";
import { useStepEditor } from "../../../../react";
import { capitalizeFirstLetter } from "../../../../utility/utils";
import { GetORM } from "./orm.get";
import { PutORM } from "./orm.put";
import { PostORM } from "./orm.post";
import { ListORM } from "./orm.list";
import { PagingORM } from "./orm.paging";

export const ORM = () => {
    const items: any[] = ["Select ORM Type", "Get", "Put", "Post", "List", "Paging"];
    const { properties, setProperty } = useStepEditor();

    const onValueChanged = (value: any) => {
        let _formData: any = properties?.taskSettings
        delete _formData?.subscriptionId
        delete _formData?.schema
        delete _formData?.documentId
        delete _formData?.where
        delete _formData?.select
        delete _formData?.order
        delete _formData?.take
        delete _formData?.skip
        delete _formData?.orderby
        delete _formData?.asc
        delete _formData?.page
        if (value === "Get" || value === "List") {
            delete _formData?.payload
        }
        if (value !== "Select Document Type") setProperty("type", value);
    };

    const render = () => {
        switch (
        capitalizeFirstLetter(properties["type"]?.toString().toLowerCase())
        ) {
            case "Get":
                return <GetORM />;
            case "Put":
                return <PutORM />;
            case "Post":
                return <PostORM />;
            case "List":
                return <ListORM />;
            case "Paging":
                return <PagingORM />;
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
