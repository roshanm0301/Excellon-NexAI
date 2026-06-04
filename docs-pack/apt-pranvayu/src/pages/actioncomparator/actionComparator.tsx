/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { Provider as StoreProvider } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Definition,
  ObjectCloner,
  StepsConfiguration,
  ToolboxConfiguration,
} from "../../designer";
import { GlobalEditor, IAction, StepEditor, TabsDataSource, createTask } from "../actionWorkflow";
import { SequentialWorkflowDesigner, wrapDefinition } from "../../react";
import {getActionAPI} from "../../redux/actions";
import { useAppDispatch } from "../../store/customHooks";
import { store } from "../../store/store";
import { StepConfig } from "../actionWorkflow/editor/steps.configuration";
import { ToolboxConfig } from "../actionWorkflow/editor/toolbox.configuration";
import { execSteps, Task } from "../actionWorkflow/rule";
import { useTheme } from "../../contexts/ThemeContext";
import "../../designer/css/designer-dark.css";
import "../../designer/css/designer-light.css";
import "../../designer/css/designer.css";
import './actioncomparator.scss';

const toolboxConfiguration: ToolboxConfiguration = ToolboxConfig;
const stepsConfiguration: StepsConfiguration = StepConfig;

export const ActionComparator = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isDark } = useTheme();
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const startDefinition: Definition = {
    properties: {},
    sequence: [
      createTask("Resolver", "Resolver", {}),
      createTask("Response", "Response", {}),
    ],
  };

  const [definition, setDefinition] = useState(() =>
    wrapDefinition(startDefinition)
  );

  // useEffect(() => {
  //   if (location.pathname) {
  //     if (location.pathname.includes("clone-action")) {
  //       let id: any = JSON.parse(
  //         localStorage.getItem("id") || ""
  //       );
  //       console.log("Current Route Name...", location.pathname);
  //       getActionById(id);
  //     }
  //   }
  // }, [location.pathname]);

  // keep this effect to auto effect in definition
  // useEffect(() => {
  //   if (definition.value) {
  //     console.log("useEffect...", definition.value);
  //   }
  // }, [definition.value]);

  // useEffect(() => {
  //   (async () => {
  //     await dispatch(getSchemaListAPI(null));
  //     if (SchemaId && id) getActionById(id);
  //     if (SchemaId && SchemaId !== "null") dispatch(getSchemaAPI(SchemaId));
  //   })();
  // }, []);

  // const getActionById = async (id: string) => {
  //   const result: any = await dispatch(getActionAPI(id));

  //   if (!result) {
  //     setDefinition(wrapDefinition(startDefinition));
  //     return;
  //   }

  //   let workflowDefinition: any = {
  //     properties: {
  //       globalSettings: {
  //         ...result,
  //       },
  //     },
  //     sequence: [],
  //   };

  //   const sequence = execSteps(result.Tasks || []);
  //   workflowDefinition.sequence = sequence;

  //   delete workflowDefinition?.properties?.globalSettings?.Tasks;

  //   setDefinition(wrapDefinition(workflowDefinition));
  // };
  const onCustomIconChange = (type: any) => {
    // console.log('onCustomIconChange...', type)
  }

  return (
    <div className="splitScreen">
      <div className="topPane">
      <SequentialWorkflowDesigner
       onCustomIconChange={onCustomIconChange}
        theme={isDark ? 'dark' : 'light'}
        undoStackSize={10}
        definition={definition}
        onDefinitionChange={setDefinition}
        selectedStepId={selectedStepId}
        // isReadonly={isReadonly}
        onSelectedStepIdChanged={setSelectedStepId}
        toolboxConfiguration={toolboxConfiguration}
        stepsConfiguration={stepsConfiguration}
        globalEditor={
          <StoreProvider store={store}>
            <GlobalEditor />
          </StoreProvider>
        }
        stepEditor={
          <StoreProvider store={store}>
            <StepEditor />
          </StoreProvider>
        }
      />
   
      </div>
      <div className="bottomPane">
      <SequentialWorkflowDesigner
       onCustomIconChange={onCustomIconChange}
        theme={isDark ? 'dark' : 'light'}
        undoStackSize={10}
        definition={definition}
        onDefinitionChange={setDefinition}
        selectedStepId={selectedStepId}
        // isReadonly={isReadonly}
        onSelectedStepIdChanged={setSelectedStepId}
        toolboxConfiguration={toolboxConfiguration}
        stepsConfiguration={stepsConfiguration}
        globalEditor={
          <StoreProvider store={store}>
            <GlobalEditor />
          </StoreProvider>
        }
        stepEditor={
          <StoreProvider store={store}>
            <StepEditor />
          </StoreProvider>
        }
      />

      </div>
    </div>
  );
};
