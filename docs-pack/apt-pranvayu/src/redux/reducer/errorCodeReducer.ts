import { AnyAction } from "redux";
import * as actionTypes from "./../actions";

const initialState = {
  errorCodeList: [],
  errorMessageList: [],
  errorByCode: null,
  messageByCode: null,
  actions: [],
  count: 0,
  errorMessage:null,
  message: null,
  action: null,
  errorList:[],
  errorCount:0,
  messageList:[],
  messageCount:0
  // ActionIdsList: []
};

const errorReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case actionTypes.ERROR_CODE_LIST: {
      return {
        ...state,
        errorCodeList: action.payload,
      };
    } case actionTypes.ERROR_MESSAGE_LIST: {
      return {
        ...state,
        errorMessageList: action.payload,
      };
    } case actionTypes.ERROR_BY_CODE_LIST: {
      return {
        ...state,
        errorByCode: action.payload,
      };
    }
    case actionTypes.MESSAGE_BY_CODE_LIST: {
      return {
        ...state,
        messageByCode: action.payload,
      };
    } case actionTypes.ERROR_CODE_LIST_PAGING: {
      return {
        ...state,
        errorList: action.payload?.data || [],
        errorCount: action.payload?.count || 0,
        errorMessage: action.payload?.message || null,
      };
    }case actionTypes.ERROR_MESSAGE_LIST_PAGING: {
      return {
        ...state,
        messageList: action.payload?.data || [],
        messageCount: action.payload?.count || 0,
        message: action.payload?.message || null,
      };
    }

    default: {
      return state;
    }
  }
};

export default errorReducer;
