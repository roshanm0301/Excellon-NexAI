import { API } from "../../api";
import { IAction } from "../../pages/actionWorkflow";
import { AppDispatch } from "../../store/store";
import { showLoader, showNotification } from "./authAction";
export const GET_ACTION_LIST_PAGING = "GET_ACTION_LIST_PAGING";
export const GET_ACTION_LIST = "GET_ACTION_LIST";
export const GET_ACTION_BY_ID = "GET_ACTION_BY_ID";
export const CREATE_ACTION = "CREATE_ACTION";

export const setActionDetails = (item: any) => (dispatch: AppDispatch) =>
  dispatch({
    type: GET_ACTION_BY_ID,
    payload: item,
  });

export const getActionListPagingAPI =
  (request: any, SystemName: string) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const params = request;
        dispatch(showLoader({ isOpen: true }));
        const result: any = await API.Get(`${config.BASE_URL}${SystemName}/Paging`, {
          params,
        });
        dispatch(showLoader({ isOpen: false }));
        dispatch({ type: GET_ACTION_LIST_PAGING, payload: result });
        resolve(result);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_ACTION_LIST_PAGING, payload: { message } });
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });

export const getActionListAPI =
  (SchemaId: string) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        dispatch(showLoader({ isOpen: true }));
        const result: any = await API.Get(
          `${config.BASE_URL}Action/${SchemaId}/List`,
          {}
        );
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
          dispatch({ type: GET_ACTION_LIST, payload: result?.data });
          resolve(result?.data || null);
        } else {
          dispatch(showLoader({ isOpen: false }));
          resolve(null);
        }
      } catch (e) {
        resolve(e);
        dispatch(showLoader({ isOpen: false }));
      }
    });

export const getActionAPI =
  (id: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        dispatch(showLoader({ isOpen: true }));
        const result: any = await API.Get(
          `${config.BASE_URL}Action/${id}/Get`
        );
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
          dispatch(setActionDetails(result?.data || null));
          resolve(result?.data || null);
        }
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch(setActionDetails({ message }));
        dispatch(showLoader({ isOpen: false }));
        resolve(null);
      }
    });

export const addActionAPI =
  (request: IAction) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        dispatch(showLoader({ isOpen: true }));
        const result: any = await API.Post(
          `${config.BASE_URL}Action/Create`,
          request
        );
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
          dispatch(showNotification({
            isOpen: true,
            message: "Added Successfully!!",
            type: "success",
          }));
          dispatch(setActionDetails(result?.data || null));
          resolve(result || null);
        } else {
          dispatch(showLoader({ isOpen: false }));
          dispatch(showNotification({
            isOpen: true,
            message: result.data,
            type: "error",
          }));
          resolve(result);
        }
      } catch (e: any) {
        dispatch(showLoader({ isOpen: false }));
        dispatch(showNotification({
          isOpen: true,
          message: e.message,
          type: "error",
        }));
        resolve(e);
      }
    });

export const updateActionAPI =
  (request: IAction, SchemaId: string, id: string) =>
    (dispatch: AppDispatch, getState: any) =>
      new Promise(async (resolve, reject) => {
        try {
          const config = getState().auth.config;
          dispatch(showLoader({ isOpen: true }));
          const result: any = await API.Put(
            `${config.BASE_URL}Action/${id}/Update`,
            request
          );
          if (result.success) {
            dispatch(showLoader({ isOpen: false }));
            dispatch(showNotification({
              isOpen: true,
              message: "Updated Successfully!!",
              type: "success",
            }));
            dispatch(setActionDetails(result?.data || null));
            resolve(result || null);
          } else {
            dispatch(showLoader({ isOpen: false }));
            resolve(null);
            dispatch(showNotification({
              isOpen: true,
              message: result.data,
              type: "error",
            }));
          }
        } catch (e: any) {
          dispatch(showLoader({ isOpen: false }));
          dispatch(showNotification({
            isOpen: true,
            message: e.message,
            type: "error",
          }));
          resolve(e);
        }
      });
