import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DXButton, DXDataGrid, DXInput } from "../../components/atoms";
import { PAGING } from "../../components/constant/constant";
import { getApplicationListPagingAPI, getRoleApplicationMappingListPagingAPI, getRoleListAPI, subscriptionChange } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
// import { ApplicationGridColumn } from "./application.entity";
import { SearchIcon, TrashIcon } from "../../assets/icons";
import { DXPopup } from "../../components/template";

const ApplicationList = () => {
  const defaultState: any = {
    orderby: "CreatedOn",
    asc: -1,
    page: PAGING.pageIndex,
    take: PAGING.pageSize,
  };
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [state, setState] = useState({ ...defaultState });
  const [search, setSearch] = useState("");
  let { applicationList, applicationCount, message } = useAppSelector((state) => state.application);
  let { roleApplicationMappingList } = useAppSelector((state) => state.roleApplicationMapping)
  let { roles } = useAppSelector((state) => state.role);

  const [convertedApplicationList, setConvertedApplicationList] = useState<any>([])
  const [isOpen, setIsOpen] = useState(false);
  let { IsSubscriptionChanged ,config} = useAppSelector((state) => state.auth);

  useEffect(() => {
    ApplicationListApiCall()
  }, [state]);

  useEffect(() => {
    if (IsSubscriptionChanged) {
      ApplicationListApiCall();
      dispatch(subscriptionChange(false));
    }
  }, [IsSubscriptionChanged])

  const ApplicationListApiCall = async () => {
    dispatch(getRoleListAPI(null))
    dispatch(getRoleApplicationMappingListPagingAPI(null))
    dispatch(getApplicationListPagingAPI(state));
  }

  useEffect(() => {
    let payload: any = []
    applicationList?.map((documentId: any) => {

      let RoleIdss = roleApplicationMappingList?.find((applicationId: any) => {
        if (applicationId?.ApplicationId === documentId?.id) {
          return applicationId?.RoleIds;
        }
      })

      let systemNames = roles.filter((document: any) => {
        const matchingSystem = RoleIdss?.RoleIds?.find((item: any) => item === document.id);
        return matchingSystem
      });

      let roleSysName = systemNames.map((item: any) => item.SystemName)

      let obj: any = {
        id: documentId.id,
        SystemName: documentId.SystemName,
        DisplayName: documentId.DisplayName,
        RoleIds: roleSysName
      }
      payload.push(obj)
    })

    setConvertedApplicationList(payload)
  }, [applicationList, roleApplicationMappingList, roles])

  const onPageIndexChange = (value: any) => {
    setState({ ...state, page: value });
  };

  const onPageSizeChange = async (value: any) => {
    if (value >= applicationCount) {
      setState({ ...state, page: 0, take: applicationCount });
    } else {
      setState({ ...state, take: value });
    }
  };

  const addNewApplication = () => {
    navigate("/application/add-application");
  };

  const onEditRowKeyChange = (e: any) => {
    navigate(`/application/edit-application/${e.row.key}`);
  };

  const ViewCredential = (e: any) => {
    setIsOpen(!isOpen);
  }

  const ApplicationGridColumn = [
    {
      dataField: "SystemName",
      caption: "System Name",
      visible: true,
    },
    {
      dataField: "DisplayName",
      caption: "Display Name",
      visible: true,
    },
    {
      type: "buttons",
      caption: "Actions",      
      buttons: [
        {
          visible: true,
          hint: "View Credentials",
          icon: "link",
          onClick: ViewCredential,
        }, {
          
          visible: true,
          hint: "View Request",
          icon: 'edit',
          onClick: onEditRowKeyChange
        },]
    },
    
  ];

  return (
    <div>
      <div className={"content-block dx-card responsive-paddings"}>
        <div className="grid-header-actions">
          <DXInput
            label="Search"
            required={true}
            onChange={(e: any) => setSearch(e)}
            defaultValue={search}
            value={search}
            width={"40%"}
            showIcon={true}
            options={{ icon: SearchIcon }}
          ></DXInput>

          <DXButton
            text="ADD APPLICATION"
            icon="add"
            type="default"
            onClick={addNewApplication}
          ></DXButton>
        </div>

        <DXDataGrid
          dataSource={convertedApplicationList}
          keyExpr="id"
          columns={ApplicationGridColumn}
          count={applicationCount}
          // Pagination
          defaultPageSize={state.take}
          onPageIndexChange={onPageIndexChange}
          onPageSizeChange={onPageSizeChange}
        // Editing
        // onEditRowKeyChange={onEditRowKeyChange}
        />
      </div>
      <DXPopup
        title="Credentials"
        width="40vw"
        height="30vh"
        visible={isOpen}
        onHiding={() => setIsOpen(false)}
      >
        <div className={"content-block"}>
          ClientId : {config.ClientId}
          <br />
          ClientSecret : {config.ClientSecret}
        </div>
      </DXPopup>
    </div>
  );
};

export default ApplicationList;
