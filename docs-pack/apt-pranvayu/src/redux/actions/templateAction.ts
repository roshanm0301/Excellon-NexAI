import { API } from "../../api/api";
import { AppDispatch } from "../../store/store";
import { showLoader, showNotification } from "./authAction";

export const GET_TEMPLATE_LIST_PAGING = "GET_TEMPLATE_LIST_PAGING";
export const GET_TEMPLATE_LIST = "GET_TEMPLATE_LIST";
export const GET_TEMPLATE_BY_ID = "GET_TEMPLATE_BY_ID";
export const CREATE_TEMPLATE = "CREATE_TEMPLATE";
export const GET_TEMPLATE_LIST_BY_SUBSCRIPTION = "GET_TEMPLATE_LIST_BY_SUBSCRIPTION";

export const setTemplateDetails = (item: any) => (dispatch: AppDispatch) =>
  dispatch({
    type: GET_TEMPLATE_BY_ID,
    payload: item,
  });

export const getTemplateListPagingAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const params = request;
        //Loader
        dispatch(showLoader({ isOpen: true }));
        const result: any = await API.Get(`${config.BASE_URL}Template/Paging`, {
          params,
        });
        //
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        dispatch({ type: GET_TEMPLATE_LIST_PAGING, payload: result });
        resolve(result);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_TEMPLATE_LIST_PAGING, payload: { message } });
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });

export const getTemplateListAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const params = request;
        //Loader
        dispatch(showLoader({ isOpen: true }));
        const result: any = await API.Get(`${config.BASE_URL}Template/List`, {
          params,
        });
        //
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        dispatch({ type: GET_TEMPLATE_LIST, payload: result.data });
        resolve(result.data);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_TEMPLATE_LIST, payload: { message } });
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });

export const getTemplateListBySubscriptionAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = request.config
        const params = request.request;
        //Loader
        dispatch(showLoader({ isOpen: true }));
        const result: any = await API.Get(`${config.BASE_URL}Template/List`, {
          params,
          headers: config
        });
        //
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        dispatch({ type: GET_TEMPLATE_LIST_BY_SUBSCRIPTION, payload: result.data });
        resolve(result.data);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_TEMPLATE_LIST_BY_SUBSCRIPTION, payload: { message } });
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });

export const getTemplateAPI =
  (documentId: string, subscriptionId?: string) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        dispatch(showLoader({ isOpen: true }));
        const result: any = await API.Get(
          `${config.BASE_URL}Template/${documentId}/Get`,
          {
            headers: {
              Subscription: subscriptionId
            }
          }
        );
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        dispatch(setTemplateDetails(result?.data || null));
        resolve(result?.data || null);
      } catch (e) {
        resolve(e);
        dispatch(showLoader({ isOpen: false }));
      }
    });

export const addTemplateAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        dispatch(showLoader({ isOpen: true }));
        const result: any = await API.Post(
          `${config.BASE_URL}Template/Create`,
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

export const updateTemplateAPI =
  (documentId: string, request: any) =>
    (dispatch: AppDispatch, getState: any) =>
      new Promise(async (resolve, reject) => {
        try {
          const config = getState().auth.config;
          dispatch(showLoader({ isOpen: true }));
          const result: any = await API.Put(
            `${config.BASE_URL}Template/${documentId}/Update`,
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
