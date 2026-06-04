import { Get, Post } from "../../api";
import { AppDispatch } from "../../store/store";
import { showLoader } from "./authAction";

export const DASHBOARD_COUNT = "DASHBOARD_COUNT";
export const COUNT_BY_ACTION = 'COUNT_BY_ACTION';

export const GetCountOfSystemService =
    (request: any) => (dispatch: AppDispatch, getState: any) =>
        new Promise(async (resolve, reject) => {
            try {
                const config = getState().auth.config;
                const params = request;
                dispatch(showLoader({ isOpen: true }));
                const result: any = await Get(`${config.BASE_URL}Action/GetCountOfSystemService`, {
                    params,
                });
                if (result?.success) {
                    dispatch(showLoader({ isOpen: false }));
                    dispatch({ type: DASHBOARD_COUNT, payload: result.data });
                    resolve(result.data);
                }
            } catch (error: any) {
                const message = error?.response?.data.message;
                dispatch({ type: DASHBOARD_COUNT, payload: { message } });
                resolve(error?.response);
            }
        });


export const GetStatusWiseCountByType =
    (request: any) => (dispatch: AppDispatch, getState: any) =>
        new Promise(async (resolve, reject) => {
            try {
                const config = getState().auth.config;
                dispatch(showLoader({ isOpen: true }));
                const result: any = await Post(`${config.BASE_URL}ProvisioningRequest/GetStatusWiseCountByType`, request);
                // dispatch({ type: DASHBOARD_COUNT, payload: result.data });
                if (result?.success) {
                    dispatch(showLoader({ isOpen: false }));
                    resolve(result);
                }
            } catch (error: any) {
                // const message = error?.response?.data.message;
                // dispatch({ type: DASHBOARD_COUNT, payload: { message } });
                resolve(error?.response);
            }
        });

export const GetCountByActionType =
    (request: any) => (dispatch: AppDispatch, getState: any) =>
        new Promise(async (resolve, reject) => {
            try {
                const config = getState().auth.config;
                dispatch(showLoader({ isOpen: true }));
                const result: any = await Get(`${config.BASE_URL}Action/GetCountByActionType`);
                if (result?.success) {
                    dispatch(showLoader({ isOpen: false }));
                    dispatch({ type: COUNT_BY_ACTION, payload: result.data });
                    resolve(result.data);
                }

            } catch (error: any) {
                const message = error?.response?.data.message;
                //dispatch({ type: COUNT_BY_ACTION, payload: { message } });
                resolve(error?.response);
            }
        });