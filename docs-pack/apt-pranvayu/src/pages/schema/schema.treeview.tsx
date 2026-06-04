import { useEffect, useState } from "react";
import ClosedImage from "../../assets/icon-close.svg";
import ClosedIcon from "../../assets/icon-closed.svg";
import { DXButton } from "../../components/atoms";
import {
  IsTreeViewOpened,
  SchemaActionList,
  SelectedItems,
  getActionAPI,
  getSchemaAPI,
  setSelectedItemId,
} from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { ActionWorkFlow, WorkFlowModes } from "../actionWorkflow";
import { AddEditSchema } from "./schema.addEdit";
import SchemaTreeViewComponent from "./schema.treeViewComponent";
import { ContextMenu } from "devextreme-react";
import { v4 } from "uuid";
import { DXPopup } from "../../components/template";

const enum ComponentType {
  Schema = "Schema",
  Action = "Action",
}

const SchemaTreeView = () => {
  const dispatch = useAppDispatch();
  const [schemaFormData, setSchemaFormData] = useState<any>(null);
  const [actionFormData, setActionFormData] = useState<any>(null);
  const [componentType, setComponentType] = useState("");
  const { actionListBySchemaId, schemaActionList, selectedItemId, selectedItems } = useAppSelector((state) => state.schema);
  const [workflowMode, setWorkflowMode] = useState<any>("");
  const [isOpen, setIsOpen] = useState(false)
  const [isDivOpen, setIsDivOpen] = useState(true);
  const [isCloseAllPopupOpen, setIsCloseAllPopupOpen] = useState(false);
  const [scrollViewHeight, setScrollViewHeight] = useState(460);

  useEffect(() => {
    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => {
      window.removeEventListener('resize', calculateHeight);
    };
  }, []);

  const calculateHeight = () => {
    const windowHeight = window.innerHeight;
    const newHeight = windowHeight - 100;
    setScrollViewHeight(newHeight);
  };
  useEffect(() => {
    if (selectedItemId !== null) {
      handleTreeViewContextMenu(selectedItemId); //bind data after page refresh
    }
  }, [])

  useEffect(() => {
    dispatch(SchemaActionList()); //left section api called
  }, []);


  // Open Schema or action file.
  const handleTreeViewContextMenu = async (item: any) => {
    const alreadyExists = selectedItems?.some((s: any) => s.id === item.id);
    if (alreadyExists === true) {
      //onItem click to bind existing data
      if (item.Type === ComponentType.Schema && item.Data !== null) {
        dispatch(setSelectedItemId(item))
        setSchemaFormData({ ...schemaFormData, ...item.Data });
      }
      else if (item.Data === null && item.Type === ComponentType.Schema) {    //left menu click for bind data from selectedItems
        const find = selectedItems?.find((sItem: any) => sItem.id === item.id)
        if (find.Data !== null) {
          dispatch(setSelectedItemId(find))
          setSchemaFormData({ ...schemaFormData, ...find.Data })
        } else if (find.Data === null && find.text === "Add New Schema") {
          dispatch(setSelectedItemId(find))
          setSchemaFormData({ ...find.Data })
        }
      }

      if (item.Type === ComponentType.Action && item.Data !== null) {
        // isDelete:true :-to handle oisDirty flag in itemDelete mode
        dispatch(setSelectedItemId({ ...item, onLoad: true }))
        setActionFormData({ ...actionFormData, ...item.Data, onLoad: true });
        if (item.isCloneAction === true) {  //for set workflow mode on itemClick
          setWorkflowMode(WorkFlowModes.CLONE_ACTION);
        } else {
          setWorkflowMode(WorkFlowModes.EDIT_ACTION);
        }
      } else if (item.Data === null && item.Type === ComponentType.Action) {   //left menu click for bind data from selectedItems
        const find = selectedItems?.find((sItem: any) => sItem.id === item.id)
        if (find.Data !== null) {
          dispatch(setSelectedItemId({ ...find, onLoad: true }))
          setActionFormData({ ...actionFormData, ...find.Data, onLoad: true })
        } else if (find.Data === null && find.text === "Add New Workflow") {
          dispatch(setSelectedItemId({ ...find, onLoad: true }))
          setActionFormData({ ...find.Data, onLoad: true })
        }
      }
    } else {
      if (item.Type === ComponentType.Schema) {  //new schema click
        const schemaResponse: any = await dispatch(getSchemaAPI(item.id));
        setSchemaFormData({ ...schemaFormData, ...schemaResponse });
        const sItem = { ...item, Data: schemaResponse };
        dispatch(setSelectedItemId(sItem));
        dispatch(SelectedItems([...selectedItems, sItem]))
      }

      if (item.Type === ComponentType.Action) {  //new action click
        const actionResponse: any = await dispatch(getActionAPI(item.id));
        setActionFormData({ ...actionFormData, ...actionResponse });
        const sItem = { ...item, Data: actionResponse, onLoad: true };
        dispatch(setSelectedItemId(sItem));
        dispatch(SelectedItems([...selectedItems, sItem]))
        setWorkflowMode(WorkFlowModes.EDIT_ACTION);
      }
      if (item.Type === ComponentType.Action && item.Data !== null) {  //clone action click
        setActionFormData({ ...actionFormData, ...item.Data, onLoad: true });
        const sItem = { ...item, Data: item.Data, onLoad: true };
        dispatch(setSelectedItemId(sItem));
        dispatch(SelectedItems([...selectedItems, sItem]))
        setWorkflowMode(WorkFlowModes.CLONE_ACTION);
      }
    }

    setComponentType(item.Type)    //set Type for all cases
  };

  const onRefreshClick = async (item: any) => {
    //refresh click from left menu
    const alreadyExists = selectedItems?.some((s: any) => s.id === item.id);
    if (alreadyExists) {     //check to refresh only opened selectedItem
      if (item.Type === ComponentType.Schema) {
        const schemaResponse: any = await dispatch(getSchemaAPI(item.id));
        setSchemaFormData({ ...schemaFormData, ...schemaResponse });
        delete item.case;
        const sItem = { ...item, Data: schemaResponse };
        dispatch(setSelectedItemId(sItem));
        setComponentType(item.Type)
        const updatedItems = selectedItems?.map((item: any) => {
          if (item.id === sItem.id) {
            return { ...item, ...sItem }
          }
          return item
        }) || [];
        dispatch(SelectedItems([...updatedItems]));
      }
      else if (item.Type === ComponentType.Action) {
        const actionResponse: any = await dispatch(getActionAPI(item.id));
        setActionFormData({ ...actionFormData, ...actionResponse });
        delete item.case;
        const sItem = { ...item, Data: actionResponse, onLoad: true };
        dispatch(setSelectedItemId(sItem));
        setComponentType(item.Type)
        const updatedItems = selectedItems?.map((item: any) => {
          if (item.id === sItem.id) {
            return { ...item, ...sItem }
          }
          return item
        }) || [];
        dispatch(SelectedItems([...updatedItems]));
      }
    }
  }

  const onCloseClick = (item: any) => {  //for closed an single item
    if (item?.isDirty === true) {
      setIsOpen(true)
    } else {
      onDeleteClick(item)
    }
  };

  const onDeleteClick = (item: any) => {
    setIsOpen(false);
    // Delete item from selected item
    let newItems = selectedItems?.filter((s: any) => s.id !== item.id)
    if (newItems && newItems?.length > 0) {
      dispatch(SelectedItems(newItems)); // twice
      let last = newItems[newItems.length - 1]; // Set last item as selected.
      // Open last item and bind data.
      handleTreeViewContextMenu(last)
    } else {
      resetCommonData()
    }
  }

  const resetCommonData = () => {   //Reset Schema and Action Form data
    dispatch(SelectedItems([]));
    dispatch(setSelectedItemId(null))
    setActionFormData(null);
    setSchemaFormData(null);
    setComponentType("");
    setWorkflowMode("");
  }

  const onCloseAllClick = () => {   // to close all opened items
    const result = selectedItems?.filter((item: any) => item.isDirty === true)
    if (result?.length > 0) {
      setIsCloseAllPopupOpen(true)
    } else {
      closeAllClick()
    }
  }

  const closeAllClick = () => {
    setIsCloseAllPopupOpen(false)
    resetCommonData()
  }
  const handleMenuClick = () => {
    setIsDivOpen(!isDivOpen);
    dispatch(IsTreeViewOpened(isDivOpen));
  };

  const addNewSchema = {
    id: v4(),
    Type: "Schema",
    text: "Add New Schema",
    Data: null,
  }

  const addNewAction = {
    id: v4(),
    Type: "Action",
    text: "Add New Workflow",
    Data: null,
    onLoad: false,
    SchemaId: null
  }

  const onAddActionClick = (item: any) => {  //to add new action
    let _item = { ...addNewAction, SchemaId: item.id }
    dispatch(setSelectedItemId(_item));
    dispatch(SelectedItems([...selectedItems, _item]));
    setActionFormData({ SchemaId: item.id });
    setComponentType(ComponentType.Action);
    setWorkflowMode(WorkFlowModes.ADD_ACTION);
  }

  const onAddSchemaClick = () => {  //to add new schema
    dispatch(setSelectedItemId(addNewSchema));
    dispatch(SelectedItems([...selectedItems, addNewSchema]));
    setSchemaFormData(null);
    setComponentType(ComponentType.Schema);
  }

  const contextMenuItemsForSetting = [
    { text: 'Add Schema', onClick: onAddSchemaClick, icon: "plus", },
    { text: 'Close All', onClick: onCloseAllClick, icon: "remove", },
  ];

  return (
    <div
      className={"schema-page content-block dx-card responsive-paddings"}
      style={{ display: "flex" }}
    >
      <SchemaTreeViewComponent
        schemaActionList={schemaActionList}
        selectedItemId={selectedItemId}
        onAddActionClick={onAddActionClick}
        handleTreeViewContextMenu={handleTreeViewContextMenu}
        actionListBySchemaId={actionListBySchemaId}
        isDivOpen={isDivOpen}
        onRefreshClick={onRefreshClick}
        scrollViewHeight={scrollViewHeight}
      />
      <div style={{ flexGrow: 1 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "baseline"
          }}
        >
          <DXButton
            id="open-context-for-settings"
            text=""
            icon='more'
            stylingMode='text'
          />
          <DXButton
            text=""
            icon="menu"
            type="default"
            stylingMode="text"
            hint="Close Tree View"
            style={{ margin: "0px" }}
            onClick={() => handleMenuClick()}
          />
          <div
            className={
              isDivOpen === false
                ? "selected-item-row-width"
                : "selected-item-row"
            }
          >
            {selectedItems?.map((item: any) => {
              return (
                <div
                  key={item.id}
                  style={{
                    color:
                      selectedItemId?.id === item.id ? "var(--color-primary, #f97316)" : "var(--text-primary, #cccccc)",
                    display: "flex",
                  }}
                >
                  <span
                    className="selected-item"
                    onClick={() => handleTreeViewContextMenu(item)}
                  >
                    {item.isDirty === true ? "*" : ""} {item.text}
                  </span>
                  <img
                    src={
                      selectedItemId?.id === item.id
                        ? ClosedIcon
                        : ClosedImage
                    }
                    alt="Avatar"
                    onClick={() => onCloseClick(item)}
                    style={{ width: "20px", height: "20px" }}
                    className="avatar"
                  ></img>
                </div>

              );
            })}
          </div>
        </div>

        <div>
          {componentType === ComponentType.Schema && (
            <AddEditSchema
              id={schemaFormData ? schemaFormData?.id : null}
              data={schemaFormData}
              isActive={true}
              disableUpdateButtons={true}
              height={scrollViewHeight - 50}
              visibility={false}
            />
          )}
          {componentType === ComponentType.Action && (
            <ActionWorkFlow
              isTreeView={true}
              handleTreeViewContextMenu={handleTreeViewContextMenu}
              workflowMode={workflowMode}
              disableToolBox={false}
              id={actionFormData ? actionFormData.id : null}
              SchemaId={actionFormData?.SchemaId ? actionFormData.SchemaId : selectedItemId?.SchemaId}
              actionByIdData={actionFormData}
            />
          )}
        </div>

        <ContextMenu
          dataSource={contextMenuItemsForSetting}
          width={160}
          target="#open-context-for-settings"
          showEvent="dxcontextmenu click"
        />
        <DXPopup title={'Discard Un-save Changes'} width='38%' height="19%" onHiding={() => setIsOpen(false)} visible={isOpen}>
          <span style={{ fontSize: "14px" }}>
            Are you sure you want to discard this record?  &nbsp;&nbsp;
            <DXButton
              text="Yes"
              type="default"
              stylingMode="text"
              style={{ height: '20px' }}
              onClick={() => onDeleteClick(selectedItemId)}
            />
            <DXButton
              text="No"
              type="default"
              stylingMode="text"
              style={{ height: '20px' }}
              onClick={() => setIsOpen(false)}
            />
          </span>
        </DXPopup>

        <DXPopup title={'Discard All Un-Save Changes'} width='42%' height="20%" onHiding={() => setIsCloseAllPopupOpen(false)} visible={isCloseAllPopupOpen}>
          <span style={{ fontSize: "14px" }}>
            Are you sure you want to discard All un-save changes? &nbsp;
            <DXButton
              text="Yes"
              type="default"
              stylingMode="text"
              style={{ height: '20px' }}
              onClick={() => closeAllClick()}
            />
            <DXButton
              text="No"
              type="default"
              stylingMode="text"
              style={{ height: '20px' }}
              onClick={() => setIsCloseAllPopupOpen(false)}
            />
          </span>
        </DXPopup>
      </div>

    </div>
  );
};

export default SchemaTreeView;
