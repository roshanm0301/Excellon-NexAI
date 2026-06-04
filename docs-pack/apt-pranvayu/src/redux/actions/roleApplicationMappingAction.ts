import { Get, Post, Put } from "../../api/api";
import { AppDispatch, RootState } from "../../store/store";
import { showLoader, showNotification } from "./authAction";

export const GET_ROLE_APPLICATION_MAPPING_LIST_PAGING = "GET_ROLE_APPLICATION_MAPPING_LIST_PAGING";
export const GET_ROLE_APPLICATION_MAPPING_LIST = "GET_ROLE_APPLICATION_MAPPING_LIST";
export const GET_ROLE_APPLICATION_MAPPING_BY_ID = "GET_ROLE_APPLICATION_MAPPING_BY_ID";
export const CREATE_ROLE_APPLICATION_MAPPING = "CREATE_ROLE_APPLICATION_MAPPING";
export const GET_ROLE_BY_APPLICATION_ID = "GET_ROLE_BY_APPLICATION_ID"

export const setRoleApplicationMappingDetails = (item: any) => (dispatch: AppDispatch) =>
  dispatch({
    type: GET_ROLE_APPLICATION_MAPPING_BY_ID,
    payload: item,
  });

export const getRoleApplicationMappingListPagingAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const params = request;
        //Loader
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Get(`${config.BASE_URL}RoleApplicationMapping/Paging`, {
          params,
        });
        //
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        dispatch({ type: GET_ROLE_APPLICATION_MAPPING_LIST_PAGING, payload: result });
        resolve(result);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_ROLE_APPLICATION_MAPPING_LIST_PAGING, payload: { message } });
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });

export const GetByApplicationIdAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const result: any = await Post(`${config.BASE_URL}RoleApplicationMapping/GetByApplicationId`, request);
        dispatch({ type: GET_ROLE_BY_APPLICATION_ID, payload: result.data });
        resolve(result.data);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_ROLE_BY_APPLICATION_ID, payload: { message } });
        resolve(error?.response);
      }
    });

export const getRoleApplicationMappingAPI =
  (documentId: string) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const result: any = await Get(
          `${config.BASE_URL}RoleApplicationMapping/${documentId}/Get`
        );
        dispatch(setRoleApplicationMappingDetails(result?.data || null));
        resolve(result?.data || null);
      } catch (e) {
        resolve(e);
      }
    });

export const addRoleApplicationMappingAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const result: any = await Post(`${config.BASE_URL}RoleApplicationMapping/Create`, request);
        resolve(result);
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
      } catch (e) {
        resolve(e);
      }
    });

export const updateRoleApplicationMappingAPI =
  (documentId: string, request: any) =>
    (dispatch: AppDispatch, getState: any) =>
      new Promise(async (resolve, reject) => {
        try {
          const config = getState().auth.config;
          const result: any = await Put(
            `${config.BASE_URL}RoleApplicationMapping/${documentId}/Update`,
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