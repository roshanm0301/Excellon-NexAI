import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EyeIcon, EyeWithSlashIcon } from '../../assets/icons';
import { DXForm } from '../../components/atoms';
import { regEx } from '../../components/constant/regex';
import { GetIdentityById, ResetPassword } from '../../redux/actions';
import { useAppDispatch } from '../../store/customHooks';
import { ValidationType } from '../../types';
import { isRequiredField, isValidField } from '../../utility/utils';

export const ResetPasswordForm = () => {
  const { id, userName } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [passwordVisible, setPasswordVisible] = useState('password');
  const [confirmPasswordVisibility, setConfirmPasswordVisibility] = useState('password');
  const [formData, setFormData] = useState<any>({ LoginName: '', Password: '', ConfirmPassword: '' });
  let result: any = null;

  useEffect(() => {
      (async () => {
        if (!userName && id) {
          result = await dispatch(GetIdentityById(id))
          setFormData({ ...formData, LoginName: result?.data?.Username })
        } else {
          setFormData({ ...formData, LoginName: userName })
        }
      })()
  }, [id, userName])

  const onSubmit = async (e: any) => {
    e.preventDefault();
    const result: any = await dispatch(ResetPassword(formData));
    if (result?.success && userName) {
      navigate('/login')
    } else {
      navigate('/user')
    }
  }

  const confirmPassword = useCallback(
    ({ value }: ValidationType) => value === formData.Password,
    [formData.ConfirmPassword]
  );
  const onFieldDataChanged = () => {
    setFormData({ ...formData })
  }

  return (
    <div className="content" style={{ marginTop: '20px' }}>
      <form
        action="your-action"
        onSubmit={onSubmit}
        className="subscription-form"
      >
        <DXForm
          onFieldDataChanged={onFieldDataChanged}
          formData={formData}
          cssClass="no-margin"
          width="100%"
          labelMode="floating"
          stylingMode="outlined"
          items={[
            {
              label: { text: "LoginName", location: "top" },
              dataField: "LoginName",
              isRequired: true,
              disabled: true
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
              editorOptions: {
                mode: passwordVisible,
                buttons: [
                  {
                    name: 'password',
                    location: 'after',
                    options: {
                      icon: passwordVisible === 'password' ? EyeWithSlashIcon : EyeIcon,
                      type: 'text',
                      onClick: function () {
                        setPasswordVisible(passwordVisible === 'password' ? 'text' : 'password');
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
                    text: "Reset Password",
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
                      if(userName){
                        navigate("/login")
                      }else{
                        navigate("/user")
                      }
                    }
                  },
                },
              ],
            },
          ]}
        ></DXForm>
      </form>
    </div>
  );
}

