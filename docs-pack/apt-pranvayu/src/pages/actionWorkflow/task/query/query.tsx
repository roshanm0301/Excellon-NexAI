import { DXSelect } from "../../../../components/atoms/select";
import { useStepEditor } from "../../../../react";
import { FindQuery } from "./query.find";
import { FindOneQuery } from "./query.findone";
import { FindPagingQuery } from "./query.findPaging";
import { NotExistQuery } from "./query.notExist";
import { RawQuery } from "./query.raw";
import { WhereQuery } from "./query.where";
import { WherePagingQuery } from "./query.wherePaging";

export const Query = () => {
	const items: any[] = ["Select Query Type", "Find", "FindOne", "FindPaging", "Where", "WherePaging","NotExist","RawQuery"];
	const { properties, setProperty } = useStepEditor();

	const onValueChanged = (value: any) => {
		let _formData: any = properties?.taskSettings
		delete _formData?.payload
		if (value !== "FindOne" || value !== "WherePaging") {
			delete _formData?.sort

		}
		if (value !== "FindOne" || value !== "Where" || value !== "WherePaging") {
			delete _formData?.select

		}
		delete _formData?.take
		delete _formData?.skip
		delete _formData?.orderby
		delete _formData?.asc
		delete _formData?.page
		delete _formData?.dynamicInput
		delete _formData?.order
		if (value !== "Select Document Type") setProperty("type", value);
	};

	const render = () => {
		switch (properties["type"]) {
			case "Find":
				return <FindQuery />;
			case "FindOne":
				return <FindOneQuery />;
			case "FindPaging":
				return <FindPagingQuery />
			case "Where":
				return <WhereQuery />
			case "WherePaging":
				return <WherePagingQuery />
				case "NotExist":
				return <NotExistQuery />
			case "RawQuery":
				return <RawQuery/>
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
