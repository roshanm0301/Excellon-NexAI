import { AnyAction } from "redux";
import * as actionTypes from "../actions";

const initialState = {
  dashboardCount: null,
  actionCount: null
};

const dashboardReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case actionTypes.DASHBOARD_COUNT: {
      return {
        ...state,
        dashboardCount: action.payload || 0,
        message: action.payload || null,
      };
    }
    case actionTypes.COUNT_BY_ACTION: {
      return {
        ...state,
        actionCount: action.payload,
      };
    }
    default: {
      return state;
    }
  }
};

export default dashboardReducer;
