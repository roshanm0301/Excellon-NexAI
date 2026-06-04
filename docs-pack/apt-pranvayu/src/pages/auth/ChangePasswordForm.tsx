import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EyeIcon, EyeWithSlashIcon } from '../../assets/icons';
import { DXForm } from '../../components/atoms';
import { regEx } from '../../components/constant/regex';
import { ChangePassword } from '../../redux/actions';
import { useAppDispatch } from '../../store/customHooks';
import { ValidationType } from '../../types';
import { isRequiredField, isValidField } from '../../utility/utils';
import SingleCardWithoutHeader from '../../layouts/single-card/single-card-without-header';

export const ChangePasswordForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [formData] = useState({ OldPassword: '', NewPassword: '', ConfirmPassword: '' });
  const [passwordVisibility, setPasswordVisibility] = useState({
    oldPassword: 'password',
    newPassword: 'password',
    confirmPassword: 'password',
  });

  const togglePasswordVisibility = (fieldName: any) => {
    setPasswordVisibility((prevState: any) => ({
      ...prevState,
      [fieldName]: prevState[fieldName] === 'password' ? 'text' : 'password',
    }));
  };

  const onSubmit = useCallback(async (e: any) => {
    e.preventDefault();
    const result: any = await dispatch(ChangePassword(formData));
    if (result?.success) {
      navigate('/dashboard');
    } else {
    }
  }, [navigate]);

  const confirmPassword = useCallback(
    ({ value }: ValidationType) => value === formData.NewPassword,
    []
  );

  return (
    <div className="content">
      <SingleCardWithoutHeader title="Change Password">
        <form
          action="your-action"
          onSubmit={onSubmit}
          className="subscription-form"
        >
          <DXForm
            formData={formData}
            cssClass="no-margin"
            width="100%"
            // labelMode="center"
            stylingMode="outlined"
            items={[
              {
                label: { text: "Old Password", location: "top" },
                dataField: "OldPassword",
                validationRules: [
                  {
                    type: "required",
                    message: isRequiredField("OldPassword"),
                  },
                  {
                    type: "pattern",
                    pattern: regEx.password,
                    message: isValidField("OldPassword"),
                  },
                ],
                editorOptions: {
                  mode: passwordVisibility.oldPassword,
                  buttons: [
                    {
                      name: 'password',
                      location: 'after',
                      options: {
                        icon: passwordVisibility.oldPassword === 'password' ? EyeWithSlashIcon : EyeIcon,
                        type: 'text',
                        onClick: () => togglePasswordVisibility('oldPassword'),
                      },
                    },
                  ],
                }
              },
              {
                label: { text: "New Password", location: "top" },
                dataField: "NewPassword",
                validationRules: [
                  {
                    type: "required",
                    message: isRequiredField("NewPassword"),
                  },
                  {
                    type: "pattern",
                    pattern: regEx.password,
                    message: isValidField("NewPassword"),
                  },
                ],
                editorOptions: {
                  mode: passwordVisibility.newPassword,
                  buttons: [
                    {
                      name: 'password',
                      location: 'after',
                      options: {
                        icon: passwordVisibility.newPassword === 'password' ? EyeWithSlashIcon : EyeIcon,
                        type: 'text',
                        onClick: () => togglePasswordVisibility('newPassword')
                      },
                    },
                  ],
                }
              },
              {
                label: { text: "Confirm Password", location: "top" },
                dataField: "ConfirmPassword",
                isRequired: true,
                validationRules: [{
                  type: "custom",
                  validationCallback: confirmPassword,
                  message: "'New Password' and 'Confirm Password' do not match."
                },
                {
                  type: "required",
                  message: isRequiredField("ConfirmPassword"),
                }
                ],
                editorOptions: {
                  mode: passwordVisibility.confirmPassword,
                  buttons: [
                    {
                      name: 'password',
                      location: 'after',
                      options: {
                        icon: passwordVisibility.confirmPassword === 'password' ? EyeWithSlashIcon : EyeIcon,
                        type: 'text',
                        onClick: () => togglePasswordVisibility('confirmPassword'),
                      },
                    },
                  ],
                }
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
                      text: "Continue",
                      type: "default",
                      useSubmitBehavior: true,
                    },
                  },
                  {
                    itemType: "button",
                    horizontalAlignment: "right",
                    buttonOptions: {
                      text: "Skip",
                      type: "",
                      useSubmitBehavior: false,
                      onClick: function () {
                        navigate("/dashboard")
                      }
                    },
                  },
                ],
              },
            ]}
          ></DXForm>
        </form>
      </SingleCardWithoutHeader>
    </div>
  );
}

