import { AnyAction } from "redux";
import * as actionTypes from "../actions";

const initialState = {
  applicationList: [],
  applications: [],
  applicationCount: 0,
  message: null,
  application: null,
};

const applicationReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case actionTypes.GET_APPLICATION_LIST_PAGING: {
      return {
        ...state,
        applicationList: action.payload?.data || [],
        applicationCount: action.payload?.count || 0,
        message: action.payload?.message || null,
      };
    }
    case actionTypes.GET_APPLICATION_LIST: {
      return {
        ...state,
        applications: action.payload || [],
      };
    }
    case actionTypes.CREATE_APPLICATION: {
      return {
        ...state,
        application: action.payload,
      };
    }
    case actionTypes.GET_APPLICATION_BY_ID: {
      return {
        ...state,
        application: action.payload,
      };
    }
    default: {
      return state;
    }
  }
};

export default applicationReducer;
