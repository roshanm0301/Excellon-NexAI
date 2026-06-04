import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchIcon } from "../../assets/icons";
import { DXButton, DXDataGrid, DXInput } from "../../components/atoms";
import { getTemplateListPagingAPI, subscriptionChange } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { defaultState } from "../schema";


export const TemplateList = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { templateList, templateCount } = useAppSelector((state) => state.template);
  let { IsSubscriptionChanged } = useAppSelector((state) => state.auth);
  const [state, setState] = useState({ ...defaultState });

  useEffect(() => {
    TemplateListApiCall();
  }, [state])

  useEffect(() => {
    if (IsSubscriptionChanged) {
      TemplateListApiCall();
      dispatch(subscriptionChange(false))
    }
  }, [IsSubscriptionChanged])

  const TemplateListApiCall = async () => {
    dispatch(getTemplateListPagingAPI(state))
  }

  const onPageIndexChange = (value: number) => {
    setState({ ...state, page: value });
  };

  const onPageSizeChange = async (value: number) => {
    if (value >= templateCount) {
      setState({ ...state, page: 0, take: templateCount });
    } else {
      setState({ ...state, take: value });
    }
  };

  const addNewTemplate = () => {
    navigate("/template/add-template");
  };

  const onEditRowKeyChange = (e: any) => {
    navigate(`/template/edit-template/${e.row.key}`);
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
      type: "buttons",
      caption: "Actions",
      width: "15%",
      buttons: [
        {
          text: "edit",
          visible: true,
          hint: "Edit Schema",
          icon: 'edit',
          onClick: onEditRowKeyChange
        }
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
            text="Add Template"
            icon="add"
            type="default"
            onClick={addNewTemplate}
          // width={'100%'}
          ></DXButton>
        </div>
        <DXDataGrid
          dataSource={templateList}
          keyExpr="id"
          columns={SchemaGridColumn}
          count={templateCount}
          // Pagination
          defaultPageSize={state.take}
          onPageIndexChange={onPageIndexChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  );
};
