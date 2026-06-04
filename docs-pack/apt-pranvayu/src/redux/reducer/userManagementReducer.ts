import { AnyAction } from "redux";
import * as actionTypes from "../actions";

const initialState = {
   user : null,
   usersList:[],
   getUserById:null,
};

const userManagementReducer = (state = initialState, action: AnyAction) => {
    switch (action.type) {
           case actionTypes.GET_IDENTITY_LIST :{
            return {
                ...state,
                usersList : action.payload 
            }
        }
        case actionTypes.GET_USER_BY_ID :{
            return {
                ...state,
                getUserById : action.payload ,
            }
        }
        default: {
            return state;
        }
    }
};
export default userManagementReducer;