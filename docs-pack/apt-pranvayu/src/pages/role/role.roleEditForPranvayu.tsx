import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { DXButton, DXForm } from '../../components/atoms';
import { regEx } from '../../components/constant/regex';
import { addRoleAPI, updateRoleAPI } from "../../redux/actions";
import { useAppDispatch } from "../../store/customHooks";
import { isRequiredField, isValidField } from '../../utility/utils';
import { IContainerProps } from '../schema';
import { RoleDefinition } from './role.entity';

const RoleEditForPranvayu = (props: IContainerProps) => {
    const { id, data, isActive, entityType } = props;
    const [formData, setFormData] = useState<any>({ ...RoleDefinition });
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (data) {
            setFormData(data);
        }
    }, [data]);


    const handleSubmit = async(e: any) => {
        e.preventDefault();
        if (id) {
          await dispatch(updateRoleAPI(id, formData));
        } else {
          const result: any = await dispatch(addRoleAPI(formData));
          if (result?.success) navigate("/role");
        }
    };

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
                                        disabled:true,
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

                    <div className="form-actions">
                        <DXButton id="role-btn-save" type="default" text={id ? "UPDATE" : "SUBMIT"} useSubmitBehavior={true} stylingMode="contained" icon="save" validationGroup="test"></DXButton>
                        &nbsp;&nbsp;
                        <DXButton id="role-btn-cancel" type="default" text='Cancel' icon="revert" onClick={() => navigate("/role")}></DXButton>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default RoleEditForPranvayu;