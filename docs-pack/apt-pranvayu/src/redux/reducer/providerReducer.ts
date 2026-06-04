import { AnyAction } from "redux";
import * as actionTypes from "../actions";

const initialState = {
  providerList: [],
  providers: [],
  providerCount: 0,
  message: null,
  provider: null,
  typeByProviderList: []
};

const providerReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case actionTypes.GET_PROVIDER_LIST_PAGING: {
      return {
        ...state,
        providerList: action.payload?.data || [],
        providerCount: action.payload?.count || 0,
        message: action.payload?.message || null,
      };
    }
    case actionTypes.GET_PROVIDER_LIST: {
      return {
        ...state,
        providers: action.payload || [],
      };
    }
    // case actionTypes.CREATE_PROVIDER: {
    //   return {
    //     ...state,
    //     provider: action.payload,
    //   };
    // }
    case actionTypes.GET_PROVIDER_BY_ID: {
      return {
        ...state,
        provider: action.payload,
      };
    }
    case actionTypes.GET_TYPE_BY_PROVIDER: {
      return {
        ...state,
        typeByProviderList: action.payload?.data || [],
      }
    }
    default: {
      return state;
    }
  }
};

export default providerReducer;
