import { AnyAction } from "redux";
import * as actionTypes from "../actions";

const initialState = {
  schemaByReferenceId: [],
  actionByReferenceId: [],
  updatedVersionDataForAction: [],
  updatedVersionDataForSchema: []
};

const publishRequestReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case actionTypes.GET_SCHEMA_BY_REFERENCE_ID: {
      return {
        ...state,
        schemaByReferenceId: action.payload?.data || [],
      };
    }
    case actionTypes.GET_ACTION_BY_REFERENCE_ID: {
      return {
        ...state,
        actionByReferenceId: action.payload?.data || [],
      };
    }
    case actionTypes.GET_UPDATED_VERSION_DATA: {
      return {
        ...state,
        updatedVersionDataForAction: action.payload?.data?.Actions.map((item:any) => ({ ...item, type: "Action" })) || [],
        updatedVersionDataForSchema: action.payload?.data?.Schema.map((item:any) => ({ ...item, type: "Schema" })) || []
      };
    }
    default: {
      return state;
    }
  }
};

export default publishRequestReducer;
