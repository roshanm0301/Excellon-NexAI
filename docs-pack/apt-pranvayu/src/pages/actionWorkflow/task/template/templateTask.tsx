import { TemplateCreate, TemplateGetById, TemplatePaging, TemplatePickList, TemplateUpdate } from ".";
import { DXSelect } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";

export const TemplateTask = () => {
	const items: any[] = [
		"Select Action Type",
		"Get",
		"Put",
		"Post",
		"List",
		"Paging",
	];
	const { properties, setProperty } = useStepEditor();

	const onValueChanged = (value: any) => {
		let _formData: any = properties?.taskSettings
		delete _formData?.documentId
		delete _formData?.schema
		delete _formData?.select
		delete _formData?.take
		delete _formData?.skip
		delete _formData?.orderby
		delete _formData?.asc
		delete _formData?.page
		if (value === "Get") {
			delete _formData?.payload

		}
		if (value !== "Select Request Type") setProperty("type", value);
	};

	const render = () => {
		switch (properties["type"]) {
			case "Get":
				return <TemplateGetById />;
			case "Put":
				return <TemplateUpdate />;
			case "Post":
				return <TemplateCreate />;
			case "List":
				return <TemplatePickList />;
			case "Paging":
				return <TemplatePaging />;
			default:
				return <h4 className={"content-block"}>Select Request Type</h4>;
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
