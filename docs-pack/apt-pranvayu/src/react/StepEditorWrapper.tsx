import { createContext, useContext, useState } from "react";
import {
  ComponentType,
  Definition,
  Properties,
  PropertyValue,
  Step,
  StepEditorContext,
} from "../designer";

export interface StepEditorWrapper {
  readonly id: string;
  readonly type: string;
  readonly componentType: ComponentType;
  readonly name: string;
  readonly properties: Properties;
  readonly step: Step;
  readonly definition: Definition;

  setId(id: string): void;
  setName(name: string): void;
  setProperty(name: string, value: PropertyValue): void;
  notifyPropertiesChanged(): void;
  notifyChildrenChanged(): void;
}

const globalEditorWrapperContext = createContext<StepEditorWrapper | null>(
  null
);

export function useStepEditor(): StepEditorWrapper {
  const wrapper = useContext(globalEditorWrapperContext);
  if (!wrapper) {
    throw new Error("Cannot find step editor context");
  }
  return wrapper;
}

export function StepEditorWrapperContext(props: {
  children: JSX.Element;
  step: Step;
  context: StepEditorContext;
  definition: Definition;
}) {
  const [wrapper, setWrapper] = useState(() => createWrapper());

  function createWrapper(): StepEditorWrapper {
    return {
      id: props.step.id,
      type: props.step.type,
      componentType: props.step.componentType,
      name: props.step.name,
      properties: { ...props.step.properties },
      step: props.step,
      definition: props.definition,
      setId,
      setName,
      setProperty,
      notifyPropertiesChanged,
      notifyChildrenChanged,
    };
  }

  function forward() {
    setWrapper(createWrapper());
  }

  function setId(id: string) {
    props.step.id = id;
    notifyPropertiesChanged(); // ID change affects data paths, treat as property change
  }

  function setName(name: string) {
    props.step.name = name;
    notifyNameChanged();
  }

  function setProperty(name: string, value: PropertyValue) {
    props.step.properties[name] = value;
    props.context.notifyPropertiesChanged();
    // 'taskSettings' is persisted by the editor's own autoSave hook — the
    // editor already holds this data in React state.  Calling forward() would
    // create a new context value → useEffect echo → DXForm template
    // re-execution via createRoot → Payload grids destroyed & recreated →
    // scroll-position lost.  Other properties (e.g. 'type' used by sub-type
    // selectors) still need forward() so the parent re-renders and switches
    // the correct sub-editor component.
    if (name !== 'taskSettings') {
      forward();
    }
  }

  function notifyNameChanged() {
    props.context.notifyNameChanged();
    forward();
  }

  function notifyPropertiesChanged() {
    props.context.notifyPropertiesChanged();
    forward();
  }

  function notifyChildrenChanged() {
    props.context.notifyChildrenChanged();
    forward();
  }

  return (
    <globalEditorWrapperContext.Provider value={wrapper}>
      {props.children}
    </globalEditorWrapperContext.Provider>
  );
}
