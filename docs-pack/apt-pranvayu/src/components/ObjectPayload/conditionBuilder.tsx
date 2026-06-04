import { ScrollView } from "devextreme-react";
import { Column, Editing } from "devextreme-react/data-grid";
import TreeList from "devextreme-react/tree-list";
import { useEffect, useState } from "react";
import ReactJson from "react-json-view";
import { useTheme } from "../../contexts/ThemeContext";
import { DXButton } from "../atoms";
import { DXPopup, QueryBuilderTemplate } from "../template";
import { ChildRulePayload } from "./childRulePayload";
import { IConditionBuilderProps, mergeData, splitMergedData, TreeNode } from "./config";

const ConditionBuilder = (props: IConditionBuilderProps) => {
    const { config, SubscriptionList, data, onCallback } = props
    const { isDark } = useTheme();
    const [treeData, setTreeData] = useState<TreeNode[]>(data);
    const [selectedRow, setSelectedRow] = useState<TreeNode | null>(null);
    const [popupType, setPopupType] = useState<string | null>(null);
    const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false);
    const [newValue, setNewValue] = useState<any>(null);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [JSONPreview, setJSONPreview] = useState<boolean>(false);
    const [onHeaderUpdate, setOnHeaderUpdate] = useState(false)

    useEffect(() => {
        if (data?.length > 0) {
            setTreeData(splitMergedData(data))
        } else {
            setTreeData([])
        }
    }, [data])

    const openPopup = (type: string, row: TreeNode, isEdit = false) => {
        setSelectedRow(row);
        setPopupType(type);
        setIsPopupVisible(true);
        setOnHeaderUpdate(false)
        setEditMode(isEdit);
        if (type === "onSuccess" || type === 'onFailure') {
            setNewValue(isEdit ? row : {})
        } else {
            setNewValue(isEdit ? row.Key : row.conditions?.[type] || {});
        }
    };

    const closePopup = () => {
        setIsPopupVisible(false);
        setPopupType(null);
        setSelectedRow(null);
        setNewValue("");
        setEditMode(false);
        setOnHeaderUpdate(false);
    };

    const handleSaveOnSuccessAndFailure = (payload: any) => {
        if (!selectedRow) return;
        let updatedData = [...treeData];

        if (onHeaderUpdate) {
            // Update header row based on selectedRow ID
            updatedData = updatedData.map((node) =>
                node.id === selectedRow.id
                    ? {
                        ...node,
                        ...payload,
                    }
                    : node
            );
            setOnHeaderUpdate(false);
        }
        else {
            let parentRowIndex = -1;

            // Check if we're in edit mode or adding new data
            if (!editMode) {
                const newId = (treeData.length + 1).toString();
                updatedData.push({ ...payload, id: newId, parentId: selectedRow.id, rowType: popupType });

                // Update parent row's respective field (either onSuccess or onFailure)
                parentRowIndex = updatedData.findIndex((node) => node.id === selectedRow.id);
                if (parentRowIndex !== -1) {
                    if (popupType === 'onSuccess') {
                        updatedData[parentRowIndex].onSuccess = payload;
                    } else if (popupType === 'onFailure') {
                        updatedData[parentRowIndex].onFailure = payload;
                    }
                }
            } else {
                updatedData = updatedData.map((node) =>
                    node.id === selectedRow.id
                        ? {
                            ...node,
                            ...payload,
                            rowType: popupType,
                        }
                        : node
                );
            }
        }
        setTreeData(updatedData);
        closePopup();
    };


    const handleSaveCondition = (payload: any) => {
        if (!selectedRow) return;

        setTreeData((prevData: any) =>
            prevData.map((node: any) => {
                if (node.id === selectedRow.id) {
                    if (editMode) {
                        // Edit Key directly
                        return { ...node, Key: payload, rowType: 'Condition' };
                    } else {
                        // Update conditions object within the same row
                        return {
                            ...node,
                            conditions: payload,
                        };
                    }
                }
                return node;
            })
        );

        closePopup();
    };

    const handleDeleteRow = (row: any) => {
        const rowIdToDelete = row.id;
        const parentIdToCheck = row.parentId;
        let updatedTreeData = [...treeData];

        const parentIndex = updatedTreeData.findIndex((node) => node.id === parentIdToCheck);

        if (parentIndex !== -1) {
            const parentNode = updatedTreeData[parentIndex];

            if (row.rowType === "onSuccess") {
                parentNode.onSuccess = {};
            }

            if (row.rowType === "onFailure") {
                parentNode.onFailure = {};
            }
            updatedTreeData[parentIndex] = { ...parentNode };
        }
        updatedTreeData = updatedTreeData.filter((node) => node.id !== rowIdToDelete && node.parentId !== rowIdToDelete);
        setTreeData(updatedTreeData);
        onCallback(mergeData(updatedTreeData))
    };



    const onSaveButtonClick = () => {
        const resultData = mergeData(treeData);
        if (resultData) onCallback(resultData)
    }

    const onJsonPreviewClick = () => {
        setJSONPreview(true)
    }

    const OnOpenHeaderUpdate = (rowType: string, data: any, flag: boolean) => {
        openPopup(rowType, data, true)
        setOnHeaderUpdate(true)
    }

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <h5 style={{ fontWeight: "bold", color: 'var(--color-primary, #f97316)' }}>Condition :</h5>
                <DXButton stylingMode="outlined" text="Save" onClick={onSaveButtonClick} />
                <DXButton icon="favorites" text="" hint="JSON Preview" onClick={onJsonPreviewClick} />
            </div>

            {treeData?.length > 0 ? <TreeList
                dataSource={treeData}
                defaultExpandedRowKeys={["1"]}
                showRowLines
                showBorders
                columnAutoWidth
                keyExpr="id"
                parentIdExpr="parentId"
                onRowRemoving={handleDeleteRow}
            >
                <Column dataField="Key" caption="Key" />
                <Column dataField="Type" caption="Type" />
                <Column dataField="Value" caption="Value" />
                <Editing mode="row" allowUpdating={false} useIcons />
                <Column
                    width={300}
                    caption="Actions"
                    cellRender={(params) => {
                        return (
                            <div>
                                {params?.data?.parentId === null && (
                                    <DXButton text="" hint="edit" icon="edit" onClick={() => OnOpenHeaderUpdate('onSuccess', params?.data, true)} />
                                )}

                                {params?.data?.parentId !== null && (
                                    <DXButton text="" hint="edit" icon="edit" onClick={() => openPopup(params?.data?.rowType, params?.data, true)} />
                                )}
                                {params?.data?.Type === "Condition" &&
                                    <>
                                        <DXButton text="" hint="Add Condition" icon="preferences" onClick={() => openPopup("Condition", params?.data)} />
                                        {params?.data?.conditions && Object.keys(params?.data?.conditions || {})?.length > 0 &&
                                            <>
                                                {(!params?.data?.onSuccess || Object.keys(params?.data?.onSuccess)?.length === 0) && (
                                                    <DXButton text="" hint="Add Success" icon="check" onClick={() => openPopup("onSuccess", params?.data)} />
                                                )}
                                                {(!params?.data?.onFailure || Object.keys(params?.data?.onFailure)?.length === 0) && (
                                                    <DXButton text="" hint="Add Failure" icon="close" onClick={() => openPopup("onFailure", params?.data)} />
                                                )}
                                            </>
                                        }
                                    </>
                                }
                                <DXButton
                                    text=""
                                    hint="Delete"
                                    icon="trash"
                                    onClick={(e) => handleDeleteRow(params?.data)}
                                />
                            </div>
                        )
                    }}
                />

            </TreeList>
                :
                <h4>No condition found</h4>
            }

            <DXPopup
                visible={isPopupVisible}
                title={editMode ? `Edit Data` : `Add ${popupType}`}
                width="50vw"
                height="40vw"
                onHiding={closePopup}>

                {popupType === "Condition" && (
                    <QueryBuilderTemplate
                        conditions={selectedRow?.conditions ?? {}}
                        callBack={(payload: any) => {
                            setNewValue(payload)
                            handleSaveCondition(payload)
                        }
                        }
                    />
                )}
                {(popupType === 'onSuccess' || popupType === 'onFailure') && (
                    <ChildRulePayload
                        data={newValue}
                        config={config}
                        SubscriptionList={SubscriptionList}
                        callback={(payload: any) => {
                            setNewValue({ ...payload })
                            handleSaveOnSuccessAndFailure(payload)
                        }}
                        onHeaderUpdate={onHeaderUpdate}
                    />
                )}
            </DXPopup>

            <DXPopup
                visible={JSONPreview}
                title={'JSON Preview'}
                width="50vw"
                height="40vw"
                onHiding={() => setJSONPreview(false)}>
                <ScrollView>
                    <ReactJson src={mergeData(treeData)} theme={isDark ? "monokai" : "rjv-default"} />
                </ScrollView>
            </DXPopup>
        </div>
    );
};

export default ConditionBuilder;
