import { Get, Post, Put } from "../../api/api";
import { AppDispatch, RootState } from "../../store/store";
import { showLoader, showNotification } from "./authAction";

export const GET_ROLE_LIST_PAGING = "GET_ROLE_LIST_PAGING";
export const GET_ROLE_LIST = "GET_ROLE_LIST";
export const GET_ROLE_BY_ID = "GET_ROLE_BY_ID";
export const CREATE_ROLE = "CREATE_ROLE";
export const GET_NAVIGATION_LIST = "GET_NAVIGATION_LIST"
export const GET_MODERATOR_LIST = "GET_MODERATOR_LIST"

export const setRoleDetails = (item: any) => (dispatch: AppDispatch) =>
  dispatch({
    type: GET_ROLE_BY_ID,
    payload: item,
  });

export const getRoleListPagingAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const params = request;
        //Loader
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Get(`${config.BASE_URL}Role/Paging`, {
          params,
        });
        //
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        dispatch({ type: GET_ROLE_LIST_PAGING, payload: result });
        resolve(result);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_ROLE_LIST_PAGING, payload: { message } });
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });

export const getRoleListAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const params = request;
        const result: any = await Get(`${config.BASE_URL}Role/List`, {
          params,
        });
        dispatch({ type: GET_ROLE_LIST, payload: result });
        resolve(result);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_ROLE_LIST, payload: { message } });
        resolve(error?.response);
      }
    });

export const getRoleAPI =
  (documentId: string) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const result: any = await Get(
          `${config.BASE_URL}Role/${documentId}/GetRoleWithClaims`
        );
        dispatch(setRoleDetails(result?.data || null));
        resolve(result?.data || null);
      } catch (e) {
        resolve(e);
      }
    });

export const addRoleAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const result: any = await Post(`${config.BASE_URL}Role/Create`, request);
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

export const updateRoleAPI =
  (documentId: string, request: any) =>
    (dispatch: AppDispatch, getState: any) =>
      new Promise(async (resolve, reject) => {
        try {
          const config = getState().auth.config;
          const result: any = await Put(
            `${config.BASE_URL}Role/${documentId}/Update`,
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

export const getNavigationListAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const params = request;
        //Loader
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Get(`${config.BASE_URL}Role/GetFeaturesByRoleId`, {
          params,
        });
        //
        if (result?.success) {
          dispatch(showLoader({ isOpen: false }));
          dispatch({ type: GET_NAVIGATION_LIST, payload: result?.data });
          resolve(result.data);
        }

      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_NAVIGATION_LIST, payload: null});
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });

export const getRoleById =
  (documentId: string) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const result: any = await Get(
          `${config.BASE_URL}Role/${documentId}/Get`
        );
        dispatch(setRoleDetails(result?.data || null));
        resolve(result?.data || null);
      } catch (e) {
        resolve(e);
      }
    });

export const getModerateListAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        //Loader
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Post(`${config.BASE_URL}ProvisioningRequest/GetModeratorList`, {
          request,
        });
        //
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        dispatch({ type: GET_MODERATOR_LIST, payload: result.data });
        resolve(result.data);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_MODERATOR_LIST, payload:null });
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });

    export const getMenuBySubscriptionId =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const params = request;
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Get(`${config.BASE_URL}Subscription/GetMenuBySubscriptionId`, {
          params,
        });
        if (result?.success) {
          dispatch(showLoader({ isOpen: false }));
          dispatch({ type: GET_NAVIGATION_LIST, payload: result?.data });
          resolve(result.data);
        }

      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_NAVIGATION_LIST, payload: { message } });
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });