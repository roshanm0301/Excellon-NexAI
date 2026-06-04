import { useState, useEffect, useCallback } from "react";
import { userDefinition } from "./user.management.entity";
import { CreateUserManagement, GetIdentityById, getRoleListAPI, getSubscriptionListAPI, UpdateUserManagement } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { DXButton, DXForm } from "../../components/atoms";
import { isRequiredField, isValidField } from "../../utility/utils";
import { regEx } from "../../components/constant/regex";
import { useNavigate, useParams } from "react-router";
import { IContainerProps } from "../schema";
import { EyeIcon, EyeWithSlashIcon } from "../../assets/icons";
import { ValidationType } from "../../types";
import { UploadLogo } from "../../components/molecules/uploadLogo";

const AddEditUser = (props: IContainerProps) => {
  const [userFormData, setUserFormData] = useState({ ...userDefinition });
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [passwordVisibility, setPasswordVisibility] = useState('password');
  const [confirmPasswordVisibility, setConfirmPasswordVisibility] = useState('password');
  const { id } = useParams();
  let { subscriptions, count } = useAppSelector((state) => state.subscription);
  let { roles } = useAppSelector((state) => state.role);

  useEffect(() => {
    if (id) {
      const FetchData = async () => {
        const result: any = await dispatch(GetIdentityById(id));
        if (result?.success) {
          setUserFormData(result?.data);
        }
      }
      FetchData();
    }
  }, []);

  useEffect(() => {
    dispatch(getSubscriptionListAPI(null));
    dispatch(getRoleListAPI(null))
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const result: any = id
      ? await dispatch(UpdateUserManagement(id, userFormData))
      : await dispatch(CreateUserManagement(userFormData));
    if (result?.success) {
      navigate("/user");
    }
  };

  const onImageCallback = (attachment: any) => {
    const _formData = { ...userFormData, Upload: attachment };
    setUserFormData({ ..._formData });
  };

  const confirmPassword = useCallback(
    ({ value }: ValidationType) => value === userFormData.Password,
    []
  );
  return (
    <div>
      <div className={"content-block dx-card responsive-paddings"}>
        <form action="your-action" onSubmit={handleSubmit}>
          <DXForm
            stylingMode="outlined"
            formData={userFormData}
            items={[
              {
                itemType: "group",
                cssClass: "no-margin",
                colCount: 1,
                items: [
                  {
                    itemType: "group",
                    cssClass: "no-margin",
                    colCount: 2,
                    items: [
                      {
                        label: { text: "First Name", location: "top" },
                        dataField: "FirstName",
                        validationRules: [
                          {
                            type: "required",
                            message: isRequiredField("FirstName"),
                          },
                          {
                            type: "pattern",
                            pattern: regEx.validName,
                            message: isValidField("FirstName"),
                          },
                        ],
                      },
                      {
                        label: { text: "Last Name", location: "top" },
                        dataField: "LastName",
                        validationRules: [
                          {
                            type: "required",
                            message: isRequiredField("LastName"),
                          },
                          {
                            type: "pattern",
                            pattern: regEx.validName,
                            message: isValidField("LastName"),
                          },
                        ],
                      },
                      {
                        label: { text: "Mobile Number", location: "top" },
                        dataField: "MobileNo",
                        validationRules: [
                          {
                            type: "required",
                            message: isRequiredField("MobileNo"),
                          },
                          {
                            type: "pattern",
                            pattern: regEx.mobileNumber,
                            message: isValidField("MobileNo"),
                          },
                        ],
                      },
                      {
                        label: { text: "Email ID", location: "top" },
                        dataField: "Email",
                        validationRules: [
                          {
                            type: "required",
                            message: isRequiredField("Email"),
                          },
                          {
                            type: "pattern",
                            pattern: regEx.emailId,
                            message: isValidField("Email"),
                          },
                        ],
                      },
                      {
                        label: { text: "Username", location: "top" },
                        dataField: "Username",
                        disabled: id ? true : false,
                        validationRules: [
                          {
                            type: "required",
                            message: isRequiredField("Username"),
                          },
                          {
                            type: "pattern",
                            pattern: regEx.userName,
                            message: isValidField("Username"),
                          },
                        ],
                      },
                      {
                        label: { text: "Role" },
                        dataField: "RoleId",
                        isRequired: true,
                        disabled: id ? true : false,
                        editorType: "dxSelectBox",
                        editorOptions: {
                          valueExpr: "id",
                          displayExpr: "SystemName",
                          dataSource: roles,
                          searchEnabled: true
                        },
                      },
                      {
                        label: { text: "Password", location: "top" },
                        dataField: "Password",
                        visible: id ? false : true,
                        validationRules: [
                          {
                            type: "required",
                            message: isRequiredField("Password"),
                          },
                          {
                            type: "pattern",
                            pattern: regEx.password,
                            message: isValidField("Password"),
                          },
                        ],
                        editorOptions: {
                          mode: passwordVisibility,
                          buttons: [
                            {
                              name: 'password',
                              location: 'after',
                              options: {
                                icon: passwordVisibility === 'password' ? EyeWithSlashIcon : EyeIcon,
                                type: 'text',
                                onClick: function () {
                                  setPasswordVisibility(passwordVisibility === 'password' ? 'text' : 'password');
                                }
                              },
                            },
                          ],
                        }
                      },
                      {
                        label: { text: "Confirm Password", location: "top" },
                        dataField: "ConfirmPassword",
                        isRequired: true,
                        visible: id ? false : true,
                        validationRules: [{
                          type: "custom",
                          validationCallback: confirmPassword,
                          message: "'New Password' and 'Confirm Password' do not match."
                        },
                        {
                          type: "required",
                          message: isRequiredField("ConfirmPassword"),
                        },
                        {
                          type: "pattern",
                          pattern: regEx.password,
                          message: isValidField("Password"),
                        },
                        ],
                        editorOptions: {
                          mode: confirmPasswordVisibility,
                          buttons: [
                            {
                              name: 'password',
                              location: 'after',
                              options: {
                                icon: confirmPasswordVisibility === 'password' ? EyeWithSlashIcon : EyeIcon,
                                type: 'text',
                                onClick: function () {
                                  setConfirmPasswordVisibility(confirmPasswordVisibility === 'password' ? 'text' : 'password');
                                }
                              },
                            },
                          ],
                        }
                      },
                    ],
                  },
                ],
              },
              {
                label: { text: "Subscriptions" },
                dataField: "Subscriptions",
                isRequired: true,
                editorType: "dxTagBox",
                editorOptions: {
                  dataSource: subscriptions,
                  displayExpr: "SystemName",
                  valueExpr: "id",
                  multiline: true,
                  showSelectionControls: true,
                  searchEnabled: true,
                },
              },
            ]}
          ></DXForm>

          <UploadLogo
            title={"Profile Picture"}
            data={userFormData.Upload}
            callback={onImageCallback}
          />
          <div className="form-actions">
            <DXButton id="role-btn-save" type="default" text={id ? "UPDATE" : "SUBMIT"} useSubmitBehavior={true} stylingMode="contained" icon="save" validationGroup="test"></DXButton>
            &nbsp;&nbsp;
            <DXButton id="role-btn-cancel" type="default" text='Cancel' icon="revert" onClick={() => navigate("/user")}></DXButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditUser;
