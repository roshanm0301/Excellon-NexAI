import { DXSelect } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import { UIComponentClone } from "./uiComponent.clone";
import { UIComponentGet } from "./uiComponent.get";
import { UIComponentList } from "./uiComponent.list";
import { UIComponentPaging } from "./uiComponent.paging";
import { UIComponentPost } from "./uiComponent.post";
import { UIComponentPut } from "./uiComponent.put";


export const UIComponentTask = () => {
	const items: any[] = [
		"Select UI Component type",
		"Get",
		"Put",
		"Post",
		"List",
		"Paging",
		"Clone"
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
		if (value !== "Select UI Component type") setProperty("type", value);
	};

	const render = () => {
		switch (properties["type"]) {
			case "Get":
				return <UIComponentGet />;
			case "Put":
				return <UIComponentPut />;
			case "Post":
				return <UIComponentPost />;
			case "List":
				return <UIComponentList />;
			case "Paging":
				return <UIComponentPaging />;
			case "Clone":
				return <UIComponentClone />;
			default:
				return <h4 className={"content-block"}>Select UI Component</h4>;
		}
	};

	return (
		<>
			<DXSelect
				items={items}
				value={properties["type"] || "Select UI Component Type"}
				onValueChange={onValueChanged}
			/>
			<br></br>
			{/* Based on document type render the relevant component */}
			{render()}
		</>
	);
};
