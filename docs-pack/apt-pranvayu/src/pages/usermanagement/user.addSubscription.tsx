import { DataGrid } from "devextreme-react";
import { Column, Editing } from "devextreme-react/data-grid";
import React, { useState } from "react";
import { v4 } from "uuid";
import { DXAccordion, DXForm } from "../../components/atoms";
import { RoleIds, SubscriptionIds } from "../../components/constant/constant";

export const UserAddSubscription = React.memo((props: any) => {
    const { data = [], callback, title } = props;
    const payloadDefinition = {
        id: v4(),
        subscriptionId: "",
        roleId: ""
    };

    const [subscriptionAndRole, setSubscriptionAndRole] = useState<any>(payloadDefinition);
    const [subscriptionAndRoles, setSubscriptionAndRoles] = useState<any[]>(data);
    const [row, setRow] = useState<any>("");
    const [toggle, setToggle] = useState(false);

    const handleSubmit = (e: any) => {
        e.preventDefault();
        setToggle(false);
        let _subscriptionAndRoles: any[] = [];

        const subscriptionTitle = SubscriptionIds.find((item) => item.subscriptionId === subscriptionAndRole.subscriptionId)?.subscriptionTitle
        const roleTitle = RoleIds.find((item) => item.roleId === subscriptionAndRole.roleId)?.roleTitle;

        if (row !== "") {
            _subscriptionAndRoles = subscriptionAndRoles?.map((item: any) => {
                if (item.id === row) {
                    return { ...item, ...subscriptionAndRole, subscriptionTitle, roleTitle };
                }
                return item;
            });
        } else {
            const item = { ...subscriptionAndRole, subscriptionTitle, roleTitle }
            _subscriptionAndRoles = [...(subscriptionAndRoles || []), item];
        }
        setSubscriptionAndRoles(_subscriptionAndRoles);
        // Update parent
        callback(_subscriptionAndRoles);
    };

    const onFormDataChange = () => {
        setSubscriptionAndRole(subscriptionAndRole);
    };

   
    function addAndCondition(target: any) {
        setToggle(!toggle);
        setSubscriptionAndRole({ ...payloadDefinition });
    }

    const onRowClick = (e: any) => {
        setRow(e.data.id);
        setToggle(true)
        setSubscriptionAndRole({ ...e.data });
    };

    const gridColumns = [
        {
            dataField: "subscriptionTitle",
            caption: "subscription",
            visible: true,
        },
        {
            dataField: "roleTitle",
            caption: "role",
            visible: true,
        },
        // {
        //     type: "buttons",
        //     caption: "Actions",
        //     buttons: [{
        //         visible: true,
        //         hint: "More commands...",
        //         icon: "edit",// <- it renders        
        //         onClick: CustomButtonTmpl
        //     }]
        // }
    ];
    return (
        <DXAccordion title={title || "Payload"}>
            <form action="your-action" onSubmit={handleSubmit}>
                <DXForm
                    stylingMode="outlined"
                    onFormDataChange={onFormDataChange}
                    formData={subscriptionAndRole}
                    colCount={1}
                    items={[
                        {
                            itemType: "group",
                            cssClass: "no-margin",
                            colCount: 1,
                            items: [
                                {
                                    itemType: "button",
                                    // horizontalAlignment: "left",
                                    cssClass: "",
                                    visible: !toggle,
                                    buttonOptions: {
                                        icon: "add",
                                        text: "ADD SUBSCRIPTION",
                                        type: "default",
                                        useSubmitBehavior: false,
                                        stylingMode: "outlined",
                                        onClick: (e: any) => {
                                            addAndCondition(e);
                                        },
                                    },
                                },
                                {
                                    label: { text: "subscription" },
                                    dataField: "subscriptionId",
                                    editorType: "dxSelectBox",
                                    isRequired: true,
                                    visible: toggle,
                                    editorOptions: {
                                        valueExpr: "subscriptionId",
                                        displayExpr: "subscriptionTitle",
                                        dataSource: SubscriptionIds,
                                        searchEnabled: true
                                    },
                                },
                                {
                                    label: { text: "role" },
                                    dataField: "roleId",
                                    visible: toggle,
                                    isRequired: true,
                                    editorType: "dxSelectBox",
                                    editorOptions: {
                                        valueExpr: "roleId",
                                        displayExpr: "roleTitle",
                                        dataSource: RoleIds,
                                        searchEnabled: true
                                    },
                                },
                                {
                                    itemType: "group",
                                    cssClass: "",
                                    colCount: 2,
                                    items: [
                                        {
                                            itemType: "button",
                                            visible: toggle,
                                            horizontalAlignment: "right",
                                            buttonOptions: {
                                                // text: row !== "" ? "UPDATE" : "SAVE",
                                                type: "default",
                                                //onClick: function () { savePayload() },
                                                useSubmitBehavior: true,
                                                icon: "save",
                                            },
                                        },
                                        {
                                            itemType: "button",
                                            visible: toggle,
                                            horizontalAlignment: "left",
                                            buttonOptions: {
                                                // text: "CANCEL",
                                                icon: "revert",
                                                type: "default",
                                                stylingMode: "outlined",
                                                onClick: function () {
                                                    setToggle(!toggle)
                                                },
                                            },
                                        },]
                                },
                            ]
                        },
                    ]}
                />
            </form>

            {subscriptionAndRoles?.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                    <DataGrid
                        showBorders={true}
                        hoverStateEnabled={true}
                        dataSource={subscriptionAndRoles}
                        keyExpr="id"
                        columns={gridColumns}
                        onRowClick={onRowClick}
                    >
                        <Editing
                            allowDeleting={true}
                            mode="row"
                        />
                        <Column dataField="id" allowEditing={false} />
                    </DataGrid>
                </div>
            )}
        </DXAccordion>
    );
});
