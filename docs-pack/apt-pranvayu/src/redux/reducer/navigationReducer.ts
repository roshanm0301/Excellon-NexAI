import { AnyAction } from "redux";
import * as actionTypes from "../actions";

const initialState = {
	currentPath:"",
};

const navigationReducer = (state = initialState, action: AnyAction) => {
	switch (action.type) {
		case actionTypes.USE_NAVIGATION: {
			return {
				...state,
				currentPath: action.payload || 0,
			};
		}
		default: {
			return state;
		}
	}
};

export default navigationReducer;
