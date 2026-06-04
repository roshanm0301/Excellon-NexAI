import axios from "axios";
import { API, Get, Post } from "../../api/api";
import {
  getAuthToken,
  getUserAuthToken,
  setLocalData
} from "../../utility/utils";

export const WHO_AMI_DATA = "WHO_AMI_DATA";
export const CONFIG_DATA = "CONFIG_DATA";
export const USER_LOGIN_DATA = "USER_LOGIN_DATA";
export const USER_LOGIN_FAILED = "USER_LOGIN_FAILED";
export const SHOW_NOTIFICATION = "SHOW_NOTIFICATION";
export const HIDE_NOTIFICATION = "HIDE_NOTIFICATION";
export const ON_OPEN_LOADER = "ON_OPEN_LOADER";
export const SOCKET_IO = "SOCKET_IO";
export const USER_SELECTION = 'USE_SELECTION';
export const SUBSCRIPTION_CHANGE = 'SUBSCRIPTION_CHANGE'
export const IS_BASE_PRODUCT = 'IS_BASE_PRODUCT'

export const whoAmI = () => (dispatch, getState) =>
  new Promise(async (resolve, reject) => {
    try {
      const tokenData = await getAuthToken();
      const config = getState().auth.config;
      let headers = {
        "Client-Id": config.ClientId,
        "Client-Secret": config.ClientSecret,
        Subscription: config.Subscription,
      };

      if (tokenData) {
        headers = { ...headers, Authorization: `Bearer ${tokenData}` };
      }

      const result = await API.Get(`${config.BASE_URL}whoami`, {
        headers: headers,
      });
      setLocalData("WHO_AMI_DATA", result?.data);
      dispatch({ type: WHO_AMI_DATA, payload: result?.data });
      resolve(result?.data);
    } catch (e) {
      reject(e);
      dispatch(showNotification({
        isOpen: true,
        message: e?.message,
        type: "error",
      }));
    }
  });

export const onSignIn = (userData) => (dispatch, getState) => {
  return new Promise(async (resolve, reject) => {
    try {
      const tokenData = getState().auth.whoamiData;
      const config = getState().auth.config;
      const result = await axios.post(
        `${config.BASE_URL}Identity/SignInWithUsernameAndPassword`,
        {
          ...userData,
        },
        {
          headers: {
            Subscription: config.Subscription,
            Authorization: `Bearer ${tokenData}`,
          },
          withCredentials: true,
        }
      );
      if (result?.status == 200) {
        setLocalData("USER_LOGIN_DATA", { ...result?.data });
        dispatch({ type: USER_LOGIN_DATA, payload: { ...result?.data }, });
        resolve({ ...result.data });
      }
    } catch (e) {
      console.log("error==>", e);
      dispatch(showNotification({
        isOpen: true,
        message: e?.response?.data?.message,
        type: "error",
      }));
      resolve(e);
    }
  });
};

export const ResetPassword = (request) => (dispatch, getState) =>
  new Promise(async (resolve, reject) => {
    try {
      const config = getState().auth.config;
      const result = await Post(`${config.BASE_URL}Identity/ResetPassword`, request);
      if (result?.success) {
        resolve(result);
        dispatch(showNotification({
          isOpen: true,
          message: result?.data,
          type: "success",
        }));
      }
    } catch (error) {
      resolve(error?.response);
      dispatch(showNotification({
        isOpen: true,
        message: error?.response?.data?.message,
        type: "error",
      }));
    }
  });

export const RegisterWithUsername = (request) => (dispatch, getState) =>
  new Promise(async (resolve, reject) => {
    try {
      const config = getState().auth.config;
      const result = await Post(`${config.BASE_URL}Identity/RegisterWithUsername`, request);
      if (result?.success) {
        resolve(result);
      }
    } catch (error) {
      resolve(error?.response);
    }
  });

export const ChangePassword = (request) => (dispatch, getState) =>
  new Promise(async (resolve, reject) => {
    try {
      const authData = getUserAuthToken();
      const config = getState().auth.config;
      const result = await Post(`${config.BASE_URL}Identity/ChangePassword`,
        request,
        {
          headers: {
            Subscription: config.Subscription,
            Authorization: `Bearer ${authData}`,
          },
        }
      );
      if (result?.success) {
        resolve(result);
        dispatch(showNotification({
          isOpen: true,
          message: result?.data,
          type: "success",
        }));
      }
    } catch (error) {
      dispatch(showNotification({
        isOpen: true,
        message: error?.response?.data?.message,
        type: "error",
      }));
      resolve(error?.response);
    }
  });

export const getUserByIdentityId =
  (identityId) => (dispatch, getState) =>
    new Promise(async (resolve, reject) => {
      try {
        const config = getState().auth.config;
        dispatch(showLoader({ isOpen: true }));
        const result = await Get(`${config.BASE_URL}Identity/${identityId}/Get`);

        if (result?.success) {
          dispatch(showLoader({ isOpen: false }));
          resolve(result.data);
        }

      } catch (error) {
        const message = error?.response?.data.message;
        resolve(error?.response);
      }
    });

export const ForgotPassword = (request) => (dispatch, getState) =>
  new Promise(async (resolve, reject) => {
    try {
      const config = getState().auth.config;
      const result = await Post(`${config.BASE_URL}Identity/ForgotPassword`, request);
      if (result?.success) {
        resolve(result);
        dispatch(showNotification({
          isOpen: true,
          message: result?.data,
          type: "success",
        }));
      }
    } catch (error) {
      dispatch(showNotification({
        isOpen: true,
        message: error?.response?.data?.message,
        type: "error",
      }));
      resolve(error?.response);
    }
  });

  export const VerifyOTP = (request) => (dispatch, getState) =>
  new Promise(async (resolve, reject) => {
    try {
      const config = getState().auth.config;
      const result = await Post(`${config.BASE_URL}Cipher/VerifyOTP`, request);
      if (result?.success) {
        resolve(result);
        dispatch(showNotification({
          isOpen: true,
          message: result?.data,
          type: "success",
        }));
      }
    } catch (error) {
      dispatch(showNotification({
        isOpen: true,
        message: error?.response?.data?.message,
        type: "error",
      }));
      resolve(error?.response);
    }
  });

export const showNotification = (notification) => (dispatch) =>
  dispatch({
    type: SHOW_NOTIFICATION,
    payload: notification,
  });

export const clearNotification = (isHide) => (dispatch) =>
  dispatch({
    type: HIDE_NOTIFICATION,
    payload: isHide,
  });

export const showLoader = (isLoaderOpen) => (dispatch) =>
  dispatch({
    type: ON_OPEN_LOADER,
    payload: isLoaderOpen,
  });

export const useSelection = (selectedUser) => (dispatch) =>
  dispatch({
    type: USER_SELECTION,
    payload: selectedUser,
  });

export const subscriptionChange = (IsSubscriptionChanged) => (dispatch) =>
  dispatch({
    type: SUBSCRIPTION_CHANGE,
    payload: IsSubscriptionChanged,
  });

export const subscriptionIdentification = (isProduct) => (dispatch) =>
  dispatch({
    type: IS_BASE_PRODUCT,
    payload: isProduct,
  });

