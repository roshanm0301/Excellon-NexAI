import { ScrollView } from "devextreme-react";
import DataGrid, { Column, Editing, SearchPanel } from "devextreme-react/data-grid";
import TextArea from 'devextreme-react/text-area';
import React, { useEffect, useState } from "react";
import { v4 } from "uuid";
import { DXAccordion, DXButton, DXForm } from "../../components/atoms";
import { showNotification } from "../../redux/actions";
import { useAppDispatch } from "../../store/customHooks";
import { checkDuplicateField } from "../../utility/utils";
import { GridColumns, IColumn, IContainerColumnProps, findDuplicateObjectsByName } from "./schema.entity";
import './schema.scss';

const defaultColumn: IColumn = {
  name: "",
  type: "",
};

export const AddColumn = React.memo((props: IContainerColumnProps) => {
  const { callback, title, data, isActive, listData, disable } = props;
  const dispatch = useAppDispatch();

  const [column, setColumn] = useState<any>({ ...defaultColumn });
  const [columns, setColumns] = useState<any[]>(data);
  const [row, setRow] = useState<any>("");
  const [columnStructure, setColumnStructure] = useState([])
  const [showTextArea, setShowTextArea] = useState(true);
  const [state, setState] = useState<any>([]);

  useEffect(() => {
    if (data) {
      let _column = data?.map((item: any) => {
        return { ...item, id: v4() };
      })
      setColumns(_column)
      setState(_column)
    }
  }, [data])

  const saveTextArea = (e: any) => {
    if (e.event) {
      e.event.stopPropagation()
    }

    if (e) {
      if (!showTextArea) {
        try {
          if (Array.isArray(state)) {
            const duplicates = findDuplicateObjectsByName(state, "name")
            if (duplicates.length > 0) {
              dispatch(showNotification({
                isOpen: true,
                message: `Duplicate Column Name found`,
                type: "error",
              }));
            } else {
              callback(state);
            }
          } else {
            setState([]);
            return;
          }
        } catch (e: any) {
          dispatch(showNotification({
            isOpen: true,
            message: "Please enter JSON in array only.",
            type: "error",
          }));
          setState([]);
        }
      }
    }
  }

  const saveColumnData = (e: any) => {
    if (showTextArea) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (column !== "") {
      if (row === "") {
        if (checkDuplicateField(data, column, 'name')) {
          dispatch(showNotification({
            isOpen: true,
            message: "Duplicate Column Name",
            type: "error",
          }));
          return
        }
      }

      let _columns: any[] = [];

      if (row !== "") {
        _columns = columns?.map((item: any) => {
          if (item.id === row) {
            return { ...item, ...column };
          }
          return item;
        });

      } else {
        _columns = [...(columns || []), column];
      }

      setColumns([..._columns]);
      setRow("")
      callback(_columns);
      setColumn({ ...defaultColumn, name: "", type: "" })
      setColumnStructure([])

    }
  };

  const onRowClick = (e: any) => {
    if (e.data) {
      setRow(e.data.id);
      setColumn({ ...e.data });
      ColumnTypeSelected(e.data.type)
      getUIElements(e.data.type)
      setShowTextArea(true)
    }
  };

  //disabled Datagrid row 
  // function onEditorPreparing(e: any) {
  //   defaultColumnNames.find((item: any) => {
  //     if (item === e.row.data.name) {
  //       return e.editorOptions.disabled = true
  //     }
  //   })
  // }

  // function onCellPrepared(e: any) {
  //   defaultColumnNames.find((item: any) => {
  //     if (item === e?.data?.name) {
  //       return e.cellElement.inert = true, e.cellElement.className = `${e.cellElement.className} disable-action`
  //     }
  //   })
  // }

  const ColumnTypeSelected = (e: any) => {
    if (e?.event) {
      getUIElements(e.value)
    }
  }

  const getUIElements = (value: any) => {
    let _columnTypeSelected = listData.find((item: any) => item.SystemName === value)
    setColumnStructure(_columnTypeSelected?.UIElement)
  }

  const editorChange = () => {
    setShowTextArea(!showTextArea);
  };

  const onCancel = () => {
    setRow("");
    setColumn({ ...defaultColumn, name: "", type: "" })
    setColumnStructure([])
    if (showTextArea) {
      setShowTextArea(true);
    } else {
      setShowTextArea(false);
    }
  }

  const confirmDelete = (e: any) => {
    const deletedData = e.data;
    const updatedData = columns.filter((item: any) => item.id !== deletedData.id);
    callback(updatedData)
  }

  const onChange = (e: any) => {
    if (e.event) {
      setColumn({ ...column, name: e.value })
    }
  }

  const handleChange = (e: any) => {
    if (e?.event) {
      let abc = JSON.parse(e.value)
      if (Array.isArray(abc))
        setState(abc)
    }
  }

  return (
    <DXAccordion title={title || "Payload"} defaultSelectedIndex={-1}>
      <DXButton text="" icon="preferences" disabled={disable} hint="Change editor" type="normal" stylingMode="text" onClick={editorChange} />
      {showTextArea ? (
        <>
          <form action="your-action" onSubmit={saveColumnData}>

            <div className="column-form-wrapper">
              <DXForm
                stylingMode="outlined"
                formData={column}
                colCount={1}
                disabled={disable}
                validationGroup="testColumn"
                items={[
                  {
                    itemType: "group",
                    cssClass: "no-margin",
                    colCount: 2,
                    items: [
                      {
                        label: { text: "Column Name", location: "top" },
                        dataField: "name",
                        isRequired: true,
                        editorOptions: {
                          onValueChanged: (e: any) => onChange(e)
                        }

                      }, {
                        label: { text: "Column Type", location: "top" },
                        dataField: "type",
                        isRequired: true,
                        editorType: "dxSelectBox",
                        editorOptions: {
                          dataSource: listData,
                          displayExpr: "DisplayName",
                          valueExpr: "SystemName",
                          searchEnabled: true,
                          onValueChanged: (e: any) => ColumnTypeSelected(e)
                        },
                      },

                    ],
                  },
                  {
                    itemType: "group",
                    cssClass: "no-margin",
                    colCount: 4,
                    items: columnStructure
                  },

                ]}
              />
              <div className="columnButtons">
                <DXButton text="" icon="save" stylingMode="text" type="normal" useSubmitBehavior={true} validationGroup="testColumn" disabled={disable} hint="Save column" />
                <DXButton text="" icon="revert" type="normal" stylingMode="text" onClick={() => {
                  setRow("");
                  setColumn({ ...defaultColumn, name: "", type: "" })
                  setColumnStructure([])
                }}
                  disabled={disable} hint="Reset" />
              </div>
            </div>
          </form>
        </>)
        : (
          <ScrollView>
            <div className={"content-block responsive-paddings"}>
              <TextArea
                height={150}
                value={JSON.stringify(state, null, 4)}
                onValueChanged={handleChange}
                stylingMode="outlined"
              />
              <div className="columnButtons">
                <DXButton type="normal" text={""} icon={'save'} onClick={saveTextArea} stylingMode="text" disabled={disable} hint="Save" />
                <DXButton type="normal" text={""} icon={'revert'} onClick={onCancel} stylingMode="text" disabled={disable} hint="Reset" />
              </div>
            </div>
          </ScrollView>
        )}
      {columns?.length > 0 && (
        <DataGrid
          showBorders={true}
          hoverStateEnabled={true}
          dataSource={columns}
          keyExpr="id"
          columns={GridColumns}
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
