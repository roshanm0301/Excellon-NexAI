import { API } from "../../api";
import { IAction } from "../../pages/actionWorkflow";
import { AppDispatch } from "../../store/store";
import { showLoader, showNotification } from "./authAction";
export const ERROR_CODE_LIST = "ERROR_CODE_LIST"
export const ERROR_MESSAGE_LIST = "ERROR_MESSAGE_LIST"
export const ERROR_BY_CODE_LIST = "ERROR_BY_CODE_LIST"
export const MESSAGE_BY_CODE_LIST = "MESSAGE_BY_CODE_LIST"
export const ERROR_CODE_LIST_PAGING = "ERROR_CODE_LIST_PAGING"
export const ERROR_MESSAGE_LIST_PAGING = "ERROR_MESSAGE_LIST_PAGING"

export const getErrorListAPI = (request: IAction, params: any) => (dispatch: AppDispatch, getState: any) =>
  new Promise(async (resolve, reject) => {
    try {
      const config = getState().auth.config;
      const result: any = await API.Post(
        `${config.BASE_URL}ErrorCode/ErrorList`,
        request, { params }
      );
      if (result.success) {
        dispatch({ type: ERROR_CODE_LIST, payload: result?.data });
        resolve(result?.data || null);
      } else {
        resolve(null);
      }
    } catch (e) {
      resolve(e);
    }
  });

export const createErrorAPI = (request: IAction) => (dispatch: AppDispatch, getState: any) =>
  new Promise(async (resolve, reject) => {
    try {
      const config = getState().auth.config;
      dispatch(showLoader({ isOpen: true }));
      const result: any = await API.Post(
        `${config.BASE_URL}ErrorCode/Create`,
        request
      );
      if (result.success) {
        dispatch(showLoader({ isOpen: false }));
        resolve(result || null);
      } else {
        dispatch(showLoader({ isOpen: false }));
        resolve(null);
      }
    } catch (e) {
      dispatch(showLoader({ isOpen: false }));
      resolve(e);
    }
  });

export const updateErrorAPI = (documentId: string, request: IAction) => (dispatch: AppDispatch, getState: any) =>
  new Promise(async (resolve, reject) => {
    try {
      const config = getState().auth.config;
      dispatch(showLoader({ isOpen: true }));
      const result: any = await API.Put(
        `${config.BASE_URL}ErrorCode/${documentId}/Update`,
        request
      );
      if (result.success) {
        dispatch(showLoader({ isOpen: false }));
        resolve(result || null);
      } else {
        dispatch(showLoader({ isOpen: false }));
        resolve(null);
      }
    } catch (e) {
      dispatch(showLoader({ isOpen: false }));
      resolve(e);
    }
  });

export const getMessageListAPI = () => (dispatch: AppDispatch, getState: any) =>
  new Promise(async (resolve, reject) => {
    try {
      const config = getState().auth.config;
      const result: any = await API.Get(
        `${config.BASE_URL}ErrorCode/List`,
        {}
      );
      if (result.success) {
        dispatch({ type: ERROR_MESSAGE_LIST, payload: result?.data });
        resolve(result?.data || null);
      } else {
        resolve(null);
      }
    } catch (e) {
      resolve(e);
    }
  });

export const createErrorMessageAPI = (request: IAction) => (dispatch: AppDispatch, getState: any) =>
  new Promise(async (resolve, reject) => {
    try {
      const config = getState().auth.config;
      dispatch(showLoader({ isOpen: true }));
      const result: any = await API.Post(
        `${config.BASE_URL}ErrorCode/Create`,
        request
      );
      if (result.success) {
        dispatch(showLoader({ isOpen: false }));
        resolve(result || null);
      } else {
        dispatch(showLoader({ isOpen: false }));
        resolve(null);
      }
    } catch (e) {
      dispatch(showLoader({ isOpen: false }));
      resolve(e);
    }
  });

export const updateErrorMessageAPI = (documentId: string, request: IAction) => (dispatch: AppDispatch, getState: any) =>
  new Promise(async (resolve, reject) => {
    try {
      const config = getState().auth.config;
      dispatch(showLoader({ isOpen: true }));
      const result: any = await API.Put(
        `${config.BASE_URL}ErrorCode/${documentId}/Update`,
        request
      );
      if (result.success) {
        dispatch(showLoader({ isOpen: false }));
        resolve(result || null);
      } else {
        dispatch(showLoader({ isOpen: false }));
        resolve(null);
      }
    } catch (e) {
      dispatch(showLoader({ isOpen: false }));
      resolve(e);
    }
  });

export const getErrorByCodeAPI = (request: IAction) => (dispatch: AppDispatch, getState: any) =>
  new Promise(async (resolve, reject) => {
    try {
      const config = getState().auth.config;
      const result: any = await API.Post(
        `${config.BASE_URL}ErrorCode/GetByErrorCode`,
        request
      );
      if (result.success) {
        dispatch({ type: ERROR_BY_CODE_LIST, payload: result?.data });
        resolve(result?.data || null);
      } else {
        dispatch({ type: ERROR_BY_CODE_LIST, payload: null });

        resolve(null);
      }
    } catch (e) {
      dispatch({ type: ERROR_BY_CODE_LIST, payload: null });
      dispatch(
        showNotification({
          isOpen: true,
          message: `Does not exist!!!`,
          type: "error",
        })
      );
      resolve(e);
    }
  });

export const getErrorMessageByCodeDescriptionAPI = (request: IAction) => (dispatch: AppDispatch, getState: any) =>
  new Promise(async (resolve, reject) => {
    try {
      const config = getState().auth.config;
      const result: any = await API.Post(
        `${config.BASE_URL}ErrorCode/GetByErrorMessageDescription`,
        request
      );
      if (result.success) {
        dispatch({ type: MESSAGE_BY_CODE_LIST, payload: result?.data });
        resolve(result?.data || null);
      } else {
        dispatch({ type: MESSAGE_BY_CODE_LIST, payload: null });

        resolve(null);
      }
    } catch (e) {
      dispatch({ type: MESSAGE_BY_CODE_LIST, payload: null });

      dispatch(
        showNotification({
          isOpen: true,
          message: `Does not exist!!!`,
          type: "error",
        })
      );

      resolve(e);
    }
  });
export const getErrorListPagingAPI = (params: any) => (dispatch: AppDispatch, getState: any) =>
  new Promise(async (resolve, reject) => {
    try {
      const config = getState().auth.config;
      dispatch(showLoader({ isOpen: true }));

      const result: any = await API.Get(
        `${config.BASE_URL}ErrorCode/Paging`,
        { params }
      );
      if (result.success) {
        dispatch(showLoader({ isOpen: false }));
        dispatch({ type: ERROR_CODE_LIST_PAGING, payload: result });
        resolve(result || null);
      } else {
        resolve(null);
      }
    } catch (e) {
      {
        // const message = e?.response?.data.message;
        // dispatch({ type: GET_SCHEMA_LIST_PAGING, payload: { message } });
        dispatch(showLoader({ isOpen: false }));
        resolve(e);
      }
    }
  });
export const getMessageListPagingAPI = (params: any) => (dispatch: AppDispatch, getState: any) =>
  new Promise(async (resolve, reject) => {
    try {
      const config = getState().auth.config;
      dispatch(showLoader({ isOpen: true }));

      const result: any = await API.Get(
        `${config.BASE_URL}ErrorCode/Paging`,
        { params }
      );
      if (result.success) {
        dispatch(showLoader({ isOpen: false }));
        dispatch({ type: ERROR_MESSAGE_LIST_PAGING, payload: result });
        resolve(result || null);
      } else {
        resolve(null);
      }
    } catch (e) {
      {
        // const message = e?.response?.data.message;
        // dispatch({ type: GET_SCHEMA_LIST_PAGING, payload: { message } });
        dispatch(showLoader({ isOpen: false }));
        resolve(e);
      }
    }
  });
