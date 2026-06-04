import { DataGrid } from "devextreme-react";
import { Button, Column, Editing, SearchPanel } from "devextreme-react/data-grid";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DXButton } from "../../components/atoms";
import { DXPopup } from "../../components/template";
import { getActionAPI, getActionListAPI, showNotification } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { RootState } from "../../store/store";
import { CheckoutProcess } from "./checkoutProcess";
import { AboutAction } from "./schema.aboutAction";
import { IContainerActionProps } from "./schema.entity";
import { Icons } from "../../designer";

const formDefinition = {
  Tags: [],
  Description: "",
  Help: ""
};

export const AddSchemaAction = (props: IContainerActionProps) => {
  const { schemaId, isActive, visibility } = props;

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { actions, count } = useAppSelector((state) => state.action);
  const selectedUser = useSelector((state: RootState) => state.auth.selectedUser);

  const [formData, setFormData] = useState({ ...formDefinition })
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false)
  const [id, setDocumentId] = useState<any>("")
  const [schemaFormData, setSchemaFormData] = useState<any>()
  const [descriptionPopup, setDescriptionPopup] = useState<{ visible: boolean; text: string }>({ visible: false, text: "" })

  useEffect(() => {
    if (schemaId) dispatch(getActionListAPI(schemaId));
  }, [schemaId]);

  const addAction = () => {
    navigate(`/schema/add-action/${schemaId}`);
  };

  const onEditRowKeyChange = (documentId: string) => {
    navigate(`/schema/edit-action/${schemaId}/${documentId}`);
  };

  const onOpenPopup = async (e: any) => {
    const result: any = await dispatch(getActionAPI(e?.row?.data?.id));
    const _formData = {
      ...formData,
      ...result,
    };
    setFormData({ ..._formData });
    setDocumentId(e?.row?.data?.id)
    setIsOpen(true)
  }

  const onHiding = () => {
    setIsOpen(false)
    setFormData({
      ...formData,
      Tags: [],
      Description: "",
      Help: ""
    })
  }

  const onCheckoutRequest = (e: any) => {
    if (e.row.data.Status === "PUBLISHED") {
      (async () => {
        const result: any = await dispatch(getActionAPI(e.row.data.id));
        setSchemaFormData(result)
      })()
      setIsConfirmOpen(!isConfirmOpen);
    } else {
      dispatch(showNotification({
        isOpen: true,
        message: "Action not Published yet!",
        type: "error",
      }));
    }
  }

  const onViewHistory = () => {
    // navigate('/history-action')
  }

  const onPopupChange = (e: boolean) => {
    setIsConfirmOpen(e)
  }

  const onAboutActionChange = (e: boolean) => {
    setIsOpen(false)
  }

  return (
    <div className="content-block">
      <div className="grid-header-actions">
        {visibility === true && <h4 className="action-list-title">Action List</h4>}
        <DXButton
          text="ADD ACTION"
          icon="add"
          type="default"
          stylingMode="outlined"
          onClick={addAction}
          visible={isActive && visibility}
        ></DXButton>
      </div>

      <DataGrid
        showBorders={true}
        hoverStateEnabled={true}
        dataSource={actions}
        keyExpr="id"
        visible={visibility}
      >
        <SearchPanel
          visible={true}
          width={240}
          searchVisibleColumnsOnly={true}
          placeholder="Search..."
        />
        <Column dataField="SystemName" />
        <Column dataField="DisplayName" />
        <Column dataField="Status" />
        <Column
          dataField="Description"
          caption="Description"
          cellRender={(cellData: any) => (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {cellData.value && (
                <button
                  type="button"
                  title="View Description"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0 4px",
                    color: "#337ab7",
                    display: "inline-flex",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDescriptionPopup({ visible: true, text: cellData.value });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              )}
            </div>
          )}
        />

        <Column type="buttons">
          <Button name="edit" />
          <Button name="add" hint="Add Documentation" onClick={onOpenPopup} />
          {/* <Button icon="folder" onClick={onViewHistory} /> */}
          <Button name="Send Action for Checkout Request" icon="airplane" visible={selectedUser} hint="Send Action for Checkout Request" onClick={onCheckoutRequest} />
        </Column >

        <Editing
          allowUpdating={true}
          useIcons={true}
          mode="row"
          onEditRowKeyChange={onEditRowKeyChange}
        />

      </DataGrid >

      <DXPopup
        visible={isOpen}
        title={"About"}
        onHiding={onHiding}
        width="800px"
        height="600px"
      >
        <AboutAction schemaId={schemaId} id={id} data={formData} setIsOpen={onAboutActionChange} />
      </DXPopup >

      <DXPopup
        title=""
        visible={isConfirmOpen}
        onHiding={() => setIsConfirmOpen(false)}
        showCloseButton={false}
        showTitle={false}
        width="400px"
        height="300px"
      >
        <CheckoutProcess data={schemaFormData} setIsOpen={onPopupChange} />
      </DXPopup>

      <DXPopup
        title="Action Description"
        visible={descriptionPopup.visible}
        onHiding={() => setDescriptionPopup({ visible: false, text: "" })}
        fullScreen={true}
      >
        <div
          style={{
            padding: 16,
            height: "100%",
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {descriptionPopup.text}
        </div>
      </DXPopup>
    </div >
  );
};
