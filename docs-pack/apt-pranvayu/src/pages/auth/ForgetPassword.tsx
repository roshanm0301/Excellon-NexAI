import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DXForm } from '../../components/atoms';
import { ForgotPassword, GetIdentityById, VerifyOTP } from '../../redux/actions';
import { useAppDispatch } from '../../store/customHooks';

export const ForgetPasswordForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const[isOtpFieldVisible,setIsOtpFieldVisible]=useState(false)
  const [formData, setFormData] = useState<any>({ LoginName: '',OTP:"" });
  let result: any = null;

  useEffect(() => {
    if (id) {
      (async () => {
        result = await dispatch(GetIdentityById(id))
        setFormData({ ...formData, LoginName: result?.data?.LoginName })
      })()
    }
  }, [id])

  const onSubmit = async (e: any) => {
    e.preventDefault();
    const result: any = await dispatch(ForgotPassword(formData));
    if (result?.success) {
      navigate('/login');
    } else {
    }
  }

  const onFieldDataChanged = () => {
    setFormData({ ...formData })
  }
  const onVerifyClick = async () => {
    let _payload={LoginName:formData.LoginName}
    const result: any = await dispatch(ForgotPassword(_payload));
    if (result?.success) {
      setIsOtpFieldVisible(true)
    }
  }
  const onVerifyOTPClick=async()=>{
    let _payload={userId:formData.LoginName,OTP:formData.OTP}
    const result: any = await dispatch(VerifyOTP(_payload));
    if (result?.success) {
      navigate(`/reset-password/${formData.LoginName}`)
    }
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
              editorOptions: {
                mode: 'text',
                placeholder:'MobileNo/Email' ,
                buttons: [
                  {
                    name: 'password',
                    location: 'after',
                    options: {
                      // disabled:formData.LoginName === "" ?true:false,
                      type: 'text',
                      text: 'Send Otp',
                      onClick: function () {
                        onVerifyClick()
                      }
                    },
                  },
                ],
              }
            },
            {
                label: { text: "OTP", location: "top" },
                dataField: "OTP",
                isRequired: true,
                visible:isOtpFieldVisible,
                editorOptions: {
                  mode: 'text',
                  buttons: [
                    {
                      name: 'password',
                      location: 'after',
                      options: {
                        type: 'text',
                        text: 'Verify Otp',
                        onClick: function () {
                          onVerifyOTPClick()
                        }
                      },
                    },
                  ],
                }
            },
            // {
            //   itemType: "group",
            //   caption: "",
            //   cssClass: "no-margin",
            //   colCount: 2,
            //   items: [
            //     {
            //       itemType: "button",
            //       horizontalAlignment: "center",
            //       buttonOptions: {
            //         text: "CONTINUE",
            //         type: "default",
            //         useSubmitBehavior: true,
            //       },
            //     },
            //     {
            //       itemType: "button",
            //       horizontalAlignment: "right",
            //       buttonOptions: {
            //         text: "Skip",
            //         type: "",
            //         useSubmitBehavior: false,
            //         onClick: function () {
            //           navigate("/login")
            //         }
            //       },
            //     },
            //   ],
            // },
          ]}
        ></DXForm>
      </form>
    </div>
  );
}

