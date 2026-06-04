import { ScrollView } from "devextreme-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DXButton } from "../../components/atoms";
import { DXPopup } from "../../components/template";
import { getActionAPI, getApplicationAPI, getApprovalAPI, getProviderAPI, getRoleAPI, getSchemaAPI, getSubscriptionAPI, updateRequestAPI } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { ActionWorkFlow, ActionWorkflowContainer } from "../actionWorkflow";
import { IProvisioningRequestStatus, IRequestCrud } from "../actionWorkflow/rule";
import { AddEditApplication } from "../application";
import AddEditProvider from "../provider/provider.addEdit";
import AddEditRole from "../role/role.addEdit";
import { AddEditSchema } from "../schema";
import { AddEditSubscription, SubscriptionOnBoard } from "../subscription";
import AddEditUser from "../usermanagement/user.addEditUser";
import Comparer from "./comparer";

const ViewApprovalRequest = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams();

  const [formData, setFormData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [oldCompareData, setOldCompareData] = useState<any>(null)

  let approval = useAppSelector((state) => state.provisioningRequest.approval);

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
              let _subscriptionData: any = await dispatch(getSubscriptionAPI(result?.Entity?.id));
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
              let _actionData: any = await dispatch(getActionAPI(result?.Entity?._id));
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

  const renderComponent = () => {
    switch (approval?.EntityType) {
      case "Schema":
        return (
          <AddEditSchema id={id} data={{ ...formData }} entityType={approval?.EntityType} isActive={false} visibility={true} />
        );
      case "Subscription":
        return (
          <SubscriptionOnBoard id={id} data={{ ...formData }} entityType={approval?.EntityType} isActive={false} />
        );
      case "Role":
        return (
          <AddEditRole id={id} data={{ ...formData }} entityType={approval?.EntityType} isActive={false} />
        );
      case "Application":
        return (
          <AddEditApplication id={id} data={{ ...formData }} entityType={approval?.EntityType} isActive={false} />
        );
      case "UserManagement":
        return (
          <AddEditUser id={id} data={{ ...formData }} entityType={approval?.EntityType} isActive={false} />
        );
      case "Provider":
        return (
          <AddEditProvider id={id} data={{ ...formData }} entityType={approval?.EntityType} isActive={false} />
        );
      case "Action":
        {
          switch (approval.RequestType) {
            case IRequestCrud.Create:
              return (
                <div
                  style={{ display: 'flex' }}
                >
                  <div style={{ width: '100%' }}>
                    <ActionWorkFlow disableToolBox={true} id={resultData?.id} SchemaId={resultData?.SchemaId} actionByIdData={formData} entityType={approval?.EntityType} />
                  </div>
                  {/* <div style={{ width: '50%' }}>
                      <ActionWorkflowContainer disableToolBox={true} DocumentIdCompareMode={request?.Entity?.id} SchemaIdCompareMode={request?.Entity?.SchemaId} />
                    </div> */}
                </div>
              );
            case IRequestCrud.Update:
              return (
                <div
                  style={{ display: 'flex' }}
                >
                  <div style={{ width: '50%' }}>
                    <b style={{ display: 'flex', justifyContent: 'center' }}>Old Version</b>
                    <ActionWorkflowContainer disableToolBox={true} DocumentIdCompareMode={approval?.Entity?.id} SchemaIdCompareMode={approval?.Entity?.SchemaId} />
                  </div>
                  <div style={{ width: '50%' }}>
                    <b style={{ display: 'flex', justifyContent: 'center' }}>New Version</b>
                    <ActionWorkFlow disableToolBox={true} id={resultData?.id} SchemaId={resultData?.SchemaId} actionByIdData={formData} entityType={approval?.EntityType} />
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
    const _formData = {
      ...resultData,
      Status: item,
    };
    let payload = {
      ..._formData
    }
    let result: any = null;
    if (id) {
      result = await dispatch(updateRequestAPI(id, payload));
    }
    navigate("/schema");
  }

  const onView = () => {
    setIsOpen(!isOpen);
  };

  const onApprove = (e: any) => {
    statusApproved(IProvisioningRequestStatus.Approved)
  };

  const onReject = () => {
  };

  return (
    <div style={{ overflow: "auto" }}>
      <div className={"content-block dx-card responsive-paddings"}>
        <div
          style={{
            width: "98%",
            textAlign: "right",
            margin: "10px 10px 10px 0px",
          }}
        >
          <DXButton hint='Approve' text="" icon="todo" onClick={onApprove} />
          <DXButton hint='Reject' text="" icon="remove" onClick={onReject} />
          <DXButton hint='Comparator' text="" icon="menu" visible={resultData?.RequestType === "UPDATE"} onClick={onView} />
        </div>
        <div>{renderComponent()}</div>
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

export default ViewApprovalRequest;
