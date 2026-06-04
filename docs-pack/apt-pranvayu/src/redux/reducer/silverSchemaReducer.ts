import { AnyAction } from "redux";
import * as actionTypes from "../actions";
import { getLocalData } from "../../utility/utils";

const initialState = {
  silverSchemaList: [],
  schemas: [],
  silverSchemaCount: 0,
  message: null,
  silverSchemasList: null,
  historyById: null,
  selectedItems: getLocalData("SELECTED_ITEMS")
    ? getLocalData("SELECTED_ITEMS")
    : [],
  actionListBySchemaId: [],
  treeViewOpen: true,
  isDirty: false,
  schemaActionList: [],
  selectedItemId: getLocalData("SELECTED_ITEM_ID")
    ? getLocalData("SELECTED_ITEM_ID")
    : null,
  IsCloneActionId: null,
  schemaListBySubscription: [],
  getWarehouseDatatypesList: []
};

const silverSchemaReducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case actionTypes.SILVER_SCHEMA_PAGING: {
      return {
        ...state,
        silverSchemaList: action.payload?.data || [],
        silverSchemaCount: action.payload?.count || 0,
        message: action.payload?.message || null,
      };
    }
    case actionTypes.GET_SILVER_SCHEMA_LIST: {
      return {
        ...state,
        silverSchemasList: action.payload || [],
      };
    }
    case actionTypes.CREATE_SCHEMA: {
      return {
        ...state,
        schema: action.payload,
      };
    }
    case actionTypes.GET_SCHEMA_BY_ID: {
      return {
        ...state,
        schema: action.payload,
      };
    }
    case actionTypes.GET_HISTORY_BY_ID: {
      return {
        ...state,
        historyById: action.payload,
      };
    }
    case actionTypes.SELECTED_ITEMS: {
      return {
        ...state,
        selectedItems: action.payload,
      };
    }
    case actionTypes.ACTION_LIST_BY_SCHEMA_ID: {
      return {
        ...state,
        actionListBySchemaId: action.payload,
      };
    }
    case actionTypes.TREE_VIEW_OPEN: {
      return {
        ...state,
        treeViewOpen: action.payload,
      };
    }
    case actionTypes.SCHEMA_ACTION_LIST: {
      const data = action.payload?.map((item: any) => ({
        id: item.id,
        text: item.DisplayName,
        Type: "Schema",
        expanded: false,
        Status: item.Status,
        icon: 'activefolder',
        isDirty: false,
        onLoad: false,
        Data: null,
        items: item.Action.map((action: any) => ({
          id: action._id,
          text: action.DisplayName,
          Type: "Action",
          Status: action.Status,
          icon: 'file',
          isDirty: false,
          Data: null,
          onLoad: false,
          SchemaId: null,
        })),
      }));
      return {
        ...state,
        schemaActionList: data,
      };
    }
    case actionTypes.SELECTED_ITEM_ID: {
      return {
        ...state,
        selectedItemId: action.payload,
      };
    }
    case actionTypes.GET_SCHEMA_LIST_BY_SUBSCRIPTION: {
      return {
        ...state,
        schemaListBySubscription: action.payload,
      };
    }
    case actionTypes.GeT_WAREHOUSE_DATATYPES: {
      return {
        ...state,
        getWarehouseDatatypesList: action.payload,
      };
    }
    default: {
      return state;
    }
  }
};

export default silverSchemaReducer;
