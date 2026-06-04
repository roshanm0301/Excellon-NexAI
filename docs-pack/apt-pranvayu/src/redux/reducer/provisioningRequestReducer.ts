import { AnyAction } from "redux";
import * as actionTypes from "../actions";

const initialState = {
   approval : null,
   approvals: [],
   requests: [],
   approvalCount: 0,
   requestCount: 0,
   message: null,
   requestPickList:null
};

const approvalReducer = (state = initialState, action: AnyAction) => {
    switch (action.type) {
        case actionTypes.GET_APPROVAL_LIST :{
            return {
                ...state,
                approvals : action.payload?.data || [],
                approvalCount: action.payload?.count || 0,
                message: action.payload?.message || null,
            }
        }
        case actionTypes.GET_REQUEST_LIST :{
            return {
                ...state,
                requests : action.payload?.data || [],
                requestCount: action.payload?.count || 0,
                message: action.payload?.message || null,
            }
        }
        case actionTypes.CREATE_APPROVAL: {
            return {
                ...state,
                approval: action.payload,
            }
        }
        case actionTypes.GET_APPROVAL_BY_ID: {
            return {
                ...state,
                approval: action.payload,
            };
        }
        case actionTypes.GET_REQUEST_TYPE_PICK_LIST: {
            return {
                ...state,
                requestPickList: action.payload?.data || [],
            };
        }
        default: {
            return state;
        }
    }
};
export default approvalReducer;