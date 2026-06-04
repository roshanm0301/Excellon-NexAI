import React, { useEffect, useState } from "react";
import { DXAccordion, DXDataGrid, DXForm } from "../../components/atoms";
import { ActionList, SchemaList } from "./role.entity";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { addClaimAPI, getActionListAPI, getRoleAPI, getSchemaListAPI, updateClaimAPI } from "../../redux/actions";
import { DataGrid } from "devextreme-react";
import { Column, Editing } from "devextreme-react/data-grid";
interface IpayloadDefinition {
    schemaId: string,
    actions: []
};


const payloadDefinition: IpayloadDefinition = {
    schemaId: "",
    actions: []
}
export const AddRoleAccesss = React.memo((props: any) => {
    const { id, data = [], callback, title, schemaList, sendDataToParent, actionList } = props;
    const [roleAccessMapping, setRoleAccessMapping] = useState<any>({ ...payloadDefinition });
    const [roleAccessMappings, setRoleAccessMappings] = useState(data);
    const [accessMappings, setAccessMappings] = useState<any>([]);
    const [row, setRow] = useState<any>("");
    const [toggle, setToggle] = useState(false);
    const dispatch = useAppDispatch();
    let { schemas } = useAppSelector((state) => state.schema);
    let { actions } = useAppSelector((state) => state.action);
    let { role } = useAppSelector((state) => state.role)
    const [schemaSelected, setSchemaSelected] = useState('')
    const [convertIds, setConvertIds] = useState<any>([])

    useEffect(() => {
        dispatch(getSchemaListAPI(null))
        if (schemaSelected !== '') {
            dispatch(getActionListAPI(schemaSelected))
        }
    }, [schemaSelected])

    useEffect(() => {
        if (id) {
            getClaimData();
            getClaimDataIds();
        }
    }, [id, actions])

    const getClaimData = async () => {
        const result: any = await dispatch(getRoleAPI(id))

        var _groupBy = function (list: any, keyGetter: any) {
            const map = new Map();
            list.forEach((item: any) => {
                const key = keyGetter(item);
                const collection = map.get(key);
                if (!collection) {
                    map.set(key, [item.ActionSystemName]);
                } else {
                    collection.push(item.ActionSystemName);
                }
            });
            return map;
        }
        let groupDataByDate: any = _groupBy(result.Claims, (e: any) => e.SchemaSystemName);
        let payload = []
        for (let [key, value] of groupDataByDate) {
            let obj = {
                schemaId: key,
                actions: value.filter((item: any, i: any, ar: any) => ar.indexOf(item) === i)
            }
            payload.push(obj)
        }
        setRoleAccessMappings(payload)
        setAccessMappings(payload)
    }

    const getClaimDataIds = async () => {
        const result: any = await dispatch(getRoleAPI(id))

        var _groupBy = function (list: any, keyGetter: any) {
            const map = new Map();
            list.forEach((item: any) => {
                const key = keyGetter(item);
                const collection = map.get(key);
                if (!collection) {
                    map.set(key, [item.ActionId]);
                } else {
                    collection.push(item.ActionId);
                }
            });
            return map;
        }
        let groupDataByDate: any = _groupBy(result.Claims, (e: any) => e.SchemaId);
        let payload = []
        for (let [key, value] of groupDataByDate) {
            let obj = {
                schemaId: key,
                actions: value.filter((item: any, i: any, ar: any) => ar.indexOf(item) === i)
            }
            payload.push(obj)
        }
        return payload;
    }

    const grouped = data.reduce((result: any, current: any) => {
        const group = result[current.SchemaSystemName] || [];
        group.push(current.ActionId);
        result[current.SchemaSystemName] = group;
        return result;
    }, {});

    const handleSubmit = async (e: any) => {

        e.preventDefault();
        e.stopPropagation()
        let claimIds: any = await getClaimDataIds()
        // return false
        // setToggle(!toggle);

        let _roleAccessMappings: any = [];
        if (row !== "") {
            claimIds = claimIds.map((item: any) => {
                if (item.schemaId === roleAccessMapping.schemaId) {
                    item.actions = roleAccessMapping.actions.filter((i: any) => typeof (i) === 'string')
                }
                return item;
            })
            let applicationClaimsPayload = {
                RoleId: id,
                ApplicationClaims: claimIds
            }
            const result: any = await dispatch(updateClaimAPI(id, applicationClaimsPayload));
            if (result.success === true) {
                setToggle(!toggle);
            }
            setRow("");

        } else {

            _roleAccessMappings = [...claimIds || [], roleAccessMapping];
            let applicationClaimsPayload = {
                RoleId: id,
                ApplicationClaims: _roleAccessMappings
            }

            const result: any = await dispatch(updateClaimAPI(id, applicationClaimsPayload));
            if (result.success === true) {
                setToggle(!toggle);
            }
            setRow("");
        }
        getClaimData();
    }

    const CustomButtonTmpl = async (e: any) => {
        const actions: any[] = [];
        const Schema = schemas.find((item: any) => item.SystemName === e.row.data.schemaId
        );
        setSchemaSelected(Schema.id)
        role?.Claims.forEach((element: any) => {
            if (element.SchemaId === Schema.id) {
                actions.push(element.ActionId)
            }
        });
        setRoleAccessMapping({ schemaId: Schema.id, actions: actions })
        setRow(Schema.id)
        setToggle(true);
    }

    function addAndCondition(target: any) {
        setToggle(!toggle);
        setRoleAccessMapping({ ...payloadDefinition });
    }

    const gridColumns = [
        {
            dataField: "schemaId",
            caption: "SchemaName",
            visible: true
        },
        {
            dataField: "actions",
            caption: "ActionList",
            visible: true
        },
        {
            type: "buttons",
            caption: "Actions",
            buttons: [{
                visible: true,
                hint: "More commands...",
                icon: "edit",// <- it renders Ã‚Â  Ã‚Â  Ã‚Â  Ã‚Â 
                onClick: CustomButtonTmpl
            }]
        }
    ];

    const handleValueChanged = (e: any) => {
        setSchemaSelected(e.value)
    };

    const onEditRowKeyChange = (e: any) => {
        setRow(e.data);

        setToggle(!toggle)
        setRoleAccessMapping({ ...e.data })
        setSchemaSelected(e.data.schemaId)
    };


    const actionValueExpr = (e: any) => {
        return e && e.id
    }

    const SchemaValueExpr = (e: any) => {
        return e && e.id
    }
    return (
        <DXAccordion title={title || "AccessMapping"}>
            <form action="your-action" onSubmit={handleSubmit}>
                <DXForm
                    // onFieldDataChanged={onFormDataChange}
                    formData={roleAccessMapping}
                    colCount={1}
                    stylingMode="outlined"
                    items={[
                        {
                            itemType: "group",
                            cssClass: "no-margin",
                            colCount: 1,
                            items: [
                                {
                                    itemType: "button",
                                    visible: !toggle,
                                    buttonOptions: {
                                        icon: "add",
                                        text: "Role Access",
                                        type: "default",
                                        useSubmitBehavior: false,
                                        stylingMode: "outlined",
                                        onClick: (e: any) => {
                                            addAndCondition(e);
                                        },
                                    },
                                },
                                {
                                    label: { text: "Schema" },
                                    dataField: "schemaId",
                                    editorType: "dxSelectBox",
                                    visible: toggle,
                                    editorOptions: {
                                        // valueExpr: SchemaValueExpr,
                                        valueExpr: "id",
                                        multiline: true,
                                        displayExpr: "SystemName",
                                        dataSource: row === "" ? schemas?.filter((schema: any) => !data.some((d: any) => d.SchemaId === schema.id)) : schemas,
                                        searchEnabled: true,
                                        onValueChanged: handleValueChanged
                                    },
                                },
                                {
                                    label: { text: "Actions" },
                                    dataField: "actions",
                                    visible: toggle,
                                    isRequired: true,
                                    editorType: "dxTagBox",
                                    editorOptions: {
                                        // value:{roleValue} ,       
                                        dataSource: actions,
                                        // valueExpr: actionValueExpr,
                                        displayExpr: "SystemName",
                                        valueExpr: "id",
                                        multiline: true,
                                        // maxDisplayedTags: 6,
                                        label: "ActionList",
                                        //labelMode="floating"        
                                        showSelectionControls: true,
                                        searchEnabled: true,
                                        // dropDownOptions:{dropDownOptions},      
                                        // onValueChanged:{onRoleSelect}
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
                                                    setRow('')
                                                    setToggle(!toggle)
                                                    setRoleAccessMapping({ ...payloadDefinition })
                                                },
                                            },
                                        },]
                                },
                            ]
                        },
                    ]}
                />
            </form>
            <DXDataGrid
                gridVisible={!toggle}
                hoverStateEnabled={true}
                dataSource={accessMappings}
                keyExpr="schemaId"
                columns={gridColumns}
                count={accessMappings.length || []}
                onEdit={false}
            />
        </DXAccordion>
    );
});
