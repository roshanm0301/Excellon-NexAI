import { CheckBox, NumberBox, TextBox } from "devextreme-react";
import DataGrid, { Column, Editing, Pager, Paging, SearchPanel } from "devextreme-react/data-grid";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { DXButton, DXForm, DXGroupButton } from "../../components/atoms";
import { regEx } from "../../components/constant/regex/regex";
import { Payload } from "../../components/molecules";
import { RuleColumnsEditor } from "../../components/molecules/ruleColumnsEditor";
import { DXPopup } from "../../components/template";
import { QueryParamsTemplate } from "../../components/template/queryParams";
import { useGlobalEditor } from "../../react";
import { getTemplateListAPI, setSelectedItemId } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { isRequiredField, isValidField } from "../../utility/utils";
import { ActionDefinition, buttonGroup } from "./action.definition";
import { IAction } from "./action.entity";
import { ActionTypeDataSource, DefaultState } from "./common.entity";
import { createBodyPropertiesArray, MethodTypeDataSource } from "./constant";

interface IActionProps {
  isTemplateView: boolean
}

export const Action = (props: IActionProps) => {
  const { isTemplateView = false } = props;
  let SchemasColumns = useAppSelector((state) => state.schema.schema);
  let SchemasDataSource = useAppSelector((state) => state.schema.schemas);
  let requestPickList = useAppSelector((state) => state.provisioningRequest.requestPickList);
  let { properties, setProperty } = useGlobalEditor();
  const dispatch = useAppDispatch();
  const [item, setItem] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isRuleFormOpen, setIsRuleFormOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [formData, setFormData] = useState({ ...ActionDefinition });
  const [rawData, setRawData] = useState({ Body: [], Params: [], Query: [], Response: [], State: [] });
  const [state, setState] = useState({
    Params: ActionDefinition.Params,
    Query: ActionDefinition.Query,
    Body: ActionDefinition.Body,
    selectedItems: [],
    responseResolverSelectedItems: [],
    Response: ActionDefinition.Response,
    State: ActionDefinition.State || []
  });
  const { selectedItemId } = useAppSelector((state) => state.schema)
  const { templates } = useAppSelector((state) => state.template);
  const [stateData, setStateData] = useState<any>([])
  const { typeByProviderList } = useAppSelector((state) => state.provider);
  let { subscriptionListByIdentity } = useAppSelector((state) => state.subscription);
  let { config } = useAppSelector((state) => state.auth);
  const formDataRef = useRef(formData);

  useEffect(() => {
    dispatch(getTemplateListAPI({}))
  }, [])

  // Helper: merge body-derived columns with State columns.
  // If a column name exists in both, State wins (overrides Body).
  const mergeBodyAndState = (bodyProps: any[], stateProps: any[]) => {
    const stateNames = new Set(stateProps.map((s: any) => s.name?.trim()?.toLowerCase()));
    const filteredBody = bodyProps.filter((b: any) => !stateNames.has(b.name?.trim()?.toLowerCase()));
    return [...filteredBody, ...stateProps, ...DefaultState];
  };

  // Listen for LLM rule-column updates dispatched from onSetRuleColumns callback.
  // This directly persists via setProperty â€” the same reliable path used by the manual
  // Rule Settings UI â€” without triggering designer destroy/recreate.
  useEffect(() => {
    const handler = (e: Event) => {
      const { columns } = (e as CustomEvent).detail as { columns: any[] };
      if (!columns || !Array.isArray(columns)) return;

      // Read the CURRENT full globalSettings from the designer context (not stale formData)
      const currentAction = (properties?.globalSettings || {}) as Record<string, any>;

      // Combine body-derived columns with the new custom columns for DataGrid display
      const bodyProps = createBodyPropertiesArray(currentAction?.Body) || [];
      // columns from LLM are already non-predefined (filtered in onSetRuleColumns callback)
      // State columns override Body columns with the same name
      const combinedForDisplay = mergeBodyAndState(bodyProps, columns);
      setStateData(combinedForDisplay);

      // Build the updated globalSettings â€” State stores ONLY custom columns
      const updatedGlobalSettings = {
        ...currentAction,
        State: columns,
      };
      setFormData((prev) => ({ ...prev, ...updatedGlobalSettings, State: columns }));

      // Persist through the designer's global editor wrapper (mutates definition in-place)
      skipNextEffectRef.current = true;
      setProperty('globalSettings', updatedGlobalSettings);
    };
    window.addEventListener('llm-rule-columns-update', handler);
    return () => window.removeEventListener('llm-rule-columns-update', handler);
  }, [properties, setProperty]);

  // Keep formDataRef in sync for use inside DXForm templates (avoids stale closures)
  useEffect(() => { formDataRef.current = formData; }, [formData]);

  // Track whether formData change came from our own setProperty (to avoid echo loop)
  const skipNextEffectRef = useRef(false);

  useEffect(() => {
    if (skipNextEffectRef.current) {
      skipNextEffectRef.current = false;
      return;
    }
    const action = properties?.globalSettings as IAction;
    if (action) {
      const bodyProps = createBodyPropertiesArray(action?.Body) || [];
      const stateProps = action.State || [];
      // DataGrid shows combined view: State overrides Body when names match
      const combinedForDisplay = mergeBodyAndState(bodyProps, stateProps);

      setFormData({
        ...action,
        Cache: action.Cache || { Enabled: false, TTL: 0, Headers: [] },
        DLQ: action.DLQ || { Enabled: false, Topic: "" },
        State: stateProps
      });
      setState((prev) => ({
        ...prev,
        Params: action.Params || {},
        Query: action.Query || {},
        Body: action.Body || {},
        Response: action.Response || {},
        State: stateProps,
        Cache: action.Cache || { Enabled: false, TTL: 0, Headers: [] },
        DLQ: action.DLQ || { Enabled: false, Topic: "" },
      }));
      setStateData(combinedForDisplay);
    }
  }, [properties?.globalSettings]);

  const onCallback = (payload: any, convertedPayload: any) => {
    setState({ ...state, Params: convertedPayload });
    setFormData((prev: any) => {
      const _formData: any = { ...prev, [item]: convertedPayload };
      const _rawData: any = { ...rawData, [item]: payload };
      setRawData({ ..._rawData });
      skipNextEffectRef.current = true;
      setProperty("globalSettings", _formData);
      return _formData;
    });
  };

  const onFormDataChange = (e: any) => {
    // Only respond to user-initiated field changes (has e.dataField)
    if (!e.dataField) return;

    const _formData = e.component.option("formData");
    // Preserve State, Cache, DLQ â€” these are managed outside the DXForm (via DataGrid/custom UI)
    // and e.component.option("formData") doesn't include them
    setFormData((prev: any) => {
      const globalSettings = {
        ...prev,
        ..._formData,
        State: prev?.State,
        Cache: prev?.Cache,
        DLQ: prev?.DLQ,
      };
      skipNextEffectRef.current = true;
      setProperty("globalSettings", globalSettings);
      dispatch(setSelectedItemId({ ...selectedItemId, isDirty: true }));
      return globalSettings;
    });
  };

  const onChangeJSONEditor = (incoming: any) => {
    setState((prev) => ({ ...prev, ...incoming }));
    const bodyProps = createBodyPropertiesArray(incoming?.Body ?? formData?.Body) || [];
    const bodyNames = new Set(bodyProps.map((b: any) => b.name?.trim()?.toLowerCase()));

    // Remove Body-derived State columns whose Body property no longer exists
    // Keep all non-Body columns (custom ones) + Body columns that still exist
    const existingState = formData?.State || [];
    const cleanedState = existingState.filter((s: any) => {
      if (s.IsPredefineColumn) {
        // Body-derived column: keep only if Body still has this property
        return bodyNames.has(s.name?.trim()?.toLowerCase());
      }
      return true; // Always keep custom columns
    });

    // State columns override Body columns with the same name
    const combinedForDisplay = mergeBodyAndState(bodyProps, cleanedState);
    setStateData(combinedForDisplay);
    const _formData = {
      ...formData,
      Params: incoming?.Params ?? formData?.Params ?? {},
      Query: incoming?.Query ?? formData?.Query ?? {},
      Body: incoming?.Body ?? formData?.Body ?? {},
      Response: incoming?.Response ?? formData?.Response ?? {},
      State: cleanedState
    };
    skipNextEffectRef.current = true;
    setProperty("globalSettings", _formData);
    setFormData(_formData);
  };

  function onItemClick(e: any) {
    e.event.preventDefault();
    setItem(e?.itemData?.title);
    setIsOpen(true);
  }

  useEffect(() => {
    let m_pos: any;
    function resize(e: any) {
      var parent = resize_el.parentNode;
      var dx = m_pos - e.x;
      m_pos = e.x;
      parent.style.width =
        parseInt(getComputedStyle(parent, "").width) + dx + "px";
    }

    let resize_el: any = document.getElementById("resize");
    resize_el.addEventListener(
      "mousedown",
      function (e: any) {
        m_pos = e.x;
        document.addEventListener("mousemove", resize, false);
      },
      false
    );
    document.addEventListener(
      "mouseup",
      function () {
        document.removeEventListener("mousemove", resize, false);
      },
      false
    );

    return () => {
      document.removeEventListener("mousemove", resize, false);
    };
  }, []);

  const onClose = () => {
    setIsOpen(false);
  };

  const onSaveRuleColumns = (items: any[]) => {
    // DataGrid shows the full combined array
    setStateData(items);
    // Save ALL columns (including Body-derived) to State
    const _formData = { ...formData, State: items || [] };
    setFormData(_formData);
    skipNextEffectRef.current = true;
    setProperty("globalSettings", _formData);
  };

  const onAddNewRuleColumn = () => {
    setSelectedRow(null);
    setIsRuleFormOpen(true);
  };

  const onEditRuleColumn = (e: any) => {
    setSelectedRow(e.data);
    setIsRuleFormOpen(true);
  };

  const onCloseRuleForm = () => {
    setIsRuleFormOpen(false);
    setSelectedRow(null);
  };

  const onPayloadCallback = (payload: any) => {
    const updatedFormData = {
      ...formData,
      Cache: { ...(formData?.Cache || {}), Headers: payload }
    };
    setFormData(updatedFormData);
    skipNextEffectRef.current = true;
    setProperty("globalSettings", updatedFormData);
  };

  const onEnableChange = (e: any, name: 'Cache' | 'DLQ') => {
    const updatedFormData = {
      ...formData,
      [name]: { ...formData[name], Enabled: e.value }
    };
    setFormData(updatedFormData);
    skipNextEffectRef.current = true;
    setProperty("globalSettings", updatedFormData);
  };


  const onValueChange = (e: any, name: 'Cache' | 'DLQ', field: 'TTL' | 'Topic') => {
    const updatedFormData = {
      ...formData,
      [name]: { ...formData[name], [field]: e }
    };
    setFormData(updatedFormData);
    skipNextEffectRef.current = true;
    setProperty("globalSettings", updatedFormData);
  };
  // Global settings for action work flow...

  return (
    <div className="responsive-paddings">
      <DXForm
        formData={formData}
        onFieldDataChanged={onFormDataChange}
        scrollingEnabled={false}
        stylingMode="outlined"
        items={[
          {
            itemType: "group",
            caption: "API End Point Settings",
            colCount: 1,
            items: [
              {
                label: { text: "Template" },
                dataField: "Template",
                editorType: "dxSelectBox",
                isRequired: false,
                visible: !isTemplateView,
                editorOptions: {
                  dataSource: templates,
                  displayExpr: "DisplayName",
                  valueExpr: "id",
                  searchEnabled: true
                },
              },
              {
                label: { text: "Type" },
                dataField: "Type",
                editorType: "dxTagBox",
                visible: !isTemplateView,
                editorOptions: {
                  searchEnabled: true,
                  showSelectionControls: true,
                  dataSource: Object.values(ActionTypeDataSource),
                },
              },
              {
                label: { text: "Type of Action" },
                dataField: "ActionType",
                editorType: "dxSelectBox",
                isRequired: true,
                visible: !isTemplateView,
                editorOptions: {
                  dataSource: requestPickList,
                  displayExpr: "DisplayName",
                  valueExpr: "ValueCode",
                  searchEnabled: true
                },
              },
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
                    message: isValidField("SystemName"),
                  },
                ],
              },
              {
                label: { text: "Display Name" },
                dataField: "DisplayName",
              },
              {
                label: { text: "Parent Schema" },
                dataField: "ParentSchemaId",
                editorType: "dxSelectBox",
                visible: !isTemplateView,
                editorOptions: {
                  dataSource: SchemasDataSource,
                  displayExpr: "SystemName",
                  valueExpr: "id",
                  searchEnabled: true
                },
              },
              {
                label: { text: "Method" },
                dataField: "Method",
                isRequired: true,
                editorType: "dxSelectBox",
                visible: !isTemplateView,
                editorOptions: {
                  searchEnabled: true,
                  dataSource: Object.values(MethodTypeDataSource),
                },
              },
              {
                label: { text: "Routing", location: "left" },
                dataField: "Routing",
                editorType: "dxCheckBox",
                visible: !isTemplateView,
              },

              {
                itemType: "group",
                caption: "",
                cssClass: "no-margin",
                visible: !isTemplateView,
                colCount: 1,
                items: [
                  {
                    template: (data: any, itemElement: any) => {
                      const root = createRoot(itemElement!);
                      root.render(
                        <div className="workflow-inline-setting">
                          <label className="workflow-inline-setting__label">Cache :</label>
                          <div className="workflow-inline-setting__group">
                            <label>Enable</label>
                            <CheckBox
                              value={formData.Cache.Enabled}
                              onValueChanged={(e: any) => onEnableChange(e, 'Cache')}
                            />
                          </div>

                          {formData?.Cache?.Enabled &&
                            <div className="workflow-inline-setting__extended">
                              <label>TTL:</label>
                              <NumberBox
                                value={formData.Cache.TTL}
                                min={1}
                                stylingMode="outlined"
                                onValueChange={(e) => onValueChange(e, 'Cache', 'TTL')}
                              />
                            </div>
                          }
                        </div>
                      );
                    }
                  },
                ]
              },
              {
                itemType: "group",
                caption: "",
                cssClass: "no-margin",
                colCount: 1,
                visible: !isTemplateView,
                items: [
                  {
                    template: (data: any, itemElement: any) => {
                      const root = createRoot(itemElement!);
                      root.render(
                        <div className="workflow-inline-setting">
                          <label className="workflow-inline-setting__label">DLQ :</label>
                          <div className="workflow-inline-setting__group">
                            <label>Enable</label>
                            <CheckBox
                              value={formData.DLQ.Enabled}
                              onValueChanged={(e: any) => onEnableChange(e, 'DLQ')}
                            />
                          </div>

                          {formData?.DLQ?.Enabled &&
                            <div className="workflow-inline-setting__extended">
                              <label>Topic:</label>
                              <TextBox
                                value={formData.DLQ.Topic}
                                stylingMode="outlined"
                                onValueChange={(e) => onValueChange(e, 'DLQ', 'Topic')}
                              />
                            </div>
                          }
                        </div>
                      );
                    }
                  },
                ]
              },
              {
                label: { text: "Topic" },
                dataField: "Topic",
                visible: !isTemplateView,
              },
              {
                itemType: "group",
                caption: "", //Params // Query // Body
                cssClass: "no-margin",
                colCount: 1,
                visible: !isTemplateView,
                template: async (data: any, itemElement: any) => {
                  const root = createRoot(itemElement!);
                  root.render(
                    <DXGroupButton
                      items={buttonGroup}
                      keyExpr="title"
                      onItemClick={(e: any) => {
                        onItemClick(e);
                      }}
                    />
                  );
                },
              },
              {
                itemType: "group",
                caption: "",
                cssClass: "no-margin",
                colCount: 1,
                visible: formData?.Cache?.Enabled === true,
                template: (data: any, itemElement: any) => {
                  const root = createRoot(itemElement!);
                  root.render(
                    <Payload
                      title={'Headers'}
                      isCallFromResolver={false}
                      data={formData?.Cache?.Headers}
                      callback={(payload: any) => onPayloadCallback(payload)}
                    />
                  );
                },
              },
            ],
          },
        ]}
      />

      {isOpen && (
        <DXPopup onHiding={onClose} title={item} visible={isOpen} width={item === "Rule Setting" ? "80%" : "60%"} height={"90%"}>
          <>
            {item === "Params" && (
              <QueryParamsTemplate
                item={item}
                jsonData={state.Params}
                columns={SchemasColumns?.Columns}
                data={rawData.Params}
                avjCallback={onCallback}
                callback={onChangeJSONEditor}
              />
            )}

            {item === "Body" && (
              <QueryParamsTemplate
                item={item}
                jsonData={state.Body}
                columns={SchemasColumns?.Columns}
                data={rawData.Body}
                avjCallback={onCallback}
                callback={onChangeJSONEditor}
              />
            )}

            {item === "Query" && (
              <QueryParamsTemplate
                item={item}
                jsonData={state.Query}
                columns={SchemasColumns?.Columns}
                data={rawData.Query}
                avjCallback={onCallback}
                callback={onChangeJSONEditor}
              />
            )}

            {item === "Response" && (
              <QueryParamsTemplate
                item={item}
                jsonData={state.Response}
                columns={SchemasColumns?.Columns}
                data={rawData.Response}
                avjCallback={onCallback}
                callback={onChangeJSONEditor}
              />
            )}
          </>
        </DXPopup>
      )}

      {!isTemplateView && <div className="workflow-rule-section">
        <div className="workflow-rule-header">
          <h4>Rule Settings</h4>
          <DXButton
            text="Add New Column"
            icon="add"
            onClick={onAddNewRuleColumn}
            type="default"
          />
        </div>

        <DataGrid
          dataSource={stateData}
          keyExpr="id"
          showBorders
          hoverStateEnabled
          onRowClick={onEditRuleColumn}
          height="400px"
          onRowRemoving={(e: any) => {
            if (e?.data?.IsPredefineColumn) {
              e.cancel = true;
            }
          }}
          onRowRemoved={(e: any) => {
            const next = stateData?.filter(
              (p: any) => p.id !== e.data.id
            );
            setStateData(next);
            onSaveRuleColumns(next);
          }}
        >
          <SearchPanel
            visible
            width={240}
            searchVisibleColumnsOnly
            placeholder="Search..."
          />

          <Editing
            allowDeleting={(e: any) => !e.row?.data?.IsPredefineColumn}
            mode="row"
          />

          <Column dataField="name" caption="Column name" />
          <Column dataField="path" caption="Path" />
          <Column dataField="SourceType" caption="Type" />

          <Paging defaultPageSize={5} />
          <Pager
            visible
            showPageSizeSelector
            allowedPageSizes={[5, 10]}
            showInfo
            showNavigationButtons
          />
        </DataGrid>
      </div>}

      {isRuleFormOpen && (
        <DXPopup
          onHiding={onCloseRuleForm}
          title={selectedRow ? "Edit Column" : "Add New Column"}
          visible={isRuleFormOpen}
          width="90%"
          height="90%"
        >
          <RuleColumnsEditor
            value={stateData}
            title={"Rule Setting"}
            callback={(items: any[]) => {
              onSaveRuleColumns(items);
            }}
            DataTypeList={typeByProviderList}
            SubscriptionList={subscriptionListByIdentity}
            config={config}
            selectedRow={selectedRow}
            onCloseForm={onCloseRuleForm}
            isFormMode={true}
          />
        </DXPopup>
      )}
    </div>
  );
}
