import { TagBox } from "devextreme-react";
import { LoadPanel } from "devextreme-react/load-panel";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SearchIcon } from "../../assets/icons";
import { DXDataGrid, DXInput, DXSelect } from "../../components/atoms";
import { PAGING } from "../../components/constant/constant";
import { getRequestListAPI, requestTypePickList } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { IProvisioningRequestStatus } from "../actionWorkflow/rule";
import { requestType } from "../schema";
import { defaultStateForRequestType, defaultStateForStatusType } from "../approval/approval.entity";

export default function Request() {
  const defaultState: any = {
    orderby: "CreatedOn",
    asc: -1,
    page: PAGING.pageIndex,
    take: PAGING.pageSize,
    search: ''
  };
  const items: any[] = Object.values(IProvisioningRequestStatus);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const defaultRequestType = useParams();
  const [requestTypes, setRequestType] = useState<any>()
  const [statusType, setStatusType] = useState<any>([])
  const [type, setType] = useState(requestType.PullRequest)
  const [loaderVisible, setLoaderVisible] = useState(false);
  const [status, setStatus] = useState<any>(items);
  const [state, setState] = useState({ ...defaultState });
  let { requests, requestCount } = useAppSelector((state) => state.provisioningRequest);

  useEffect(() => {
    if (defaultRequestType) {
      if (defaultRequestType.id === requestType.PullRequest)
        setType(requestType.PullRequest)
    }
  }, [defaultRequestType])

  useEffect(() => {
    (async () => {
      const result: any = await dispatch(requestTypePickList(defaultStateForRequestType));
      setRequestType(result?.data);
    })();
    (async () => {
      const result: any = await dispatch(requestTypePickList(defaultStateForStatusType));
      setStatusType(result?.data);
    })();
  }, []);


  useEffect(() => {
    dispatch(getRequestListAPI(state, { Status: status, Type: type }));
  }, [state, status, type]);

  const onPageIndexChange = (value: any) => {
    setState({ ...state, page: value });
  };

  const onPageSizeChange = async (value: any) => {
    if (value >= requestCount) {
      setState({ ...state, page: 0, take: requestCount });
    } else {
      setState({ ...state, take: value });
    }
  };

  const onView = (e: any, options: any) => {
    navigate(`/request/view-request/${e.row?.data._id}`);
  };

  const RequestGridColumn = [
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
      dataField: "ApprovalName",
      caption: "Assign To",
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
      caption: "Entity Status",
      visible: true,
      width: "30%",
    },
    {
      type: "buttons",
      caption: "Actions",
      // visible: status === IStatus.Draft || status === IStatus.PendingForApproval ? true : false,
      visible: true,
      width: "20%",
      buttons: [
        {
          // visible: status === IStatus.Draft || status === IStatus.PendingForApproval ? true : false,
          visible: true,
          hint: "View Request",
          stylingMode: "contained",
          icon: 'info', // <- it renders
          onClick: onView,
        },
      ],
    },
  ];

  const onValueChanged = (e: any) => {
    setStatus(e.value);
  };

  const handleTypeChange = (e: any) => {
    setType(e);
  };

  const onCellPrepared = (e: any) => {
    if (e.row?.data?.Status === IProvisioningRequestStatus.Approved || e.row?.data?.Status === IProvisioningRequestStatus.CancelledByUser) {
      e.cellElement.inert = true;
      e.cellElement.className = `${e.cellElement.className} disable-action`;
    }
  };

  return (
    <div>
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
          />
          <DXSelect
            items={requestTypes}
            value={type}
            displayExpr="DisplayName"
            valueExpr="ValueCode"
            label="Request Type"
            height={'37px'}
            onValueChange={handleTypeChange}
          />

          <TagBox
            items={statusType || []}
            value={status || ""}
            displayExpr="DisplayName"
            valueExpr="ValueCode"
            multiline={true}
            // maxDisplayedTags={0}
            label="Status"
            stylingMode="outlined"
            showSelectionControls={true}
            searchEnabled={true}
            onValueChanged={onValueChanged}
            width={280}
          // height={"37px"}
          />
        </div>

        <DXDataGrid
          dataSource={requests}
          keyExpr="Status"
          // hoverStateEnabled={false}
          // onRowClick={onRowClick}
          columns={RequestGridColumn}
          count={requestCount}
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
    </div>
  );
}
