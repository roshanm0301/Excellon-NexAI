import { RuleExecute, RuleExecutor, RuleFindOne, RuleGet, RuleList, RulePaging, RulePost, RulePut } from ".";
import { DXSelect } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import { RuleObject } from "./rule.object";

export const Rule = () => {
	const items: any[] = [
		"Select Action Type",
		"Object",
		"Execute",
		"Get",
		"Post",
		"Put",
		"List",
		"Paging",
		"FindOne",
		"Executor"
	];
	const { properties, setProperty } = useStepEditor();

	const onValueChanged = (value: any) => {
		if (value !== "Select Request Type") setProperty("type", value);
	};

	const render = () => {
		switch (properties["type"]) {
			case "Execute":
				return <RuleExecute />;
			case "Object":
				return <RuleObject />;
			case "Get":
				return <RuleGet />;
			case "Put":
				return <RulePut />;
			case "Post":
				return <RulePost />;
			case "List":
				return <RuleList />;
			case "Paging":
				return <RulePaging />;
			case "FindOne":
				return <RuleFindOne />;
			case "Executor":
				return <RuleExecutor />;
			default:
				return <></>;
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
