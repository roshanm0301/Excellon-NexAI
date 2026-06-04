import { useEffect, useState } from 'react';

import { createRoot } from 'react-dom/client';
import { useNavigate } from "react-router-dom";
import { DXButton, DXForm } from '../../components/atoms';
import { addApprovalAPI, addClaimAPI, addRoleAPI, getActionListAPI, getSchemaListAPI, updateRequestAPI, updateRoleAPI } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { AddRoleAccesss } from "./role.addRoleAccess";
import { RoleDefinition } from './role.entity';
import { RootState } from '../../store/store';
import { useSelector } from 'react-redux';
import { IRequestCrud, IProvisioningRequestStatus } from '../actionWorkflow/rule';
import { IContainerProps } from '../schema';
import { regEx } from '../../components/constant/regex';
import { isRequiredField, isValidField } from '../../utility/utils';

const AddEditRole = (props: IContainerProps) => {
    const { id, data, isActive, entityType } = props;
    const [formData, setFormData] = useState<any>({ ...RoleDefinition });
    const selectedUser = useSelector((state: RootState) => state.auth.selectedUser);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (data) {
            setFormData(data);
        }
    }, [data]);

    const onRoleAccessCallback = (applicationRoleData: any) => {
        const _formData = { ...formData, ApplicationClaims: applicationRoleData };
        setFormData({ ..._formData });
    }

    // const addEditRole = async (item: any) => {
    //     setFormData({ ...formData });
    //     let payload = {
    //         Entity: formData,
    //         Status: item,
    //         RequestType: formData.id ? IRequestCrud.Update : IRequestCrud.Create,
    //         EntityType: 'Role',
    //         AssignForApproval: '5dec1c81-ab59-47f1-ab6d-3cbb7f07302c'
    //     }
    //     let result: any = null;
    //     if (selectedUser) {
    //         if (id && entityType && payload.Status === IProvisioningRequestStatus.PendingForApproval) {
    //             result = await dispatch(updateRequestAPI(id, payload));
    //         } else {
    //             result = await dispatch(addApprovalAPI(payload));
    //         }
    //     } else {
    //         if (id) {
    //             result = await dispatch(updateRoleAPI(id, formData));
    //             if (result.success) {
    //                 let applicationClaimsPayload = {
    //                     RoleId: id,
    //                     ApplicationClaims: formData.ApplicationClaims
    //                 }
    //                 // await dispatch(updateRoleApplicationMappingAPI(formData.id, applicationClaimsPayload))
    //             }
    //         } else {
    //             result = await dispatch(addRoleAPI(formData));
    //             if (result.success) {
    //                 let applicationClaimsPayload = {
    //                     RoleId: result.documentId,
    //                     ApplicationClaims: formData.ApplicationClaims
    //                 }
    //                 // await dispatch(addClaimAPI(applicationClaimsPayload))
    //             }
    //         }
    //     }
    //     navigate("/role");
    // }

    const handleSubmit =async(e: any) => {
        e.preventDefault();
        if (id) {
          await dispatch(updateRoleAPI(id, formData));
        } else {
          const result: any = await dispatch(addRoleAPI(formData));
          if (result?.success) navigate("/role");
        }
    };

    // const handleSendForApproval = (e: any) => {
    //     addEditRole(IProvisioningRequestStatus.PendingForApproval)
    // };

    return (
        <div>
            <div className={"content-block dx-card responsive-paddings"}>
                <form action="your-action"
                    onSubmit={handleSubmit}
                >
                    <DXForm
                        formData={formData}
                        stylingMode="outlined"
                        validationGroup="test"
                        items={[
                            {
                                itemType: 'group',
                                name: 'test',
                                colCount: 2,
                                items: [
                                    {
                                        label: { text: "System Name", location: "top" },
                                        dataField: "SystemName",
                                        validationRules: [
                                            {
                                                type: "required",
                                                message: isRequiredField("SystemName"),
                                            },
                                            {
                                                type: "pattern",
                                                pattern: regEx.validString,
                                                message: isValidField("SystemName, {Special characters are not allowed}"),
                                            },
                                        ],
                                    },
                                    {
                                        label: { text: "Display Name", location: "top" },
                                        dataField: "DisplayName",
                                        validationRules: [
                                            {
                                                type: "required",
                                                message: isRequiredField("DisplayName"),
                                            },
                                            {
                                                type: "pattern",
                                                pattern: regEx.stringWithSpace,
                                                message: isValidField("DisplayName, {Special characters are not allowed}"),
                                            },
                                        ],
                                    },
                                ]
                            },
                        ]}
                    >
                    </DXForm>
                    {id && <AddRoleAccesss id={data.RoleId} data={formData.Claims} callback={onRoleAccessCallback} />}

                    <div className="form-actions">
                        <DXButton id="role-btn-save" type="default" text={id ? "UPDATE" : "SUBMIT"} useSubmitBehavior={true} stylingMode="contained" icon="save" validationGroup="test"></DXButton>
                        &nbsp;&nbsp;
                        <DXButton id="role-btn-cancel" type="default" text='Cancel' icon="revert" onClick={() => navigate("/role")}></DXButton>
                        &nbsp;&nbsp;
                        {/* <DXButton type="default" visible={selectedUser === true} text='SEND FOR APPROVAL' icon="lock" onClick={(e: any) => handleSendForApproval(e)}></DXButton> */}
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddEditRole;