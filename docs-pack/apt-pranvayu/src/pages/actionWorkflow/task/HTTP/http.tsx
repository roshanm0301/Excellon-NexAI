import { DXSelect } from "../../../../components/atoms/select";
import { useStepEditor } from "../../../../react";
import { HTTPPost } from "./http.post";
import { HTTPGet } from "./http.get";
import { HTTPPut } from "./http.put";
import { HTTPDelete } from "./http.delete";

export const HTTP = () => {
	const items: any[] = ["Select HTTP Type", "Post", "Get", "Put", "Delete"];
	const { properties, setProperty } = useStepEditor();

	const onValueChanged = (value :any) => {
		let _formData: any = properties?.taskSettings
		delete _formData?.payload
		delete _formData?.documentId
		if (value !== "Select HTTP Type") setProperty("type", value);
	};
	const render = () => {
		switch (properties["type"]) {
			case "Post":
				return <HTTPPost />;
			case "Get":
				return <HTTPGet />;
			case "Put":
				return <HTTPPut/>;
			case "Delete":
				return <HTTPDelete/>
			default:
				return <h4 className={"content-block"}>Select HTTP Type</h4>;
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
