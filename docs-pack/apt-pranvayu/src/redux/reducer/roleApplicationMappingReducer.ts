import { AnyAction } from "redux";
import * as actionTypes from "../actions";

const initialState = {
  roleApplicationMappingList: [],
  roleApplicationMappings: [],
  count: 0,
  message: null,
  roleApplicationMapping: null,
};

const roleApplicationMappingReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case actionTypes.GET_ROLE_APPLICATION_MAPPING_LIST_PAGING: {
      return {
        ...state,
        roleApplicationMappingList: action.payload?.data || [],
        count: action.payload?.count || 0,
        message: action.payload?.message || null,
      };
    }
    case actionTypes.GET_ROLE_APPLICATION_MAPPING_LIST: {
      return {
        ...state,
        roleApplicationMappings: action.payload || [],
      };
    }
    case actionTypes.CREATE_ROLE_APPLICATION_MAPPING: {
      return {
        ...state,
        roleApplicationMapping: action.payload,
      };
    }
    case actionTypes.GET_ROLE_APPLICATION_MAPPING_BY_ID: {
      return {
        ...state,
        roleApplicationMapping: action.payload,
      };
    }
    case actionTypes.GET_ROLE_BY_APPLICATION_ID: {
      return {
        ...state,
        roleApplicationMapping: action.payload,
      };
    }
    default: {
      return state;
    }
  }
};

export default roleApplicationMappingReducer;
