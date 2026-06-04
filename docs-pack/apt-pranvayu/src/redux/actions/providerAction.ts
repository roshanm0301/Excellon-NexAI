import { Get, Post, Put } from "../../api/api";
import { AppDispatch, RootState } from "../../store/store";
import { getSchemaIdFromMetaData } from "../../utility/utils";
import { showLoader, showNotification } from "./authAction";

export const GET_PROVIDER_LIST_PAGING = "GET_PROVIDER_LIST_PAGING";
export const GET_PROVIDER_LIST = "GET_PROVIDER_LIST";
export const GET_PROVIDER_BY_ID = "GET_PROVIDER_BY_ID";
export const CREATE_PROVIDER = "CREATE_PROVIDER";
export const GET_TYPE_BY_PROVIDER = "GET_TYPE_BY_PROVIDER";

export const setProviderDetails = (item: any) => (dispatch: AppDispatch) =>
  dispatch({
    type: GET_PROVIDER_BY_ID,
    payload: item,
  });

export const getProviderListPagingAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const params = request;

        dispatch(showLoader({ isOpen: true }));
        const result: any = await Get(`${config.BASE_URL}Provider/List`, {
          params,
        });
        //
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        dispatch({ type: GET_PROVIDER_LIST_PAGING, payload: result });
        resolve(result);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_PROVIDER_LIST_PAGING, payload: { message } });
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });

export const getProviderListAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const params = request;
        const result: any = await Get(`${config.BASE_URL}ProviderType/List`, {
          params,
        });

        dispatch({ type: GET_PROVIDER_LIST, payload: result.data });
        resolve(result.data);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_PROVIDER_LIST, payload: { message } });
        resolve(error?.response);
      }
    });

export const getProviderAPI =
  (documentId: string) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const result: any = await Get(
          `${config.BASE_URL}Provider/${documentId}/Get`
        );
        dispatch(setProviderDetails(result?.data || null));
        resolve(result?.data || null);
      } catch (e) {
        resolve(e);
      }
    });

export const addProviderAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const result: any = await Post(`${config.BASE_URL}Provider/Create`, request);
        resolve(result);
        //
        if (result.success) {
          dispatch(showNotification({
            isOpen: true,
            message: "Added Successfully!!",
            type: "success",
          }));
        } else {
          dispatch({
            isOpen: true,
            message: "Error!!",
            type: "error",
          });
        }
        //
      } catch (e) {
        resolve(e);
      }
    });

export const updateProviderAPI =
  (documentId: string, request: any) =>
    (dispatch: AppDispatch, getState: any) =>
      new Promise(async (resolve, reject) => {
        try {
          const config = getState().auth.config;
          const result: any = await Put(
            `${config.BASE_URL}Provider/${documentId}/Update`,
            request
          );
          resolve(result);
          //
          if (result.success) {
            dispatch(showNotification({
              isOpen: true,
              message: "Updated Successfully!!",
              type: "success",
            }));
          } else {
            dispatch({
              isOpen: true,
              message: "Error!!",
              type: "error",
            });
          }
          //
        } catch (e) {
          resolve(e);
        }
      });

export const GetTypeByProviderAPI = (params: any, request: any) => (dispatch: AppDispatch, getState: any) =>
  new Promise(async (resolve, reject) => {
    try {
      const config = getState().auth.config;
      dispatch(showLoader({ isOpen: true }));
      const result: any = await Post(`${config.BASE_URL}ProviderType/GetTypeByProvider`, request, { params: params });
      if (result.success) {
        dispatch(showLoader({ isOpen: false }));
      }
      dispatch({ type: GET_TYPE_BY_PROVIDER, payload: result });
      resolve(result);
      
    } catch (error: any) {
      dispatch({ type: GET_TYPE_BY_PROVIDER, payload:null});
      dispatch(showLoader({ isOpen: false }));
      resolve(error?.response);
    }
  });