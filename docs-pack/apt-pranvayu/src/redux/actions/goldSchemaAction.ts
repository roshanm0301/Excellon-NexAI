import { Get, Post, Put } from "../../api/api";
import { AppDispatch } from "../../store/store";
import { showLoader, showNotification } from "./authAction";

export const GOLD_SCHEMA_PAGING = "GOLD_SCHEMA_PAGING";
export const GET_GOLD_SCHEMA_BY_ID = "GET_GOLD_SCHEMA_BY_ID";
export const CREATE_GOLD_SCHEMA = "CREATE_GOLD_SCHEMA";
export const GET_GOLD_SCHEMA_LIST="GET_GOLD_SCHEMA_LIST"

export const setGoldSchemaDetails = (item: any) => (dispatch: AppDispatch) =>
  dispatch({
    type: GET_GOLD_SCHEMA_BY_ID,
    payload: item,
  });

export const getGoldSchemaPagingAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const params = request;
        //Loader
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Get(`${config.BASE_URL}Gold/Paging`, {
          params,
        });
        //
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        dispatch({ type: GOLD_SCHEMA_PAGING, payload: result });
        resolve(result);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GOLD_SCHEMA_PAGING, payload: { message } });
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });

export const getGoldSchemaListAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const params = request;
        //Loader
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Get(`${config.BASE_URL}Gold/List`, {
          params,
        });
        //
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        dispatch({ type: GET_GOLD_SCHEMA_LIST, payload: result.data });
        resolve(result.data);
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_GOLD_SCHEMA_LIST, payload: { message } });
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });


export const getGoldSchemaAPI =
  (documentId: string, subscriptionId?: string) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Get(
          `${config.BASE_URL}Gold/${documentId}/Get`,
          {
            headers: {
              Subscription: subscriptionId
            }
          }
        );
        if (result.success) {
          dispatch(showLoader({ isOpen: false }));
        }
        dispatch(setGoldSchemaDetails(result?.data || null));
        resolve(result?.data || null);
      } catch (e) {
        resolve(e);
        dispatch(showLoader({ isOpen: false }));
      }
    });

export const addGoldSchemaAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        dispatch(showLoader({ isOpen: true }));
        const result: any = await Post(
          `${config.BASE_URL}Gold/Create`,
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

export const updateGoldSchemaAPI =
  (documentId: string, request: any) =>
    (dispatch: AppDispatch, getState: any) =>
      new Promise(async (resolve, reject) => {
        try {
          const config = getState().auth.config;
          dispatch(showLoader({ isOpen: true }));
          const result: any = await Put(
            `${config.BASE_URL}Gold/${documentId}/Update`,
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
