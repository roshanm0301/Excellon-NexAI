import { Post, Put } from "../../api/api";
import { AppDispatch } from "../../store/store";
import { showNotification } from "./authAction";

export const CREATE_CLAIM = "CREATE_CLAIM";

export const addClaimAPI =
  (request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        const result: any = await Post(`${config.BASE_URL}Claims/SaveClaim`, request);
        resolve(result);
        //
        if (result.success) {
          dispatch(showNotification({
            isOpen: true,
            message: "Added Successfully!!",
            type: "success",
          }));
        }
        //
      } catch (e: any) {
        resolve(e);
        if (e.response.data.success === false) {
          dispatch(showNotification({
            isOpen: true,
            message: `Error!! { ${e.response.data.message} }`,
            type: "error",
          }));
        }
      }
    });

export const updateClaimAPI =
  (documentId: string, request: any) =>
    (dispatch: AppDispatch, getState: any) =>
      new Promise(async (resolve, reject) => {
        try {
          const config = getState().auth.config;
          const result: any = await Put(
            `${config.BASE_URL}Claims/${documentId}/UpdateClaims`,
            request
          );
          //
          if (result.success) {
            dispatch(showNotification({
              isOpen: true,
              message: "Updated Successfully!!",
              type: "success",
            }));
          }
          resolve(result);
          //
        } catch (e: any) {
          resolve(e);
          if (e.response.data.success === false) {
            dispatch(showNotification({
              isOpen: true,
              message: `Error!! { ${e.response.data.message} }`,
              type: "error",
            }));
          }
        }
      });