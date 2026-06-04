
import { Get, Post } from "../../api/api";
import { AppDispatch } from "../../store/store";
import { showLoader } from "./authAction";
export const GET_SCHEMA_BY_REFERENCE_ID = 'GET_SCHEMA_BY_REFERENCE_ID'
export const GET_ACTION_BY_REFERENCE_ID = 'GET_ACTION_BY_REFERENCE_ID'
export const GET_UPDATED_VERSION_DATA = 'GET_UPDATED_VERSION_DATA'

export const GetSchemaByReferenceId =
    (request: any) => (dispatch: AppDispatch, getState: any) =>
        new Promise(async (resolve, reject) => {
            try {
                const config = getState().auth.config;
                const result: any = await Post(`${config.BASE_URL}Schema/GetSchemaByReferenceId`, request);
                if (result?.success) {
                    //dispatch({ type: GET_SCHEMA_BY_REFERENCE_ID, payload: result });
                    resolve(result?.data);
                }
            } catch (error: any) {
                //dispatch({ type: GET_SCHEMA_BY_REFERENCE_ID, payload: { message } });
                resolve(error?.response);
            }
        });


export const GetActionByReferenceId =
    (request: any) => (dispatch: AppDispatch, getState: any) =>
        new Promise(async (resolve, reject) => {
            try {
                const config = getState().auth.config;
                const result: any = await Post(`${config.BASE_URL}Action/GetActionByReferenceId`, request);
                if (result?.success) {
                    resolve(result?.data);
                }
            } catch (error: any) {
                resolve(error?.response);
            }
        });


export const GetUpdatedVersionData =
    () => (dispatch: AppDispatch, getState: any) =>
        new Promise(async (resolve, reject) => {
            try {
                const config = getState().auth.config;
                dispatch(showLoader({ isOpen: true }));
                const result: any = await Get(`${config.BASE_URL}Version/GetUpdatedVersionData`);
                if (result?.success) {
                    dispatch({ type: GET_UPDATED_VERSION_DATA, payload: result });
                    dispatch(showLoader({ isOpen: false }));
                    resolve(result);
                }
            } catch (error: any) {
                const message = error?.response?.data.message;
                dispatch({ type: GET_UPDATED_VERSION_DATA, payload: { message } });
                resolve(error?.response);
            }
        });

export const getDocumentByActionId =
    (documentId: string) => (dispatch: AppDispatch, getState: any) =>
        new Promise(async (resolve, reject) => {
            try {
                const config = getState().auth.config;
                const result: any = await Get(
                    `${config.BASE_URL}Action/${documentId}/Get`
                );
                if (result.success) {
                    dispatch(showLoader({ isOpen: false }));
                }
                resolve(result?.data || null);
            } catch (e) {
                resolve(e);
            }
        });

export const updateProviderCopyMultipleSchemaAndActionList =
    (request: any) => (dispatch: AppDispatch, getState: any) =>
        new Promise(async (resolve, reject) => {
            try {
                const config = getState().auth.config;
                const result: any = await Post(`${config.BASE_URL}Schema/UpdateProviderCopyMultipleSchemaAndActionList`, request);
                if (result?.success) {
                    resolve(result);
                }
            } catch (error: any) {
                resolve(error?.response);
            }
        });