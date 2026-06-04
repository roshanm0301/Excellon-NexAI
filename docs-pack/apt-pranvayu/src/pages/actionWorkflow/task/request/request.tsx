import { RequestAction, RequestForward, RequestSchedule, RequestService, RequestForwardProxy, RequestProxy } from ".";
import { DXSelect } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import { RequestProduce } from "./request.produce";

export const Request = () => {
	const items: any[] = [
		"Select Request Type",
		"Action",
		"Service",
		"Schedule",
		"Proxy",
		"Forward",
		"ForwardProxy",
		"Produce"
	];
	const { properties, setProperty } = useStepEditor();

	const onValueChanged = (value: any) => {
		let _formData: any = properties?.taskSettings
		delete _formData?.schema
		delete _formData?.documentId
		delete _formData?.path
		delete _formData?.action
		delete _formData?.dateTime
		delete _formData?.topic
		delete _formData?.subscription
		delete _formData?.action
		delete _formData?.key
		delete _formData?.headers
		delete _formData?.value
		if (value === "ForwardProxy" || value === "GetById" || !Array.isArray(_formData?.payload)) {
			delete _formData?.payload
		}
		if (value !== "Select Request Type") setProperty("type", value);
	};

	const render = () => {
		switch (properties["type"]) {
			case "Action":
				return <RequestAction />;
			case "Service":
				return <RequestService />;
			case "Schedule":
				return <RequestSchedule />;
			case "Proxy":
				return <RequestProxy />
			case "Forward":
				return <RequestForward />
			case "ForwardProxy":
				return <RequestForwardProxy />
			case "Produce":
				return <RequestProduce />
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
