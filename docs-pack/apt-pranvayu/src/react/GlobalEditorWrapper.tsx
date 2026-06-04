import { createContext, useContext, useState } from 'react';
import { Definition, GlobalEditorContext, Properties, PropertyValue } from '../designer';

export interface GlobalEditorWrapper {
	readonly properties: Properties;

	setProperty(name: string, value: PropertyValue): void;
}

const globalEditorWrapperContext = createContext<GlobalEditorWrapper | null>(null);

export function useGlobalEditor(): GlobalEditorWrapper {
	const wrapper = useContext(globalEditorWrapperContext);
	if (!wrapper) {
		throw new Error('Cannot find global editor context');
	}
	return wrapper;
}

export function GlobalEditorWrapperContext(props: { children: JSX.Element; definition: Definition; context: GlobalEditorContext }) {
	const [wrapper, setWrapper] = useState(() => createWrapper());

	function createWrapper() {
		return {
			properties: props.definition.properties,
			setProperty
		};
	}

	function forward() {
		setWrapper(createWrapper());
	}

	function setProperty(name: string, value: PropertyValue) {
		props.definition.properties[name] = value;
		props.context.notifyPropertiesChanged();
		// 'globalSettings' is managed by the editor's own React state —
		// calling forward() would create a new context → re-render echo →
		// DXForm template re-execution → Payload grids remount → scroll lost.
		if (name !== 'globalSettings') {
			forward();
		}
	}

	return <globalEditorWrapperContext.Provider value={wrapper}>{props.children}</globalEditorWrapperContext.Provider>;
}
