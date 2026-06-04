import { DXSelect } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import { GenerateKeys } from "./rsa.generateKeys";
import { PrivateDecrypt } from "./rsa.privateDecrypt";
import { PrivateEncrypt } from "./rsa.privateEncrypt";
import { PublicDecrypt } from "./rsa.publicDecrypt";
import { PublicEncrypt } from "./rsa.publicEncrypt";

export const RSATask = () => {
	const items: any[] = [
		"Select RSA Type",
		"Generate",
		"PublicEncrypt",
		"PublicDecrypt",
		"PrivateEncrypt",
		"PrivateDecrypt",
	];
	const { properties, setProperty } = useStepEditor();

	const onValueChanged = (value: any) => {
		let _formData: any = properties?.taskSettings

		delete _formData?.privateKey
		delete _formData?.publicKey
		delete _formData?.str

		if (value !== "Select Request Type") setProperty("type", value);
	};

	const render = () => {
		switch (properties["type"]) {
			case "Generate":
				return <GenerateKeys />;
			case "PublicEncrypt":
				return <PublicEncrypt />;
			case "PublicDecrypt":
				return <PublicDecrypt />;
			case "PrivateEncrypt":
				return <PrivateEncrypt />;
			case "PrivateDecrypt":
				return <PrivateDecrypt />;
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
