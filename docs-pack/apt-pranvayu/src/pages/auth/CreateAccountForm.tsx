import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './auth.scss'
import { DXForm } from '../../components/atoms';
import { RegisterWithUsername, showNotification, whoAmI } from '../../redux/actions';
import { useAppDispatch } from '../../store/customHooks';
import { isRequiredField, isValidField, setLocalData } from '../../utility/utils';
import { ValidationType } from '../../types';
import { regEx } from '../../components/constant/regex';

export const CreateAccountForm = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [formData] = useState({
    FirstName: "",
    LastName: "",
    Username: "",
    MobileNo: "",
    Email: "",
    Password: "",
    ConfirmPassword: ""
  })

  const handleSubmit =async (e: any) => {
    e.preventDefault();
    const result: any = await dispatch (RegisterWithUsername(formData))
    if (result?.success) {
      navigate('/login');
    } else {
      dispatch(showNotification({
        isOpen: true,
        message: "Validation error",
        type: "error",
      }));
    }
  };

  const confirmPassword = useCallback(
    ({ value }: ValidationType) => value === formData.Password,
    []
  );


  return (
    <div className="content">
      <form
        action="your-action"
        onSubmit={handleSubmit}
        className="subscription-form"
      >
        <DXForm
          formData={formData}
          cssClass="no-margin"
          width="100%"
          labelMode="floating"
          stylingMode="outlined"
          items={[
            {
              label: { text: "FirstName", location: "top" },
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
              label: { text: "LastName", location: "top" },
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
              label: { text: "Username", location: "top" },
              dataField: "Username",
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
              label: { text: "Mobile No", location: "top" },
              dataField: "MobileNo",
              validationRules: [
                {
                  type: "required",
                  message: isRequiredField("MobileNumber"),
                },
                {
                  type: "pattern",
                  pattern: regEx.mobileNumber,
                  message: isValidField("MobileNumber"),
                },
              ],
            },
            {
              label: { text: "Email", location: "top" },
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
              label: { text: "Password", location: "top" },
              dataField: "Password",
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
              editorOptions:{mode:'password'}
            },
            {
              label: { text: "Confirm Password", location: "top" },
              dataField: "ConfirmPassword",
              isRequired: true,
              editorOptions:{mode:'password'},
              validationRules: [{
                type: "custom",
                validationCallback: confirmPassword,
                message: "'New Password' and 'Confirm Password' do not match."
              },
              {
                type: "required",
                message: isRequiredField("ConfirmPassword"),
            }
            ]
            },
            {
              itemType: "group",
              caption: "",
              cssClass: "no-margin",
              colCount: 2,
              items: [
                {
                  itemType: "button",
                  horizontalAlignment: "center",
                  buttonOptions: {
                    text: "Register",
                    type: "default",
                    useSubmitBehavior: true,
                  },
                },
                // {
                //   itemType: "button",
                //   horizontalAlignment: "right",
                //   buttonOptions: {
                //     text: "Sign In",
                //     type: "",
                //     useSubmitBehavior: false,
                //     onClick: function () {
                //         navigate("/login")
                //     }
                //   },
                // },
              ],
            },
          ]}
        ></DXForm>
        <div className={'login-link'} style={{ textAlign: 'center' }}>
        Already have an account? <Link to={'/login'}>Sign In</Link>
        </div>
      </form>
    </div>
  );
}