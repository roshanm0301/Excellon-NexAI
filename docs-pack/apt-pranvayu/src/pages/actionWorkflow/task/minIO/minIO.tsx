import { DXSelect } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import { BucketExist } from "./minIO.bucketExist";
import { GetBucketPolicy } from "./minIO.getBucketPolicy";
import { GetObject } from "./minIO.getObject";
import { MakeBucket } from "./minIO.makeBucket";
import { PutObject } from "./minIO.putObject";
import { RemoveBucket } from "./minIO.removeBucket";
import { SetBucketPolicy } from "./minIO.setBucketPolicy";
import { StatObject } from "./miniO.statObject";

export const MinIOTask = () => {
	const items: any[] = [
		"Select Minio Type",
		"PutObject",
		"BucketExists",
		"MakeBucket",
		"RemoveBucket",
		"SetBucketPolicy",
		"GetBucketPolicy",
		"GetObject",
		"StatObject"
	];
	const { properties, setProperty } = useStepEditor();

	const onValueChanged = (value: any) => {
		let _formData: any = properties?.taskSettings
		delete _formData?.payload
		if (value !== "Select Request Type") setProperty("type", value);
	};

	const render = () => {
		switch (properties["type"]) {
			case "MakeBucket":
				return <MakeBucket />;
			case "PutObject":
				return <PutObject />;
			case "BucketExists":
				return <BucketExist />;
			case "RemoveBucket":
				return <RemoveBucket />;
			case "SetBucketPolicy":
				return <SetBucketPolicy />
			case "GetBucketPolicy":
				return <GetBucketPolicy />
			case "GetObject":
				return <GetObject />
			case "StatObject":
				return <StatObject />
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
