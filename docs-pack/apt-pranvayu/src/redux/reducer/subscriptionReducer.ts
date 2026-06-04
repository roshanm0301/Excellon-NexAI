import { AnyAction } from "redux";
import * as actionTypes from "../actions";
import { getLocalData } from "../../utility/utils";

const initialState = {
    subscription: null,
    subscriptions: [],
    count: 0,
    schemaListBySubscriptionId: [],
    providerListBySubscriptionId: [],
    selectedSubscription: null,
    subscriptionById: [],
    getAllSubscriptionByPaging: [],
    pagingCount: null,
    subscriptionSettingList: [],
    subscriptionSettingValueList: [],
    subscriptionListByIdentity: [],
    selectedVersion: getLocalData("selectedVersion"),
    getAppVersion: null
};

const subscriptionReducer = (state = initialState, action: AnyAction) => {

    switch (action.type) {
        case actionTypes.ADD_SUBSCRIPTION: {
            return {
                ...state,
                subscription: action.payload || []
            };
        }
        case actionTypes.SELECTED_VERSION: {
            return {
                ...state,
                selectedVersion: action.payload || []
            };
        }
        case actionTypes.GET_APP_VERSION: {
            return {
                ...state,
                getAppVersion: action.payload
            }
        }
        case actionTypes.GET_SUBSCRIPTION_LIST: {
            return {
                ...state,
                subscriptions: action.payload || [],
                message: action.payload || [],
                count: action.count || 0
            }
        }
        case actionTypes.GET_SCHEMA_LIST_BY_SUBSCRIPTION_ID: {
            return {
                ...state,
                schemaListBySubscriptionId: action.payload?.data || []
            }
        }
        case actionTypes.GET_PROVIDER_BY_SUBSCRIPTION_ID: {
            return {
                ...state,
                providerListBySubscriptionId: action.payload?.data || []
            }
        }
        case actionTypes.SELECTED_SUBSCRIPTION: {
            return {
                ...state,
                selectedSubscription: action.payload
            }
        }
        case actionTypes.GET_SUBSCRIPTION_BY_ID: {
            return {
                ...state,
                subscriptionById: action.payload
            }
        }
        case actionTypes.GET_SUBSCRIPTION_PAGING: {
            return {
                ...state,
                getAllSubscriptionByPaging: action.payload?.data || [],
                pagingCount: action.payload?.count
            }
        }
        case actionTypes.GET_SUBSCRIPTION_SETTING_LIST: {
            return { ...state, subscriptionSettingList: action.payload }
        }
        case actionTypes.GET_SUBSCRIPTION_SETTING_VALUE_LIST: {
            return {
                ...state,
                subscriptionSettingValueList: action.payload || [],
                count: action.count || 0
            }
        }
        case actionTypes.GET_SUBSCRIPTION_LIST_BY_IDENTITY: {
            return {
                ...state,
                subscriptionListByIdentity: action.payload || [],
            }
        }

        default: {
            return state;
        }
    }
};
export default subscriptionReducer;