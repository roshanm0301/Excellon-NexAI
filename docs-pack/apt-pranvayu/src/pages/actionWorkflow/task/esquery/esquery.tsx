import { DXSelect } from "../../../../components/atoms/select";
import { useStepEditor } from "../../../../react";
import { FindESQuery } from "./esquery.find";

export const ESQuery = () => {
	const items: any[] = ["Select ESQuery Type", "Find"];
	const { properties, setProperty } = useStepEditor();

	const onValueChanged = (value: any) => {
		if (value !== "Select Document Type") setProperty("type", value);
	};

	const render = () => {
		switch (properties["type"]) {
			case "Find":
				return <FindESQuery />;
			default:
				return <h4 className={"content-block"}>Select Document Type</h4>;
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
