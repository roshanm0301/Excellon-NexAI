import { AnyAction } from "redux";
import * as actionTypes from "../actions";

const initialState = {
  claim: null,
};

const claimsReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case actionTypes.CREATE_CLAIM: {
      return {
        ...state,
        claim: action.payload,
      };
    }
    default: {
      return state;
    }
  }
};

export default claimsReducer;
