import { Tabs } from "devextreme-react";
import { memo, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AddColumn,
  AddSchemaAction,
  DefaultCrud,
  DefaultMongodbColumns,
  DefaultPostgresColumns,
  DefaultSQLColumns,
  EntityType,
  EntityTypeList,
  IContainerProps,
  SchemaDefinition,
  SchemaTabsDataSource,
  TableTypes,
  requestType
} from ".";
import { DXAccordion, DXButton, DXForm, DXSelect } from "../../components/atoms";
import { regEx } from "../../components/constant/regex";
import { DXPopup } from "../../components/template";
import {
  GetTypeByProviderAPI,
  SchemaActionList,
  SelectedItems,
  addApprovalAPI,
  addSchemaAPI,
  getGoldSchemaListAPI,
  getProviderListPagingAPI,
  getSchemaListAPI,
  getSilverSchemaListAPI,
  setSelectedItemId,
  updateRequestAPI,
  updateSchemaAPI
} from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { RootState } from "../../store/store";
import { isRequiredField, isValidField } from "../../utility/utils";
import {
  IEntityStatus,
  IProvisioningRequestStatus,
  IRequestCrud,
} from "../actionWorkflow/rule";
import { AddRelations } from "./schema.addRelations";
import ReadMeEditor from "./schema.readMeEditor";
import "./schema.scss";
import { ViewHistory } from "./viewHistory";

export const AddEditSchema = memo((props: IContainerProps) => {
  const {
    id,
    data,
    entityType = "",
    isActive,
    RequestType = "",
    disableUpdateButtons,
    height,
    visibility,
  } = props;

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();

  const selectedUser = useSelector(
    (state: RootState) => state.auth.selectedUser
  );
  const { providerList, typeByProviderList } = useAppSelector(
    (state) => state.provider
  );
  let navigationList = useAppSelector((state) => state.role.navigationList);
  const { selectedItemId, selectedItems } = useAppSelector(
    (state) => state.schema
  );
  const [schemaFormData, setSchemaFormData] = useState<any>({
    ...SchemaDefinition,
  });
  const [selectedTableType, setSelectedTableType] = useState();
  const [selectTags, setSelectTags] = useState([]);
  const [disableSendPullRequest, setDisableSendPullRequest] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [assignForApproval, setAssignForApproval] = useState("");
  let { isProduct } = useAppSelector((state) => state.auth);
  let moderatorList = useAppSelector((state) => state.role.moderatorList);
  let { silverSchemasList } = useAppSelector((state) => state.silverSchema)
  let { goldSchemas } = useAppSelector((state) => state.goldSchema)


  useEffect(() => {
    dispatch(getSchemaListAPI(null));
    dispatch(getSilverSchemaListAPI(null))
    dispatch(getProviderListPagingAPI(null));
    dispatch(getGoldSchemaListAPI(null))
  }, []);

  useEffect(() => {
    if (location.pathname) {
      if (location.pathname.includes("/schema/add-schema")) {
        setDisableSendPullRequest(true);
      } else {
        setDisableSendPullRequest(false);
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    if (data !== null) {
      setSchemaFormData({ ...SchemaDefinition, ...data, Relations: data?.Relations ?? [] });
      if (data.Provider) {
        let _res = providerList?.find((item: any) => item.id === data.Provider);
        getType(_res?.Type);
      }
    } else {
      setSchemaFormData({ ...SchemaDefinition, Minio: { enable: false, index: "" }, Elasticsearch: { enable: false, index: "" } });
    }
  }, [data]);

  const handleKeyDown = (e: any) => {
    if (e.keyCode === 13) {
      e.preventDefault();
    }
  }

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setSchemaFormData({ ...schemaFormData, Tags: selectTags });

    // Contributor mode
    if (selectedUser) {
      // cancelled by user flow in request component while editing schema
      if (
        data &&
        data?.Status === IProvisioningRequestStatus.Draft &&
        RequestType
      ) {
        addUpdateSchemaInContributorMode(
          IProvisioningRequestStatus.CancelledByUser
        );

        // save as draft flow while add or edit schema
      } else {
        addUpdateSchemaInContributorMode(IProvisioningRequestStatus.Draft);
      }

      // Developer mode
    } else {
      addUpdateSchema(schemaFormData, IEntityStatus.Published);
    }
  };

  const addUpdateSchemaInContributorMode = (
    status: IProvisioningRequestStatus
  ) => {
    // payload for provisioning request
    let payload = {
      Entity: schemaFormData,
      Status: status,
      RequestType: schemaFormData.id
        ? IRequestCrud.Update
        : IRequestCrud.Create,
      EntityType: EntityType.Schema,
      // AssignForApproval: "5dec1c81-ab59-47f1-ab6d-3cbb7f07302c",
      Type: requestType.PullRequest,
      AssignForApproval: assignForApproval,
    };

    // save as draft flow while add or edit schema
    if (status === IProvisioningRequestStatus.Draft) {
      addUpdateSchema(schemaFormData, IEntityStatus.Draft);

      // cancelled by user flow in request component while editing schema
    } else if (status === IProvisioningRequestStatus.CancelledByUser) {
      cancelledByUser(payload, schemaFormData);

      // send pull request flow
    } else {
      execPullRequestMode(payload);
    }
  };

  const addUpdateSchema = async (formData: any, status: IEntityStatus) => {
    const sItem = {
      ...selectedItemId,
      isDirty: false,
      Data: schemaFormData,
      text: schemaFormData.DisplayName,
    };
    dispatch(setSelectedItemId(sItem));
    const updatedItems =
      selectedItems?.map((item: any) => {
        if (item.id === sItem.id) {
          return { ...item, ...sItem };
        }
        return item;
      }) || [];
    dispatch(SelectedItems([...updatedItems]));
    dispatch(SchemaActionList());
    if (id) {
      await dispatch(updateSchemaAPI(id, formData));
    } else {
      // add schema
      formData.Status = status;
      let result: any = await dispatch(addSchemaAPI(formData));
      if (result?.success) {
        navigate("/schema");
      }
    }
  };

  const execPullRequestMode = (payload: any) => {
    // update provisioning request
    if (
      id &&
      entityType &&
      payload.Status === IProvisioningRequestStatus.PendingForApproval
    ) {
      dispatch(updateRequestAPI(id, payload));
      setIsOpen(false)
      setAssignForApproval("")
    } else {
      // add provisioning request
      dispatch(addApprovalAPI(payload));
      setIsOpen(false)
      setAssignForApproval("")
    }
    // if (navigationList[0]?.Role === RoleType.Moderator) {
    //   navigate(`/approval/${requestType.PullRequest}`);
    // } else {
    //   navigate("/schema");
    // }
  };

  const cancelledByUser = async (payload: any, formData: any) => {
    // update schema as draft and provisioning request as cancelledByUser
    if (id && RequestType === IRequestCrud.Update) {
      const result: any = await dispatch(
        updateSchemaAPI(formData.id, formData)
      );
      if (result.success) {
        dispatch(updateRequestAPI(id, payload));
      }
      // add schema as draft and provisioning request as cancelledByUser
    } else {
      formData.Status = IEntityStatus.Draft;
      const result: any = await dispatch(addSchemaAPI(formData));
      if (result.success) {
        dispatch(addApprovalAPI(payload));
      }
    }
  };

  const handleSendForApproval = (e: any) => {
    // send pull request
    // navigate("/approval")
    if (assignForApproval) {
      setIsOpen(false);
      addUpdateSchemaInContributorMode(
        IProvisioningRequestStatus.PendingForApproval
      );
      navigate(`/approval/${requestType.PullRequest}`);
    }
  };
  const onColumnDataCallback = (column: any) => {
    setSchemaFormData((state: any) => {
      return { ...state, Columns: column };
    });
  };

  const onRelationsDataCallback = (relations: any) => {
    setSchemaFormData((state: any) => {
      return { ...state, Relations: relations };
    });
  };

  const onTableTypeChanged = (e: any) => {
    if (e.event) {
      setSelectedTableType(e.value);
    }
  };

  const handleValueChanged = (e: any) => {
    if (e.event) {
      e.event.preventDefault();
      setSelectTags(e.value);
    }
  };

  const onEditorCallback = (readMeText: any) => {
    const _schemaFormData = { ...schemaFormData, Help: readMeText };
    setSchemaFormData({ ..._schemaFormData });
  };

  const getType = (type: any) => {
    dispatch(GetTypeByProviderAPI(null, { ValueType: type }));
  };

  const handleProviderSelect = (e: any) => {
    if (e.event) {
      let _res = providerList.find((item: any) => item.id === e.value);
      getType(_res?.Type);
      if (_res?.Type === "mysql") {
        setSchemaFormData({ ...schemaFormData, Columns: DefaultSQLColumns });
      } else if (_res?.Type === "postgres") {
        setSchemaFormData({ ...schemaFormData, Columns: DefaultPostgresColumns });
      } else if (_res?.Type === "mongodb") {
        setSchemaFormData({ ...schemaFormData, Columns: DefaultMongodbColumns });
      }
    }
  };

  const onSelectionChanged = (args: any) => {
    if (args.name === "selectedIndex") {
      setSelectedIndex(args.value);
    }
  };
  const [isOpen, setIsOpen] = useState(false);
  const onHiding = () => { };
  const onValueChange = (e: any) => {
    setAssignForApproval(e);
  };
  const onNoClick = (e: any) => {
    setIsOpen(false);
    setAssignForApproval("");
    setAssignForApproval("");
  };

  // const onLakeHouseClick = async () => {
  //   const payload = {
  //     SchemaId: id,
  //     ...payloadForLakeHouse
  //   }
  //   const result: any = await dispatch(AryaLakehouseIntegration(payload));
  // }

  const onFieldDataChanged = () => {
    setSchemaFormData({ ...schemaFormData });
    const sItem = {
      ...selectedItemId,
      isDirty: true,
      Data: schemaFormData,
      text: schemaFormData.DisplayName
        ? schemaFormData.DisplayName
        : "Add New Schema",
    };
    dispatch(setSelectedItemId(sItem));
    const updatedItems =
      selectedItems?.map((item: any) => {
        if (item.id === sItem.id) {
          return { ...item, ...sItem };
        }
        return item;
      }) || [];
    dispatch(SelectedItems([...updatedItems]));
  };

  const onCancelClick = () => {
    if (isActive === false) {
      navigate("/request");
    } else {
      navigate(visibility === false ? "/schema/workflow-editor" : "/schema");
    }
  }

  return (
    <div>
      {/* ..................Tabs Section................ */}
      {id && (
        <Tabs
          dataSource={SchemaTabsDataSource}
          selectedItem={SchemaTabsDataSource[selectedIndex]}
          selectedIndex={selectedIndex}
          onOptionChanged={onSelectionChanged}
        />
      )}

      {selectedIndex === 1 && <ViewHistory schemaId={id} />}

      {/* ..................Add Edit Section................ */}
      {(selectedIndex === 0 || !id) && (
          <div className={"content-block responsive-paddings"}>
            <form action="your-action" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
              <DXForm
                stylingMode="outlined"
                formData={schemaFormData}
                validationGroup="test"
                disabled={schemaFormData.Status === "PUBLISHED" ? true : false}
                onFieldDataChanged={onFieldDataChanged}
                items={[
                  {
                    itemType: "group",
                    cssClass: "no-margin",
                    colCount: 2,
                    name: "test",
                    disabled: schemaFormData.IsLock === true ? true : false,
                    items: [
                      {
                        label: { text: "System Name", location: "top" },
                        dataField: "SystemName",
                        validationRules: [
                          {
                            type: "required",
                            message: isRequiredField("SystemName"),
                          },
                          {
                            type: "pattern",
                            pattern: regEx.validString,
                            message: isValidField(
                              "SystemName, {Special characters are not allowed}"
                            ),
                          },
                        ],
                      },
                      {
                        label: { text: "Display Name", location: "top" },
                        dataField: "DisplayName",
                        isRequired: true,
                        validationRules: [
                          {
                            type: "required",
                            message: isRequiredField("DisplayName"),
                          },
                        ],
                      },
                      {
                        label: { text: "Table Name", location: "top" },
                        dataField: "TableName",
                        isRequired: true,
                        disabled: id ? true : false,
                        validationRules: [
                          {
                            type: "required",
                            message: isRequiredField("TableName"),
                          },
                          // {
                          //   type: "pattern",
                          //   pattern: regEx.pluralString,
                          //   message: isValidField(
                          //     "TableName, {Table name should be in Plural form}"
                          //   ),
                          // },
                        ],
                      },
                      {
                        label: { text: "Provider", location: "top" },
                        dataField: "Provider",
                        isRequired: true,
                        editorType: "dxSelectBox",
                        disabled: id ? true : false,
                        editorOptions: {
                          valueExpr: "id",
                          displayExpr: "DisplayName",
                          dataSource: providerList,
                          searchEnabled: true,
                          onValueChanged: (e: any) => handleProviderSelect(e),
                        },
                      },
                      {
                        label: { text: "TableType", location: "top" },
                        dataField: "TableType",
                        editorType: "dxSelectBox",
                        disabled: id ? true : false,
                        editorOptions: {
                          dataSource: TableTypes,
                          searchEnabled: true,
                          onValueChanged: (e: any) => onTableTypeChanged(e),
                        },
                      },
                      {
                        label: { text: "Swagger URL", location: "top" },
                        dataField: "SwaggerURL",
                        visible: id ? true : false,
                        disabled: id ? true : false,
                      },
                      {
                        itemType: "group",
                        cssClass: "no-margin",
                        colCount: 2,
                        disabled: schemaFormData.IsLock === true ? true : false,
                        items: [
                          {
                            label: { text: "Is System", location: "left" },
                            dataField: "IsSystem",
                            editorType: "dxCheckBox",
                          },
                          {
                            label: { text: "Is Lock", location: "left" },
                            dataField: "IsLock",
                            editorType: "dxCheckBox",
                            visible: id ? true : false,
                            disabled: id ? true : false,
                          }
                        ],
                      },
                      {
                        label: { text: "Ref No", location: "top" },
                        dataField: "RefNo",
                        visible: id ? true : false,
                        disabled: id ? true : false,
                      },
                      {
                        label: { text: "Topic", location: "top" },
                        dataField: "Topic",
                      },
                      {
                        label: { text: "Cache TTL (Seconds)", location: "top" },
                        dataField: "CacheTTL",
                        editorType: "dxNumberBox",
                      },
                      {
                        label: { text: "Silver", location: "top" },
                        dataField: "Silver",
                        editorType: "dxTagBox",
                        editorOptions: {
                          valueExpr: "id",
                          displayExpr: "DisplayName",
                          dataSource: silverSchemasList ?? [],
                          searchEnabled: true,
                          multiline: true,
                          showSelectionControls: true,
                        },
                      },
                      {
                        label: { text: "Entity Type", location: "top" },
                        dataField: "EntityType",
                        editorType: "dxSelectBox",
                        editorOptions: {
                          dataSource: EntityTypeList,
                          searchEnabled: true,
                        },
                      },
                      // {
                      //   label: { text: "Gold", location: "top" },
                      //   dataField: "Gold",
                      //   editorType: "dxTagBox",
                      //   editorOptions: {
                      //     valueExpr: "id",
                      //     displayExpr: "DisplayName",
                      //     dataSource: goldSchemas ?? [],
                      //     searchEnabled: true,
                      //     multiline: true,
                      //     showSelectionControls: true,
                      //   }
                      // }

                      {
                        label: { text: "Default Crud" },
                        dataField: "DefaultCrud",
                        editorType: "dxTagBox",
                        disabled: schemaFormData.IsLock === true ? true : false,
                        visible: id || selectedTableType === "view" ? false : true,
                        editorOptions: {
                          dataSource: DefaultCrud,
                          multiline: true,
                          label: "DefaultCrud",
                          showSelectionControls: true,
                          searchEnabled: true,
                        },
                      },
                    ],
                  },
                  // {
                  //   itemType: "group",
                  //   cssClass: "no-margin",
                  //   colCount: 2,
                  //   disabled: schemaFormData.IsLock === true ? true : false,
                  //   visible: id || selectedTableType === "view" ? false : true,
                  //   items: [
                  //     {
                  //       label: { text: "Default Crud" },
                  //       dataField: "DefaultCrud",
                  //       editorType: "dxTagBox",
                  //       editorOptions: {
                  //         dataSource: DefaultCrud,
                  //         multiline: true,
                  //         label: "DefaultCrud",
                  //         showSelectionControls: true,
                  //         searchEnabled: true,
                  //       },
                  //     },
                  //   ],
                  // },
                  {
                    label: { text: "Description", location: "top" },
                    dataField: "Description",
                    editorType: "dxTextArea",
                    disabled: schemaFormData.IsLock === true ? true : false,
                  },
                  {
                    label: { text: "Tag", location: "top" },
                    dataField: "Tags",
                    editorType: "dxTagBox",
                    disabled: schemaFormData.IsLock === true ? true : false,
                    editorOptions: {
                      multiline: true,
                      label: "Tags",
                      showSelectionControls: true,
                      searchEnabled: true,
                      acceptCustomValue: true,
                      openOnFieldClick: false,
                      onValueChanged: handleValueChanged,
                    },
                  },
                  {
                    itemType: "group",
                    caption: "",
                    cssClass: "no-margin",
                    colCount: 1,
                    template: async (data: any, itemElement: any) => {
                      const root = createRoot(itemElement!);
                      root.render(
                        <DXAccordion title={"Elasticsearch"} defaultSelectedIndex={-1}>
                          <DXForm stylingMode="outlined"
                            formData={schemaFormData.Elasticsearch}
                            colCount={2}
                            items={[
                              {
                                label: { text: "Enable", location: "left" },
                                dataField: "enable",
                                editorType: "dxCheckBox",
                                // visible: id ? true : false,
                                // disabled: id ? true : false,
                              },
                              {
                                label: { text: "Index", location: "top" },
                                dataField: "index",
                                // visible: id ? true : false,
                                // disabled: id ? true : false,
                              },
                            ]}></DXForm>
                        </DXAccordion>
                      );
                    },
                  },
                  {
                    itemType: "group",
                    caption: "",
                    cssClass: "no-margin",
                    colCount: 1,
                    template: async (data: any, itemElement: any) => {
                      const root = createRoot(itemElement!);
                      root.render(
                        <DXAccordion title={"MiniIo"} defaultSelectedIndex={-1}>
                          <DXForm stylingMode="outlined"
                            formData={schemaFormData.Minio}
                            colCount={2}
                            items={[
                              {
                                label: { text: "Enable", location: "left" },
                                dataField: "enable",
                                editorType: "dxCheckBox",
                              },
                              {
                                label: { text: "Bucket Name", location: "top" },
                                dataField: "bucketName",
                              }
                            ]}></DXForm>
                        </DXAccordion>
                      );
                    },
                  },
                ]}
              />

              {/* ..................Add Column Section................ */}

              <AddColumn
                title={"Add Column"}
                data={schemaFormData.Columns}
                callback={onColumnDataCallback}
                isActive={isActive}
                listData={typeByProviderList}
                disable={schemaFormData.Status === "PUBLISHED" ? true : false}
              />

              {/* ..................Add Column Section................ */}

              <AddRelations
                title={"Add Relations"}
                data={schemaFormData.Relations ?? []}
                callback={onRelationsDataCallback}
                // isActive={isActive}
                ParentSchemaColumn={schemaFormData.Columns}
                disable={schemaFormData.Status === "PUBLISHED"}
              />

              {/* ..................Readme Editor Section................ */}
              <ReadMeEditor
                data={schemaFormData.Help}
                callback={onEditorCallback}
                disable={schemaFormData.Status === "PUBLISHED" ? true : false}
              />


              <div className="schemaButtons">
                {schemaFormData.Status === "PUBLISHED" && selectedUser ? false : true &&
                  <>
                    <DXButton id="schema-btn-save" type="default" visible={disableUpdateButtons} disabled={schemaFormData.IsLock} text={id ? "UPDATE" : selectedUser === true ? "SAVE AS DRAFT" : "SUBMIT"} useSubmitBehavior={true} stylingMode="contained" icon="save" validationGroup="test" />
                    <DXButton id="schema-btn-cancel" type="normal" visible={disableUpdateButtons} text='Cancel' icon="revert" stylingMode="outlined" onClick={onCancelClick} />
                    <DXButton type="default" visible={selectedUser === true} disabled={schemaFormData.Status !== IProvisioningRequestStatus.Draft || !isActive || disableSendPullRequest} text='SEND PULL REQUEST' icon="lock" stylingMode="outlined" onClick={() => setIsOpen(true)} />
                  </>
                }
              </div>
            </form>

            {/* ..................Schema Actions Grid Section................ */}
            {
              id && data && (
                <AddSchemaAction
                  isActive={isActive}
                  schemaId={schemaFormData.id}
                  visibility={visibility}
                />
              )
            }

            {/* ..................Confirmation Popup.......................  */}

            <DXPopup
              showTitle={false}
              visible={isOpen}
              title={""}
              onHiding={onHiding}
              width="300px"
              height="180px"
            >
              <span
                style={{
                  fontSize: "14px",
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "20px",
                  color: "var(--text-primary)",
                }}
              >
                Do you want to send Pull Request?
              </span>
              <DXSelect
                value={assignForApproval}
                items={moderatorList}
                onValueChange={(e: any) => onValueChange(e)}
                label={"Send For Approval"}
                displayExpr={"DisplayName"}
                valueExpr="id"
                labelMode="floating"
                searchEnabled={true}
              />
              <div className="checkoutProcessButton">
                <DXButton
                  type="default"
                  text="Yes"
                  onClick={(e: any) => handleSendForApproval(e)}
                />
                <DXButton
                  type="default"
                  text="No"
                  onClick={(e) => onNoClick(e)}
                />
              </div>
            </DXPopup>
          </div >
      )}
    </div >
  );
});
