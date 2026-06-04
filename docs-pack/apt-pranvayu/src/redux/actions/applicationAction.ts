import { Get, Post, Put } from "../../api/api";
import { AppDispatch } from "../../store/store";
import { showLoader, showNotification } from "./authAction";

export const GET_APPLICATION_LIST_PAGING = "GET_APPLICATION_LIST_PAGING";
export const GET_APPLICATION_LIST = "GET_APPLICATION_LIST";
export const GET_APPLICATION_BY_ID = "GET_APPLICATION_BY_ID";
export const CREATE_APPLICATION = "CREATE_APPLICATION";

export const setApplicationDetails = (item: any) => (dispatch: AppDispatch) =>
    dispatch({
        type: GET_APPLICATION_BY_ID,
        payload: item,
    });

export const getApplicationListPagingAPI =
    (request: any) => (dispatch: AppDispatch, getState: any) =>
        new Promise(async (resolve, reject) => {
            try {
                const config = getState().auth.config;
                const params = request;
                //Loader
                dispatch(showLoader({ isOpen: true }));
                const result: any = await Get(`${config.BASE_URL}Application/Paging`, {
                    params,
                });
                //
                if (result.success) {
                    dispatch(showLoader({ isOpen: false }));
                }
                dispatch({ type: GET_APPLICATION_LIST_PAGING, payload: result });
                resolve(result);
            } catch (error: any) {
                const message = error?.response?.data.message;
                dispatch({ type: GET_APPLICATION_LIST_PAGING, payload: { message } });
                dispatch(showLoader({ isOpen: false }));
                resolve(error?.response);
            }
        });

export const getApplicationListAPI =
    (request: any) => (dispatch: AppDispatch, getState: any) =>
        new Promise(async (resolve, reject) => {
            try {
                const config = getState().auth.config;
                const params = request;
                const result: any = await Get(`${config.BASE_URL}Application/List`, {
                    params,
                });

                dispatch({ type: GET_APPLICATION_LIST, payload: result.data });
                resolve(result.data);
            } catch (error: any) {
                const message = error?.response?.data.message;
                dispatch({ type: GET_APPLICATION_LIST, payload: { message } });
                resolve(error?.response);
            }
        });

export const getApplicationAPI =
    (documentId: string) => (dispatch: AppDispatch, getState: any) =>
        new Promise(async (resolve, reject) => {
            try {
                const config = getState().auth.config;
                const result: any = await Get(
                    `${config.BASE_URL}Application/${documentId}/Get`
                );
                dispatch(setApplicationDetails(result?.data || null));
                resolve(result?.data || null);
            } catch (e) {
                resolve(e);
            }
        });

export const addApplicationAPI =
    (request: any) => (dispatch: AppDispatch, getState: any) =>
        new Promise(async (resolve, reject) => {
            try {
                const config = getState().auth.config;
                const result: any = await Post(`${config.BASE_URL}Application/Create`, request);
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

export const updateApplicationAPI =
    (documentId: string, request: any) =>
        (dispatch: AppDispatch, getState: any) =>
            new Promise(async (resolve, reject) => {
                try {
                    const config = getState().auth.config;
                    const result: any = await Put(
                        `${config.BASE_URL}Application/${documentId}/Update`,
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
