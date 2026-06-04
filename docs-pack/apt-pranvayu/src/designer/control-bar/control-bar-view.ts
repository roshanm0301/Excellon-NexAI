import { Dom } from '../core/dom';
import { Icons } from '../core/icons';
import { DesignerState } from '../designer-state';
import { ControlBoxButtons } from './control-bar';

export class ControlBarView {
	public static create(parent: HTMLElement, isUndoRedoSupported: boolean, state: DesignerState): ControlBarView {
		const root = Dom.element('div', {
			class: 'sqd-control-bar'
		});

		const saveButton = createButton(Icons.save, ControlBoxButtons.Save);
		Dom.toggleClass(saveButton, state.customIcons.Save, 'sqd-hidden');
		root.appendChild(saveButton);

		const sendPullRequestButton = createButton(Icons.lock, ControlBoxButtons.SendPullRequest);
		Dom.toggleClass(sendPullRequestButton, state.customIcons.SendPullRequest, 'sqd-hidden');
		root.appendChild(sendPullRequestButton);

		const clearButton = createButton(Icons.cross, ControlBoxButtons.Clear);
		Dom.toggleClass(clearButton, state.customIcons.Clear, 'sqd-hidden');
		root.appendChild(clearButton);

		const reloadButton = createButton(Icons.reload, ControlBoxButtons.Reload);
		Dom.toggleClass(reloadButton, state.customIcons.Reload, 'sqd-hidden');
		root.appendChild(reloadButton);

		const viewDefinitionButton = createButton(Icons.eye, ControlBoxButtons.ViewDefinition);
		root.appendChild(viewDefinitionButton);

		const copyToClipboardButton = createButton(Icons.copyToClipboard, ControlBoxButtons.CopyToClipboard);
		root.appendChild(copyToClipboardButton);

		const pasteTaskButton = createButton(Icons.pasteFromClipboard, ControlBoxButtons.PasteTask);
		root.appendChild(pasteTaskButton);

		const cloneWorkFlowButton = createButton(Icons.copy, ControlBoxButtons.CloneWorkFlow);
		Dom.toggleClass(cloneWorkFlowButton, state.customIcons.CloneWorkFlow, 'sqd-hidden');
		root.appendChild(cloneWorkFlowButton);

		const cloneTaskButton = createButton(Icons.repeat, ControlBoxButtons.CloneTask);
		Dom.toggleClass(cloneTaskButton, state.customIcons.CloneTask, 'sqd-hidden');
		if (!state.customIcons.CloneTask) {
			cloneTaskButton.classList.add('sqd-disabled');
		}
		root.appendChild(cloneTaskButton);

		const viewHistoryButton = createButton(Icons.folderUp, ControlBoxButtons.ViewHistory);
		Dom.toggleClass(viewHistoryButton, state.customIcons.ViewHistory, 'sqd-hidden');
		root.appendChild(viewHistoryButton);

		const resetButton = createButton(Icons.center, 'Reset view');
		root.appendChild(resetButton);

		const zoomInButton = createButton(Icons.zoomIn, 'Zoom in');
		root.appendChild(zoomInButton);

		const zoomOutButton = createButton(Icons.zoomOut, 'Zoom out');
		root.appendChild(zoomOutButton);

		let undoButton: HTMLElement | null = null;
		let redoButton: HTMLElement | null = null;

		if (isUndoRedoSupported) {
			undoButton = createButton(Icons.undo, 'Undo');
			root.appendChild(undoButton);
			redoButton = createButton(Icons.redo, 'Redo');
			root.appendChild(redoButton);
		}

		const disableDragButton = createButton(Icons.move, 'Turn on/off drag and drop');
		disableDragButton.classList.add('sqd-disabled');
		root.appendChild(disableDragButton);

		const deleteButton = createButton(Icons.delete, 'Delete selected step');
		deleteButton.classList.add('sqd-delete');
		deleteButton.classList.add('sqd-hidden');
		root.appendChild(deleteButton);

		parent.appendChild(root);
		return new ControlBarView(resetButton, zoomInButton, zoomOutButton, undoButton, redoButton, disableDragButton, deleteButton, saveButton, sendPullRequestButton, clearButton, reloadButton, viewDefinitionButton, cloneWorkFlowButton, cloneTaskButton, viewHistoryButton, pasteTaskButton, copyToClipboardButton);
	}

	private constructor(
		private readonly resetButton: HTMLElement,
		private readonly zoomInButton: HTMLElement,
		private readonly zoomOutButton: HTMLElement,
		private readonly undoButton: HTMLElement | null,
		private readonly redoButton: HTMLElement | null,
		private readonly disableDragButton: HTMLElement,
		private readonly deleteButton: HTMLElement,
		private readonly saveButton: HTMLElement,
		private readonly sendPullRequestButton: HTMLElement,
		private readonly clearButton: HTMLElement,
		private readonly reloadButton: HTMLElement,
		private readonly viewDefinitionButton: HTMLElement,
		private readonly cloneWorkFlowButton: HTMLElement,
		private readonly cloneTaskButton: HTMLElement,
		private readonly pasteTaskButton: HTMLElement,
		private readonly copyToClipboardButton: HTMLElement,
		private readonly viewHistoryButton: HTMLElement
	) { }

	public bindSaveButtonClick(handler: () => void) {
		bindClick(this.saveButton, handler);
	}

	public bindSendPullRequestButtonClick(handler: () => void) {
		bindClick(this.sendPullRequestButton, handler);
	}

	public bindClearButtonClick(handler: () => void) {
		bindClick(this.clearButton, handler);
	}

	public bindReloadButtonClick(handler: () => void) {
		bindClick(this.reloadButton, handler);
	}

	public bindViewDefinitionButtonClick(handler: () => void) {
		bindClick(this.viewDefinitionButton, handler);
	}

	public bindCloneWorkFlowButtonClick(handler: () => void) {
		bindClick(this.cloneWorkFlowButton, handler);
	}

	public bindCloneTaskButtonClick(handler: (e: any) => void) {
		bindClick(this.cloneTaskButton, handler);
	}

	public bindPasteTaskButtonClick(handler: (e: any) => void) {
		bindClick(this.pasteTaskButton, handler);
	}

	public bindCopyToClipboardTaskButtonClick(handler: (e: any) => void) {
		bindClick(this.copyToClipboardButton, handler);
	}

	public bindViewHistoryButtonClick(handler: () => void) {
		bindClick(this.viewHistoryButton, handler);
	}

	public bindResetButtonClick(handler: () => void) {
		bindClick(this.resetButton, handler);
	}

	public bindZoomInButtonClick(handler: () => void) {
		bindClick(this.zoomInButton, handler);
	}

	public bindZoomOutButtonClick(handler: () => void) {
		bindClick(this.zoomOutButton, handler);
	}

	public bindUndoButtonClick(handler: () => void) {
		if (!this.undoButton) {
			throw new Error('Undo button is disabled');
		}
		bindClick(this.undoButton, handler);
	}

	public bindRedoButtonClick(handler: () => void) {
		if (!this.redoButton) {
			throw new Error('Redo button is disabled');
		}
		bindClick(this.redoButton, handler);
	}

	public bindDisableDragButtonClick(handler: () => void) {
		bindClick(this.disableDragButton, handler);
	}

	public bindDeleteButtonClick(handler: () => void) {
		bindClick(this.deleteButton, handler);
	}

	public setIsDeleteButtonHidden(isHidden: boolean) {
		Dom.toggleClass(this.deleteButton, isHidden, 'sqd-hidden');
	}

	public setIsSendPullRequestButtonHidden(isHidden: boolean) {
		Dom.toggleClass(this.sendPullRequestButton, isHidden, 'sqd-disabled');
	}

	public setIsCloneTaskButtonDisabled(isDisabled: boolean) {
		Dom.toggleClass(this.cloneTaskButton, isDisabled, 'sqd-disabled');
	}

	public setDisableDragButtonDisabled(isDisabled: boolean) {
		Dom.toggleClass(this.disableDragButton, isDisabled, 'sqd-disabled');
	}

	public setUndoButtonDisabled(isDisabled: boolean) {
		if (!this.undoButton) {
			throw new Error('Undo button is disabled');
		}
		Dom.toggleClass(this.undoButton, isDisabled, 'sqd-disabled');
	}

	public setRedoButtonDisabled(isDisabled: boolean) {
		if (!this.redoButton) {
			throw new Error('Redo button is disabled');
		}
		Dom.toggleClass(this.redoButton, isDisabled, 'sqd-disabled');
	}


}

function bindClick(element: HTMLElement, handler: (e?: any) => void) {
	element.addEventListener(
		'click',
		e => {
			e.preventDefault();
			handler(e);
		},
		false
	);
}


function createButton(d: string, title: string): HTMLElement {
	const button = Dom.element('div', {
		class: 'sqd-control-bar-button',
		title
	});
	const icon = Icons.createSvg('sqd-control-bar-button-icon', d);
	button.appendChild(icon);
	return button;
}
