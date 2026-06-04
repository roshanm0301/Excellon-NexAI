import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EyeIcon, SearchIcon } from "../../assets/icons";
import { DXButton, DXDataGrid, DXInput } from "../../components/atoms";
import { PAGING } from "../../components/constant/constant";
import { getProviderListPagingAPI, subscriptionChange } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";

const ProviderList = () => {
  const defaultState: any = {
    orderby: "CreatedOn",
    asc: -1,
    page: PAGING.pageIndex,
    take: PAGING.pageSize,
  };
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [state, setState] = useState({ ...defaultState });
  let { providerList, providerCount, message } = useAppSelector((state) => state.provider);
  let { IsSubscriptionChanged } = useAppSelector((state) => state.auth);

  useEffect(() => {
    ProviderListApiCall();
  }, [state])

  useEffect(() => {
    if (IsSubscriptionChanged) {
      ProviderListApiCall();
      dispatch(subscriptionChange(false));
    }
  }, [IsSubscriptionChanged])

  const ProviderListApiCall = async () => {
    dispatch(getProviderListPagingAPI(state));
  }

  const onPageIndexChange = (value: any) => {
    setState({ ...state, page: value });
  };

  const onPageSizeChange = async (value: any) => {
    if (value >= providerCount) {
      setState({ ...state, page: 0, take: providerCount });
    } else {
      setState({ ...state, take: value });
    }
  };

  // const onEditRowKeyChange = (e: any) => {
  //   navigate(`/provider/edit-provider/${e}`);
  // };

  const onView = (e: any) => {
    navigate(`/provider/edit-provider/${e.row.data.id}`);
  };

  const ProvidersGridColumns = [
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
          hint: "View Request",
          icon: EyeIcon,
          onClick: onView,
        },
        // {
        //   visible: true,
        //   hint: "View Request",
        //   icon: TrashIcon,
        // },
      ],
    },
  ];

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
            text="ADD PROVIDER"
            icon="add"
            type="default"
            onClick={() => {
              navigate("/provider/add-provider");
            }}
          ></DXButton>
        </div>

        <DXDataGrid
          dataSource={providerList}
          keyExpr="id"
          columns={ProvidersGridColumns}
          count={providerCount}
          // Pagination
          defaultPageSize={state.take}
          onPageIndexChange={onPageIndexChange}
          onPageSizeChange={onPageSizeChange}
          // Editing
          // onEditRowKeyChange={onEditRowKeyChange}
          onDelete={true}
        />
      </div>
    </div>
  );
};

export default ProviderList;
