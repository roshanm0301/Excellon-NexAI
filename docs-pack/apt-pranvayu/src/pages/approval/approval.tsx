import { LoadPanel } from "devextreme-react/load-panel";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SearchIcon } from "../../assets/icons";
import { DXDataGrid, DXInput, DXSelect } from "../../components/atoms";
import { PAGING } from "../../components/constant/constant";
import { getApprovalAPI, getApprovalListAPI, requestTypePickList, showNotification } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { IProvisioningRequestStatus } from "../actionWorkflow/rule";
import { ApproveRequest } from "../request/approveRequest";
import '../request/request.scss';
import { requestType } from '../schema/schema.entity';
import { defaultStateForRequestType, defaultStateForStatusType } from "./approval.entity";

const items: any[] = [IProvisioningRequestStatus.PendingForApproval, IProvisioningRequestStatus.Approved];

export default function Approval() {
  const defaultState: any = {
    orderby: "CreatedOn",
    asc: -1,
    page: PAGING.pageIndex,
    take: PAGING.pageSize,
    search: ''
  };
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const defaultRequestType = useParams();
  const [search, setSearch] = useState();
  const [loaderVisible, setLoaderVisible] = useState(false);
  const [showApprove, setShowApprove] = useState(false)
  const [resultData, setResultData] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);
  const [requestTypes, setRequestType] = useState<any>()
  const [statusType, setStatusType] = useState<any>()
  const [type, setType] = useState(requestType.PullRequest)

  let { approvals, approvalCount } = useAppSelector(
    (state) => state.provisioningRequest
  );
  let { requestPickList } = useAppSelector((state) => state.provisioningRequest);

  const [status, setStatus] = useState(IProvisioningRequestStatus.PendingForApproval);

  const [state, setState] = useState({
    ...defaultState,
  });

  useEffect(() => {
    if (defaultRequestType) {
      if (defaultRequestType.id === requestType.CheckoutRequest)
        setType(requestType.CheckoutRequest)
    }
  }, [defaultRequestType])

  useEffect(() => {
    dispatch(getApprovalListAPI(state, { Status: [status], Type: type }));
  }, [status, state, type]);

  useEffect(() => {
    (async () => {
      const result: any = await dispatch(requestTypePickList(defaultStateForRequestType));
      setRequestType(result.data);
    })();
    (async () => {
      const result: any = await dispatch(requestTypePickList(defaultStateForStatusType));
      setStatusType(result.data);
    })();
  }, []);

  const onPageIndexChange = (value: any) => {
    setState({ ...state, page: value });
  };

  const onPageSizeChange = async (value: any) => {
    if (value >= approvalCount) {
      setState({ ...state, page: 0, take: approvalCount });
    } else {
      setState({ ...state, take: value });
    }
  };
  const onViewHistory = (e: any) => {
    if (e?.row?.data?.Type) {
      if (e?.row?.data?.EntityType === "Action") {
        navigate(`/history-action`);
      } else if (e?.row?.data?.EntityType === "Schema") {
        navigate(`/history-schema`);
      }
    }
  }

  const onView = async (e: any, options: any) => {
    if (e?.row?.data?.Type) {
      if (e?.row?.data?.Type === requestType.PullRequest) {
        navigate(`/approval/view-request/${e.row?.data._id}`);
      }
      //  else if (e?.row?.data?.EntityType === "Subscription") {
      //   navigate(`/approval-tree-view/${e.row?.data._id}`)
      // }
      else {
        const result: any = await dispatch(getApprovalAPI(e?.row?.data?.id))
        setResultData(result)
        const _formData = {
          ...formData,
          ...result.Entity,
        };
        setFormData({ ..._formData });
        setShowApprove(true)
      }
    } else {
      dispatch(showNotification({
        isOpen: true,
        message: "missing field : Type",
        type: "error",
      }));
    }
  };

  const ApprovalGridColumn = [
    {
      dataField: "EntityType",
      caption: "Entity Type",
      visible: true,
      width: "20%",
    },
    {
      dataField: "RequestType",
      caption: "Request Type",
      visible: true,
      width: "20%",
    },
    {
      dataField: "CreatedName",
      caption: "Created By",
      visible: true,
      width: "30%",
    },
    {
      dataField: "Entity.SystemName",
      caption: "SystemName",
      visible: true,
      width: "30%",
    },
    {
      dataField: "Status",
      caption: "Status",
      visible: true,
      width: "30%",
    },
    {
      dataField: "Entity.Status",
      caption: "Request Status",
      visible: true,
      width: "30%",
    },
    {
      type: "buttons",
      caption: "Actions",
      width: "20%",
      className: "blur",
      visible: status === IProvisioningRequestStatus.PendingForApproval,
      buttons: [
        {
          visible: true,
          hint: "View Request",
          icon: 'info', // <- it renders
          onClick: onView,
          cssClass: '',
        },
      ],
    },
  ];

  const onValueChanged = (e: any) => {
    if (e === null) {
      setStatus(IProvisioningRequestStatus.PendingForApproval)
    } else {
      setStatus(e);
    }
  };

  const onTest = (e: any) => {
  }

  function onCellPrepared(e: any) {
    if (e.row?.data?.Status === IProvisioningRequestStatus.Approved) {
      e.cellElement.inert = true
      e.cellElement.className = `${e.cellElement.className} disable-action`
    }
  }

  const handleTypeChange = (e: any) => {
    setType(e);
    navigate(`/approval`);
  };

  const onSelectToggle = (e: boolean) => {
    setShowApprove(e)
  }

  return (
    <div>
      {!showApprove ?
        <div className={"content-block dx-card responsive-paddings"}>
          <div className="grid-header-actions">
            <DXInput
              label="Search"
              required={true}
              onChange={(e: any) => setState({ ...state, search: e })}
              defaultValue={state.search}
              value={state.search}
              width={240}
              showIcon={true}
              options={{ icon: SearchIcon }}
            ></DXInput>

            <DXSelect
              items={requestTypes}
              value={type}
              displayExpr="DisplayName"
              valueExpr="ValueCode"
              onValueChange={handleTypeChange}
              width={200}
              showClearButton={true}
            />

            <DXSelect
              items={statusType}
              value={status}
              displayExpr="DisplayName"
              valueExpr="ValueCode"
              defaultValue={items}
              onValueChange={onValueChanged}
              width={200}
              showClearButton={true}
            />
          </div>

          <DXDataGrid
            // hoverStateEnabled={true}
            dataSource={approvals}
            keyExpr="_id"
            columns={ApprovalGridColumn}
            count={approvalCount}
            onEdit={false}
            defaultPageSize={state.take}
            onPageIndexChange={onPageIndexChange}
            onPageSizeChange={onPageSizeChange}
            onCellPrepared={onCellPrepared}
          />

          <LoadPanel
            shadingColor="rgba(0,0,0,0.4)"
            // position={position}
            visible={loaderVisible}
          />

        </div>
        :
        <div className="checkBoxstyle" >
          <ApproveRequest resultData={resultData} formData={formData} schemaId={formData.id} onSelectToggle={onSelectToggle} />
        </div>
      }
    </div>
  );
}
