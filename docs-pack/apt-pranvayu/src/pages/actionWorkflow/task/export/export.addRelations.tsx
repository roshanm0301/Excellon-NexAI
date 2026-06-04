import { ScrollView } from "devextreme-react";
import DataGrid, { Column, Editing, SearchPanel } from "devextreme-react/data-grid";
import React, { useEffect, useState } from "react";
import { v4 } from "uuid";
import "../../../schema/schema.scss";
import {
  IContainerColumnProps,
  IRelations,
  RelationGridColumns,
  ReltionTypes,
} from "../../../schema";
import { useAppDispatch, useAppSelector } from "../../../../store/customHooks";
import {
  getSchemaAPI,
  getSchemaListAPI,
  getSchemaListBySubscriptionAPI,
  showNotification,
} from "../../../../redux/actions";
import {DXAccordion,DXButton,DXForm,DXTextArea} from "../../../../components/atoms";
import { checkDuplicateField } from "../../../../utility/utils";

const defaultRelation: IRelations = {
  id: v4(),
  name: "",
  type: "",
  subscription: "",
  schemaId: "",
  joinColumn: "",
  column: "",
  columns: [],
};

export const AddRelations = React.memo((props: IContainerColumnProps) => {
  const { callback, title, data, isActive, listData, disable } = props;
  const dispatch = useAppDispatch();

  let { config } = useAppSelector((state) => state.auth);
  let { schemaListBySubscription } = useAppSelector((state) => state.schema);
  let { subscriptionListByIdentity } = useAppSelector(
    (state) => state.subscription
  );
  const [relation, setRelation] = useState<any>({ ...defaultRelation });
  const [relations, setRelations] = useState<any[]>(data);
  const [row, setRow] = useState<any>("");
  const [showTextArea, setShowTextArea] = useState(true);
  const [state, setState] = useState<any>([]);
  const [columnList, setColumnList] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState<any>("");

  useEffect(() => {
    SchemaListApiCall();
  }, []);

  useEffect(() => {
    if (data) {
      let _relations = data?.map((item: any) => {
        return { ...item, id: v4() };
      });
      setRelations(_relations);
    }
  }, [data]);

  const SchemaListApiCall = async () => {
    dispatch(getSchemaListAPI(null));
  };

  const saveTextArea = (e: any) => {
    if (e.event) {
      e.event.stopPropagation();
    }

    if (e) {
      if (!showTextArea) {
        try {
          let value = JSON.parse(e);
          if (Array.isArray(value)) {
            value.map((i: any) => {
              i.id = v4();
              relations.push(i);
            });
            callback(relations);
          } else {
            setState([]);
            return;
          }
        } catch (e: any) {
          dispatch(
            showNotification({
              isOpen: true,
              message: "Please enter JSON in array only.",
              type: "error",
            })
          );
          setState([]);
        }
      }
    }
  };

  const saveColumnData = (e: any) => {
    if (showTextArea) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (relation !== "") {
      if (row === "") {
        if (checkDuplicateField(data, relation, "name")) {
          dispatch(
            showNotification({
              isOpen: true,
              message: "Duplicate Column Name",
              type: "error",
            })
          );
          return;
        }
      }

      let _relations: any[] = [];

      if (row !== "") {
        _relations = relations?.map((item: any) => {
          if (item.id === row) {
            return { ...item, ...relation };
          }
          return item;
        });
      } else {
        _relations = [...(relations || []), relation];
      }

      setRelations([..._relations]);
      setRow("");
      callback(_relations);
      setRelation({ ...defaultRelation, name: "", type: "" });
    }
  };

  const onRowClick = (e: any) => {
    if (e.data) {
      setRow(e.data.id);
      setRelation({ ...e.data });
      ColumnTypeSelected(e.data.type);
      handleGetSchemaListBySubscription(e?.data?.subscription);
      handleGetSchema(e?.data?.schemaId);
      setShowTextArea(true);
    }
  };

  const ColumnTypeSelected = (e: any) => {
    if (e?.event) {
      // getUIElements(e.value)
    }
  };

  const SubscriptionSelected = (e: any) => {
    if (e?.event) {
      handleGetSchemaListBySubscription(e.value);
      setSelectedSubscription(e.value);
      setRelation({
        ...relation,
        schemaId: "",
        joinColumn: "",
        columns: [],
      });
    }
  };

  const handleGetSchemaListBySubscription = (id: any) => {
    let _defaultConfig = { ...config, Subscription: id };
    dispatch(
      getSchemaListBySubscriptionAPI({ config: _defaultConfig, request: null })
    );
  };

  const SchemaSelected = async (e: any) => {
    if (e?.event) {
      handleGetSchema(e?.value);
      setRelation({
        ...relation,
        joinColumn: "",
        columns: [],
      });
    }
  };

  const handleGetSchema = async (id: any) => {
    const result: any = await dispatch(getSchemaAPI(id, selectedSubscription));
    if (result?.id) {
      setColumnList(result.Columns);
    }
  };

  const editorChange = () => {
    setShowTextArea(!showTextArea);
  };

  const onCancel = () => {
    setRow("");
    setRelation({ ...defaultRelation, name: "", type: "" });
    if (showTextArea) {
      setShowTextArea(true);
    } else {
      setShowTextArea(false);
    }
  };

  const confirmDelete = (e: any) => {
    const deletedData = e.data;
    const updatedData = relations.filter(
      (item: any) => item.id !== deletedData.id
    );
    callback(updatedData);
  };

  const onChange = (name: any, e: any) => {
    if (e.event) {
      setRelation({ ...relation, [name]: e.value });
    }
  };

  return (
    <DXAccordion title={title || "Payload"} defaultSelectedIndex={-1}>
      <DXButton
        text=""
        icon="preferences"
        disabled={disable}
        hint="Change editor"
        type="default"
        onClick={editorChange}
      />
      {showTextArea ? (
        <>
          <form action="your-action" onSubmit={saveColumnData}>
            <div style={{ padding: "10px" }}>
              <DXForm
                stylingMode="outlined"
                formData={relation}
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
                          onValueChanged: (e: any) => onChange("name", e),
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
                          onValueChanged: (e: any) => SubscriptionSelected(e),
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
                          onValueChanged: (e: any) => SchemaSelected(e),
                        },
                      },
                      {
                        label: { text: "Column", location: "top" },
                        dataField: "column",
                        isRequired: true,
                        editorType: "dxSelectBox",
                        editorOptions: {
                          dataSource: listData,
                          displayExpr: "name",
                          valueExpr: "name",
                          searchEnabled: true,
                        },
                      },
                      {
                        label: { text: "Join Column", location: "top" },
                        dataField: "joinColumn",
                        isRequired: true,
                        editorType: "dxSelectBox",
                        editorOptions: {
                          dataSource: columnList || [],
                          displayExpr: "name",
                          valueExpr: "name",
                          searchEnabled: true,
                          onValueChanged: (e: any) => onChange("joinColumn", e),
                        },
                      },
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
                          dataSource: columnList || [],
                          displayExpr: "name",
                          valueExpr: "name",
                          multiline: true,
                          showSelectionControls: true,
                          searchEnabled: true,
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
                  stylingMode="contained"
                  type="default"
                  useSubmitBehavior={true}
                  validationGroup="testRelation"
                  disabled={disable}
                />
                <DXButton
                  text=""
                  icon="revert"
                  type="default"
                  onClick={() => {
                    setRow("");
                    setRelation({ ...defaultRelation, name: "", type: "" });
                  }}
                  disabled={disable}
                />
              </div>
            </div>
          </form>
        </>
      ) : (
        <ScrollView>
          <div className={"content-block dx-card responsive-paddings"}>
            <DXTextArea
              name={"Payload"}
              value={JSON.stringify(relations)}
              onValueChange={saveTextArea}
              stylingMode="outlined"
            />
            <div className="columnButtons">
              <DXButton
                type="default"
                text={""}
                icon={"save"}
                onClick={saveTextArea}
                stylingMode="contained"
                disabled={disable}
              />
              <DXButton
                type="default"
                text={""}
                icon={"revert"}
                onClick={onCancel}
                stylingMode="outlined"
                disabled={disable}
              />
            </div>
          </div>
        </ScrollView>
      )}
      {relations?.length > 0 && (
        <DataGrid
          showBorders={true}
          hoverStateEnabled={true}
          dataSource={relations}
          keyExpr="id"
          columns={RelationGridColumns}
          onRowClick={onRowClick}
          // onEditorPreparing={onEditorPreparing}
          // onCellPrepared={onCellPrepared}
          onRowRemoved={confirmDelete}
          disabled={disable}
        >
          <SearchPanel
            visible={true}
            width={240}
            searchVisibleColumnsOnly={true}
            placeholder="Search..."
          />
          <Editing allowDeleting={true} mode="row" />
          <Column dataField="id" allowEditing={false} />
        </DataGrid>
      )}
    </DXAccordion>
  );
});
