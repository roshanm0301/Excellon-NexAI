import { DesignerContext } from '../designer-context';
import { ControlBarView } from './control-bar-view';
import { HistoryController } from '../history-controller';
import { DesignerState } from '../designer-state';
import { DefinitionModifier } from '../definition-modifier';
import { WorkspaceController } from '../workspace/workspace-controller';
import { UiComponent } from '../designer-extension';

export enum ControlBoxButtons {
	Save = "Save",
	SendPullRequest = "Send Pull Request",
	Clear = "Clear",
	Reload = "Reload",
	ViewDefinition = "View Definition",
	CloneWorkFlow = "Clone WorkFlow",
	CloneTask = "Clone Task",
	ViewHistory = "View History",
	PasteTask = "Paste Task",
	CopyToClipboard = "Copy To Clipboard"
}

export class ControlBar implements UiComponent {
	public static create(parent: HTMLElement, context: DesignerContext): UiComponent {
		const view = ControlBarView.create(parent, !!context.historyController, context.state);
		const bar = new ControlBar(view, context.state, context.workspaceController, context.historyController, context.definitionModifier);

		view.bindSaveButtonClick((e?: any) => bar.onCustomIconClicked(e));
		view.bindSendPullRequestButtonClick((e?: any) => bar.onCustomIconClicked(e));
		view.bindClearButtonClick((e?: any) => bar.onCustomIconClicked(e));
		view.bindReloadButtonClick((e?: any) => bar.onCustomIconClicked(e));
		view.bindViewDefinitionButtonClick((e?: any) => bar.onCustomIconClicked(e));
		view.bindCloneWorkFlowButtonClick((e?: any) => bar.onCustomIconClicked(e));
		view.bindCloneTaskButtonClick((e?: any) => bar.onCustomIconClicked(e));
		view.bindViewHistoryButtonClick((e?: any) => bar.onCustomIconClicked(e));
		view.bindPasteTaskButtonClick((e?: any) => bar.onCustomIconClicked(e));
		view.bindCopyToClipboardTaskButtonClick((e?: any) => bar.onCustomIconClicked(e));

		view.bindResetButtonClick(() => bar.onResetButtonClicked());
		view.bindZoomInButtonClick(() => bar.onZoomInButtonClicked());
		view.bindZoomOutButtonClick(() => bar.onZoomOutButtonClicked());
		view.bindDisableDragButtonClick(() => bar.onMoveButtonClicked());
		view.bindDeleteButtonClick(() => bar.onDeleteButtonClicked());
		context.state.onIsReadonlyChanged.subscribe(() => bar.onIsReadonlyChanged());
		context.state.onSelectedStepIdChanged.subscribe(() => bar.onSelectedStepIdChanged());
		context.state.onIsDragDisabledChanged.subscribe(i => bar.onIsDragDisabledChanged(i));
		context.state.onCustomIconsChanged.subscribe(() => bar.onCustomIconsChanged())

		if (context.historyController) {
			view.bindUndoButtonClick(() => bar.onUndoButtonClicked());
			view.bindRedoButtonClick(() => bar.onRedoButtonClicked());
			context.state.onDefinitionChanged.subscribe(() => bar.onDefinitionChanged());

			bar.refreshUndoRedoAvailability();
		}
		return bar;
	}

	private constructor(
		private readonly view: ControlBarView,
		private readonly state: DesignerState,
		private readonly workspaceController: WorkspaceController,
		private readonly historyController: HistoryController | undefined,
		private readonly definitionModifier: DefinitionModifier
	) { }

	public destroy() {
		//
	}

	private onResetButtonClicked() {
		this.workspaceController.resetViewPort();
	}

	private onZoomInButtonClicked() {
		this.workspaceController.zoom(true);
	}

	private onZoomOutButtonClicked() {
		this.workspaceController.zoom(false);
	}

	private onMoveButtonClicked() {
		this.state.toggleIsDragDisabled();
	}

	private onUndoButtonClicked() {
		if (!this.state.isReadonly && this.historyController?.canUndo()) {
			this.historyController.undo();
		}
	}

	private onRedoButtonClicked() {
		if (!this.state.isReadonly && this.historyController?.canRedo()) {
			this.historyController.redo();
		}
	}

	private onDeleteButtonClicked() {
		if (!this.state.isReadonly && this.state.selectedStepId) {
			this.definitionModifier.tryDelete(this.state.selectedStepId);
		}
	}

	// Custom Icon Button Clicked function
	private onCustomIconClicked(e: any) {
		const type: ControlBoxButtons = e.currentTarget?.title || '';
		switch (type) {
			case ControlBoxButtons.Save: this.definitionModifier.customIconClicked(ControlBoxButtons.Save); break
			case ControlBoxButtons.SendPullRequest: this.definitionModifier.customIconClicked(ControlBoxButtons.SendPullRequest); break
			case ControlBoxButtons.Clear: this.definitionModifier.customIconClicked(ControlBoxButtons.Clear); break
			case ControlBoxButtons.Reload: this.definitionModifier.customIconClicked(ControlBoxButtons.Reload); break
			case ControlBoxButtons.ViewDefinition: this.definitionModifier.customIconClicked(ControlBoxButtons.ViewDefinition); break
			case ControlBoxButtons.CloneWorkFlow: this.definitionModifier.customIconClicked(ControlBoxButtons.CloneWorkFlow); break
			case ControlBoxButtons.CloneTask: this.definitionModifier.customIconClicked(ControlBoxButtons.CloneTask); break
			case ControlBoxButtons.ViewHistory: this.definitionModifier.customIconClicked(ControlBoxButtons.ViewHistory); break
			case ControlBoxButtons.PasteTask: this.definitionModifier.customIconClicked(ControlBoxButtons.PasteTask); break
			case ControlBoxButtons.CopyToClipboard: this.definitionModifier.customIconClicked(ControlBoxButtons.CopyToClipboard); break
			default: break
		}
	}

	private onIsReadonlyChanged() {
		this.refreshDeleteButtonVisibility();
		this.refreshCloneTaskButtonVisibility();
	}

	private onCustomIconsChanged() {
		this.refreshSendPullRequestButtonVisibility();
	}

	private onSelectedStepIdChanged() {
		this.refreshDeleteButtonVisibility();
		this.refreshCloneTaskButtonVisibility();
	}

	private onIsDragDisabledChanged(isEnabled: boolean) {
		this.view.setDisableDragButtonDisabled(!isEnabled);
	}

	private onDefinitionChanged() {
		this.refreshUndoRedoAvailability();
	}

	private refreshUndoRedoAvailability() {
		if (!this.historyController) {
			throw new Error('Undo/redo is disabled');
		}

		const canUndo = this.historyController.canUndo();
		const canRedo = this.historyController.canRedo();
		this.view.setUndoButtonDisabled(!canUndo);
		this.view.setRedoButtonDisabled(!canRedo);
	}

	private refreshDeleteButtonVisibility() {
		const isHidden = !this.state.selectedStepId || this.state.isReadonly;
		this.view.setIsDeleteButtonHidden(isHidden);
	}

	private refreshSendPullRequestButtonVisibility() {
		const isHidden = this.state.customIcons.SendPullRequest || this.state.isReadonly;
		this.view.setIsSendPullRequestButtonHidden(isHidden);
	}

	private refreshCloneTaskButtonVisibility() {
		const isHidden = !this.state.selectedStepId || this.state.isReadonly || this.state.customIcons.CloneTask;
		this.view.setIsCloneTaskButtonDisabled(isHidden);
	}
}
