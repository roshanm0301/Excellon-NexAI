import { LoadPanel } from "devextreme-react/load-panel";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DXButton, DXDataGrid, DXInput } from "../../components/atoms";
import { PAGING } from "../../components/constant/constant";
import { getRoleListPagingAPI, subscriptionChange } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { RoleGridColumn } from "./role.entity";
import { SearchIcon } from "../../assets/icons";

const RoleList = () => {
  const defaultState: any = {
    orderby: "CreatedOn",
    asc: -1,
    page: PAGING.pageIndex,
    take: PAGING.pageSize,
    search: ''
  };
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [state, setState] = useState({ ...defaultState });
  let { roleList, roleCount, message } = useAppSelector((state) => state.role);
  let { selectedSubscription } = useAppSelector((state) => state.subscription);
  let { IsSubscriptionChanged } = useAppSelector((state) => state.auth);

  useEffect(() => {
    RoleListApiCall();
  }, [state])

  useEffect(() => {
    if (IsSubscriptionChanged) {
      RoleListApiCall();
      dispatch(subscriptionChange(false));
    }
  }, [IsSubscriptionChanged])

  const RoleListApiCall = async () => {
    dispatch(getRoleListPagingAPI(state));
  }

  const onPageIndexChange = (value: any) => {
    setState({ ...state, page: value });
  };

  const onPageSizeChange = async (value: any) => {
    if (value >= roleCount) {
      setState({ ...state, page: 0, take: roleCount });
    } else {
      setState({ ...state, take: value });
    }
  };

  const addNewRole = () => {
    navigate("/role/add-role");
  };

  const onEditRowKeyChange = (e: any) => {
      navigate(`/role/role-edit-for-pranvayu/${e}`);
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
            width={"40%"}
            showIcon={true}
            options={{ icon: SearchIcon }}
          ></DXInput>
          <DXButton
            text="ADD ROLE"
            icon="add"
            type="default"
            onClick={addNewRole}
          ></DXButton>
        </div>
        <DXDataGrid
          dataSource={roleList}
          keyExpr="id"
          columns={RoleGridColumn}
          count={roleCount}
          // Pagination
          defaultPageSize={state.take}
          onPageIndexChange={onPageIndexChange}
          onPageSizeChange={onPageSizeChange}
          // Editing
          onEditRowKeyChange={onEditRowKeyChange}
        />
      </div>
    </div>
  );
};

export default RoleList;
