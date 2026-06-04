import { AnyAction } from "redux";
import * as actionTypes from "../actions";

const initialState = {
  goldSchemaList: [],
  goldSchemaCount: 0,
  message: null,
  silverSchemasList: null,
  actionListBySchemaId: [],
  goldSchemas: [],
};

const GoldSchemaReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case actionTypes.GOLD_SCHEMA_PAGING: {
      return {
        ...state,
        goldSchemaList: action.payload?.data || [],
        goldSchemaCount: action.payload?.count || 0,
        message: action.payload?.message || null,
      };
    }
    case actionTypes.GET_GOLD_SCHEMA_BY_ID: {
      return {
        ...state,
        schema: action.payload,
      };
    }
    case actionTypes.GET_GOLD_SCHEMA_LIST: {
      return {
        ...state,
        goldSchemas: action.payload,
      };
    }
    default: {
      return state;
    }
  }
};

export default GoldSchemaReducer;
