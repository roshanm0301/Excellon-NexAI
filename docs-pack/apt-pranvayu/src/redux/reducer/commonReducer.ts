import * as actionTypes from "../actions";
import { AnyAction } from 'redux';
interface IDialog {
	isOpen: boolean,
	title: string | null,
	subTitle: string | null,
	item?: any,
};

interface IState {
	dialog: IDialog
}

const initialState: IState = {
	dialog: {
		isOpen: false,
		title: null,
		subTitle: null,
		item: null,
	},
};

const commonReducer = (state = initialState, action: AnyAction) => {
	switch (action.type) {
		case actionTypes.CONFIRM_DIALOG_OPEN: {
			return {
				...state,
				dialog: action.payload,
			};
		}

		case actionTypes.CONFIRM_DIALOG_CLOSE: {
			return {
				...state,
				dialog: { ...state.dialog, isOpen: action.payload },
			};
		}

		default: {
			return state;
		}
	}
};

export default commonReducer;
