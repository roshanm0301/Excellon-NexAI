import axios, { AxiosRequestConfig, CreateAxiosDefaults } from "axios";
import { getLocalData } from "../utility/utils";
import { pranwayuDefaultConfig } from "../config";

// Simple global flag for 401 errors
let hasUnauthorizedError = false;
let unauthorizedErrorCallback: (() => void) | null = null;

export const setUnauthorizedErrorCallback = (callback: (() => void) | null) => {
  unauthorizedErrorCallback = callback;
};

export const getUnauthorizedError = () => hasUnauthorizedError;

export const setUnauthorizedError = (value: boolean) => {
  hasUnauthorizedError = value;
  if (value && unauthorizedErrorCallback) {
    unauthorizedErrorCallback();
  }
};

const options: CreateAxiosDefaults = {
  // baseURL: config.BASE_URL,
  timeout: 60000,
  withCredentials: true,
};
const instance = axios.create(options);

// --- Token refresh handling (single-flight) ---
let refreshPromise: Promise<boolean> | null = null;



const refreshOidcToken = async (): Promise<boolean> => {
  if (refreshPromise) return refreshPromise; // Reuse in-flight refresh

  // Use OIDC silent renew from authService
  refreshPromise = (async () => {
    try {
      // Dynamically import to avoid circular dependency
      const { authService } = await import('../services/authService');
      const user = await authService.signinSilent();

      if (user && user.access_token) {
        // Update localStorage with new token
        localStorage.setItem('OIDC_TOKEN', user.access_token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Silent token refresh failed:', error);
      return false;
    } finally {
      // Allow new refresh attempts after current microtask
      setTimeout(() => { refreshPromise = null; }, 0);
    }
  })();

  return refreshPromise;
};

// Add a request interceptor

instance.interceptors.request.use(
  async (config: any) => {
    // Add Authorization header with OIDC token or legacy token
    const oidcToken = localStorage.getItem('OIDC_TOKEN');
    if (oidcToken) {
      config.headers["Authorization"] = `Bearer ${oidcToken}`;
    }

    // subscription header
    const subscription =
      config.headers["Subscription"] || getLocalData("CONFIG_DATA")?.Subscription;

    if (subscription) {
      config.headers["Subscription"] = subscription;
    }

    // default content-type
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// Add a response interceptor
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;

    if (status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Avoid infinite loop: don't retry refresh or signout endpoints
    const url: string = originalRequest.url || '';
    const lowerUrl = url.toLowerCase();
    const skipRetry = lowerUrl.includes('auth/refresh') || lowerUrl.includes('auth/signout');

    if (skipRetry || (originalRequest as any)._retry) {
      setUnauthorizedError(true);
      return Promise.reject(error);
    }

    (originalRequest as any)._retry = true;

    try {
      const refreshed = await refreshOidcToken();
      if (refreshed) {
        // Retry original request with same config
        return instance(originalRequest);
      }
    } catch (e) {
      // fallthrough to logout handling flag
    }
    // Refresh failed -> surface unauthorized
    setUnauthorizedError(true);
    return Promise.reject(error);
  }
);

export const Get = (url: string, config?: AxiosRequestConfig<any>) => {
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

export const Put = (
  url: string,
  data?: any,
  config?: AxiosRequestConfig<any>
) => {
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

export const Post = (
  url: string,
  data?: any,
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

export const Delete = (
  url: string,
  data?: any,
  config?: AxiosRequestConfig<any>
) => {
  return new Promise((resolve, reject) => {
    instance
      .delete(url, config)
      .then((result: any) => {
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

export const API = {
  Get,
  Put,
  Post,
  Delete,
};
