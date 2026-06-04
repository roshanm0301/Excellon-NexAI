import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { useNavigate, useParams } from "react-router-dom";
import { IContainerProps, SubscriptionDefinition } from ".";
import { DXButton, DXForm } from "../../components/atoms";
import { regEx } from "../../components/constant/regex";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { isRequiredField, isValidField } from "../../utility/utils";
import { cloneSubscriptionAPI } from "../../redux/actions";

export const AddEditSubscription = (props: IContainerProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams()

  const [subscriptionFormData, setSubscriptionFormData] = useState<any>({ ...SubscriptionDefinition });
  let { subscriptions } = useAppSelector((state) => state.subscription);

  useEffect(() => {
    if (id) {
      abcd(id)
    } else {
      abcd("fb74f103-3df6-4941-989e-a3e52b655843")
    }
  }, [])


  const abcd = (Id: any) => {
    let _abc = subscriptions.find((item: any) => {
      if (item?.id === Id) {
        return item?.SystemName
      }
    })
    // setSubscriptionFormData({ ...subscriptionFormData, SourceSubscriptionId: _abc?.SystemName })
    setSubscriptionFormData({
      ...subscriptionFormData,
      SourceSubscriptionId: _abc?.SystemName,
      SubscriptionOptions: {
        ...subscriptionFormData.SubscriptionOptions,
        type: "",
        database: "",
        url: "",
        authSource: ""
      },
      StorageProvider: {
        ...subscriptionFormData.StorageProvider,
        options: {
          ...subscriptionFormData.StorageProvider.options,
          type: "",
          url: ""
        }
      },
      ProviderOptions: {
        ...subscriptionFormData.ProviderOptions,
        type: "",
        database: "",
        url: "",
        authSource: ""
      }
    })
  }

  //submit button click
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    e.stopPropagation()
    if (id) {
      subscriptionFormData.SourceSubscriptionId = id
    } else {
      subscriptionFormData.SourceSubscriptionId = "fb74f103-3df6-4941-989e-a3e52b655843"
    }
    // setSubscriptionFormData({ ...subscriptionFormData });
    if (subscriptionFormData) {
      const result: any = await dispatch(cloneSubscriptionAPI(subscriptionFormData))
      if (result.success) {
        navigate('/subscription')
      }
    }

    navigate('/subscription')
  };

  const onCancel = () => {
    navigate("/subscription");
  };

  return (
    <div>
      <div className={"content-block dx-card responsive-paddings"}>
        <form action="your-action" onSubmit={handleSubmit}>
          <DXForm
            formData={subscriptionFormData}
            stylingMode="outlined"
            validationGroup="testSub"
            items={[
              {
                itemType: "group",
                colCount: 2,
                items: [
                  {
                    disabled: true,
                    visible: id ? true : false,
                    label: { text: "Source Subscription Id", location: "top" },
                    dataField: "SourceSubscriptionId",
                  },
                  {
                    label: { text: "System Name", location: "top" },
                    dataField: "SystemName",
                    isRequired: true,
                    validationRules: [
                      {
                        type: "required",
                        message: isRequiredField("SystemName"),
                      },
                      {
                        type: "pattern",
                        pattern: regEx.validString,
                        message: isValidField("SystemName"),
                      },
                    ],
                  },
                  {
                    label: { text: "First Name", location: "top" },
                    dataField: "FirstName",
                    isRequired: true,
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
                    isRequired: true,
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
                    label: { text: "Email", location: "top" },
                    dataField: "Email",
                    isRequired: true,
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
                    label: { text: "Mobile No", location: "top" },
                    dataField: "MobileNo",
                    isRequired: true,
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
                    label: { text: "User Name", location: "top" },
                    dataField: "Username",
                    isRequired: true,
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
                    label: { text: "Password", location: "top" },
                    dataField: "Password",
                    isRequired: true,
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
                  },
                ]
              },
              {
                itemType: "group",
                colSpan: 3,
                cssClass: "container-div",
                items: [
                  {
                    itemType: "tabbed",
                    tabPanelOptions: {
                      deferRendering: false
                    },
                    tabs: [
                      {
                        title: "Subscription Options",
                        items: [
                          {
                            label: { visible: false },
                            // dataField: 'SystemProperties',
                            template: async (data: any, itemElement: any) => {
                              const root = createRoot(itemElement!);
                              root.render(
                                <DXForm
                                  stylingMode="outlined"
                                  formData={subscriptionFormData.SubscriptionOptions}
                                  colCount={2}
                                  items={
                                    [
                                      {
                                        label: { text: "Type", location: "top" },
                                        dataField: "type",
                                        isRequired: true,
                                      },
                                      {
                                        label: { text: "Database", location: "top" },
                                        dataField: "database",
                                        isRequired: true,
                                      },
                                      {
                                        label: { text: "URL", location: "top" },
                                        dataField: "url",
                                        isRequired: true,
                                      },
                                      {
                                        label: { text: "AuthSource", location: "top" },
                                        dataField: "authSource",
                                        isRequired: true,
                                      },
                                    ]
                                  }
                                />
                              )
                            }
                          }
                        ]
                      },
                      {
                        title: "Storage Provider",
                        items: [
                          {
                            label: { visible: false },
                            dataField: 'SystemProperties',
                            template: async (data: any, itemElement: any) => {
                              const root = createRoot(itemElement!);
                              root.render(
                                <DXForm
                                  stylingMode="outlined"
                                  formData={subscriptionFormData.StorageProvider}
                                  colCount={2}
                                  items={
                                    [
                                      {
                                        label: { text: "Type", location: "top" },
                                        dataField: "options.type",
                                        isRequired: true,
                                      },
                                      {
                                        label: { text: "URL", location: "top" },
                                        dataField: "options.url",
                                        isRequired: true,
                                      }
                                    ]
                                  }
                                />
                              )
                            }
                          }
                        ]
                      },
                      {
                        title: "Provider Options",
                        items: [
                          {
                            label: { visible: false },
                            dataField: 'SystemProperties',
                            template: async (data: any, itemElement: any) => {
                              const root = createRoot(itemElement!);
                              root.render(
                                <DXForm
                                  stylingMode="outlined"
                                  formData={subscriptionFormData.ProviderOptions}
                                  colCount={2}
                                  items={
                                    [
                                      {
                                        label: { text: "Type", location: "top" },
                                        dataField: "type",
                                        isRequired: true,
                                      },
                                      {
                                        label: { text: "Database", location: "top" },
                                        dataField: "database",
                                        isRequired: true,
                                      },
                                      {
                                        label: { text: "URL", location: "top" },
                                        dataField: "url",
                                        isRequired: true,
                                      },
                                      {
                                        label: { text: "AuthSource", location: "top" },
                                        dataField: "authSource",
                                        isRequired: true,
                                      },
                                    ]
                                  }
                                />
                              )
                            }
                          }
                        ]
                      },
                    ]
                  }
                ]
              },
            ]}
          />

          <div className="schemaButtons">
            <DXButton type="default" text={"SUBMIT"} useSubmitBehavior={true} stylingMode="contained" icon="save" validationGroup="testSub" />
            &nbsp;&nbsp;
            <DXButton type="default" text='Cancel' icon="revert" onClick={onCancel} />
          </div>

        </form>
      </div>
    </div>
  );
};
