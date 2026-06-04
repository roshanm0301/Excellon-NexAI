import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { DXForm } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import { errorDefinition, errorStatusCode, failedDefinition, successDefinition, successStatusCode } from "../../common.entity";
import { TaskType } from "../../rule";
import { isValidField } from "../../../../utility/utils";
import { regEx, regexEx } from "../../../../components/constant/regex";
import { createRoot } from "react-dom/client";
import { QueryBuilderTemplate } from "../../../../components/template";

export function Loop() {
	let { id: stepId, name: stepName, setId, setName, properties, setProperty } = useStepEditor();
	const [formData, setFormData] = useState({
		id: "", // Will be synced from step.id
		name: "",
		start: 0,
		type: TaskType.Loop, // hardcoded readonly
		tasks: [],
		iterations: 0 || "",
		index: "",
		break: false,
		breakConditions: {
			and: [],
			any: [],
			operator: "",
			fact: "",
			value: "",
		},
		success: { ...successDefinition },
		failed: { ...failedDefinition },
		error: { ...errorDefinition },
	});
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

	useEffect(() => {
		if (properties?.taskSettings) {
			const data: any = properties?.taskSettings;
			// Sync id from step.id (execution taskId) and name from step.name (display name)
			setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, name: stepName || data.name || '' }));
		} else {
			// Initialize from step even if no taskSettings
			setFormData(prev => ({ ...prev, id: stepId || prev.id, name: stepName || prev.name }));
		}
	}, [stepId, stepName, properties]);

	const onQueryCallBack = (conditions: any) => {
		const _formData = { ...formData, breakConditions: conditions };
		autoSave(_formData);
	};

	const onFormDataChange = (e: any) => {
		const _formData = e.component.option("formData");
		autoSave(_formData);
	};

	const onBreakChange = (e: any) => {
		if (e.event) {
			if (e.value === true) {
				setFormData({
					...formData,
					break: e.value,
					breakConditions: {
						and: [],
						any: [],
						operator: "",
						fact: "",
						value: "",
					},
				});
			} else {
				let _formData: any = { ...formData, break: e.value }
				delete _formData.breakConditions;
				setFormData({ ..._formData });
			}
		}
	};

	return (
		
			<DXForm
				onFieldDataChanged={onFieldDataChanged}
          stylingMode="outlined"
				formData={formData}
				onFormDataChange={onFormDataChange}
				items={[
					{
						label: { text: "Id", location: "top" },
						dataField: "id",
						isRequired: true,
					},
					{
						label: { text: "Name", location: "top" },
						dataField: "name",
						isRequired: true,
					},
					{
						label: { text: "Start", location: "top" },
						dataField: "start",
						validationRules: [
							{
								type: "pattern",
								pattern: regEx.number,
								message: isValidField(`Start`),
							},
						],
					},
					{
						label: { text: "Iterations", location: "top" },
						dataField: "iterations",
						isRequired: true,
					},
					{
						label: { text: "Index", location: "top" },
						dataField: "index",
						isRequired: true,
					},
					{
						label: { text: "Break", location: "left" },
						dataField: "break",
						editorType: "dxCheckBox",
						editorOptions: {
							onValueChanged: (e: any) => onBreakChange(e),
						},
					},
					{
						label: { text: "Break Conditions", location: "top" },
						dataField: "breakConditions",
						isRequired: true,
						visible: formData.break,
						template: async (data: any, itemElement: any) => {
							const root = createRoot(itemElement!);
							root.render(
								<QueryBuilderTemplate
									conditions={data.editorOptions.value}
									callBack={onQueryCallBack}
								></QueryBuilderTemplate>
							);
						},
					},
					{
						itemType: "group",
						caption: "Success",
						cssClass: "no-margin",
						colCount: 1,
						items: [
							{
								label: { text: "Status Code" },
								dataField: "success.statusCode",
								editorType: "dxSelectBox",
								editorOptions: {
									dataSource: successStatusCode,
								},
							},
							{
								label: { text: "Data" },
								dataField: "success.data",
							},
							{
								label: { text: "Code" },
								dataField: "success.code",
							},
							{
								label: { text: "Cookies" },
								dataField: "success.cookies",
							},
						],
					},
					{
						itemType: "group",
						caption: "Error",
						cssClass: "no-margin",
						colCount: 1,
						items: [
							{
								label: { text: "Status Code" },
								dataField: "error.statusCode",
								editorType: "dxSelectBox",
								editorOptions: {
									dataSource: errorStatusCode,
								},
							},
							{
								label: { text: "Message" },
								dataField: "error.message",
							},
							{
								label: { text: "Code" },
								dataField: "error.code",
							},
							{
								label: { text: "Error" },
								dataField: "error.error",
							},
						],
					},
					{
						itemType: "group",
						caption: "Failed",
						cssClass: "no-margin",
						colCount: 1,
						items: [
							{
								label: { text: "Status Code" },
								dataField: "failed.statusCode",
							},
							{
								label: { text: "Message" },
								dataField: "failed.message",
							},
							{
								label: { text: "Code" },
								dataField: "failed.code",
							},
							{
								label: { text: "Error" },
								dataField: "failed.error",
							},
						],
					},
				]}
			></DXForm>
);
}
