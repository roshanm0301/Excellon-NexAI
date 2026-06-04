import { ScrollView } from "devextreme-react";
import TreeList, { Column, Editing, SearchPanel } from "devextreme-react/tree-list";
import React, { useEffect, useState } from "react";
import { v4 } from "uuid";
import { DXAccordion, DXButton, DXForm, DXTextArea } from "../../components/atoms";
import { DXPopup } from "../../components/template";
import { GET_SCHEMA_LIST_BY_SUBSCRIPTION, getSchemaAPI, getSchemaListBySubscriptionAPI, showNotification } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { formatRelationsDataForTreeList, formatTreeListDataForPayload, IRelations, ReltionTypes } from "./schema.entity";
import "./schema.scss";

const defaultRelation: IRelations = {
  id: v4(),
  name: "",
  type: "",
  subscription: "",
  schemaId: "",
  joinColumn: "",
  column: "",
  columns: [],
  edge: "",
  nodeLabel: "",
  parentId: null,
  relations: []
};
interface AddRelationsProps {
  data: any;
  disable: boolean;
  ParentSchemaColumn: any[];
  title: string;
  callback: (arg: any) => void;
}

export const AddRelations: React.FC<AddRelationsProps> = React.memo(({ data, disable, ParentSchemaColumn, title, callback }: any) => {
  const dispatch = useAppDispatch();
  const [relations, setRelations] = useState(data || []);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [newRelation, setNewRelation] = useState<IRelations>({ ...defaultRelation });
  const [parentId, setParentId] = useState<any>(null);
  const [editingRelationId, setEditingRelationId] = useState<string | null>(null);
  let { config } = useAppSelector((state) => state.auth);
  let { schemaListBySubscription } = useAppSelector((state) => state.schema);
  let { subscriptionListByIdentity } = useAppSelector((state) => state.subscription);
  const [columnsAndJoinColumn, setColumnsAndJoinColumn] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState<string>("");
  const [isTextAreaVisible, setIsTextAreaVisible] = useState(true);
  const [textareaContent, setTextareaContent] = useState<any>([]);
  const [columnList, setColumnList] = useState<any[]>([])


  useEffect(() => {
    if (data) {
      let newData = formatRelationsDataForTreeList(data?.map((item: IRelations) => ({ ...item })))
      setRelations(newData ?? []);
    }
  }, [data]);


  const handleOpenPopup = async (parentId?: any, relationToEdit?: IRelations) => {

    setParentId(parentId || null);

    if (relationToEdit) {
      SubscriptionSelectedForEditMode(relationToEdit?.subscription);
      setEditingRelationId(relationToEdit?.id);

      if (!parentId) {
        if (relationToEdit?.schemaId) {
          SchemaSelected(relationToEdit?.schemaId, "callOnLoad");
          await fetchParentSchemaColumns(relationToEdit?.schemaId, relationToEdit?.subscription);
        } else {
          console.error("Missing schemaId in relationToEdit");
        }
        setNewRelation(relationToEdit);
      } else {
        const find = relations?.find((item: IRelations) => item?.id === parentId);
        if (find) {
          SchemaSelected(find?.schemaId, "callOnLoad");
          await fetchParentSchemaColumns(find?.schemaId, find?.subscription);
        } else {
          console.error("Parent relation not found");
        }
        setNewRelation(relationToEdit);
      }
    } else {
      const find = relations?.find((item: IRelations) => item?.id === parentId);
      setEditingRelationId(null);
      setNewRelation({
        ...defaultRelation,
        parentId: parentId || null,
      });
      if (find?.schemaId) {
        await fetchParentSchemaColumns(find?.schemaId, find?.subscription);
      }
    }

    // Open the popup only after API calls complete
    setIsPopupVisible(true);
  };


  const handleClosePopup = () => {
    setIsPopupVisible(false);
    setNewRelation({ ...defaultRelation });
    setEditingRelationId(null);
    setParentId(null)
    setIsTextAreaVisible(true)
    setSelectedSubscription("")
    setTextareaContent([])
    dispatch({ type: GET_SCHEMA_LIST_BY_SUBSCRIPTION, payload: [] });
  };

  const fetchParentSchemaColumns = async (id: string, subscription: string) => {
    const result: any = await dispatch(getSchemaAPI(id, subscription));
    if (result?.id) {
      setColumnList(result.Columns);
    }
  };


  const handleSubmit = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (editingRelationId) {
      setRelations(relations?.map((item: IRelations) =>
        item.id === editingRelationId ? { ...newRelation, id: editingRelationId } : item)
      );
    } else {
      if (parentId) {
        setRelations([...relations, { ...newRelation, id: v4(), parentId }]);
      } else {
        setRelations([...relations, { ...newRelation, id: v4(), parentId: null },
        ]);
      }
    }
    handleClosePopup();
  };

  const handleFieldChange = (name: string, e: any) => {
    if (e.event) {
      setNewRelation({ ...newRelation, [name]: e.value });
    }
  };

  const SubscriptionSelectedForEditMode = (id: string) => {
    if (id) {
      handleGetSchemaListBySubscription(id);
      setSelectedSubscription(id);
    }
  };

  const SubscriptionSelected = (e: any) => {
    if (e?.event) {
      handleGetSchemaListBySubscription(e.value);
      setSelectedSubscription(e.value);
      setNewRelation({ ...newRelation, schemaId: "", joinColumn: "", columns: [] });
    }
  };

  const handleGetSchemaListBySubscription = (id: string) => {
    let _defaultConfig = { ...config, Subscription: id };
    dispatch(
      getSchemaListBySubscriptionAPI({ config: _defaultConfig, request: null })
    );
  };


  const SchemaSelected = async (id: string, callForm: string) => {
    if (id) {
      handleGetSchema(id);
      if (callForm === "callOnLoad") {
        setNewRelation({ ...newRelation, joinColumn: "", columns: [] });
      }
    }
  };

  const handleGetSchema = async (id: string) => {
    const result: any = await dispatch(getSchemaAPI(id, selectedSubscription));
    if (result?.id) {
      setColumnsAndJoinColumn(result.Columns);
    }
  };

  const handleSaveRelations = (e: any) => {
    if (relations?.length > 0) {
      const formattedData = formatTreeListDataForPayload(relations);
      callback(formattedData)
    }
  }

  const toggleTextAreaVisibility = () => {
    if (isTextAreaVisible) {
      setIsTextAreaVisible(false);
    }
    else {
      setIsTextAreaVisible(true);

    }

    setTextareaContent(isTextAreaVisible ? [newRelation] : []);
  };

  const saveTextAreaContent = (e: any) => {
    e?.event?.stopPropagation();

    try {
      const parsedValue = Array.isArray(textareaContent) ? textareaContent : JSON.parse(textareaContent);
      if (!Array.isArray(parsedValue)) {
        throw new Error("Input must be an array.");
      }

      const updatedRelations = parsedValue?.map(item => ({
        ...item,
        id: item.id || v4(),
        parentId: item.parentId || null,
      }));

      const newRelation = updatedRelations[0];

      // If the item exists in the current relations, update it; otherwise, add it
      const updatedState = relations?.map((item: IRelations) =>
        item.id === newRelation.id ? { ...item, ...newRelation } : item
      );

      // If the item was not found in the state, add it to the list
      if (!relations?.some((item: IRelations) => item?.id === newRelation?.id)) {
        updatedState.push(newRelation);
      }
      setRelations(updatedState);
      callback(updatedState);
      handleClosePopup();

    } catch (error) {
      dispatch(showNotification({
        isOpen: true,
        message: "Please enter JSON in array only.",
        type: "error",
      }));
    }
  };

  const onHiding = () => {
    handleClosePopup()
  }

  return (
    <DXAccordion title={title || "Add Relation"} defaultSelectedIndex={-1}>
      <DXButton
        text="Save"
        onClick={handleSaveRelations}
        style={{ marginRight: "5px" }}
        visible={relations?.length > 0} />

      <DXButton
        text="Add New Relation"
        disabled={disable}
        className="dx-button dx-button-default add-record"
        onClick={() => handleOpenPopup()}
        style={{ marginLeft: "5px" }}
      />
      <div style={{ width: "100%", overflowX: "auto" }}>
        {relations?.length > 0 && <TreeList
          dataSource={relations}
          keyExpr="id"
          parentIdExpr="parentId"
          showBorders
          height={800}
          columnAutoWidth={false}
          allowColumnResizing={true}
          // columns={RelationGridColumns}
          autoExpandAll
          onRowInserted={(e) => setRelations([...relations, e?.data])}
          onRowUpdated={(e) =>
            setRelations(relations?.map((item: IRelations) => (item?.id === e?.key ? e?.data : item)))
          }
          onRowRemoved={(e) =>
            setRelations(relations?.filter((item: IRelations) => item?.id !== e?.key))
          }
        >
          <SearchPanel visible highlightCaseSensitive={false} />
          <Column dataField="name" caption="Name" />
          <Column dataField="type" caption="Type" />
          {/* <Column dataField="subscription" caption="Subscription" /> */}
          {/* <Column dataField="schemaId" caption="Schema" /> */}
          <Column dataField="joinColumn" caption="JoinColumn" />
          <Column dataField="column" caption="Column" />
          <Column dataField="columns" caption="Columns" />

          <Editing
            mode="row"
            allowUpdating={false}
            allowDeleting
            useIcons={true}
          />
          <Column
            cellRender={({ data }) => {
              return (
                <div>
                  <DXButton
                    text=""
                    icon="edit"
                    disabled={disable}
                    className="dx-button dx-button-success"
                    onClick={() => handleOpenPopup(data?.parentId, data)}
                  />
                  <DXButton
                    text=""
                    icon="plus"
                    disabled={disable}
                    className="dx-button dx-button-default"
                    onClick={() => handleOpenPopup(data?.id)}
                  />
                </div>
              );
            }}
            caption="Actions"
          />
        </TreeList>
        }
      </div>

      <DXPopup
        title={editingRelationId ? "Edit Record" : parentId ? "Add Child Record" : "Add New Record"}
        width="50vw"
        height={"40vw"}
        visible={isPopupVisible}
        onHiding={onHiding} >
        <DXButton
          text=""
          icon="preferences"
          disabled={disable}
          hint="Change editor"
          type="default"
          onClick={toggleTextAreaVisibility}
        />
        {isTextAreaVisible ?
          <ScrollView style={{ paddingBottom: "5px" }}>
            <form action="your-action" onSubmit={handleSubmit}>
              {/* <ScrollView> */}
              <DXForm
                stylingMode="outlined"
                formData={newRelation}
                colCount={1}
                disabled={disable}
                validationGroup="testRelation"
                items={[
                  {
                    itemType: "empty",
                  },
                  {
                    itemType: "group",
                    cssClass: "no-margin",
                    colCount: 2,
                    items: [
                      {
                        label: { text: "Name", location: "top" },
                        dataField: "name",
                        isRequired: true,
                        editorOptions: {
                          onValueChanged: (e: any) => handleFieldChange("name", e),
                        },
                      },
                      {
                        label: { text: "Subscription", location: "top" },
                        dataField: "subscription",
                        isRequired: true,
                        editorType: "dxSelectBox",
                        editorOptions: {
                          dataSource: subscriptionListByIdentity,
                          displayExpr: "DisplayName",
                          valueExpr: "id",
                          searchEnabled: true,
                          onValueChanged: (e: any) => {
                            SubscriptionSelected(e);
                          },
                        },
                      },
                      {
                        label: { text: "Type", location: "top" },
                        dataField: "type",
                        isRequired: true,
                        editorType: "dxSelectBox",
                        editorOptions: {
                          dataSource: Object.values(ReltionTypes),
                          searchEnabled: true,
                        },
                      },
                      {
                        label: { text: "Schema", location: "top" },
                        dataField: "schemaId",
                        isRequired: true,
                        editorType: "dxSelectBox",
                        editorOptions: {
                          dataSource: schemaListBySubscription,
                          displayExpr: "DisplayName",
                          valueExpr: "id",
                          searchEnabled: true,
                          onValueChanged: (e: any) => {
                            SchemaSelected(e?.value, "handleFieldChange");
                          },
                        },
                      },
                      {
                        label: { text: "Column", location: "top" },
                        dataField: "column",
                        isRequired: true,
                        editorType: "dxSelectBox",
                        editorOptions: {
                          dataSource: parentId ? columnList : ParentSchemaColumn,
                          displayExpr: "name",
                          valueExpr: "name",
                          searchEnabled: true,
                          onValueChanged: (e: any) => handleFieldChange("column", e),
                        },
                      },
                      {
                        label: { text: "Join Column", location: "top" },
                        dataField: "joinColumn",
                        isRequired: true,
                        editorType: "dxSelectBox",
                        editorOptions: {
                          dataSource: columnsAndJoinColumn || [],
                          displayExpr: "name",
                          valueExpr: "name",
                          searchEnabled: true,
                          onValueChanged: (e: any) => handleFieldChange("joinColumn", e),
                        },
                      }
                    ],
                  },
                  {
                    itemType: "group",
                    cssClass: "no-margin",
                    colCount: 1,
                    items: [
                      {
                        label: { text: "Columns" },
                        dataField: "columns",
                        editorType: "dxTagBox",
                        editorOptions: {
                          dataSource: columnsAndJoinColumn || [],
                          displayExpr: "name",
                          valueExpr: "name",
                          multiline: true,
                          showSelectionControls: true,
                          searchEnabled: true,
                          onValueChanged: (e: any) => handleFieldChange("columns", e),
                        },
                      },
                    ],
                  },
                  {
                    itemType: "group",
                    cssClass: "no-margin",
                    colCount: 2,
                    items: [
                      {
                        label: { text: "Edge", location: "top" },
                        dataField: "edge",
                        editorOptions: {
                          onValueChanged: (e: any) => handleFieldChange("edge", e),
                        },
                      },
                      {
                        label: { text: "Node Label", location: "top" },
                        dataField: "nodeLabel",
                        editorOptions: {
                          onValueChanged: (e: any) => handleFieldChange("nodeLabel", e),
                        },
                      },
                    ],
                  },
                ]}
              />
              <div className="columnButtons">
                <DXButton
                  text=""
                  icon="save"
                  // stylingMode="contained"
                  type="default"
                  useSubmitBehavior={true}
                  validationGroup="testRelation"
                  disabled={disable}
                />
                <DXButton
                  text=""
                  icon="revert"
                  type="default"
                  onClick={handleClosePopup}
                  disabled={disable}
                />
              </div>
              {/* </ScrollView> */}
            </form>
          </ScrollView>
          :
          <div>
            <ScrollView>
              <DXTextArea
                name={"Payload"}
                value={JSON.stringify(textareaContent)}
                onValueChange={(e: any) => setTextareaContent(e)}
                // onValueChange={saveTextArea}
                stylingMode="outlined"
              />

              <div className="columnButtons">
                <DXButton
                  type="default"
                  text={""}
                  icon={"save"}
                  onClick={saveTextAreaContent}
                  // stylingMode="contained"
                  disabled={disable}
                />
                <DXButton
                  type="default"
                  text={""}
                  icon={"revert"}
                  onClick={() => setIsTextAreaVisible(true)}
                  stylingMode="outlined"
                  disabled={disable}
                />
              </div>
            </ScrollView>
          </div>}
      </DXPopup>
    </DXAccordion>
  );
});
