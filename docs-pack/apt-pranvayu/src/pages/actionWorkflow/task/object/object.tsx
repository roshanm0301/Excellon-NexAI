import { DXSelect } from "../../../../components/atoms/select";
import { useStepEditor } from "../../../../react";
import { IsExist, IsNaN, IsObject } from ".";
import { MergeObject } from "./object.merge";

export const Object = () => {
	const items: any[] = ["Select Object Type", "IsExist", "IsNaN", "IsObject","Merge"];
	const { properties, setProperty } = useStepEditor();

	const onValueChanged = (value:any) => {
		let _formData: any = properties?.taskSettings
		delete _formData?.key
		delete _formData?.path
		delete _formData?.paths
		if (value !== "Select Object Type") setProperty("type", value);
	};

	const render = () => {
		switch (properties["type"]) {
			case "IsExist":
				return <IsExist />;
			case "IsNaN":
				return <IsNaN />;
			case "IsObject":
				return <IsObject />;
			case "Merge":
				return <MergeObject/>
			default:
				return <h4 className={"content-block"}>Select Object Type</h4>;
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
			{/* Based on Object type render the relevant component */}
			{render()}
		</>
	);
};
