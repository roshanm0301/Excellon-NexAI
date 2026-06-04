import { AnyAction } from "redux";
import * as actionTypes from "../actions";

const initialState = {
  roleList: [],
  roles: [],
  roleCount: 0,
  message: null,
  role: null,
  navigationList: [],
  moderatorList: [],
};

const roleReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case actionTypes.GET_ROLE_LIST_PAGING: {
      return {
        ...state,
        roleList: action.payload?.data || [],
        roleCount: action.payload?.count || 0,
        message: action.payload?.message || null,
      };
    }
    case actionTypes.GET_ROLE_LIST: {
      return {
        ...state,
        roles: action.payload?.data || [],
      };
    }
    case actionTypes.CREATE_ROLE: {
      return {
        ...state,
        role: action.payload,
      };
    }
    case actionTypes.GET_ROLE_BY_ID: {
      return {
        ...state,
        role: action.payload,
      };
    }
    case actionTypes.GET_NAVIGATION_LIST: {
      let data = action.payload?.sort(
        (a: any, b: any) => a.Sequence - b.Sequence
      );
      return {
        ...state,
        navigationList: data || [],
      };
    }
    case actionTypes.GET_MODERATOR_LIST: {
      const moderatorList =
        action.payload?.length > 0
          ? action.payload.map((i: any) => {
            return { ...i, DisplayName: i.FirstName + " " + i.LastName };
          })
          : [];
      return { ...state, moderatorList };
    }
    default: {
      return state;
    }
  }
};

export default roleReducer;
