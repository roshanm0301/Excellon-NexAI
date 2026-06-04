import { API } from "../../api";
import { IAction } from "../../pages/actionWorkflow";
import { AppDispatch } from "../../store/store";
import { showLoader, showNotification } from "./authAction";

export const GET_NOTIFICATION_LIST_PAGING = "GET_NOTIFICATION_LIST_PAGING";
export const GET_NOTIFICATION_BY_ID = "GET_NOTIFICATION_BY_ID";
export const GET_NOTIFICATION_LIST = "GET_NOTIFICATION_LIST";

export const getNotificationPagingAPI =
  (params: any, type: string) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        // dispatch(showLoader({ isOpen: true }));
        const result: any = await API.Get(`${config.BASE_URL}Notification/Paging`, {
          params,
        });
        dispatch(showLoader({ isOpen: false }));
        if (type === "list") {
          dispatch({ type: GET_NOTIFICATION_LIST_PAGING, payload: result });
          resolve(result);
        } else {
          dispatch({ type: GET_NOTIFICATION_LIST, payload: result });
          resolve(result);
        }
      } catch (error: any) {
        const message = error?.response?.data.message;
        dispatch({ type: GET_NOTIFICATION_LIST_PAGING, payload: { message } });
        dispatch(showLoader({ isOpen: false }));
        resolve(error?.response);
      }
    });

export const updateNotificationAPI =
  (request: IAction, id: string) =>
    (dispatch: AppDispatch, getState: any) =>
      new Promise(async (resolve, reject) => {
        try {
          const config = getState().auth.config;
          const result: any = await API.Put(
            `${config.BASE_URL}Notification/${id}/Update`,
            request
          );
          if (result.success) {

            resolve(result || null);
          } else {
            resolve(null);
            dispatch(showNotification({
              isOpen: true,
              message: result.data,
              type: "error",
            }));
          }
        } catch (e: any) {

          resolve(e);
        }
      });

export const getNotificationAPI =
  (id: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        dispatch(showLoader({ isOpen: true }));
        const result: any = await API.Get(
          `${config.BASE_URL}Notification/${id}/Get`
        );
        if (result.success) {
          dispatch({ type: GET_NOTIFICATION_BY_ID, payload: result?.data });
          dispatch(showLoader({ isOpen: false }));
          resolve(result?.data || null);
        }
      } catch (error: any) {
        dispatch(showLoader({ isOpen: false }));
        dispatch({ type: GET_NOTIFICATION_BY_ID, payload: null });

        resolve(null);
      }
    });