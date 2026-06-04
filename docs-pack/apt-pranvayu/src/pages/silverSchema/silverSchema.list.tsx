import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchIcon } from "../../assets/icons";
import { DXButton, DXDataGrid, DXInput } from "../../components/atoms";
import { getSilverSchemaListPagingAPI, subscriptionChange } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { defaultState } from "../schema";

export const SilverSchemaList = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { silverSchemaList, silverSchemaCount } = useAppSelector((state) => state.silverSchema);
  let { IsSubscriptionChanged } = useAppSelector((state) => state.auth);
  const [state, setState] = useState({ ...defaultState });

  useEffect(() => {
    SilverSchemaListApiCall();
  }, [state])

  useEffect(() => {
    if(IsSubscriptionChanged){
      SilverSchemaListApiCall();
      dispatch(subscriptionChange(false))
    }
  }, [IsSubscriptionChanged])

  const SilverSchemaListApiCall=async()=>{
    dispatch(getSilverSchemaListPagingAPI(state))
  }

  const onPageIndexChange = (value: number) => {
    setState({ ...state, page: value });
  };

  const onPageSizeChange = async (value: number) => {
    if (value >= silverSchemaCount) {
      setState({ ...state, page: 0, take: silverSchemaCount });
    } else {
      setState({ ...state, take: value });
    }
  };

  const addNewSchema = () => {
    navigate("/silver/add");
  };

  const onEditRowKeyChange = (e: any) => {
    navigate(`/silver/edit/${e.row.key}`);
  };

  const SchemaGridColumn = [
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
      dataField: "TableName",
      caption: "Table Name",
      visible: true,
    },
    {
      type: "buttons",
      caption: "Actions",
      width: "15%",
      buttons: [
        {
          text: "edit",
          visible: true,
          hint: "Edit Silver Schema",
          icon: 'edit',
          onClick: onEditRowKeyChange
        },
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
          >
          </DXInput>
          <DXButton
            text="ADD SILVER"
            icon="add"
            type="default"
            onClick={addNewSchema}
          ></DXButton>
        </div>
        <DXDataGrid
          dataSource={silverSchemaList}
          keyExpr="id"
          columns={SchemaGridColumn}
          count={silverSchemaCount}
          defaultPageSize={state.take}
          onPageIndexChange={onPageIndexChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  );
};
