/* eslint-disable react-hooks/exhaustive-deps */
import { memo, useEffect, useState } from "react";
import { Provider as StoreProvider, useSelector } from "react-redux";
// Don't import from npm package use it from internal peer project.
// import { Definition, ObjectCloner, Step, StepsConfiguration, ToolboxConfiguration } from 'sequential-workflow-designer';
import { Tabs } from "devextreme-react";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 } from "uuid";
import {
  ActionDefinition,
  BranchDefinition,
  CustomIconButtons,
  GlobalEditor,
  IAction,
  IActionWorkFlowProps,
  StepEditor,
  TabsDataSource,
  WorkFlowModes,
  createTask,
  createTaskWithBranches,
} from ".";
// Task traversal utilities for nth-level nested task operations
import { DXButton, DXSelect, ReactJsonEditor } from "../../components/atoms";
import { DXPopupForDefinition } from "../../components/atoms/popup/popup";
import { regEx } from "../../components/constant/regex/regex";
import {
  Definition,
  ObjectCloner,
  StepsConfiguration,
  ToolboxConfiguration,
} from "../../designer";
import {
  SequentialWorkflowDesigner,
  WrappedDefinition,
  wrapDefinition,
} from "../../react";
import {
  SchemaActionList,
  SelectedItems,
  addActionAPI,
  addApprovalAPI,
  addTemplateAPI,
  getModerateListAPI,
  getSchemaAPI,
  getSchemaListAPI,
  requestTypePickList,
  setSelectedItemId,
  showNotification,
  updateActionAPI,
  updateRequestAPI,
  updateTemplateAPI
} from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { RootState, store } from "../../store/store";
import { copyName, setLocalData, toCopyBranches } from "../../utility/utils";
import { defaultStateForActionType } from "../request";
import { EntityType, requestType } from "../schema";
import { ViewHistory } from "../schema/viewHistory";
import { StepConfig } from "./editor/steps.configuration";
import {
  TaskInfo,
  addTask as addTaskToLocation,
  deleteTaskById,
  findTaskByEngineId,
  findTaskById,
  listAllTasks,
  updateTaskProperties,
  updateTaskProperty,
} from "./editor/taskTraversal";
import { ToolboxConfig } from "./editor/toolbox.configuration";
import {
  IEntityStatus,
  IProvisioningRequestStatus,
  IRequestCrud,
  Task,
  execSteps,
  execTasks,
} from "./rule";

import { PostWithAuthAndSubscription } from "../../api";
import { DXPopup } from "../../components/template";
import { ControlBoxButtons } from "../../designer/control-bar/control-bar";
import "../../designer/css/designer-dark.css";
import "../../designer/css/designer-light.css";
import "../../designer/css/designer.css";
import "./action.workflow.scss";
import { createBodyPropertiesArray } from "./constant";
// AI Assistant
import { WorkflowAssistantDemo } from "../../assistant/a2ui";
import { AiAutoFillProvider } from "../../assistant/a2ui/components/AiTaskFillButton";
import { DisplayDescription } from "../../assistant/a2ui/components/WorkflowAssistantDemo/DisplayDescription";
import { useTheme } from "../../contexts/ThemeContext";

const toolboxConfiguration: ToolboxConfiguration = ToolboxConfig;
const stepsConfiguration: StepsConfiguration = StepConfig;

export const ActionWorkFlow = memo((props: IActionWorkFlowProps) => {
  const {
    SchemaId,
    id,
    actionByIdData,
    entityType = "",
    disableToolBox,
    workflowMode,
    handleTreeViewContextMenu,
    isTemplateView
  } = props;


  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isDark } = useTheme();
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [actionDefinition, setActionDefinition] = useState({});
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [history, showHistory] = useState(false);
  const [provisioningDocumentId, setProvisioningDocumentId] = useState("");
  const [assignForApproval, setAssignForApproval] = useState("");
  let { moderatorList, navigationList } = useAppSelector((state) => state.role);
  let { config } = useAppSelector((state) => state.auth);

  const { selectedItems, selectedItemId } = useAppSelector(
    (state) => state.schema
  );
  const [sendPullRequestOpen, setIsSendPullRequestOpen] = useState(false);

  const onHiding = () => { };
  const onValueChange = (e: any) => {
    setAssignForApproval(e);
  };

  const onNoClick = (e: any) => {
    setIsSendPullRequestOpen(false);
    setAssignForApproval("");
  };

  let { selectedSubscription } = useAppSelector((state) => state.subscription);
  const selectedUser = useSelector(
    (state: RootState) => state.auth.selectedUser
  );

  console.log("actionDefinition",actionDefinition)

  const startDefinition: Definition = {
    properties: {
      globalSettings: {
        ...ActionDefinition,
        ParentSchemaId: SchemaId || '',
      },
    },
    sequence: [
      createTask("Resolver", "Resolver", {}),
      createTask("Response", "Response", {}),
    ],
  };

  const [definition, setDefinition] = useState(() =>
    wrapDefinition(startDefinition)
  );

  useEffect(() => {
    toolboxConfiguration.isHidden = disableToolBox;
    CustomIconButtons.Save = disableToolBox;
    CustomIconButtons.SendPullRequest = disableToolBox;
    CustomIconButtons.Clear = disableToolBox;
    CustomIconButtons.Reload = disableToolBox;
    CustomIconButtons.ViewDefinition = disableToolBox;
    CustomIconButtons.CloneWorkFlow = disableToolBox;
    CustomIconButtons.CloneTask = disableToolBox;
    CustomIconButtons.ViewHistory = disableToolBox;
    CustomIconButtons.PasteTask = disableToolBox;
    CustomIconButtons.CopyToClipboard = disableToolBox;
  }, []);

  useEffect(() => {
    dispatch(getSchemaListAPI(null));
    if (SchemaId && SchemaId !== "null") {
      dispatch(getSchemaAPI(SchemaId));
      let params = { SchemaId: SchemaId, id: id };
      setLocalData("params", params);
    }
  }, []);

  useEffect(() => {
    if (defaultStateForActionType) {
      dispatch(requestTypePickList({ ...defaultStateForActionType }));
    }
  }, []);

  useEffect(() => {
    if (selectedUser) {
      if (
        (actionByIdData?.Status === "PUBLISHED" &&
          workflowMode === WorkFlowModes.EDIT_ACTION) ||
        location.pathname.includes("/schema/edit-action")
      ) {
        CustomIconButtons.Save = true;
        CustomIconButtons.SendPullRequest = true;
        CustomIconButtons.CloneTask = true;
      }
      if (
        workflowMode === WorkFlowModes.ADD_ACTION ||
        location.pathname.includes("/schema/add-action")
      ) {
        CustomIconButtons.SendPullRequest = true;
        CustomIconButtons.ViewHistory = true;
      }
      if (
        workflowMode === WorkFlowModes.CLONE_ACTION ||
        location.pathname.includes("/schema/clone-action")
      ) {
        CustomIconButtons.Save = false;
        CustomIconButtons.SendPullRequest = true;
        CustomIconButtons.Clear = false;
        CustomIconButtons.Reload = false;
        CustomIconButtons.ViewDefinition = false;
        CustomIconButtons.CloneWorkFlow = true;
        CustomIconButtons.CloneTask = false;
        CustomIconButtons.ViewHistory = true;
      }
      if (
        location.pathname.includes("/request/view-request/schema/edit-action")
      ) {
        let _provisioningDocumentId: any = JSON.parse(
          localStorage.getItem("ProvisioningDocumentId") || ""
        );
        setProvisioningDocumentId(_provisioningDocumentId);
        CustomIconButtons.Save = false;
        CustomIconButtons.SendPullRequest = true;
        CustomIconButtons.Clear = false;
        CustomIconButtons.Reload = false;
        CustomIconButtons.ViewDefinition = false;
        CustomIconButtons.CloneWorkFlow = false;
        CustomIconButtons.CloneTask = false;
        CustomIconButtons.ViewHistory = true;
        CustomIconButtons.PasteTask = false;
        CustomIconButtons.CopyToClipboard = false;
      }

      if (
        actionByIdData?.Status === "DRAFT" &&
        (workflowMode === WorkFlowModes.EDIT_ACTION ||
          location.pathname.includes("/schema/edit-action"))
      ) {
        CustomIconButtons.Save = false;
        CustomIconButtons.SendPullRequest = false;
        CustomIconButtons.Clear = false;
        CustomIconButtons.Reload = false;
        CustomIconButtons.ViewDefinition = false;
        CustomIconButtons.CloneWorkFlow = false;
        CustomIconButtons.CloneTask = false;
        CustomIconButtons.ViewHistory = false;
        CustomIconButtons.PasteTask = false;
        CustomIconButtons.CopyToClipboard = false;
      }
      if (isTemplateView) {
        CustomIconButtons.SendPullRequest = true;
        CustomIconButtons.ViewHistory = true;
      }
    } else {
      if (
        workflowMode === WorkFlowModes.ADD_ACTION ||
        location.pathname.includes("/schema/add-action")
      ) {
        CustomIconButtons.ViewHistory = true;
      }
      CustomIconButtons.SendPullRequest = true;
    }
  }, [workflowMode, actionByIdData]);

  // Keep actionDefinition in sync with workflow definition changes
  useEffect(() => {
    if (definition.value) {
      const syncActionDefinition = async () => {
        const tasks: Task[] = await execTasks(definition.value.sequence);
        const synced: any = {
          ...(ActionDefinition as IAction),
          ...(definition.value.properties.globalSettings as Object),
          Tasks: tasks,
        };
        delete synced.PartitionKey;
        setActionDefinition({ ...synced });
      };
      syncActionDefinition();
    }
  }, [definition.value]);

  useEffect(() => {
    if (actionByIdData && (SchemaId || isTemplateView)) {
      getActionById();
    } else if (!actionByIdData) {
      setDefinition(wrapDefinition(startDefinition));
    }
  }, [SchemaId, actionByIdData, isTemplateView]);

  const getActionById = () => {
    let workflowDefinition: any = {
      properties: {
        globalSettings: {
          ...actionByIdData,
        },
      },
      sequence: [],
    };

    // Convert task to step
    const sequence = execSteps(actionByIdData?.Tasks || []);
    workflowDefinition.sequence = sequence;

    delete workflowDefinition?.properties?.globalSettings?.Tasks;
    // First Time data binding issue.
    setTimeout(() => {
      setDefinition(wrapDefinition(workflowDefinition));
    }, 100);

    if (location.pathname.includes("/schema/workflow-editor")) {
      updateData();
    }
  };

  const updateData = () => {
    setTimeout(() => {
      if (selectedItemId?.Data === null) {
        setDefinition(wrapDefinition(startDefinition));
      } else {
        const sItem = { ...selectedItemId, onLoad: false, isDelete: false };
        const updatedItems =
          selectedItems?.map((item: any) => {
            if (item.id === sItem.id) {
              return { ...item, ...sItem };
            }
            return item;
          }) || [];

        dispatch(setSelectedItemId(sItem));
        dispatch(SelectedItems([...updatedItems]));
      }
    }, 1000);
  };
  const handleOpenPopup = () => {
    setIsOpen(!isOpen);
  };

  const handleClosePopup = () => {
    setIsOpen(false);
    showHistory(false);
  };

  const onSelectionChanged = (args: any) => {
    if (args.name === "selectedIndex") {
      setSelectedIndex(args.value);
      saveWorkflow(false, "selectionChange");
    }
  };

  const reloadDefinitionClicked = (definition: Definition) => {
    const newDefinition = ObjectCloner.deepClone(definition);
    setDefinition(wrapDefinition(newDefinition));
    if (SchemaId && id) getActionById();
    let item = { ...selectedItemId, isDirty: false };
    handleTreeViewContextMenu(item);
  };

  const clearData = () => {
    setDefinition(wrapDefinition(startDefinition));
    let item = { ...selectedItemId, isDirty: false };
    handleTreeViewContextMenu(item);
  };

  useEffect(() => {
    GetModerateListAPI();
  }, [selectedSubscription]);

  const GetModerateListAPI = async () => {
    let request = { SubscriptionId: selectedSubscription?.id };
    dispatch(getModerateListAPI(request));
  };
  const handleSendForApproval = () => {
    setIsSendPullRequestOpen(true);
    if (assignForApproval)
      saveWorkflow(true, IProvisioningRequestStatus.PendingForApproval);
  };

  const saveWorkflow = async (isConfirmed: Boolean = false, e: any) => {
    let tasks: Task[] = await execTasks(definition.value.sequence);


    let _actionDefinition: any = {
      ...(ActionDefinition as IAction),
      ...(definition.value.properties.globalSettings as Object),
      Tasks: tasks,
      workflowDefinition: definition.value,
    };


    // 1. Extract active rules from current tasks
    const activeRules = tasks
      .flatMap((task: any) => task.payload || [])
      .filter((item: any) => item.Type === "Rule" && item.Rule)
      .map((item: any) => ({
        RuleId: item.Rule,
        IsActive: true,
        IsDeleted: false,
        ActionName: _actionDefinition.SystemName,
        ActionId: _actionDefinition?.id
      }));

    // 2. Extract previous rule IDs from old actionByIdData
    const previousRules = (actionByIdData?.Tasks || [])
      .flatMap((task: any) => task?.payload || [])
      .filter((item: any) => item.Type === "Rule" && item.Rule)
      .map((item: any) => item.Rule);

    // 3. Compare with new rules to find deleted ones
    const newRuleIds = activeRules?.map(rule => rule.RuleId);

    const deletedRules = previousRules
      .filter((prevRuleId: any) => !newRuleIds?.includes(prevRuleId))
      .map((ruleId: any) => ({
        RuleId: ruleId,
        IsActive: false,
        IsDeleted: true,
        ActionName: _actionDefinition.SystemName,
        ActionId: _actionDefinition?.id
      }));

    // 4. Combine both active and deleted rules
    const ruleArray = [...activeRules, ...deletedRules];


    // 5. Optional: fetch existing mappings (not used here)
    // await Post(`${config.BASE_URL}ActionRuleMapping/RuleMappingList`, {});

    // 6. Send to API
    if (ruleArray?.length > 0) {
      await PostWithAuthAndSubscription(
        `${config.BASE_URL}ActionRuleMapping/Upsert`,
        { RuleMapping: ruleArray },
        {
          headers: {
            subscription: selectedSubscription?.id,
          }
        }
      );
    }

    delete _actionDefinition.PartitionKey;
    delete _actionDefinition.workflowDefinition;
    setActionDefinition({ ..._actionDefinition });

    if (e === "selectionChange") {
      setActionDefinition({ ..._actionDefinition });
    } else {
      if (
        workflowMode === WorkFlowModes.CLONE_ACTION ||
        location.pathname.includes("/schema/clone-action/")
      ) {
        delete _actionDefinition.id;
        delete _actionDefinition._id;
        delete _actionDefinition.id;
        delete _actionDefinition.PartitionKey;
        delete _actionDefinition.workflowDefinition;
        const result: any = await dispatch(addActionAPI(_actionDefinition));
        if (result?.success === true) {
          if (location.pathname.includes("/schema/workflow-editor")) {
            let item = {
              ...selectedItemId,
              isDirty: false,
              isCloneAction: false,
              Data: result?.data,
            };
            dispatch(SchemaActionList());
            handleTreeViewContextMenu(item);
          } else {
            navigate(
              `/schema/edit-action/${result.data.ParentSchemaId}/${result.data.id}`
            );
          }
        } else {
          dispatch(
            showNotification({
              isOpen: true,
              message: result?.data,
              type: "error",
            })
          );
        }

        // Contributor mode
      } else if (selectedUser) {
        if (e !== IProvisioningRequestStatus.PendingForApproval) {
          //cancelled by user
          if (location.pathname.includes("/request/view-request/edit-action")) {
            addUpdateActionInContributorMode(
              IProvisioningRequestStatus.CancelledByUser,
              _actionDefinition
            );

            // save as draft
          } else {
            addUpdateActionInContributorMode(
              IProvisioningRequestStatus.Draft,
              _actionDefinition
            );
          }

          // Send Pull request
        } else {
          addUpdateActionInContributorMode(
            IProvisioningRequestStatus.PendingForApproval,
            _actionDefinition
          );
        }

        // Dev mode
      } else {
        if (isConfirmed) {
          addUpdateAction(_actionDefinition, IEntityStatus.Published);
        }
      }
    }
  };

  const saveTemplate = async () => {
    let tasks: Task[] = await execTasks(definition.value.sequence);


    let _actionDefinition: any = {
      ...(ActionDefinition as IAction),
      ...(definition.value.properties.globalSettings as Object),
      Tasks: tasks,
      workflowDefinition: definition.value,
    };

    delete _actionDefinition.id;
    delete _actionDefinition._id;
    delete _actionDefinition.id;
    delete _actionDefinition.PartitionKey;
    delete _actionDefinition.workflowDefinition;
    delete _actionDefinition.ActionType
    delete _actionDefinition.Body
    delete _actionDefinition.Cache
    delete _actionDefinition.DLQ
    delete _actionDefinition.Method
    delete _actionDefinition.Params
    delete _actionDefinition.ParentSchemaId
    delete _actionDefinition.Query
    delete _actionDefinition.Routing
    delete _actionDefinition.Topic

    let result: any
    if (id) {
      result = await dispatch(
        updateTemplateAPI(id, _actionDefinition)
      );
    } else {
      result = await dispatch(addTemplateAPI(_actionDefinition));
    }
    if (result?.data) {
      navigate("/template")
    }
  }

  const addUpdateActionInContributorMode = async (
    status: any,
    actionDefinitionData: any
  ) => {
    let payload = {
      Entity: actionDefinitionData,
      Status: status,
      RequestType: SchemaId && id ? IRequestCrud.Update : IRequestCrud.Create,
      EntityType: EntityType.Action,
      AssignForApproval: assignForApproval,
      Type: requestType.PullRequest,
    };

    // save as draft flow while add or edit action
    if (status === IProvisioningRequestStatus.Draft) {
      addUpdateAction(actionDefinitionData, IEntityStatus.Draft);

      // cancelled by user flow in request component while editing action
    } else if (status === IProvisioningRequestStatus.CancelledByUser) {
      cancelledByUser(actionDefinitionData, payload);

      // send pull request flow
    } else {
      execPullRequestMode(payload);
    }
  };

  const cancelledByUser = async (actionDefinitionData: any, payload: any) => {
    let result: any = null;

    if (SchemaId && id) {
      result = await dispatch(
        updateActionAPI(actionDefinitionData, SchemaId, id)
      );
      if (result.success) {
        dispatch(updateRequestAPI(provisioningDocumentId, payload));
        navigate("/request");
      }
    } else {
      actionDefinitionData.Status = IEntityStatus.Draft;
      result = await dispatch(addActionAPI(actionDefinitionData));
      if (result.success) {
        result = await dispatch(addApprovalAPI(payload));
        if (result.success) {
          navigate(
            `/schema/edit-action/${result.data.ParentSchemaId}/${result.data.id}`
          );
        }
      }
    }
  };

  const execPullRequestMode = (payload: any) => {
    if (
      id &&
      entityType &&
      payload.Status === IProvisioningRequestStatus.PendingForApproval
    ) {
      dispatch(updateRequestAPI(id, payload));
      setIsSendPullRequestOpen(false);
    } else {
      dispatch(addApprovalAPI(payload));
      setIsSendPullRequestOpen(false);
    }
    // if (navigationList[0]?.Role === RoleType.Moderator) {
    //   navigate("/approval");
    // } else {
    //   navigate(`/schema/edit-schema/${SchemaId}`);
    // }
  };

  const addUpdateAction = (_actionDefinition: any, status: IEntityStatus) => {
    if (_actionDefinition.SystemName && _actionDefinition.ActionType) {
      if (regEx.validString.test(_actionDefinition.SystemName)) {
        delete _actionDefinition.id;
        delete _actionDefinition._id;
        delete _actionDefinition.id;
        delete _actionDefinition.PartitionKey;
        delete _actionDefinition.workflowDefinition;
        setActionDefinition({ ..._actionDefinition });
        _actionDefinition.Status = status;
        saveWorkflowAPI(_actionDefinition);
      } else {
        dispatch(
          showNotification({
            isOpen: true,
            message: "Please enter valid SystemName.",
            type: "error",
          })
        );
      }
    } else {
      dispatch(
        showNotification({
          isOpen: true,
          message: `Please enter required field.`,
          type: "error",
        })
      );
    }
  };

  const saveWorkflowAPI = async (request: IAction) => {
    dispatch(setSelectedItemId({ ...selectedItemId, isDirty: false }));
    dispatch(SchemaActionList());
    if (SchemaId && id) {
      const result: any = await dispatch(
        updateActionAPI(request, SchemaId, id)
      );
      if (result?.success === true) {
        let item = { ...selectedItemId, isDirty: false, Data: result?.data };
        handleTreeViewContextMenu(item);
      }
    } else {
      const result: any = await dispatch(addActionAPI(request));
      if (result?.success === true) {
        if (location.pathname.includes("/schema/workflow-editor")) {
          let item = { ...selectedItemId, isDirty: false, Data: result?.data };
          handleTreeViewContextMenu(item);
          dispatch(SchemaActionList());
        } else if (
          result.data.id &&
          !location.pathname.includes("/schema/workflow-editor")
        ) {
          navigate(
            `/schema/edit-action/${result.data.ParentSchemaId}/${result.data.id}`
          );
        }
      }
      // if (result.data.id) {
      // goto edit mode
      // navigate(
      //   `/schema/edit-action/${result.data.ParentSchemaId}/${result.data.id}`
      // );
      // }
      else {
        dispatch(
          showNotification({
            isOpen: true,
            message: JSON.stringify(result),
            type: "error",
          })
        );
      }
    }
  };

  const cloneWorkFlow = () => {
    debugger;
    localStorage.setItem("id", JSON.stringify(id));
    let globalSettings: any = definition.value.properties.globalSettings;
    if (globalSettings?.SchemaId) {
      if (location.pathname.includes("/schema/workflow-editor")) {
        let item = {
          Status: globalSettings.Status,
          Type: "Action",
          id: v4(),
          selected: false,
          text: "Clone_".concat(globalSettings.DisplayName),
          oldId: globalSettings?.id,
          isCloneAction: true,
          Data: actionByIdData,
        };
        handleTreeViewContextMenu(item);
      } else {
        navigate(`/schema/clone-action/${globalSettings?.SchemaId}`);
      }
    } else {
      dispatch(
        showNotification({
          isOpen: true,
          message: "You can clone only existing action.",
          type: "error",
        })
      );
    }
  };

  const toCopySingleBranches = (copyBranch: any, buttonName: any) => {
    let _definition: any = definition.value;

    if (copyBranch.length !== 0) {
      let _copyBranch = copyBranch.map((_copyTask: any) => {
        if (
          _copyTask.componentType === "switch" &&
          ((_copyTask._id && _copyTask._id === selectedStepId) || _copyTask.id === selectedStepId)
        ) {
          let workflowDefinition: any = {
            properties: _definition.properties,
            sequence: [
              ..._definition.sequence,
              {
                ..._copyTask,
                id: v4(),
                name: copyName(_copyTask.name),
                properties: {
                  ..._copyTask.properties,
                  taskSettings: {
                    ..._copyTask.properties.taskSettings,
                    name: copyName(_copyTask.name),
                  },
                },
                branches: toCopyBranches(_copyTask?.branches),
              },
            ],
          };
          if (buttonName === ControlBoxButtons.CopyToClipboard) {
            copyToClipboard(_copyTask);
          } else {
            setDefinition(wrapDefinition(workflowDefinition));
          }
        } else if (
          _copyTask.componentType === "task" &&
          ((_copyTask._id && _copyTask._id === selectedStepId) || _copyTask.id === selectedStepId)
        ) {
          let workflowDefinition: any = {
            properties: _definition.properties,
            sequence: [
              ..._definition.sequence,
              {
                ..._copyTask,
                id: v4(),
                name: copyName(_copyTask.name),
                properties: {
                  ..._copyTask.properties,
                  taskSettings: {
                    ..._copyTask.properties.taskSettings,
                    name: copyName(_copyTask.name),
                  },
                },
              },
            ],
          };
          if (buttonName === ControlBoxButtons.CopyToClipboard) {
            copyToClipboard(_copyTask);
          } else {
            setDefinition(wrapDefinition(workflowDefinition));
          }
        } else {
          return {};
        }
      });
    } else {
      return {};
    }
  };

  const findBranch = (item: any, taskType: any, buttonName: any) => {
    if (item.componentType === "switch") {
      Object.values(item?.branches).find((cases: any) => {
        cases.find((item: any) => {
          if ((item._id && item._id === selectedStepId) || item.id === selectedStepId) {
            toCopySingleBranches(cases, buttonName);
          } else {
            findCase(cases, buttonName);
          }
        });
      });
    }
  };

  const findCase = (caseFind: any, buttonName: any) => {
    caseFind?.find((item: any) => {
      findBranch(item, "switch", buttonName);
    });
  };

  const copyTask = (buttonName: any) => {
    if (selectedStepId) {
      let _definition: any = definition.value;

      if (_definition?.sequence?.length > 0) {
        const taskToCopy: any = _definition?.sequence?.find((item: any) => {
          return (item._id && item._id === selectedStepId) || item.id === selectedStepId;
        });

        if (taskToCopy === undefined) {
          _definition?.sequence?.find((item: any) => {
            findBranch(item, "switch", buttonName);
          });
        } else {
          if (taskToCopy.componentType === "switch") {
            let workflowDefinition: any = {
              properties: _definition.properties,
              sequence: [
                ..._definition.sequence,
                {
                  ...taskToCopy,
                  id: v4(),
                  name: copyName(taskToCopy.name),
                  properties: {
                    ...taskToCopy.properties,
                    taskSettings: {
                      ...taskToCopy.properties.taskSettings,
                      name: copyName(taskToCopy.name),
                    },
                  },
                  branches: toCopyBranches(taskToCopy?.branches),
                },
              ],
            };
            if (buttonName === ControlBoxButtons.CopyToClipboard) {
              copyToClipboard(taskToCopy);
            } else {
              setDefinition(wrapDefinition(workflowDefinition));
            }
          } else {
            let workflowDefinition: any = {
              properties: _definition.properties,
              sequence: [
                ..._definition.sequence,
                {
                  ...taskToCopy,
                  id: v4(),
                  name: copyName(taskToCopy.name),
                  properties: {
                    ...taskToCopy.properties,
                    taskSettings: {
                      ...taskToCopy.properties.taskSettings,
                      name: copyName(taskToCopy.name),
                    },
                  },
                },
              ],
            };
            if (buttonName === ControlBoxButtons.CopyToClipboard) {
              copyToClipboard(taskToCopy);
            } else {
              setDefinition(wrapDefinition(workflowDefinition));
            }
          }
        }
      }
    } else {
      copyWorkflow();
    }
  };

  const viewHistory = () => {
    setIsOpen(!isOpen);
    showHistory(true);
  };

  const pasteTask = async () => {
    try {
      const data = await navigator.clipboard.readText();
      savePayload(data);
    } catch (err) {
    }
  };

  const onCustomIconChange = (type: any) => {
    switch (type) {
      case ControlBoxButtons.Save:
        if (isTemplateView) {
          saveTemplate();
        } else {
          saveWorkflow(true, IProvisioningRequestStatus.Draft);
        }
        break;
        break;
      case ControlBoxButtons.SendPullRequest:
        handleSendForApproval();
        break;
      case ControlBoxButtons.Clear:
        clearData();
        break;
      case ControlBoxButtons.Reload:
        reloadDefinitionClicked(definition.value);
        break;
      case ControlBoxButtons.ViewDefinition:
        handleOpenPopup();
        break;
      case ControlBoxButtons.CloneWorkFlow:
        cloneWorkFlow();
        break;
      case ControlBoxButtons.CloneTask:
        copyTask(ControlBoxButtons.CloneTask);
        break;
      case ControlBoxButtons.ViewHistory:
        viewHistory();
        break;
      case ControlBoxButtons.PasteTask:
        pasteTask();
        break;
      case ControlBoxButtons.CopyToClipboard:
        copyTask(ControlBoxButtons.CopyToClipboard);
        break;
      default:
        <div>This step is not implemented yet!</div>;
    }
  };

  const [copied, setCopied] = useState(false);

  const copyWorkflow = () => {
    let copySettings: any = definition.value;
    copyToClipboard(copySettings);
  };

  const copyToClipboard = (test: any) => {
    if (selectedStepId) {
      if (test) {
        try {
          const jsonString = JSON.stringify(test);
          navigator.clipboard
            .writeText(jsonString || "")
            .then(() => {
              setCopied(true);
              dispatch(
                showNotification({
                  isOpen: true,
                  message: "Task Copied",
                  type: "success",
                })
              );
            })
            .catch((error) => {
              console.error("Failed to copy text:", error);
              setCopied(false);
              dispatch(
                showNotification({
                  isOpen: true,
                  message: "Failed to Task Copied",
                  type: "error",
                })
              );
            });
        } catch (error) {
          console.error("Clipboard API not available:", error);
          setCopied(false);
          dispatch(
            showNotification({
              isOpen: true,
              message: "Failed to Task Copied",
              type: "error",
            })
          );
        }
      }
    } else {
      if (test) {
        try {
          const jsonString = JSON.stringify(test);
          navigator.clipboard
            .writeText(jsonString || "")
            .then(() => {
              setCopied(true);
              dispatch(
                showNotification({
                  isOpen: true,
                  message: "Workflow Copied",
                  type: "success",
                })
              );
            })
            .catch((error) => {
              console.error("Failed to copy text:", error);
              setCopied(false);
              dispatch(
                showNotification({
                  isOpen: true,
                  message: "Failed to Workflow Copied",
                  type: "error",
                })
              );
            });
        } catch (error) {
          console.error("Clipboard API not available:", error);
          setCopied(false);
          dispatch(
            showNotification({
              isOpen: true,
              message: "Failed to Workflow Copied",
              type: "error",
            })
          );
        }
      }
    }
  };

  const savePayload = (e: any) => {
    if (e) {
      let _definition: any = definition.value;
      try {
        let value = JSON.parse(e);
        if (value.id) {
          if (typeof value === "object" && value !== null) {
            // Create the new task with regenerated IDs for unique identification
            const newTask: any = {
              ...value,
              id: v4(),
              _id: v4(), // Regenerate _id to make pasted task selectable/editable
              name: copyName(value.name),
              properties: {
                ...value.properties,
                taskSettings: {
                  ...value.properties?.taskSettings,
                  name: copyName(value.name),
                },
              },
            };

            // If task has branches (switch/condition), regenerate IDs for nested tasks
            if (value.branches) {
              newTask.branches = toCopyBranches(value.branches);
            }

            let workflowDefinition: any = {
              properties: _definition.properties,
              sequence: [
                ..._definition.sequence,
                newTask,
              ],
            };
            setDefinition(wrapDefinition(workflowDefinition));
            dispatch(
              showNotification({
                isOpen: true,
                message: "Task Added Successfully",
                type: "success",
              })
            );
          } else {
            // setState({});
            return;
          }
        } else {
          setDefinition(wrapDefinition(value));
          dispatch(
            showNotification({
              isOpen: true,
              message: "Workflow Added Successfully",
              type: "success",
            })
          );
        }
      } catch (e: any) { }
    }
  };

  function getActionDisplayName(selectedItemId: any, _actionDefinition: any) {
    if (selectedItemId?.isCloneAction === true) {
      return selectedItemId.text;
    } else if (_actionDefinition.DisplayName) {
      return _actionDefinition.DisplayName;
    } else {
      return "Add New Workflow";
    }
  }

  const onDefinitionChange = async (definition: WrappedDefinition) => {
    setDefinition(definition);

    // Convert Step to Task and rebuild action definition
    const tasks: Task[] = await execTasks(definition.value.sequence);
    const _actionDefinition: any = {
      ...(ActionDefinition as IAction),
      ...(definition.value.properties.globalSettings as Object),
      Tasks: tasks,
    };
    delete _actionDefinition.PartitionKey;

    // Always keep actionDefinition state in sync
    setActionDefinition({ ..._actionDefinition });

    // Update redux state for tree-view mode
    if (
      selectedItemId?.onLoad === false &&
      selectedItemId.isDelete !== true &&
      location.pathname.includes("/schema/workflow-editor")
    ) {
      const sItem = {
        ...selectedItemId,
        isDirty: true,
        Data: _actionDefinition,
        text: getActionDisplayName(selectedItemId, _actionDefinition),
      };

      const updatedItems =
        selectedItems?.map((item: any) => {
          if (item.id === sItem.id) {
            return { ...item, ...sItem };
          }
          return item;
        }) || [];

      dispatch(setSelectedItemId(sItem));
      dispatch(SelectedItems([...updatedItems]));
    }
  };

  return (
    <div className={props.isTreeView ? "treeView" : ""}>
      <SequentialWorkflowDesigner
        theme={isDark ? 'dark' : 'light'}
        undoStackSize={10}
        definition={definition}
        onDefinitionChange={onDefinitionChange}
        onCustomIconChange={onCustomIconChange}
        customIcons={CustomIconButtons}
        selectedStepId={selectedStepId}
        isReadonly={disableToolBox}
        onSelectedStepIdChanged={setSelectedStepId}
        toolboxConfiguration={toolboxConfiguration}
        stepsConfiguration={stepsConfiguration}
        globalEditor={
          <StoreProvider store={store}>
            <GlobalEditor isTemplateView={isTemplateView} />
          </StoreProvider>
        }
        stepEditor={
          <StoreProvider store={store}>
            <AiAutoFillProvider
              workflowContext={{
                currentWorkflowId: id,
                currentSchemaId: SchemaId,
                selectedTaskId: selectedStepId || undefined,
                workflowMode: workflowMode as 'ADD_ACTION' | 'EDIT_ACTION' | 'CLONE_ACTION' | 'VIEW_ACTION',
                subscription: selectedSubscription?.id,
              }}
              readOnly={disableToolBox}
            >
              <StepEditor />
            </AiAutoFillProvider>
          </StoreProvider>
        }
      />

      {isOpen && (
        <DXPopupForDefinition
          isOpen={isOpen}
          height={isOpen ? "500px" : ""}
          onClose={handleClosePopup}
        >
          {history ? (
            <ViewHistory schemaId={id} />
          ) : (
            <>
              <Tabs
                dataSource={TabsDataSource}
                selectedItem={TabsDataSource[selectedIndex]}
                selectedIndex={selectedIndex}
                onOptionChanged={onSelectionChanged}
              />
              <br></br>
              {selectedIndex === 1 && (
                <ReactJsonEditor
                  name="actionDefinition"
                  src={actionDefinition}
                />
              )}
              {selectedIndex === 0 && (
                <ReactJsonEditor
                  name="workflowDefinition"
                  src={definition.value}
                />
              )}
            </>
          )}
        </DXPopupForDefinition>
      )}
      <DXPopup
        showTitle={false}
        visible={sendPullRequestOpen}
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
            onClick={(e: any) => handleSendForApproval()}
          />
          <DXButton type="default" text="No" onClick={(e) => onNoClick(e)} />
        </div>
      </DXPopup>

      {/* AI Workflow Assistant */}
      <WorkflowAssistantDemo
        workflowContext={{
          currentWorkflowId: id,
          currentSchemaId: SchemaId,
          selectedTaskId: selectedStepId || undefined,
          workflowMode: workflowMode as 'ADD_ACTION' | 'EDIT_ACTION' | 'CLONE_ACTION' | 'VIEW_ACTION',
          subscription: selectedSubscription?.id,
        }}
        currentDefinition={definition?.value}
        onTaskCreate={(taskType, taskId, properties, taskName) => {
          // Create a new task and add it to the workflow (uses createTaskWithBranches for full support)
          // taskId = execution ID (camelCase, no spaces), taskName = display name (optional)
          const newTask = createTaskWithBranches(taskType, taskId, properties || {}, undefined, taskName);
          if (definition?.value?.sequence) {
            const newDefinition = {
              ...definition.value,
              sequence: [...definition.value.sequence, newTask]
            };
            setDefinition(wrapDefinition(newDefinition));
          }
        }}
        designer={{
          // Select a task in the designer by _id (AI identifier)
          // This looks up the task by _id and uses its engine id for designer selection
          onSelectTask: (taskId: string) => {
            if (!definition?.value?.sequence) return;
            // Find task by _id (AI identifier)
            const result = findTaskById(definition.value.sequence, taskId);
            if (result.task) {
              // Set designer selection using _id (unique) for correct task targeting
              setSelectedStepId(result.task._id || result.task.id);
            } else {
            }
          },
          // Clear task selection
          onClearSelection: () => {
            setSelectedStepId(null);
          },
          // Delete a task at any nesting level using task traversal utilities
          onDeleteTask: (taskId: string) => {
            if (!definition?.value?.sequence) return;

            const result = deleteTaskById(definition.value.sequence, taskId);
            if (result.success) {
              const newDefinition = { ...definition.value, sequence: result.data };
              setDefinition(wrapDefinition(newDefinition));
            } else {
            }
          },
          // Get current workflow definition
          onGetWorkflow: () => definition?.value,
          // Get selected task details at any nesting level
          // Note: selectedStepId is the workflow engine's id from designer selection
          onGetSelectedTask: () => {
            if (!selectedStepId || !definition?.value?.sequence) return null;

            // Try finding by _id first (selectedStepId is now _id-based for unique targeting)
            let result = findTaskById(definition.value.sequence, selectedStepId);
            // Fall back to engine id for backward compatibility
            if (!result.task) {
              result = findTaskByEngineId(definition.value.sequence, selectedStepId);
            }
            if (result.task) {
              return {
                _id: result.task._id || '',
                type: result.task.type,
                name: result.task.name,
                properties: result.task.properties || {},
                path: result.pathString,
                depth: result.depth,
                parent_id: result.parent?._id || null,
                branchName: result.branchName
              };
            }
            return null;
          },
          // List all tasks in workflow with full path info (supports nth-level nesting)
          onListTasks: (): TaskInfo[] => {
            if (!definition?.value?.sequence) return [];
            return listAllTasks(definition.value.sequence);
          },
          // Add a task to sequence (supports branching tasks like Condition, Switch, Iterator, etc.)
          onAddTask: (taskType: string, taskId: string, taskName?: string, afterTaskId?: string, properties?: Record<string, unknown>, branches?: BranchDefinition) => {
            // Use createTaskWithBranches for full support of branching tasks
            // taskId = execution ID for state storage: {$.taskId.data}
            // taskName = display name shown in designer UI (optional)
            const newTask = createTaskWithBranches(taskType, taskId, properties || {}, branches, taskName);
            // Note: taskId sets the workflow engine's id; _id (AI identifier) is auto-generated

            if (definition?.value?.sequence) {
              let newSequence;
              if (afterTaskId) {
                // Find by _id (AI identifier)
                const afterIndex = definition.value.sequence.findIndex((t: any) => t._id === afterTaskId);
                if (afterIndex !== -1) {
                  newSequence = [
                    ...definition.value.sequence.slice(0, afterIndex + 1),
                    newTask,
                    ...definition.value.sequence.slice(afterIndex + 1)
                  ];
                } else {
                  newSequence = [...definition.value.sequence, newTask];
                }
              } else {
                newSequence = [...definition.value.sequence, newTask];
              }
              const newDefinition = { ...definition.value, sequence: newSequence };
              setDefinition(wrapDefinition(newDefinition));
            }
          },
          // Move a task (uses _id for AI operations)
          onMoveTask: (taskId: string, afterTaskId: string) => {
            if (!definition?.value?.sequence) return;
            // Find by _id (AI identifier)
            const taskIndex = definition.value.sequence.findIndex((t: any) => t._id === taskId);
            if (taskIndex === -1) return;

            const task = definition.value.sequence[taskIndex];
            let newSequence = definition.value.sequence.filter((t: any) => t._id !== taskId);

            if (afterTaskId === '') {
              // Move to beginning
              newSequence = [task, ...newSequence];
            } else {
              const afterIndex = newSequence.findIndex((t: any) => t._id === afterTaskId);
              if (afterIndex !== -1) {
                newSequence = [
                  ...newSequence.slice(0, afterIndex + 1),
                  task,
                  ...newSequence.slice(afterIndex + 1)
                ];
              } else {
                newSequence = [...newSequence, task];
              }
            }
            const newDefinition = { ...definition.value, sequence: newSequence };
            setDefinition(wrapDefinition(newDefinition));
          },
          // Duplicate a task (uses _id for AI operations)
          onDuplicateTask: (taskId: string, newTaskName: string) => {
            if (!definition?.value?.sequence) return;
            // Find by _id (AI identifier)
            const task = definition.value.sequence.find((t: any) => t._id === taskId);
            if (!task) return;

            const duplicatedTask = createTask(task.type, newTaskName, task.properties || {});
            const taskIndex = definition.value.sequence.findIndex((t: any) => t._id === taskId);
            const newSequence = [
              ...definition.value.sequence.slice(0, taskIndex + 1),
              duplicatedTask,
              ...definition.value.sequence.slice(taskIndex + 1)
            ];
            const newDefinition = { ...definition.value, sequence: newSequence };
            setDefinition(wrapDefinition(newDefinition));
          },
          // Add a task to an existing branch at any nesting level
          // Supports nth-level nested branching tasks (Condition inside Condition, etc.)
          onAddTaskToBranch: (
            parentTaskId: string,
            branchName: string,
            taskType: string,
            taskId: string,
            taskName?: string,
            properties?: Record<string, unknown>,
            branches?: BranchDefinition
          ) => {
            if (!definition?.value?.sequence) return;

            // taskId = execution ID for state storage: {$.taskId.data}
            // taskName = display name shown in designer UI (optional)
            const newTask = createTaskWithBranches(taskType, taskId, properties || {}, branches, taskName);
            const branchPath = `${parentTaskId}.${branchName}`;

            const result = addTaskToLocation(definition.value.sequence, newTask, null, branchPath);
            if (result.success) {
              const newDefinition = { ...definition.value, sequence: result.data };
              setDefinition(wrapDefinition(newDefinition));
            } else {
            }
          },
          // Find a task by _id at any nesting level (returns full path info)
          // NOTE: Use _id (AI identifier), not id (workflow engine identifier)
          onFindTask: (taskId: string) => {
            if (!definition?.value?.sequence) return null;

            const result = findTaskById(definition.value.sequence, taskId);
            if (result.task) {
              return {
                _id: result.task._id || '',
                type: result.task.type,
                name: result.task.name,
                properties: result.task.properties || {},
                path: result.pathString,
                depth: result.depth,
                parent_id: result.parent?._id || null,
                branchName: result.branchName,
                hasBranches: 'branches' in result.task
              };
            }
            return null;
          },
          // Update task property at any nesting level using task traversal utilities
          // NOTE: Properties are stored in properties.taskSettings structure
          // Paths like "properties.method" should map to "properties.taskSettings.method"
          onUpdateTaskProperty: (taskId: string, propertyPath: string, value: unknown) => {
            if (!definition?.value?.sequence) return;
            if (!taskId || !propertyPath) {
              return;
            }

            const result = updateTaskProperty(definition.value.sequence, taskId, propertyPath, value);
            if (!result.success) {
              return;
            }

            const newDefinition = { ...definition.value, sequence: result.data };
            setDefinition(wrapDefinition(newDefinition));
          },
          // Batch update multiple properties in ONE atomic structuredClone/setDefinition pass
          // Avoids stale-closure issue of calling onUpdateTaskProperty sequentially
          onBatchUpdateTask: (taskId: string, updates: Array<{ path: string; value: unknown }>) => {
            if (!definition?.value?.sequence) return;
            if (!taskId || !updates?.length) {
              return;
            }

            const result = updateTaskProperties(definition.value.sequence, taskId, updates);
            if (!result.success) {
              return;
            }

            const newDefinition = { ...definition.value, sequence: result.data };
            setDefinition(wrapDefinition(newDefinition));
          },
          // Update Body/Query validation schema
          // When replace=true, replaces entire schema; otherwise merges with existing fields
          onUpdateBodyQuerySchema: (schemaType: 'Body' | 'Query', fields: Array<{
            key: string;
            keyType: string;
            required: boolean;
            pattern?: string;
            errorMessage?: string;
            minLength?: number;
            maxLength?: number;
          }>, replace?: boolean) => {
            if (!definition?.value?.properties?.globalSettings) return;

            // â”€â”€ Defensive: filter out any field with missing/invalid key â”€â”€
            const safeFields = (fields || []).filter(f =>
              f && typeof f.key === 'string' && f.key.trim().length > 0
            );
            if (safeFields.length === 0) return;

            const globalSettings = { ...(definition.value.properties.globalSettings as Record<string, unknown>) };
            const currentSchema = (globalSettings[schemaType] || {}) as any;

            // If replace is true, use only new fields; otherwise merge with existing
            let mergedFields: any[];

            if (replace) {
              // Replace mode: use only the provided fields
              mergedFields = safeFields.map(f => ({ ...f, id: v4() }));
            } else {
              // Merge mode: get existing fields and merge with new ones
              const existingFields: any[] = [];
              if (currentSchema.allOf?.[0]?.properties) {
                // Extract fields from existing schema format
                Object.entries(currentSchema.allOf[0].properties).forEach(([key, value]: [string, any]) => {
                  existingFields.push({
                    id: v4(),
                    key,
                    keyType: value.type || 'string',
                    required: currentSchema.required?.includes(key) || false,
                    pattern: value.pattern || '',
                    errorMessage: currentSchema.errorMessage?.properties?.[key] || '',
                    minLength: value.minLength,
                    maxLength: value.maxLength,
                  });
                });
              }

              // Merge new fields with existing (update existing, add new)
              mergedFields = [...existingFields];
              safeFields.forEach(newField => {
                const existingIndex = mergedFields.findIndex(f => f.key === newField.key);
                if (existingIndex >= 0) {
                  mergedFields[existingIndex] = { ...mergedFields[existingIndex], ...newField, id: mergedFields[existingIndex].id };
                } else {
                  mergedFields.push({ ...newField, id: v4() });
                }
              });
            }

            // Convert back to AJV schema format
            const required: string[] = [];
            const errorProperties: any = {};
            const allOfProperties: any = {};

            mergedFields.forEach(field => {
              // Skip fields with invalid key to prevent "undefined" property names
              if (!field.key || typeof field.key !== 'string' || !field.key.trim()) return;
              const cleanKey = field.key.trim();

              if (field.required) {
                required.push(cleanKey);
              }
              if (field.errorMessage) {
                errorProperties[cleanKey] = field.errorMessage;
              }
              const propDef: any = { type: field.keyType || 'string' };
              if (field.pattern) propDef.pattern = field.pattern;
              if (field.minLength !== undefined) propDef.minLength = field.minLength;
              if (field.maxLength !== undefined) propDef.maxLength = field.maxLength;
              allOfProperties[cleanKey] = propDef;
            });

            const newSchema = {
              type: 'object',
              required,
              allOf: [{ properties: allOfProperties }],
              errorMessage: { properties: errorProperties }
            };

            globalSettings[schemaType] = newSchema;

            const newDefinition = {
              ...definition.value,
              properties: {
                ...definition.value.properties,
                globalSettings
              }
            };
            setDefinition(wrapDefinition(newDefinition));
          },
          // Get current Body/Query schema fields
          onGetBodyQuerySchema: (schemaType: 'Body' | 'Query') => {
            if (!definition?.value?.properties?.globalSettings) return [];

            const globalSettings = definition.value.properties.globalSettings as any;
            const currentSchema = globalSettings[schemaType] || {};

            const fields: any[] = [];
            if (currentSchema.allOf?.[0]?.properties) {
              Object.entries(currentSchema.allOf[0].properties).forEach(([key, value]: [string, any]) => {
                fields.push({
                  key,
                  keyType: value.type || 'string',
                  required: currentSchema.required?.includes(key) || false,
                  pattern: value.pattern || '',
                  errorMessage: currentSchema.errorMessage?.properties?.[key] || '',
                  minLength: value.minLength,
                  maxLength: value.maxLength,
                });
              });
            }
            return fields;
          },
          // Set action-level properties (globalSettings) â€” merges provided fields into existing settings
          onSetActionProperties: (properties: Record<string, unknown>) => {
            const currentGlobalSettings = (definition?.value?.properties?.globalSettings || {}) as Record<string, unknown>;
            const updatedGlobalSettings = { ...currentGlobalSettings, ...properties };

            const newDefinition = {
              ...definition.value,
              properties: {
                ...definition.value.properties,
                globalSettings: updatedGlobalSettings
              }
            };
            setDefinition(wrapDefinition(newDefinition));
          },
          // Get current action-level properties (globalSettings)
          onGetActionProperties: () => {
            if (!definition?.value?.properties?.globalSettings) return null;
            const gs = definition.value.properties.globalSettings as Record<string, unknown>;
            // Return relevant action properties (exclude large nested objects like Tasks)
            return {
              SystemName: gs.SystemName || '',
              DisplayName: gs.DisplayName || '',
              Method: gs.Method || '',
              ActionType: gs.ActionType || '',
              ParentSchemaId: gs.ParentSchemaId || '',
              Routing: gs.Routing || false,
              Topic: gs.Topic || '',
              Cache: gs.Cache || { Enabled: false, TTL: 0, Headers: [] },
              DLQ: gs.DLQ || { Enabled: false, Topic: '' },
              Template: gs.Template || '',
            };
          },
          // Get current rule columns (State array from globalSettings)
          // These are the key-value rule mapping columns: name (domain key), path (data path like {$.body.id}), SourceType
          onGetRuleColumns: () => {
            if (!definition?.value?.properties?.globalSettings) return [];
            const gs = definition.value.properties.globalSettings as Record<string, unknown>;
            const state = (gs.State || []) as any[];
            // Also include body-derived columns for completeness
            const bodyColumns = gs.Body ? createBodyPropertiesArray(gs.Body) : [];
            const combined = [...(bodyColumns || []), ...state];
            return combined.map((col: any) => ({
              id: col.id || '',
              name: col.name || '',
              path: col.path || '',
              SourceType: col.SourceType || 'Body',
              IsPredefineColumn: col.IsPredefineColumn || false,
              DataType: col.DataType || 'String',
              Properties: col.Properties || [],
              PickList: col.PickList || {},
              Enum: col.Enum || [],
            }));
          },
          // Set/replace rule columns (updates globalSettings.State â€” only non-predefined columns)
          onSetRuleColumns: (columns: any[]) => {
            if (!definition?.value?.properties?.globalSettings) return;
            // Filter out predefined (body-derived) columns â€” only store custom State items
            const customColumns = (columns || []).filter((c: any) => !c.IsPredefineColumn);
            // Ensure each column has an id
            const withIds = customColumns.map((c: any) => ({
              ...c,
              id: c.id || v4(),
            }));

            // Update definition directly â€” same pattern as onSetActionProperties.
            // This ensures State is persisted even when the Action (GlobalEditor)
            // component is not mounted (e.g. a step is selected in the designer).
            const currentGlobalSettings = (definition.value.properties.globalSettings || {}) as Record<string, unknown>;
            const updatedGlobalSettings = { ...currentGlobalSettings, State: withIds };

            const newDefinition = {
              ...definition.value,
              properties: {
                ...definition.value.properties,
                globalSettings: updatedGlobalSettings
              }
            };
            setDefinition(wrapDefinition(newDefinition));

            // Also dispatch event for the Action component's local UI state (DataGrid)
            // so it picks up the columns immediately if it's currently mounted.
            window.dispatchEvent(
              new CustomEvent('llm-rule-columns-update', { detail: { columns: withIds } })
            );
          },
        }}
      />
      
      {/* AI Workflow Assistant */}
      <DisplayDescription
        ActionDefinition={actionDefinition ?? {}}
        onDescriptionChange={(description: string) => {
          const currentGlobalSettings = (definition?.value?.properties?.globalSettings || {}) as Record<string, unknown>;
          const updatedGlobalSettings = { ...currentGlobalSettings, Description: description };
          const newDefinition = {
            ...definition.value,
            properties: {
              ...definition.value.properties,
              globalSettings: updatedGlobalSettings
            }
          };
          setDefinition(wrapDefinition(newDefinition));
        }}
      />
    </div>
  );
});
