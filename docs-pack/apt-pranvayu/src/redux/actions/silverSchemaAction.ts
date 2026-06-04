import { Get, Post, Put } from "../../api/api";
import { AppDispatch } from "../../store/store";
import { showLoader, showNotification } from "./authAction";

export const SILVER_SCHEMA_PAGING = "SILVER_SCHEMA_PAGING";
export const GET_SILVER_SCHEMA_BY_ID = "GET_SILVER_SCHEMA_BY_ID";
export const CREATE_SILVER_SCHEMA = "CREATE_SILVER_SCHEMA";
export const GeT_WAREHOUSE_DATATYPES = "GeT_WAREHOUSE_DATATYPES"
export const GET_SILVER_SCHEMA_LIST="GET_SILVER_SCHEMA_LIST"

export const setSilverSchemaDetails = (item: any) => (dispatch: AppDispatch) =>
  dispatch({
    type: GET_SILVER_SCHEMA_BY_ID,
    payload: item,
  });

export const getSilverSchemaListPagingAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const params = request;
        //Loader
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Get(`${config.BASE_URL}Silver/Paging`, {
          params,
        });
        //
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        dispatch({ type: SILVER_SCHEMA_PAGING, payload: result });
        resolve(result);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: SILVER_SCHEMA_PAGING, payload: { message } });
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });

export const GetWarehouseDatatypesAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const params = request;
        const result: any = await Get(`${config.BASE_URL}ProviderType/GetWarehouseDatatypes`, {
          params,
        });

        dispatch({ type: GeT_WAREHOUSE_DATATYPES, payload: result.data });
        resolve(result.data);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GeT_WAREHOUSE_DATATYPES, payload: { message } });
        resolve(error?.response);
      }
    });

export const getSilverSchemaListAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const params = request;
        //Loader
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Get(`${config.BASE_URL}Silver/List`, {
          params,
        });
        //
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        dispatch({ type: GET_SILVER_SCHEMA_LIST, payload: result.data });
        resolve(result.data);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_SILVER_SCHEMA_LIST, payload: { message } });
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });


export const getSilverSchemaAPI =
  (documentId: string, subscriptionId?: string) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Get(
          `${config.BASE_URL}Silver/${documentId}/Get`,
          {
            headers: {
              Subscription: subscriptionId
            }
          }
        );
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        dispatch(setSilverSchemaDetails(result?.data || null));
        resolve(result?.data || null);
      } catch (e) {
        resolve(e);
        dispatch(showLoader({ isOpen: false }));
      }
    });

export const addSilverSchemaAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Post(
          `${config.BASE_URL}Silver/Create`,
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

export const updateSilverSchemaAPI =
  (documentId: string, request: any) =>
    (dispatch: AppDispatch, getState: any) =>
      new Promise(async (resolve, reject) => {
        try {
          const config = getState().auth.config;
          dispatch(showLoader({ isOpen: true }));
          const result: any = await Put(
            `${config.BASE_URL}Silver/${documentId}/Update`,
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
      })
