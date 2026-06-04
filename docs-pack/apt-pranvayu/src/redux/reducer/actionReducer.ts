import { AnyAction } from "redux";
import * as actionTypes from "./../actions";

const initialState = {
  actionList: [],
  actions: [],
  count: 0,
  message: null,
  action: null,
  // ActionIdsList: []
};

const actionReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case actionTypes.GET_ACTION_LIST_PAGING: {
      return {
        ...state,
        actionList: action.payload?.data || [],
        count: action.payload?.count || 0,
        message: action.payload?.message || null,
      };
    }
    case actionTypes.GET_ACTION_LIST: {
      return {
        ...state,
        actions: action.payload,
        count: action.payload?.length,
      };
    }
    case actionTypes.CREATE_ACTION: {
      return {
        ...state,
        action: action.payload,
      };
    }
    case actionTypes.GET_ACTION_BY_ID: {
      return {
        ...state,
        action: action.payload,
      };
    }

    default: {
      return state;
    }
  }
};

export default actionReducer;
