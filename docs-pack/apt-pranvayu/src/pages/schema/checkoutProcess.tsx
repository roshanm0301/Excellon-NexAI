import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DXButton, DXSelect, DXTextArea } from "../../components/atoms";
import { addApprovalAPI, getModerateListAPI } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { RootState } from "../../store/store";
import {
    IProvisioningRequestStatus,
    IRequestCrud,
} from "../actionWorkflow/rule";
import {
    EntityType,
    ICheckoutProcessProps,
    requestType,
} from "./schema.entity";
import "./schema.scss";

export const CheckoutProcess = (props: ICheckoutProcessProps) => {
  const { data, setIsOpen }: any = props;

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [remark, setRemark] = useState("");
  const [errorMsg, setErrorMessage] = useState("");
  const [assignForApproval, setAssignForApproval] = useState("");

  let { selectedSubscription } = useAppSelector((state) => state.subscription);
  const selectedUser = useSelector(
    (state: RootState) => state.auth.selectedUser
  );
  let moderatorList = useAppSelector((state) => state.role.moderatorList);

  const saveRemark = (e: string) => {
    setRemark(e);
  };

  useEffect(() => {
    GetModerateListAPI();
  }, [selectedSubscription]);

  const GetModerateListAPI = async () => {
    let request = { SubscriptionId: selectedSubscription?.id };
    await dispatch(getModerateListAPI(request));
  };

  const onConfirmClick = () => {
    if (remark === "") {
      setErrorMessage("Please enter remark");
    } else {
      if (data) {
        if (data?._type === "Schema") {
          checkout(
            IProvisioningRequestStatus.PendingForApproval,
            requestType.CheckoutRequest,
            EntityType.Schema
          );
        } else {
          checkout(
            IProvisioningRequestStatus.PendingForApproval,
            requestType.CheckoutRequest,
            EntityType.Action
          );
        }
        setIsOpen(false);
        setErrorMessage("");
      }
    }
  };

  const onCancelClick = () => {
    setRemark("");
    setIsOpen(false);
    setErrorMessage("");
    setAssignForApproval("");
  };

  const checkout = async (
    item: string,
    requestSelected: string,
    entityType: EntityType
  ) => {
    let payload = {
      Entity: data,
      Status: item,
      RequestType: IRequestCrud.Update,
      EntityType: entityType,
      // AssignForApproval: "5dec1c81-ab59-47f1-ab6d-3cbb7f07302c",
      Type: requestSelected,
      Remark: remark,
      AssignForApproval: assignForApproval,
    };
    let result: any = null;
    if (selectedUser) {
      result = await dispatch(addApprovalAPI(payload));
    }
    // navigate(`/approval/${requestSelected}`);
  };
  const onValueChange = (e: any) => {
    setAssignForApproval(e);
  };
  return (
    <div>
      <div>
        <b className="checkoutProcessLabel">Do you want to Send Request?</b>
        <>
          <DXTextArea
            stylingMode={"outlined"}
            height={100}
            // width={430}
            label={"Remark"}
            placeholder={"Remark"}
            value={remark}
            onValueChange={saveRemark}
            name={""}
          />
          {errorMsg && <span className="errorMessage">{errorMsg}</span>}
        </>
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
          <DXButton type="default" text="Yes" onClick={onConfirmClick} />
          <DXButton type="default" text="No" onClick={onCancelClick} />
        </div>
      </div>
    </div>
  );
};
