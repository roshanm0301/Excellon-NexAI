import { Get, Post, Put } from "../../api/api";
import { AppDispatch } from "../../store/store";
import { setLocalData } from "../../utility/utils";
import { showLoader, showNotification } from "./authAction";

export const GET_SCHEMA_LIST_PAGING = "GET_SCHEMA_LIST_PAGING";
export const GET_SCHEMA_LIST = "GET_SCHEMA_LIST";
export const GET_SCHEMA_BY_ID = "GET_SCHEMA_BY_ID";
export const CREATE_SCHEMA = "CREATE_SCHEMA";
export const GET_HISTORY_BY_ID = "GET_HISTORY_BY_ID";
export const SELECTED_ITEMS = "SELECTED_ITEMS";
export const ACTION_LIST_BY_SCHEMA_ID = "ACTION_LIST_BY_SCHEMA_ID";
export const TREE_VIEW_OPEN = "TREE_VIEW_OPEN";
export const SCHEMA_ACTION_LIST = "SCHEMA_ACTION_LIST";
export const SELECTED_ITEM_ID = "SELECTED_ITEM_ID";
export const IS_CLONE_ACTION = "IS_CLONE_ACTION";
export const GET_SCHEMA_LIST_BY_SUBSCRIPTION = "GET_SCHEMA_LIST_BY_SUBSCRIPTION";

export const setSchemaDetails = (item: any) => (dispatch: AppDispatch) =>
  dispatch({
    type: GET_SCHEMA_BY_ID,
    payload: item,
  });

export const getSchemaListPagingAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const params = request;
        //Loader
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Get(`${config.BASE_URL}Schema/Paging`, {
          params,
        });
        //
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        dispatch({ type: GET_SCHEMA_LIST_PAGING, payload: result });
        resolve(result);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_SCHEMA_LIST_PAGING, payload: { message } });
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });

export const getSchemaListAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const params = request;
        //Loader
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Get(`${config.BASE_URL}Schema/List`, {
          params,
        });
        //
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        dispatch({ type: GET_SCHEMA_LIST, payload: result.data });
        resolve(result.data);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_SCHEMA_LIST, payload: { message } });
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });

export const getSchemaListBySubscriptionAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = request.config
        const params = request.request;
        //Loader
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Get(`${config.BASE_URL}Schema/List`, {
          params,
          headers: config 
        });
        //
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        dispatch({ type: GET_SCHEMA_LIST_BY_SUBSCRIPTION, payload: result.data });
        resolve(result.data);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_SCHEMA_LIST_BY_SUBSCRIPTION, payload: { message } });
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });

export const getSchemaAPI =
  (documentId: string, subscriptionId?: string) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Get(
          `${config.BASE_URL}Schema/${documentId}/Get`,
          {
            headers: {
              Subscription: subscriptionId
            }
          }
        );
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        dispatch(setSchemaDetails(result?.data || null));
        resolve(result?.data || null);
      } catch (e) {
        resolve(e);
        dispatch(showLoader({ isOpen: false }));
      }
    });

export const addSchemaAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Post(
          `${config.BASE_URL}Schema/Create`,
          request
        );
        //
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
          dispatch(
            showNotification({
              isOpen: true,
              message: "Added Successfully!!",
              type: "success",
            })
          );
          resolve(result);
        } else {
          dispatch(showLoader({ isOpen: false }));
          dispatch(
            showNotification({
              isOpen: true,
              message: result.data,
              type: "error",
            })
          );
        }
        //
      } catch (e: any) {
        dispatch(showLoader({ isOpen: false }));
        dispatch(
          showNotification({
            isOpen: true,
            message: e?.response?.data?.data,
            type: "error",
          })
        );
        resolve(e);
      }
    });

export const updateSchemaAPI =
  (documentId: string, request: any) =>
    (dispatch: AppDispatch, getState: any) =>
      new Promise(async (resolve, reject) => {
        try {
          const config = getState().auth.config;
          dispatch(showLoader({ isOpen: true }));
          const result: any = await Put(
            `${config.BASE_URL}Schema/${documentId}/Update`,
            request
          );
          resolve(result);
          //
          if (result.success) {
            dispatch(showLoader({ isOpen: false }));
            dispatch(
              showNotification({
                isOpen: true,
                message: "Updated Successfully!!",
                type: "success",
              })
            );
          } else {
            dispatch(showLoader({ isOpen: false }));
            dispatch({
              isOpen: true,
              message: "Error!!",
              type: "error",
            });
          }
          //
        } catch (e: any) {
          dispatch(showLoader({ isOpen: false }));
          dispatch(
            showNotification({
              isOpen: true,
              message: e?.response?.data?.data,
              type: "error",
            })
          );
          resolve(e);
        }
      });

export const GetHistoryByParentId =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Post(
          `${config.BASE_URL}History/GetHistoryByParentId`,
          request
        );

        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        dispatch({ type: GET_HISTORY_BY_ID, payload: result });
        resolve(result);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_HISTORY_BY_ID, payload: { message } });
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });

export const RevertHistoryByParentId =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Post(
          `${config.BASE_URL}History/RevertHistory`,
          request
        );

        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }

        resolve(result);
      } catch (error: any) {
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });

export const AryaLakehouseIntegration =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Post(
          `${config.BASE_URL}AryaSchema/AryaDataFlow`,
          request
        );
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        resolve(result);
      } catch (error: any) {
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });

export const GetActionListBySchemaId =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Post(
          `${config.BASE_URL}Schema/GetActionListBySchemaId`,
          request
        );
        if (result.success) {
          dispatch({ type: ACTION_LIST_BY_SCHEMA_ID, payload: result.data });
          dispatch(showLoader({ isOpen: false }));
        }
        resolve(result);
      } catch (error: any) {
        dispatch({ type: ACTION_LIST_BY_SCHEMA_ID, payload: null });
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });

export const IsTreeViewOpened =
  (treeViewOpen: any) => (dispatch: AppDispatch) =>
    dispatch({
      type: TREE_VIEW_OPEN,
      payload: treeViewOpen,
    });

export const SchemaActionList = () => (dispatch: AppDispatch, getState: any) =>
  new Promise(async (resolve, reject) => {
    try {
      const config = getState().auth.config;
      dispatch(showLoader({ isOpen: true }));
      const result: any = await Get(
        `${config.BASE_URL}Schema/SchemaActionList`,
        {}
      );
      if (result.success) {
        dispatch({ type: SCHEMA_ACTION_LIST, payload: result.data });
        dispatch(showLoader({ isOpen: false }));
      }
      resolve(result);
    } catch (error: any) {
      dispatch({ type: SCHEMA_ACTION_LIST, payload: null });
      dispatch(showLoader({ isOpen: false }));
      resolve(error?.response);
    }
  });


export const SelectedItems =
  (selectedItems: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        dispatch({ type: SELECTED_ITEMS, payload: selectedItems });
        setLocalData("SELECTED_ITEMS", selectedItems);
      } catch (error: any) {
        dispatch({ type: SELECTED_ITEMS, payload: [] });
      }
    });

export const setSelectedItemId =
  (selectedItemId: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        dispatch({ type: SELECTED_ITEM_ID, payload: selectedItemId });
        setLocalData("SELECTED_ITEM_ID", selectedItemId);
      } catch (error: any) {
        dispatch({ type: SELECTED_ITEM_ID, payload: null });
      }
    });
