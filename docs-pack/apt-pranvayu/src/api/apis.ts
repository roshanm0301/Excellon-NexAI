import axios, { AxiosRequestConfig, CreateAxiosDefaults } from "axios";
import { getAuthToken, getUserAuthToken } from "../utility/utils";
import { setUnauthorizedError } from "./api";

const options: CreateAxiosDefaults = {
  // baseURL: config.BASE_URL,
  timeout: 60000,
  withCredentials: true,
};
const instance = axios.create(options);

// Add a request interceptor
instance.interceptors.request.use(
  async (config: any) => {
    const authData = getUserAuthToken();
    const tokenData = authData ?? getAuthToken();
    if (tokenData) {
      config.headers["Authorization"] = `Bearer ${tokenData}`;
    }
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }
    config.headers["Access-Control-Allow-Credentials"] = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error?.config;
    if (error?.response?.status === 401) {
      if (
        originalRequest.url &&
        originalRequest.url?.indexOf("identity") !== -1
      ) {
        //do nothing
      } else {
        // Set flag to show unauthorized error notification
        setUnauthorizedError(true);
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export const GetWithAuthAndSubscription = (url: string, config?: AxiosRequestConfig<any>) => {
  return new Promise((resolve, reject) => {
    instance
      .get(url, config)
      .then((result) => {
        if (result.status === 200 || result.status === 201) {
          resolve(result.data);
        } else {
          reject(result.data);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};


export const PostWithAuthAndSubscription = (
  url: string,
  data: any,
  config?: AxiosRequestConfig<any>
) => {
  return new Promise((resolve, reject) => {
    instance
      .post(url, data, config)
      .then((result) => {
        if (result.status === 200 || result.status === 201) {
          resolve(result.data);
        } else {
          reject(result.data);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const PutWithAuthAndSubscription = (url: string, data?: any, config?: AxiosRequestConfig<any>) => {
  return new Promise((resolve, reject) => {
    instance
      .put(url, data, config)
      .then((result) => {
        if (result.status === 200 || result.status === 201) {
          resolve(result.data);
        } else {
          reject(result.data);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};


