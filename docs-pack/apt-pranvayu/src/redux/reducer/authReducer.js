import { shrushtiDefaultConfig } from "../../config";
import { getAuthData, getLocalData, getUserData } from "../../utility/utils";
import * as actionTypes from "../actions";

const initialState = {
	config: getLocalData('CONFIG_DATA') ? getLocalData('CONFIG_DATA') : shrushtiDefaultConfig,
	whoamiData: getAuthData(),
	userData: getUserData(),
	loginFailed: null,
	notification: false,
	isLoaderOpen: false,
	socket: null,
	isManagementUser: true,
	selectedUser: false,
	IsSubscriptionChanged: false,
	isProduct: getLocalData('IS_BASE_PRODUCT') ? getLocalData('IS_BASE_PRODUCT') : null
};

const authReducer = (state = initialState, action) => {
	switch (action.type) {
		case actionTypes.WHO_AMI_DATA: {
			return {
				...state,
				whoamiData: action.payload,
			};
		}
		case actionTypes.CONFIG_DATA: {
			return {
				...state,
				config: action.payload,
			};
		}
		case actionTypes.USER_LOGIN_DATA: {
			return {
				...state,
				userData: action.payload || null,
			};
		}
		case actionTypes.SOCKET_IO: {
			return {
				...state,
				socket: action.payload,
			};
		}
		case actionTypes.USER_LOGIN_FAILED: {
			return {
				...state,
				loginFailed: action.payload,
			};
		}
		case actionTypes.SHOW_NOTIFICATION: {
			return { ...state, notification: action.payload };
		}
		case actionTypes.HIDE_NOTIFICATION: {
			return { ...state, notification: false };
		}
		case actionTypes.ON_OPEN_LOADER: {
			return {
				...state,
				isLoaderOpen: action.payload,
			};
		}
		case actionTypes.USER_SELECTION: {
			return {
				...state,
				selectedUser: action.payload,
			};
		}
		case actionTypes.SUBSCRIPTION_CHANGE: {
			return {
				...state,
				IsSubscriptionChanged: action.payload,
			};
		}
		case actionTypes.IS_BASE_PRODUCT: {
			return {
				...state,
				isProduct: action.payload,
			};
		}

		default: {
			return state;
		}
	}
};

export default authReducer;
