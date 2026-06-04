import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DXButton, DXForm, DXSelect } from "../../components/atoms";
import { regEx } from "../../components/constant/regex";
import { DXPopup } from "../../components/template";
import {
  addApprovalAPI,
  addOnBoardSubscriptionAPI,
  getProviderListAPI,
  updateOnBoardSubscriptionAPI,
  updateRequestAPI,
} from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { isRequiredField, isValidField } from "../../utility/utils";
import {
  IEntityStatus,
  IProvisioningRequestStatus,
  IRequestCrud,
} from "../actionWorkflow/rule";
import { SubscriptionOnBoardDefinition } from "./subscription.entity";
import {
  DefaultMongodbColumns,
  DefaultPostgresColumns,
  DefaultSQLColumns,
  EntityType,
  RoleType,
  requestType,
} from "../schema";

export const SubscriptionOnBoard = (props: any) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const {
    id,
    data,
    entityType = "",
    isActive,
    RequestType = "",
    disableUpdateButtons,
    isReadOnly,
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [subscriptionFormData, setSubscriptionFormData] = useState<any>({
    ...SubscriptionOnBoardDefinition,
  });
  const { providerList, typeByProviderList } = useAppSelector(
    (state) => state.provider
  );
  const [disableSendPullRequest, setDisableSendPullRequest] = useState(false);
  let navigationList = useAppSelector((state) => state.role.navigationList);
  const [assignForApproval, setAssignForApproval] = useState("");
  let moderatorList = useAppSelector((state) => state.role.moderatorList);

  useEffect(() => {
    if (data !== null && id) {
      setSubscriptionFormData({ ...data });
    } else {
      // clear previous (nested) child data in case of add new record
      setSubscriptionFormData({
        ...subscriptionFormData,
        SubscriptionOptions: {
          ...subscriptionFormData.SubscriptionOptions,
          type: "",
          database: "",
          url: "",
          authSource: "",
        },
        StorageProvider: {
          ...subscriptionFormData.StorageProvider,
          options: {
            ...subscriptionFormData.StorageProvider.options,
            type: "",
            url: "",
          },
        },
        ProviderOptions: {
          ...subscriptionFormData.ProviderOptions,
          type: "",
          database: "",
          url: "",
          authSource: "",
        },
        AdminDetails: {
          ...subscriptionFormData.AdminDetails,
          FirstName: "",
          LastName: "",
          Email: "",
          MobileNo: "",
        },
        ContactDetails: {
          ...subscriptionFormData.ContactDetails,
          UserFirstName: "",
          UserLastName: "",
          UserEmail: "",
          UserMobileNo: "",
        },
      });
    }
  }, [data]);

  useEffect(() => {
    dispatch(getProviderListAPI(null));
  }, []);
  useEffect(() => {
    if (location.pathname) {
      if (location.pathname.includes("/subscription/subscription-onboard")) {
        setDisableSendPullRequest(true);
      } else {
        setDisableSendPullRequest(false);
      }
    }
  }, [location.pathname]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setSubscriptionFormData({ ...subscriptionFormData });

    // Contributor mode
    // if (navigationList[0]?.Role !== RoleType.Moderator) {
    //   // cancelled by user flow in request component while editing schema
    //   if (data && data?.Status === IProvisioningRequestStatus.Draft && RequestType) {
    //     addUpdateSchemaInContributorMode(IProvisioningRequestStatus.CancelledByUser);

    //     // save as draft flow while add or edit schema
    //   } else {
    //     addUpdateSchemaInContributorMode(IProvisioningRequestStatus.Draft);
    //   }
    //   // Developer mode
    // } else {
    addUpdateSchema(subscriptionFormData, IEntityStatus.Draft);
    // }
    if (location.pathname.includes("request/view-request")) {
      navigate("/request");
    } else {
      navigate("/subscription");
    }
  };

  const addUpdateSchemaInContributorMode = (
    status: IProvisioningRequestStatus
  ) => {
    // payload for provisioning request
    let payload = {
      Entity: subscriptionFormData,
      Status: status,
      RequestType: subscriptionFormData._id
        ? IRequestCrud.Update
        : IRequestCrud.Create,
      EntityType: EntityType.Subscription,
      // AssignForApproval: "5dec1c81-ab59-47f1-ab6d-3cbb7f07302c",
      Type: requestType.PullRequest,
      AssignForApproval: assignForApproval,
    };

    // save as draft flow while add or edit schema
    if (status === IProvisioningRequestStatus.Draft) {
      addUpdateSchema(subscriptionFormData, IEntityStatus.Draft);

      // cancelled by user flow in request component while editing schema
    } else if (status === IProvisioningRequestStatus.CancelledByUser) {
      cancelledByUser(payload, subscriptionFormData);

      // send pull request flow
    } else {
      execPullRequestMode(payload);
    }
  };

  const addUpdateSchema = (formData: any, status: IEntityStatus) => {
    // update schema
    if (id) {
      dispatch(updateOnBoardSubscriptionAPI(id, formData));
    } else {
      // add schema
      formData.Status = status;
      dispatch(addOnBoardSubscriptionAPI(formData));
    }
  };

  const execPullRequestMode = (payload: any) => {
    // update provisioning request
    if (
      id &&
      entityType &&
      payload.Status === IProvisioningRequestStatus.PendingForApproval
    ) {
      dispatch(updateRequestAPI(id, payload));
    } else {
      // add provisioning request
      dispatch(addApprovalAPI(payload));
    }
    if (navigationList[0]?.Role === RoleType.Moderator) {
      navigate(`/approval/${requestType.PullRequest}`);
    } else {
      navigate("/subscription");
    }
  };

  const cancelledByUser = async (payload: any, formData: any) => {
    // update schema as draft and provisioning request as cancelledByUser
    if (id && RequestType === IRequestCrud.Update) {
      const result: any = await dispatch(
        updateOnBoardSubscriptionAPI(formData.id, formData)
      );
      if (result.success) {
        dispatch(updateRequestAPI(id, payload));
      }
      // add schema as draft and provisioning request as cancelledByUser
    } else {
      formData.Status = IEntityStatus.Draft;
      const result: any = await dispatch(addOnBoardSubscriptionAPI(formData));
      if (result.success) {
        dispatch(addApprovalAPI(payload));
      }
    }
  };

  const handleSendForApproval = (e: any) => {
    // send pull request
    // navigate("/approval")
    if (assignForApproval) {
      setIsOpen(false);
      addUpdateSchemaInContributorMode(
        IProvisioningRequestStatus.PendingForApproval
      );
    }
  };

  const onHiding = () => {};
  const onValueChange = (e: any) => {
    setAssignForApproval(e);
  };

  const handleProviderSelect = (e: any) => {
    if (e.event) {
      let _res = providerList.find((item: any) => item.id === e.value);
    }
  };

  return (
    <div>
      <div className={"content-block dx-card responsive-paddings"}>
        <form action="your-action" onSubmit={handleSubmit}>
          <DXForm
            formData={subscriptionFormData}
            cssClass="no-margin"
            width="100%"
            stylingMode="outlined"
            validationGroup="test"
            // disabled={subscriptionFormData.Status === "PUBLISHED" || isReadOnly}
            items={[
              {
                itemType: "group",
                colCount: 2,
                items: [
                  {
                    label: { text: "System Name", location: "top" },
                    dataField: "SystemName",
                    isRequired: true,
                    disabled: id ? true : false,
                    validationRules: [
                      {
                        type: "required",
                        message: isRequiredField("SystemName"),
                      },
                      {
                        type: "pattern",
                        pattern: regEx.stringWithLowercaseCharacter,
                        message: isValidField("SystemName"),
                      },
                    ],
                  },
                  {
                    label: { text: "DisplayName", location: "top" },
                    dataField: "DisplayName",
                    isRequired: true,
                  },
                ],
              },
              {
                itemType: "group",
                colCount: 2,
                items: [
                  {
                    itemType: "group",
                    colCount: 1,
                    caption: "Subscription Options",
                    disabled: id ? true : false,
                    items: [
                      {
                        label: { text: "Type", location: "top" },
                        dataField: "SubscriptionOptions.type",
                        isRequired: true,
                        disabled: id ? true : false,
                      },
                      {
                        label: { text: "Database", location: "top" },
                        dataField: "SubscriptionOptions.database",
                        isRequired: true,
                      },
                      {
                        label: { text: "URL", location: "top" },
                        dataField: "SubscriptionOptions.url",
                        isRequired: true,
                      },
                      {
                        label: { text: "AuthSource", location: "top" },
                        dataField: "SubscriptionOptions.authSource",
                        isRequired: true,
                      },
                    ],
                  },
                  {
                    itemType: "group",
                    colCount: 1,
                    caption: "Storage Provider",
                    disabled: id ? true : false,
                    items: [
                      {
                        label: { text: "Type", location: "top" },
                        dataField: "StorageProvider.options.type",
                        isRequired: true,
                      },
                      {
                        label: { text: "URL", location: "top" },
                        dataField: "StorageProvider.options.url",
                        isRequired: true,
                      },
                    ],
                  },
                ],
              },
              {
                itemType: "group",
                colCount: 2,
                caption: "Company Details",
                disabled: id ? true : false,
                items: [
                  {
                    label: { text: "Company Name", location: "top" },
                    dataField: "CompanyName",
                    isRequired: true,
                  },
                  {
                    label: { text: "Company Website", location: "top" },
                    dataField: "CompanyWebsite",
                    isRequired: true,
                  },
                  {
                    label: { text: "Company Domain", location: "top" },
                    dataField: "CompanyDomain",
                    isRequired: true,
                  },
                  {
                    label: { text: "Company Size", location: "top" },
                    dataField: "CompanySize",
                    isRequired: true,
                    validationRules: [
                      {
                        type: "required",
                        message: isRequiredField("CompanySize"),
                      },
                      {
                        type: "pattern",
                        pattern: regEx.number,
                        message: isValidField("CompanySize"),
                      },
                    ],
                  },
                  {
                    label: { text: "Company Address", location: "top" },
                    dataField: "CompanyAddress",
                    isRequired: true,
                  },
                  {
                    label: { text: "Pin Code", location: "top" },
                    dataField: "PinCode",
                    isRequired: true,
                    validationRules: [
                      {
                        type: "required",
                        message: isRequiredField("PinCode"),
                      },
                      {
                        type: "pattern",
                        pattern: regEx.number,
                        message: isValidField("PinCode"),
                      },
                    ],
                  },
                  {
                    label: { text: "City", location: "top" },
                    dataField: "City",
                    isRequired: true,
                  },
                  {
                    label: { text: "State", location: "top" },
                    dataField: "State",
                    isRequired: true,
                  },
                  {
                    label: { text: "Country", location: "top" },
                    dataField: "Country",
                    isRequired: true,
                  },
                ],
              },
              {
                itemType: "group",
                colCount: 2,
                items: [
                  {
                    itemType: "group",
                    colCount: 1,
                    caption: "Admin Details",
                    disabled: id ? true : false,
                    items: [
                      {
                        label: { text: "First Name", location: "top" },
                        dataField: "AdminDetails.FirstName",
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
                        dataField: "AdminDetails.LastName",
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
                        dataField: "AdminDetails.Email",
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
                        dataField: "AdminDetails.MobileNo",
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
                    ],
                  },
                  {
                    itemType: "group",
                    colCount: 1,
                    caption: "Contact Details",
                    disabled: id ? true : false,
                    items: [
                      {
                        label: { text: "User First Name", location: "top" },
                        dataField: "ContactDetails.UserFirstName",
                        isRequired: true,
                        validationRules: [
                          {
                            type: "required",
                            message: isRequiredField("UserFirstName"),
                          },
                          {
                            type: "pattern",
                            pattern: regEx.validName,
                            message: isValidField("UserFirstName"),
                          },
                        ],
                      },
                      {
                        label: { text: "User Last Name", location: "top" },
                        dataField: "ContactDetails.UserLastName",
                        isRequired: true,
                        validationRules: [
                          {
                            type: "required",
                            message: isRequiredField("UserLastName"),
                          },
                          {
                            type: "pattern",
                            pattern: regEx.validName,
                            message: isValidField("UserLastName"),
                          },
                        ],
                      },
                      {
                        label: { text: "User Email", location: "top" },
                        dataField: "ContactDetails.UserEmail",
                        isRequired: true,
                        validationRules: [
                          {
                            type: "required",
                            message: isRequiredField("UserEmail"),
                          },
                          {
                            type: "pattern",
                            pattern: regEx.emailId,
                            message: isValidField("UserEmail"),
                          },
                        ],
                      },
                      {
                        label: { text: "User Mobile No", location: "top" },
                        dataField: "ContactDetails.UserMobileNo",
                        isRequired: true,
                        validationRules: [
                          {
                            type: "required",
                            message: isRequiredField("UserMobileNo"),
                          },
                          {
                            type: "pattern",
                            pattern: regEx.mobileNumber,
                            message: isValidField("UserMobileNo"),
                          },
                        ],
                      },
                    ],
                  },
                  {
                    itemType: "group",
                    colCount: 1,
                    caption: "Elastic Search",
                    items: [
                      {
                        label: { text: "Provider", location: "top" },
                        dataField: "Provider",
                         editorType: "dxSelectBox",

                        editorOptions: {
                          valueExpr: "id",
                          displayExpr: "DisplayName",
                          dataSource: providerList,
                          searchEnabled: true,
                          onValueChanged: (e: any) => handleProviderSelect(e),
                        },
                      },
                    ],
                  },
                ],
              },
            ]}
          ></DXForm>
          {subscriptionFormData.Status !== "PUBLISHED" &&
            isReadOnly === undefined && (
              <div className="schemaButtons">
                <DXButton
                  id="schema-btn-save"
                  type="default"
                  visible={disableUpdateButtons}
                  disabled={subscriptionFormData.IsLock}
                  text={id ? "UPDATE" : "SUBMIT"}
                  useSubmitBehavior={true}
                  stylingMode="contained"
                  icon="save"
                  validationGroup="test"
                />
                &nbsp;&nbsp;
                <DXButton
                  id="schema-btn-cancel"
                  type="default"
                  visible={disableUpdateButtons}
                  text="Cancel"
                  icon="revert"
                  onClick={
                    isActive === false
                      ? function () {
                          navigate("/request");
                        }
                      : function () {
                          navigate("/subscription");
                        }
                  }
                />
                &nbsp;&nbsp;
                <DXButton
                  type="default"
                  disabled={
                    subscriptionFormData.Status !==
                      IProvisioningRequestStatus.Draft ||
                    !isActive ||
                    disableSendPullRequest
                  }
                  text="SEND PULL REQUEST"
                  icon="lock"
                  onClick={() => setIsOpen(true)}
                />
              </div>
            )}
        </form>

        <DXPopup
          showTitle={false}
          visible={isOpen}
          title={""}
          onHiding={onHiding}
          width="300px"
          height="180px"
        >
          <span
            style={{
              fontSize: "14px",
              display: "flex",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            Do you want to send Pull Request?
          </span>
          <DXSelect
            value={assignForApproval}
            items={moderatorList}
            onValueChange={(e: any) => onValueChange(e)}
            label={"Send For Approval"}
            displayExpr={"DisplayName"}
            valueExpr="id"
            labelMode="floating"
            searchEnabled={true}
          />
          <div className="checkoutProcessButton">
            <DXButton
              type="default"
              text="Yes"
              onClick={(e: any) => handleSendForApproval(e)}
            />
            <DXButton
              type="default"
              text="No"
              onClick={() => setIsOpen(false)}
            />
          </div>
        </DXPopup>
      </div>
    </div>
  );
};
