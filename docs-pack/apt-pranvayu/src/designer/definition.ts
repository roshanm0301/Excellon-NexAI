export interface Definition {
	sequence: Sequence;
	properties: Properties;
}

export type Sequence = Step[];

/**
 * Step represents a task in the workflow designer
 * 
 * CRITICAL: Two separate identifiers:
 * 
 * - id = Execution ID (camelCase, no spaces) → STATE STORAGE KEY
 *   When converted to API: task.id = step.id
 *   Backend stores: state[task.id] = taskOutput
 *   Data paths: {$.id.data} → resolves to state["id"].data
 *   Example: id = "getUser" → {$.getUser.data}
 * 
 * - name = Display name (readable, can have spaces) → shown in designer UI
 *   Example: name = "Get User" → displayed in workflow canvas
 */
export interface Step {
	/** 
	 * Execution ID - STATE STORAGE KEY (camelCase, no spaces)
	 * Converted to task.id in API format
	 * Backend: state[task.id] = response
	 * Data paths: {$.id.data} → state["id"].data
	 * Example: "getUser" → {$.getUser.data}
	 */
	id: string;
	/** 
	 * AI assistant identifier - separate from execution id
	 * Used by AI tools for find/update/delete operations
	 */
	_id?: string;
	componentType: ComponentType;
	type: string;
	/** 
	 * Display name - shown in designer UI (can have spaces)
	 * For user readability in the workflow canvas
	 * Example: "Get User"
	 */
	name: string;
	properties: Properties;
	definition?: Properties
}

export type ComponentType = 'task' | 'switch' | 'container' | string;

export interface TaskStep extends Step {
	componentType: 'task';
}

export interface SwitchStep extends Step {
	componentType: 'switch';
	branches: Branches;
}

export interface ContainerStep extends Step {
	componentType: 'container';
	sequence: Sequence;
}

export interface Branches {
	[branchName: string]: Sequence;
}

export interface Properties {
	[name: string]: PropertyValue;
}

export type PropertyValue = string | number | boolean | null | object;
