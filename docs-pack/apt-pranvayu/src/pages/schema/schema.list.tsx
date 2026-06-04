import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { SearchIcon } from "../../assets/icons";
import { DXButton, DXDataGrid, DXInput } from "../../components/atoms";
import { DXPopup } from "../../components/template";
import { getSchemaListPagingAPI, showNotification, subscriptionChange } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { RootState } from "../../store/store";
import { CheckoutProcess } from "./checkoutProcess";
import { defaultState } from "./schema.entity";

const statusBadgeMap: Record<string, { className: string; label: string }> = {
  DRAFT: { className: 'schema-status-badge schema-status-badge--draft', label: 'Draft' },
  PUBLISHED: { className: 'schema-status-badge schema-status-badge--published', label: 'Published' },
  ARCHIVED: { className: 'schema-status-badge schema-status-badge--archived', label: 'Archived' },
};

const StatusCell = (cellData: any) => {
  const status = cellData.value || 'DRAFT';
  const badge = statusBadgeMap[status] || { className: 'schema-status-badge schema-status-badge--draft', label: status };
  return <span className={badge.className}>{badge.label}</span>;
};

const BooleanCell = (cellData: any) => {
  return (
    <span className={`schema-bool-badge ${cellData.value ? 'schema-bool-badge--yes' : 'schema-bool-badge--no'}`}>
      {cellData.value ? 'Yes' : 'No'}
    </span>
  );
};

export const SchemaList = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { schemaList, schemaCount } = useAppSelector((state) => state.schema);
  const selectedUser = useSelector((state: RootState) => state.auth.selectedUser);
  let { IsSubscriptionChanged } = useAppSelector((state) => state.auth);

  const [isOpen, setIsOpen] = useState(false);
  const [schemaFormData, setSchemaFormData] = useState<any>()
  const [state, setState] = useState({ ...defaultState });

  useEffect(() => {
    SchemaListApiCall();
  }, [state])

  useEffect(() => {
    if (IsSubscriptionChanged) {
      SchemaListApiCall();
      dispatch(subscriptionChange(false));
    }
  }, [IsSubscriptionChanged])

  const SchemaListApiCall = async () => {
    dispatch(getSchemaListPagingAPI(state));
  }

  const onPageIndexChange = (value: number) => {
    setState({ ...state, page: value });
  };

  const onPageSizeChange = async (value: number) => {
    if (value >= schemaCount) {
      setState({ ...state, page: 0, take: schemaCount });
    } else {
      setState({ ...state, take: value });
    }
  };

  const addNewSchema = () => {
    navigate("/schema/add-schema");
  };

  const onEditRowKeyChange = (e: any) => {
    navigate(`/schema/edit-schema/${e.row.key}`);
  };

  const onCheckoutRequest = (e: any) => {
    if (e.row.data.Status === "PUBLISHED") {
      setSchemaFormData(e.row.data)
      setIsOpen(!isOpen);
    } else {
      dispatch(showNotification({
        isOpen: true,
        message: "Schema not Published yet!",
        type: "error",
      }));
    }
  }

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
      dataField: "IsSystem",
      caption: "Is System",
      visible: true,
      alignment: "center",
      width: 100,
      cellRender: BooleanCell,
    },
    {
      dataField: "DatabaseType",
      caption: "Provider",
      visible: true,
    },
    {
      dataField: "Status",
      caption: "Status",
      visible: true,
      width: 120,
      cellRender: StatusCell,
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
        },
        {
          text: "checkout",
          visible: selectedUser ? true : false,
          hint: "Send for Checkout Request",
          icon: 'airplane',
          onClick: onCheckoutRequest,
        },
      ],
    },
  ];

  const onPopupChange = (e: boolean) => {
    setIsOpen(e)
  }

  return (
    <div className="schema-page">
      <div className={"content-block dx-card responsive-paddings"}>
        <div className="grid-header-actions">
          <DXInput
            label=""
            placeholder="Search schemas..."
            required={false}
            onChange={(e: any) => setState({ ...state, search: e })}
            defaultValue={state.search}
            value={state.search}
            width={280}
            showIcon={true}
            options={{ icon: SearchIcon }}
            stylingMode="outlined"
          />
          <DXButton
            text="Add Schema"
            icon="add"
            type="default"
            stylingMode="contained"
            onClick={addNewSchema}
          />
        </div>
        <DXDataGrid
          dataSource={schemaList}
          keyExpr="id"
          columns={SchemaGridColumn}
          count={schemaCount}
          // Pagination
          defaultPageSize={state.take}
          onPageIndexChange={onPageIndexChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
      <DXPopup
        title=""
        visible={isOpen}
        onHiding={() => setIsOpen(false)}
        showCloseButton={false}
        showTitle={false}
        width="400px"
        height="300px"
      >
        <CheckoutProcess data={schemaFormData} setIsOpen={onPopupChange} />
      </DXPopup>
    </div>
  );
};
