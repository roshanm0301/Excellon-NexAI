
import { Get, Put, Post } from "../../api/api";
import { AppDispatch } from "../../store/store";
import { showLoader, showNotification } from "./authAction";
export const MOCK_APPROVAL_LIST = 'MOCK_APPROVAL_LIST'
export const GET_APPROVAL_LIST = "GET_APPROVAL_LIST";
export const GET_APPROVAL_BY_ID = "GET_APPROVAL_BY_ID";
export const CREATE_APPROVAL = "CREATE_APPROVAL";
export const GET_REQUEST_LIST = "GET_REQUEST_LIST";
export const GET_REQUEST_TYPE_PICK_LIST = 'GET_REQUEST_TYPE_PICK_LIST';

export const setApprovalDetails = (item: any) => (dispatch: AppDispatch) =>
    dispatch({
        type: GET_APPROVAL_BY_ID,
        payload: item,
    });

export const getApprovalListAPI = (params: any, request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
        try {
            const config = getState().auth.config;
            dispatch(showLoader({ isOpen: true }));
            const result: any = await Post(`${config.BASE_URL}ProvisioningRequest/PendingApprovals`, request, { params: params });
            if (result.success) {
                dispatch(showLoader({ isOpen: false }));
            }
            dispatch({ type: GET_APPROVAL_LIST, payload: result });
            resolve(result);
        } catch (error: any) {
            dispatch({ type: GET_APPROVAL_LIST, payload: null });
            dispatch(showLoader({ isOpen: false }));
            resolve(error?.response);
        }
    });

export const getRequestListAPI = (params: any, request: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
        try {
            const config = getState().auth.config;
            dispatch(showLoader({ isOpen: true }));
            const result: any = await Post(`${config.BASE_URL}ProvisioningRequest/PendingRequest`, request, { params: params });
            if (result.success) {
                dispatch(showLoader({ isOpen: false }));
            }
            dispatch({ type: GET_REQUEST_LIST, payload: result });
            resolve(result);
        } catch (error: any) {
            dispatch({ type: GET_REQUEST_LIST, payload: null });
            dispatch(showLoader({ isOpen: false }));
            resolve(error?.response);
        }
    });

export const getApprovalAPI = (_id: string) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
        try {
            const config = getState().auth.config;
            const result: any = await Get(`${config.BASE_URL}ProvisioningRequest/${_id}/GetByIdRequest`);
            dispatch(setApprovalDetails(result?.data || null));
            resolve(result?.data || null);

        } catch (e) {
            resolve(e);
        }
    });

export const addApprovalAPI =
    (request: any) => (dispatch: AppDispatch, getState: any) =>
        new Promise(async (resolve, reject) => {
            try {
                const config = getState().auth.config;
                dispatch(showLoader({ isOpen: true }));
                const result: any = await Post(`${config.BASE_URL}ProvisioningRequest/PostRequest`, request);
                if (result.success) {
                    dispatch(showLoader({ isOpen: false }));
                    dispatch(showNotification({
                        isOpen: true,
                        message: "Added Successfully!!",
                        type: "success",
                    }));
                    resolve(result);
                } else {
                    dispatch(showLoader({ isOpen: false }));
                    dispatch(showNotification({
                        isOpen: true,
                        message: result.data,
                        type: "error",
                    }));
                }
            } catch (e: any) {
                dispatch(showLoader({ isOpen: false }));
                resolve(e);
                dispatch(showNotification({
                    isOpen: true,
                    message: e.message,
                    type: "error",
                }));
            }
        });

export const updateApprovalAPI =
    (documentId: string, request: any) =>
        (dispatch: AppDispatch, getState: any) =>
            new Promise(async (resolve, reject) => {
                try {
                    const config = getState().auth.config;
                    dispatch(showLoader({ isOpen: true }));
                    const result: any = await Put(
                        `${config.BASE_URL}ProvisioningRequest/${documentId}/PutRequest`,
                        request
                    );
                    resolve(result);
                    if (result.success) {
                        dispatch(showLoader({ isOpen: false }));
                        dispatch(showNotification({
                            isOpen: true,
                            message: "Updated Successfully!!",
                            type: "success",
                        }));
                    } else {
                        dispatch(showLoader({ isOpen: false }));
                        dispatch({
                            isOpen: true,
                            message: "Error!!",
                            type: "error",
                        });
                    }
                } catch (e: any) {
                    dispatch(showLoader({ isOpen: false }));
                    resolve(e);
                    dispatch(showNotification({
                        isOpen: true,
                        message: e.message,
                        type: "error",
                    }));
                }
            });

export const updateRequestAPI =
    (documentId: string, request: any) =>
        (dispatch: AppDispatch, getState: any) =>
            new Promise(async (resolve, reject) => {
                try {
                    const config = getState().auth.config;
                    dispatch(showLoader({ isOpen: true }));
                    const result: any = await Put(
                        `${config.BASE_URL}ProvisioningRequest/${documentId}/UpdateRequest`,
                        request
                    );
                    resolve(result);
                    if (result.success) {
                        dispatch(showLoader({ isOpen: false }));
                        dispatch(showNotification({
                            isOpen: true,
                            message: "Updated Successfully!!",
                            type: "success",
                        }));
                    } else {
                        dispatch(showLoader({ isOpen: false }));
                        dispatch({
                            isOpen: true,
                            message: "Error!!",
                            type: "error",
                        });
                    }
                } catch (e: any) {
                    dispatch(showLoader({ isOpen: false }));
                    resolve(e);
                    dispatch(showNotification({
                        isOpen: true,
                        message: e.message,
                        type: "error",
                    }));
                }
            });

export const approvedApprovalAPI =
    (documentId: string, request: any) =>
        (dispatch: AppDispatch, getState: any) =>
            new Promise(async (resolve, reject) => {
                try {
                    const config = getState().auth.config;
                    dispatch(showLoader({ isOpen: true }));
                    const result: any = await Put(
                        `${config.BASE_URL}ProvisioningRequest/${documentId}/ApprovedRequest`,
                        request
                    );
                    if (result.success) {
                        dispatch(showLoader({ isOpen: false }));
                        dispatch(showNotification({
                            isOpen: true,
                            message: "Added Successfully!!",
                            type: "success",
                        }));
                        resolve(result);
                    } else {
                        dispatch(showLoader({ isOpen: false }));
                        dispatch(showNotification({
                            isOpen: true,
                            message: result.data,
                            type: "error",
                        }));
                    }
                } catch (e: any) {
                    dispatch(showLoader({ isOpen: false }));
                    dispatch(showNotification({
                        isOpen: true,
                        message: e.message,
                        type: "error",
                    }));
                    resolve(e);
                }
            });

export const requestTypePickList = (params: any) => (dispatch: AppDispatch, getState: any) =>
    new Promise(async (resolve, reject) => {
        try {
            const config = getState().auth.config;
            dispatch(showLoader({ isOpen: true }));
            const result: any = await Get(`${config.BASE_URL}PicklistMaster/Paging`, { params: params });
            if (result.success) {
                dispatch(showLoader({ isOpen: false }));
            }
            dispatch({ type: GET_REQUEST_TYPE_PICK_LIST, payload: result });
            resolve(result);
        } catch (error: any) {
            const message = error?.response?.data.message;
            dispatch({ type: GET_REQUEST_TYPE_PICK_LIST, payload: { message } });
            dispatch(showLoader({ isOpen: false }));
            resolve(error?.response);
        }
    });
