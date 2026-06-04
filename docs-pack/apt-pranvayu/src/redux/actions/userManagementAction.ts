import { API, Post, Put } from "../../api";
import { Get, Remove } from "../../mockData/mockData";
import { AppDispatch } from "../../store/store";
import { showLoader, showNotification } from "./authAction";

export const GET_USERS_LIST = "GET_USERS_LIST";
export const CREATE_USER = "CREATE_USER";
export const GET_USER_BY_ID = 'GET_USER_BY_ID';
export const GET_IDENTITY_LIST = 'GET_IDENTITY_LIST'

export const setUserDetails = (item: any) => (dispatch: AppDispatch) =>
	dispatch({
		type: GET_USER_BY_ID,
		payload: item,
	});


export const GetAllIdentityList = (request: any) => (dispatch: AppDispatch, getState: any) =>
	new Promise(async (resolve, reject) => {
		try {
			const config = getState().auth.config;
			dispatch(showLoader({ isOpen: true }));
			const result: any = await API.Get(`${config.BASE_URL}Identity/GetAllIdentityList`);
			dispatch(showLoader({ isOpen: false }));
			dispatch({ type: GET_IDENTITY_LIST, payload: result });
			resolve(result);
		} catch (error: any) {
			const message = error?.response?.data.message;
			dispatch({ type: GET_IDENTITY_LIST, payload: { message } });
			dispatch(showLoader({ isOpen: false }));
			resolve(error?.response);
		}
	})

export const GetIdentityById =
	(documentId: string) => (dispatch: AppDispatch, getState: any) =>
		new Promise(async (resolve, reject) => {
			try {
				const config = getState().auth.config;
				dispatch(showLoader({ isOpen: true }));
				const result: any = await API.Get(`${config.BASE_URL}Identity/${documentId}/GetIdentityById`);
				if (result.success) {
					dispatch(showLoader({ isOpen: false }));
				}
				resolve(result || null);
			} catch (e) {
				resolve(e);
				dispatch(showLoader({ isOpen: false }));
			}
		});

export const CreateUserManagement = (request: any) => (dispatch: AppDispatch, getState: any) =>
	new Promise(async (resolve, reject) => {
		try {
			const config = getState().auth.config;
			const result: any = await Post(`${config.BASE_URL}Identity/CreateUserManagement`, request);
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
		} catch (error: any) {
			dispatch(showLoader({ isOpen: false }));
			dispatch(showNotification({
				isOpen: true,
				message: error.message,
				type: "error",
			}));
			resolve(error?.response);
		}
	});


export const UpdateUserManagement =
	(id: any, request: any) => (dispatch: AppDispatch, getState: any) =>
		new Promise(async (resolve, reject) => {
			try {
				const config = getState().auth.config;
				const result: any = await Put(`${config.BASE_URL}Identity/${id}/UpdateUserManagement`, request);
				if (result?.success) {
					dispatch(showNotification({
						isOpen: true,
						message: result?.data,
						type: "success",
					}));
					resolve(result);
				}
			} catch (error: any) {
				dispatch(showNotification({
					isOpen: true,
					message: error?.data?.message,
					type: "success",
				}));
				resolve(error?.response);
			}
		});

export const deactivateUser =
	(documentId: string, request: any) => (dispatch: AppDispatch, getState: any) =>
		new Promise(async (resolve, reject) => {
			try {
				const config = getState().auth.config;
				dispatch(showLoader({ isOpen: true }));
				const result: any = await API.Put(`${config.BASE_URL}Identity/${documentId}/Update`,request);
				if (result.success) {
					resolve(result);
					dispatch(showLoader({ isOpen: false }));
					dispatch(showNotification({
						isOpen: true,
						message:"User deactivated successfully",
						type: "success",
					}));
				}
				resolve(result || null);
			} catch (e: any) {
				resolve(e);
				dispatch(showLoader({ isOpen: false }));
				dispatch(showNotification({
					isOpen: true,
					message: e?.data?.message,
					type: "success",
				}));
				resolve(e);
			}
		});
