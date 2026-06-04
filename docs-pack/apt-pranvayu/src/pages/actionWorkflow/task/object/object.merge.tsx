import { useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { createRoot } from "react-dom/client";
import { v4 } from "uuid";
import { DXForm } from "../../../../components/atoms";
import { regEx, regexEx } from "../../../../components/constant/regex";
import { MergePath } from "../../../../components/molecules";
import { useStepEditor } from "../../../../react";
import { isRequiredField, isValidField } from "../../../../utility/utils";
import { errorDefinition, errorStatusCode, failedDefinition, failedStatusCode, successDefinition, successStatusCode } from "../../common.entity";
import { ObjectMethodType, TaskType } from "../../rule";

export function MergeObject() {
	let { id: stepId, name: stepName, setId, setName, properties, setProperty } = useStepEditor();
	const [formData, setFormData] = useState({
		id: "",
		name: "",
		type: TaskType.Object,
		method: "Merge",
		paths: [],
		success: { ...successDefinition },
		failed: { ...failedDefinition },
		error: { ...errorDefinition },
	});
  const { onFieldDataChanged, autoSave } = useAutoSave(formData, stepId, stepName, setProperty, setId, setName);

	useEffect(() => {
		if (properties?.taskSettings) {
			const data: any = properties?.taskSettings;

			if (data.paths.length > 0) {
				let _paths = data?.paths?.map((item: any) => {
					if (item?.id) {
						return { id: v4(), Value: item.Value }
					} else {
						return { id: v4(), Value: item }
					}
				})
				setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, method: properties.type as ObjectMethodType.Merge, paths: _paths }));
			} else {
				setFormData(prev => ({ ...prev, ...data, id: stepId || data.id || prev.id, method: properties.type as ObjectMethodType.Merge }));
			}
		}
	}, [stepId, stepName, properties]);
	const onPayloadCallbackMerge = (path: any) => {
		const _formData: any = { ...formData, paths: path };
		autoSave(_formData);
	};
	return (
		<>
			
				<DXForm
					onFieldDataChanged={onFieldDataChanged}
          stylingMode="outlined"
					formData={formData}
					items={[
						{
							label: { text: "Id", location: "top" },
							dataField: "id",
							isRequired: true,
						}, {
							label: { text: "Name", location: "top" },
							dataField: "name",
							isRequired: true,
						},
						{
							label: { text: "Path" },
							isRequired: true,

							validationRules: [
								{
									type: "required",
									message: isRequiredField("paths"),
								},
								{
									type: "pattern",
									pattern: regEx.pattern,
									message: isValidField(`path ${regexEx.pattern}`),
								},
							],
							template: async (data: any, itemElement: any) => {
								const root = createRoot(itemElement!);
								root.render(
									<MergePath
										title={'Paths'}
										data={formData.paths}
										callback={onPayloadCallbackMerge}
									/>
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
									editorType: "dxSelectBox",
									editorOptions: {
										dataSource: failedStatusCode,
									},
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
</>
	);
}
