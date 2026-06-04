import { ScrollView } from "devextreme-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { DXButton } from "../../components/atoms";
import { DXPopup } from "../../components/template";
import { SelectedItems, approvedApprovalAPI, getActionAPI, getApplicationAPI, getApprovalAPI, getProviderAPI, getRoleAPI, getSchemaAPI, getSubscriptionById, setSelectedItemId, updateRequestAPI } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { ActionWorkFlow, ActionWorkflowContainer } from "../actionWorkflow";
import { IProvisioningRequestStatus, IRequestCrud } from "../actionWorkflow/rule";
import { AddEditApplication } from "../application";
import Comparer from "../approval/comparer";
import AddEditProvider from "../provider/provider.addEdit";
import AddEditRole from "../role/role.addEdit";
import { AddEditSchema } from "../schema";
import { SubscriptionOnBoard } from "../subscription";
import AddEditUser from "../usermanagement/user.addEditUser";
import { ApproveRequest } from "./approveRequest";
import './request.scss';
import SubscriptionSetting from "../subscription/subscription.setting";
import { getLocalData } from "../../utility/utils";

const ViewRequest = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams();
  let location: any = useLocation()

  let request = useAppSelector((state) => state.provisioningRequest.approval);

  const [formData, setFormData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [oldCompareData, setOldCompareData] = useState<any>(null)
  const [toggle, setToggle] = useState<any>(false)
  const [disableApprovalButtons, setDisableApprovalButton] = useState(true)
  const [disableUpdateButtons, setDisableUpdateButton] = useState(true)
  const { selectedItems, selectedItemId } = useAppSelector( (state) => state.schema);
  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        const result: any = await dispatch(getApprovalAPI(id));
        setResultData(result)
        const _formData = {
          ...formData,
          ...result.Entity,
        };
        setFormData({ ..._formData });
        if (result?.RequestType === "UPDATE" || "Update") {
          switch (result?.EntityType) {
            case "Schema":
              let _schemaData: any = await dispatch(getSchemaAPI(result?.Entity?.id));
              setOldCompareData(_schemaData);
              break;
            case "Subscription":
              let _subscriptionData: any = await dispatch(getSubscriptionById(result?.Entity?.id));
              setOldCompareData(_subscriptionData)
              break;
            case "Role":
              let _roleData: any = await dispatch(getRoleAPI(result?.Entity?.id));
              setOldCompareData(_roleData)
              break;
            case "Application":
              let _applicationData: any = await dispatch(getApplicationAPI(result?.Entity?.id));
              setOldCompareData(_applicationData)
              break;
            case "UserManagement":
              return <div>API's implemented yet!</div>;
              break;
            case "Provider":
              let _providerData: any = await dispatch(getProviderAPI(result?.Entity?.id));
              setOldCompareData(_providerData)
              break;
            case "Action":
              let _actionData: any = await dispatch(getActionAPI(result?.Entity?.id));
              setOldCompareData(_actionData)
              break;
            default:
              return <div>This step is not implemented yet!</div>;
          }
        }
      };
      fetchData();
    }
  }, []);

  useEffect(() => {
    if (location.pathname) {
      if (location.pathname.includes("approval/view-request")) {
        setDisableUpdateButton(false);
        setDisableApprovalButton(true)
      } else {
        setDisableApprovalButton(false)
        setDisableUpdateButton(true)
      }
    };
  }, [location.pathname])

  const renderComponent = () => {
    switch (request?.EntityType) {
      case "Schema":
        return (
          <AddEditSchema id={id} data={{ ...formData }} RequestType={request?.RequestType} entityType={request?.EntityType} isActive={false} disableUpdateButtons={disableUpdateButtons} visibility={true} />
        );
      case "Subscription":
        return (
          <>
            <SubscriptionOnBoard id={id} data={{ ...formData }} entityType={request?.EntityType} isActive={false} disableUpdateButtons={disableUpdateButtons} />
            <SubscriptionSetting editMode={false} />
          </>
        );
      case "Role":
        return (
          <AddEditRole id={id} data={{ ...formData }} entityType={request?.EntityType} isActive={false} />
        );
      case "Application":
        return (
          <AddEditApplication id={id} data={{ ...formData }} entityType={request?.EntityType} isActive={false} />
        );
      case "UserManagement":
        return (
          <AddEditUser id={id} data={{ ...formData }} entityType={request?.EntityType} isActive={false} />
        );
      case "Provider":
        return (
          <AddEditProvider id={id} data={{ ...formData }} entityType={request?.EntityType} isActive={false} />
        );
      case "Action":
        {
          switch (request.RequestType) {
            case IRequestCrud.Create:
              return (
                <div
                  style={{ display: 'flex' }}
                >
                  <div style={{ width: '100%' }}>
                    <ActionWorkFlow disableToolBox={true} id={resultData?.id} SchemaId={resultData?.SchemaId} actionByIdData={formData} entityType={request?.EntityType} />
                  </div>
                </div>
              );
            case IRequestCrud.Update:
              return (
                <div
                  style={{ display: 'flex' }}
                >
                  <div style={{ width: '50%' }}>
                    <ActionWorkFlow disableToolBox={true} id={resultData?.id} SchemaId={resultData?.Entity?.SchemaId} actionByIdData={formData} entityType={request?.EntityType} isTreeView={true}/>
                  </div>
                  <div style={{ width: '50%' }}>
                    <ActionWorkflowContainer disableToolBox={true} DocumentIdCompareMode={request?.Entity?.id} SchemaIdCompareMode={request?.Entity?.SchemaId} />
                  </div>
                </div>
              );
            default:
              return <div>This step is not implemented yet!</div>;
          }
        }
      default:
        return <div>This step is not implemented yet!</div>;
    }
  };

  const statusApproved = async (item: any) => {
    let _resultData = resultData
    let payload;

    const _formData = {
      ...formData,
      IsLock: false,
      Status: "PUBLISHED"
    }
    const _payload = {
      ..._resultData,
      Status: item,
      Entity: _formData,
    };
    payload = {
      ..._payload
    }
    if (_resultData.EntityType === "Subscription") {
      payload = { ..._payload,Values:getLocalData("SUBSCRIPTION_SETTING_CREATE")}
    }
    let result: any = null;
    if (id) {
      result = await dispatch(approvedApprovalAPI(id, payload));
      if (result.success) {
        navigate("/approval");
        const sItem = { ...selectedItemId, Data:payload?.Entity, onLoad: false, isDelete: false };
        const updatedItems =
          selectedItems?.map((item: any) => {
            if (item.id === sItem.id) {
              return { ...item, ...sItem };
            }
            return item;
          }) || [];
  
        dispatch(setSelectedItemId(sItem));
        dispatch(SelectedItems([...updatedItems]));
      }
    }
  }

  const onView = () => {
    setIsOpen(!isOpen);
  };

  const onApprove = (e: any) => {
    statusApproved(IProvisioningRequestStatus.Approved)
  };

  const onReject = async () => {
    let _payload = { ...formData, Status: IProvisioningRequestStatus.Reject }
    if (id) {
      const result: any = await dispatch(updateRequestAPI(id, _payload));
      if (result.success) {
        navigate("/approval");
      }
    }
  };

  const onEdit = (e: any) => {
    localStorage.setItem("ProvisioningDocumentId", JSON.stringify(request.id));
    const item = {
      Status: request?.Entity.Status,
      Type: "Action",
      selected: false,
      text: request?.Entity.DisplayName,
      id: request?.Entity?.id,
      Data: request?.Entity,
      isDirty: false
    };
    dispatch(setSelectedItemId(item));
    navigate('/schema/workflow-editor');
  };

  return (
    <div style={{ overflow: "auto" }}>
      <div className="view-request-header">
        <div className="view-request-actions">
          {disableUpdateButtons && <DXButton hint='Edit' text="" visible={resultData?.EntityType === "Action"} icon="edit" onClick={onEdit} />}
        </div>
      </div>
      <div className={"content-block dx-card responsive-paddings"}>
        {disableApprovalButtons && <div className="view-request-approval-actions">
          <DXButton hint='Approve' text="" icon="todo" onClick={onApprove} />
          <DXButton hint='Reject' text="" icon="remove" onClick={onReject} />
          <DXButton hint='Comparator' text="" icon="menu" visible={resultData?.RequestType === "UPDATE"} onClick={onView} />
        </div>}
        <div>{
          !toggle ?
            renderComponent()
            :
            <ApproveRequest resultData={resultData} formData={formData} schemaId={formData.id} />
        }</div>
      </div>
      <DXPopup
        title="Comparator"
        width="80vw"
        visible={isOpen}
        onHiding={() => setIsOpen(false)}
      >
        <ScrollView width="100%" height="100%">
          <div>
            <Comparer oldJSON={oldCompareData} newJSON={formData} />
          </div>
        </ScrollView>
      </DXPopup>
    </div>
  );
};

export default ViewRequest;
