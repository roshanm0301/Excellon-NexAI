
import axios from "axios";
import { API, GetWithAuthAndSubscription, PutWithAuthAndSubscription } from "../../api";
import { AppDispatch } from "../../store/store";
import { showLoader, showNotification } from "./authAction";
import { getUserAuthToken, setLocalData } from "../../utility/utils";
export const ADD_SUBSCRIPTION = "ADD_SUBSCRIPTION";
export const GET_SUBSCRIPTION_LIST = "GET_SUBSCRIPTION_LIST";
export const GET_SUBSCRIPTION_BY_ID = "GET_SUBSCRIPTION_BY_ID";
export const MOCK_SUBSCRIPTION_LIST = 'MOCK_SUBSCRIPTION_LIST';
export const GET_SCHEMA_LIST_BY_SUBSCRIPTION_ID = 'GET_SCHEMA_LIST_BY_SUBSCRIPTION_ID'
export const GET_PROVIDER_BY_SUBSCRIPTION_ID = 'GET_PROVIDER_BY_SUBSCRIPTION_ID'
export const SELECTED_SUBSCRIPTION = "SELECTED_SUBSCRIPTION"
export const GET_SUBSCRIPTION_PAGING = "GET_SUBSCRIPTION_PAGING";
export const GET_SUBSCRIPTION_SETTING_LIST = "GET_SUBSCRIPTION_SETTING_LIST"
export const GET_SUBSCRIPTION_SETTING_VALUE_LIST = "GET_SUBSCRIPTION_SETTING_VALUE_LIST"
export const GET_SUBSCRIPTION_LIST_BY_IDENTITY = "GET_SUBSCRIPTION_LIST_BY_IDENTITY";
export const SELECTED_VERSION = "SELECTED_VERSION";
export const GET_APP_VERSION = "GET_APP_VERSION";

export const setSubscriptionDetails = (item: any) => (dispatch: AppDispatch) =>
	dispatch({
		type: GET_SUBSCRIPTION_BY_ID,
		payload: item,
	});

export const getSubscriptionListAPI =
	(request: any) => (dispatch: AppDispatch, getState: any) =>
		new Promise(async (resolve, reject) => {
			try {
				const config = getState().auth.config;
				const params = request;
				//Loader
				dispatch(showLoader({ isOpen: true }));
				const result: any = await API.Get(`${config.BASE_URL}Subscription/List`, {
					params,
				});
				//
				if (result.success) {
					dispatch(showLoader({ isOpen: false }));
				}
				dispatch({ type: GET_SUBSCRIPTION_LIST, payload: result.data });
				resolve(result.data);
			} catch (error: any) {
				const message = error?.response?.data.message;
				dispatch({ type: GET_SUBSCRIPTION_LIST, payload: null });
				dispatch(showLoader({ isOpen: false }));
				resolve(error?.response);
			}
		});

export const getSubscriptionAPI =
	(documentId: any) => (dispatch: AppDispatch, getState: any) =>
		new Promise(async (resolve, reject) => {
			try {
				const config = getState().auth.config;
				dispatch(showLoader({ isOpen: true }));
				const result: any = await API.Get(`${config.BASE_URL}Subscription/${documentId}/GetSubscriptionListById`);

				if (result?.success) {
					dispatch(showLoader({ isOpen: false }));
					dispatch(setSubscriptionDetails(result?.data));
					resolve(result.data);
				}

			} catch (error: any) {
				const message = error?.response?.data.message;
				dispatch(setSubscriptionDetails(null));
				dispatch(showLoader({ isOpen: false }));
				resolve(error?.response);
			}
		});

export const cloneSubscriptionAPI =
	(request: any) => (dispatch: AppDispatch, getState: any) =>
		new Promise(async (resolve, reject) => {
			try {
				const config = getState().auth.config;
				const result: any = await API.Post(`${config.BASE_URL}Subscription/CloneSubscription`, request);
				//
				if (result.success) {
					dispatch(showNotification({
						isOpen: true,
						message: "Added Successfully!!",
						type: "success",
					}));
					resolve(result);
				} else {
					dispatch(showNotification({
						isOpen: true,
						message: result.data,
						type: "error",
					}));
				}
				//
			} catch (e: any) {
				dispatch(showNotification({
					isOpen: true,
					message: e.message,
					type: "error",
				}));
				resolve(e);
			}
		});

export const GetSchemaListBySubscriptionIdAPI = (request: any) => (dispatch: AppDispatch, getState: any) =>
	new Promise(async (resolve, reject) => {
		try {
			const config = getState().auth.config;
			//Loader
			dispatch(showLoader({ isOpen: true }));
			const result: any = await API.Post(`${config.BASE_URL}Subscription/GetSchemaListBySubscriptionId`, request);
			//
			if (result.success) {
				dispatch(showLoader({ isOpen: false }));
			}
			//if (result.success) {
			dispatch({ type: GET_SCHEMA_LIST_BY_SUBSCRIPTION_ID, payload: result });
			resolve(result);
			// }
		} catch (error: any) {
			const message = error?.response?.data.message;
			dispatch({ type: GET_SCHEMA_LIST_BY_SUBSCRIPTION_ID, payload: { message } });
			dispatch(showLoader({ isOpen: false }));
			resolve(error?.response);
		}
	});

export const publishSubscriptionAPI =
	(request: any) => (dispatch: AppDispatch, getState: any) =>
		new Promise(async (resolve, reject) => {
			try {
				const config = getState().auth.config;
				dispatch(showLoader({ isOpen: true }));
				const result: any = await API.Post(`${config.BASE_URL}Schema/UpdateProviderCopyMultipleSchemaAndActionList`, request);
				//
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
				//
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

export const GetProviderBySubscriptionIdAPI = (request: any) => (dispatch: AppDispatch, getState: any) =>
	new Promise(async (resolve, reject) => {
		try {
			const config = getState().auth.config;
			//Loader
			dispatch(showLoader({ isOpen: true }));
			const result: any = await API.Post(`${config.BASE_URL}Subscription/GetProviderBySubscriptionId`, request);
			//
			if (result.success) {
				dispatch(showLoader({ isOpen: false }));
			}
			//if (result.success) {
			dispatch({ type: GET_PROVIDER_BY_SUBSCRIPTION_ID, payload: result });
			resolve(result);
			// }
		} catch (error: any) {
			const message = error?.response?.data.message;
			dispatch({ type: GET_PROVIDER_BY_SUBSCRIPTION_ID, payload: { message } });
			dispatch(showLoader({ isOpen: false }));
			resolve(error?.response);
		}
	});

export const selectedSubscription = (selectedSubscription: any) => (dispatch: AppDispatch) =>
	dispatch({
		type: SELECTED_SUBSCRIPTION,
		payload: selectedSubscription,
	});

export const addOnBoardSubscriptionAPI =
	(request: any) => (dispatch: AppDispatch, getState: any) =>
		new Promise(async (resolve, reject) => {
			try {
				const config = getState().auth.config;
				const result: any = await API.Post(`${config.BASE_URL}SubscriptionExtension/Create`, request);
				//
				if (result.success) {
					dispatch(showNotification({
						isOpen: true,
						message: "Added Successfully!!",
						type: "success",
					}));
					resolve(result);
				} else {
					dispatch(showNotification({
						isOpen: true,
						message: result.data,
						type: "error",
					}));
				}
				//
			} catch (e: any) {
				dispatch(showNotification({
					isOpen: true,
					message: e.message,
					type: "error",
				}));
				resolve(e);
			}
		});

export const updateOnBoardSubscriptionAPI =
	(documentId: string, request: any) =>
		(dispatch: AppDispatch, getState: any) =>
			new Promise(async (resolve, reject) => {
				try {
					const config = getState().auth.config;
					dispatch(showLoader({ isOpen: true }));
					const result: any = await API.Put(
						`${config.BASE_URL}SubscriptionExtension/${documentId}/Update`,
						request
					);
					resolve(result);
					//
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
					//
				} catch (e) {
					dispatch(showLoader({ isOpen: false }));
					resolve(e);
				}
			});

export const getSubscriptionPagingAPI =
	(request: any) => (dispatch: AppDispatch, getState: any) =>
		new Promise(async (resolve, reject) => {
			try {
				const config = getState().auth.config;
				const params = request;
				//Loader
				dispatch(showLoader({ isOpen: true }));
				const result: any = await API.Get(`${config.BASE_URL}SubscriptionExtension/Paging`, {
					params,
				});
				//
				if (result.success) {
					dispatch(showLoader({ isOpen: false }));
				}
				dispatch({ type: GET_SUBSCRIPTION_PAGING, payload: result });
				resolve(result);
			} catch (error: any) {
				const message = error?.response?.data.message;
				dispatch({ type: GET_SUBSCRIPTION_PAGING, payload: null });
				dispatch(showLoader({ isOpen: false }));
				resolve(error?.response);
			}
		});


export const getSubscriptionById =
	(documentId: any) => (dispatch: AppDispatch, getState: any) =>
		new Promise(async (resolve, reject) => {
			try {
				const config = getState().auth.config;
				dispatch(showLoader({ isOpen: true }));
				const result: any = await API.Get(
					`${config.BASE_URL}SubscriptionExtension/${documentId}/Get`
				);
				if (result?.success) {
					resolve(result?.data || null);
					dispatch(showLoader({ isOpen: false }));
				}

			} catch (e) {
				resolve(e);
				dispatch(showLoader({ isOpen: false }));
			}
		});

export const getSubscriptionSettingAPI =
	(subscriptionId: any) => (dispatch: AppDispatch, getState: any) =>
		new Promise(async (resolve, reject) => {
			try {
				const config = getState().auth.config;
				//Loader
				dispatch(showLoader({ isOpen: true }));
				const result: any = await GetWithAuthAndSubscription(`${config.BASE_URL}SubscriptionSetting/List`, {
					headers: {
						Subscription: subscriptionId
					}
				});
				if (result.success) {
					dispatch(showLoader({ isOpen: false }));
				}
				dispatch({ type: GET_SUBSCRIPTION_SETTING_LIST, payload: result.data });
				resolve(result.data);
			} catch (error: any) {
				const message = error?.response?.data.message;
				dispatch({ type: GET_SUBSCRIPTION_SETTING_LIST, payload: null });
				dispatch(showLoader({ isOpen: false }));
				resolve(error?.response);
			}
		});

export const addSubscriptionSettingAPI =
	(request: any) => (dispatch: AppDispatch, getState: any) =>
		new Promise(async (resolve, reject) => {
			try {
				const config = getState().auth.config;
				request = { ...request, NewSubscriptionId: config.Subscription }
				const result: any = await API.Post(`${config.BASE_URL}SubscriptionSettingValue/Create`, request);
				//
				if (result.success) {
					dispatch(showNotification({
						isOpen: true,
						message: "Added Successfully!!",
						type: "success",
					}));
					resolve(result);
				} else {
					dispatch(showNotification({
						isOpen: true,
						message: result.data,
						type: "error",
					}));
				}
				//
			} catch (e: any) {
				dispatch(showNotification({
					isOpen: true,
					message: e.message,
					type: "error",
				}));
				resolve(e);
			}
		});

export const updateSubscriptionSettingAPI =
	(subscriptionId: any, request: any) =>
		(dispatch: AppDispatch, getState: any) =>
			new Promise(async (resolve, reject) => {
				try {
					const config = getState().auth.config;
					dispatch(showLoader({ isOpen: true }));
					const result: any = await PutWithAuthAndSubscription(
						`${config.BASE_URL}SubscriptionSettingValue/Update`,
						{
							...request,
						},
						{
							headers: {
								Subscription: subscriptionId,
							}
						}
					);
					resolve(result);
					//
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
					//
				} catch (e) {
					dispatch(showLoader({ isOpen: false }));
					resolve(e);
				}
			});

export const getSubscriptionSettingValueAPI =
	(subscriptionId: any) => (dispatch: AppDispatch, getState: any) =>
		new Promise(async (resolve, reject) => {
			try {
				const config = getState().auth.config;
				//Loader
				dispatch(showLoader({ isOpen: true }));
				const result: any = await GetWithAuthAndSubscription(`${config.BASE_URL}SubscriptionSettingValue/List`, {
					headers: {
						Subscription: subscriptionId
					}
				});
				//
				if (result.success) {
					dispatch(showLoader({ isOpen: false }));
				}
				dispatch({ type: GET_SUBSCRIPTION_SETTING_VALUE_LIST, payload: result.data });
				resolve(result.data);
			} catch (error: any) {
				dispatch({ type: GET_SUBSCRIPTION_SETTING_VALUE_LIST, payload: null });
				dispatch(showLoader({ isOpen: false }));
				resolve(error?.response);
			}
		});

export const GetSubscriptionByIdentity =
	(request: any) => (dispatch: AppDispatch, getState: any) =>
		new Promise(async (resolve, reject) => {
			try {
				const config = getState().auth.config;
				const params = request;
				dispatch(showLoader({ isOpen: true }));
				const result: any = await API.Get(`${config.BASE_URL}SubscriptionIdentityMapping/GetSubscriptionByIdentity`, {
					params,
				});
				if (result.success) {
					dispatch(showLoader({ isOpen: false }));
				}
				dispatch({ type: GET_SUBSCRIPTION_LIST_BY_IDENTITY, payload: result.data });
				resolve(result.data);
			} catch (error: any) {
				const message = error?.response?.data.message;
				dispatch({ type: GET_SUBSCRIPTION_LIST_BY_IDENTITY, payload: null });
				dispatch(showLoader({ isOpen: false }));
				resolve(error?.response);
			}
		});

export const selectedVersionAPI = (selectedVersion: any) => (dispatch: AppDispatch) => {
	setLocalData("selectedVersion", selectedVersion);
	dispatch({
		type: SELECTED_VERSION,
		payload: selectedVersion,
	})
}

export const GetAppVersion =
	(request: any) => (dispatch: AppDispatch, getState: any) =>
		new Promise(async (resolve, reject) => {
			try {
				const config = getState().auth.config;
				const params = request;
				dispatch(showLoader({ isOpen: true }));
				const result: any = await API.Get(`${config.BASE_URL}Action/GetAppVersions`, {
					params,
				});
				if (result.success) {
					dispatch(showLoader({ isOpen: false }));
				}
				dispatch({ type: GET_APP_VERSION, payload: result.data });
				resolve(result.data);
			} catch (error: any) {
				const message = error?.response?.data.message;
				dispatch({ type: GET_APP_VERSION, payload: null });
				dispatch(showLoader({ isOpen: false }));
				resolve(error?.response);
			}
		});
