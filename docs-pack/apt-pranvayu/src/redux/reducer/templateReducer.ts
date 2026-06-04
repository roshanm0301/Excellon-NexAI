import { AnyAction } from "redux";
import * as actionTypes from "../actions";

const initialState = {
  templateList: [],
  templates: [],
  templateCount: 0,
  message: null,
  template: null,
  templateListBySubscription: []
};

const templateReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case actionTypes.GET_TEMPLATE_LIST_PAGING: {
      return {
        ...state,
        templateList: action.payload?.data || [],
        templateCount: action.payload?.count || 0,
        message: action.payload?.message || null,
      };
    }
    case actionTypes.GET_TEMPLATE_LIST: {
      return {
        ...state,
        templates: action.payload || [],
      };
    }
    case actionTypes.CREATE_TEMPLATE: {
      return {
        ...state,
        template: action.payload,
      };
    }
    case actionTypes.GET_TEMPLATE_BY_ID: {
      return {
        ...state,
        template: action.payload,
      };
    }

    case actionTypes.GET_TEMPLATE_LIST_BY_SUBSCRIPTION: {
      return {
        ...state,
        templateListBySubscription: action.payload,
      };
    }
    default: {
      return state;
    }
  }
};

export default templateReducer;
