
import { AppDispatch } from "../../store/store";

export const CONFIRM_DIALOG_OPEN = "CONFIRM_DIALOG_OPEN";
export const CONFIRM_DIALOG_CLOSE = "CONFIRM_DIALOG_CLOSE";

export const confirmDialogOpen = (dialog: any) => (dispatch: AppDispatch, getState: any) => {
	dispatch({
		type: CONFIRM_DIALOG_OPEN,
		payload: dialog,
	})
};

export const confirmDialogClose = () => (dispatch: AppDispatch, getState: any) => {
	dispatch({
		type: CONFIRM_DIALOG_CLOSE,
		payload: false,
	})
};
