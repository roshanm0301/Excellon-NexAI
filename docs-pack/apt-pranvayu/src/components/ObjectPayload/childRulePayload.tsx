import React, { useState } from "react";
import { OperatorTypes, ValueTypesForParentOfRule, ValueTypesForRule } from "../../pages/actionWorkflow/rule";
import { DXForm } from "../atoms";
import { Get } from "../../api";
import { v4 } from "uuid";

interface IPayload {
    data: any;
    callback: any;
    title?: string;
    item?: any;
    enableOperator?: boolean
    SubscriptionList: any[]
    config: any;
    onHeaderUpdate: boolean
}

export const ChildRulePayload = React.memo((props: IPayload) => {
    const { data, callback, enableOperator = false, SubscriptionList, config, onHeaderUpdate } = props;
    const [valueType, setValueType] = useState<string>(data?.Type)
    const [formData, setFormData] = useState<any>({ ...data });
    const [schemaList, setSchemaList] = useState<any>([])

    const onTypeValueChanged = (e: any) => {
        setValueType(e?.value)
    }

    const handleSubmit = (e: any) => {
        e.preventDefault();
        setFormData({ ...formData });
        callback({ ...formData, Id: v4() })
    };


    return (
        <form action="your-action" onSubmit={handleSubmit}>
            <DXForm
                formData={formData}
                stylingMode="outlined"
                items={[
                    {
                        label: { text: "Key" },
                        dataField: "Key",
                        isRequired: true,
                        editorType: "dxTextBox",
                    },
                    {
                        label: { text: "_type" },
                        dataField: "_type",
                        isRequired: false,
                        editorType: "dxTextBox",
                        visible: valueType === ValueTypesForRule.Condition,
                    },
                    {
                        label: { text: "Type" },
                        dataField: "Type",
                        isRequired: true,
                        editorType: "dxSelectBox",
                        editorOptions: {
                            searchEnabled: true,
                            dataSource: onHeaderUpdate ? Object.values(ValueTypesForParentOfRule) : Object.values(ValueTypesForRule),
                            onValueChanged: (e: any) => onTypeValueChanged(e)
                        },
                    },
                    {
                        label: { text: "Value" },
                        dataField: "Value",
                        // visible: valueType !== ValueTypesForRule.Array,
                        isRequired: true,
                        editorType: "dxTextBox",
                    },
                    {
                        label: { text: "Subscription" },
                        dataField: "Subscription",
                        editorType: "dxSelectBox",
                        isRequired: true,
                        visible: valueType === ValueTypesForRule.Rule,
                        editorOptions: {
                            searchEnabled: true,
                            dataSource: SubscriptionList,
                            displayExpr: "DisplayName",
                            valueExpr: "id",
                            onValueChanged: async (e: any) => {
                                // SubscriptionSelected(e);
                                let _defaultConfig = { ...config, Subscription: e.value };
                                const result: any = await Get(`${config.BASE_URL}Schema/List`, {
                                    headers: _defaultConfig
                                });
                                if (result?.success) {
                                    setSchemaList(result?.data)
                                }
                            },
                        },
                    },
                    {
                        label: { text: "Schema" },
                        dataField: "Schema",
                        editorType: "dxSelectBox",
                        isRequired: true,
                        visible: valueType === ValueTypesForRule.Rule,
                        editorOptions: {
                            searchEnabled: true,
                            dataSource: schemaList,
                            displayExpr: "DisplayName",
                            valueExpr: "id",
                            // onValueChanged: (e: any) => {
                            //     SubscriptionSelected(e);
                            // },
                        },
                    },
                    {
                        label: { text: "Rule" },
                        dataField: "Rule",
                        isRequired: true,
                        visible: valueType === ValueTypesForRule.Rule,
                        editorType: "dxTextBox",
                        // editorOptions: {
                        //     searchEnabled: true,
                        //     dataSource: Object.values(ValueTypesForRule),
                        //     // onValueChanged: (e: any) => onTypeValueChanged(e)
                        // },
                    },
                    {
                        label: { text: "Operator" },
                        dataField: "Operator",
                        editorType: "dxSelectBox",
                        visible: enableOperator,
                        editorOptions: {
                            searchEnabled: true,
                            dataSource: Object.values(OperatorTypes),
                        },
                    },
                    {
                        itemType: "button",
                        horizontalAlignment: "center",
                        buttonOptions: {
                            text: "Save",
                            type: "default",
                            useSubmitBehavior: true,
                        },
                    },
                ]
                }
            ></DXForm>
        </form >
    );
})
