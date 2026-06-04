import { AnyAction } from "redux";
import * as actionTypes from "../actions";

const initialState = {
  notificationList: [],
  notification: null,
  count: 0,
  notificationListByPaging:[],
  message: null,
  action: null,
  unReadCount:0
  // ActionIdsList: []
};

const notificationReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case actionTypes.GET_NOTIFICATION_LIST_PAGING: {
      return {
        ...state,
        notificationListByPaging: action.payload?.data || [],
        count: action.payload?.count || 0,
        unReadCount: action.payload?.UnreadCount || 0,
        message: action.payload?.message || null,
      };
    } 
    case actionTypes.GET_NOTIFICATION_BY_ID: {
      return {
        ...state,
        notification: action.payload,
      };
    }

    case actionTypes.GET_NOTIFICATION_LIST: {
      return {
        ...state,
        notificationList: action.payload?.data || [],
        count: action.payload?.count || 0,
        unReadCount: action.payload?.UnreadCount || 0,
        message: action.payload?.message || null,
      };
    } 

    default: {
      return state;
    }
  }
};

export default notificationReducer;
