import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DXForm } from "../../components/atoms";
import { addApplicationAPI, getRoleListAPI, updateApplicationAPI } from "../../redux/actions";
import { useAppDispatch } from "../../store/customHooks";
import { useSelector } from "react-redux";
import { ApplicationDefinition, IContainerProps } from ".";
import { regEx } from "../../components/constant/regex";
import { RootState } from "../../store/store";
import { isRequiredField, isValidField } from "../../utility/utils";
import { IProvisioningRequestStatus } from "../actionWorkflow/rule";

export const AddEditApplication = (props: IContainerProps) => {
  const { id, data, isActive, entityType } = props;

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<any>({ ...ApplicationDefinition });
  const selectedUser = useSelector((state: RootState) => state.auth.selectedUser);

  useEffect(() => {
    dispatch(getRoleListAPI(null))
    if (data) {
      setFormData(data);
    }
  }, [data]);

  const addEditApplication = async (item: any) => {
    setFormData({ ...formData });
    // if (selectedUser) {
    //   if (id && entityType && payload.Status === IProvisioningRequestStatus.PendingForApproval) {
    //     result = await dispatch(updateRequestAPI(id, payload));
    //   } else {
    //     result = await dispatch(addApprovalAPI(payload));
    //   }
    // } else {
    if (id) {
      await dispatch(updateApplicationAPI(id, formData))
    } else {
      await dispatch(addApplicationAPI(formData));
    }
    // }
    navigate("/application");
  }

  const handleSubmit = (e: any) => {
    e.preventDefault();
    addEditApplication(IProvisioningRequestStatus.Draft)
  };

  const handleSendForApproval = () => {
    addEditApplication(IProvisioningRequestStatus.PendingForApproval)
  };

  return (
    <div>
      <div className={"content-block dx-card responsive-paddings"}>
        <div>
          <form action="your-action" onSubmit={handleSubmit}>
            <DXForm
              stylingMode="outlined"
              formData={formData}
              items={[
                {
                  itemType: "group",
                  cssClass: "no-margin",
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
                      isRequired: true,
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
                  ],
                },
                {
                  itemType: "group",
                  cssClass: "button-group",
                  colCount: 1,
                  items: [
                    {
                      itemType: "button",
                      visible: isActive,
                      buttonOptions: {
                        text: id ? "UPDATE" : "SUBMIT",
                        type: "default",
                        useSubmitBehavior: true,
                        icon: "save",
                      },
                    },
                    {
                      itemType: "button",
                      buttonOptions: {
                        text: "CANCEL",
                        icon: "revert",
                        type: "default",
                        stylingMode: "outlined",
                        onClick: () => {
                          if (isActive === false) {
                            navigate("/approval");
                          } else {
                            navigate("/application");
                          }
                        },
                      },
                    },
                    {
                      itemType: "button",
                      visible: selectedUser === true,
                      buttonOptions: {
                        disabled: true,
                        text: "SEND FOR APPROVAL",
                        icon: "lock",
                        type: "default",
                        stylingMode: "outlined",
                        onClick: handleSendForApproval
                      },
                    },
                  ],
                },
              ]}
            ></DXForm>
          </form>
        </div>
      </div>
    </div>
  );
};
