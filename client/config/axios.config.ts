import {
  AxiosError,
  AxiosRequestConfig,
  AxiosInstance,
  isAxiosError,
  AxiosResponse,
} from "axios";
import axios from "axios";
import { env } from "@/env";
import { ErrorCode } from "@/types/enums/error-code.enum";

export interface FieldError {
  field: string;
  message: string;
}

// forma de bază a erorii
export interface BaseErrorRes {
  success: false;
  message: string;
  errorCode: ErrorCode;
  requestId: string;
}

export interface ValidationErrorRes extends BaseErrorRes {
  errors: FieldError[];
}

export type ErrorRes = BaseErrorRes | ValidationErrorRes;

export type AxiosErrorRes = AxiosError<ErrorRes>;
interface CancellablePromise<T> extends Promise<T> {
  cancel: () => void;
}

const AXIOS_INSTANCE: AxiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

const accessTokenErrorCodes = [
  "AUTH_ACCESS_TOKEN_NOT_FOUND",
  "AUTH_ACCESS_TOKEN_TYPE_INVALID",
  "AUTH_ACCESS_TOKEN_USER_NOT_FOUND",
  "AUTH_ACCESS_TOKEN_SESSION_INVALID",
  "AUTH_ACCESS_TOKEN_SESSION_MISMATCH",
  "AUTH_ACCESS_TOKEN_EXPIRED",
  "AUTH_ACCESS_TOKEN_INVALID",
];

interface FailedRequestsQueue {
  resolve: (value: AxiosResponse) => void;
  reject: (value: AxiosError) => void;
  config: AxiosRequestConfig;
  error: AxiosError;
}

let failedRequestsQueue: FailedRequestsQueue[] = [];
let isTokenRefreshing = false;

AXIOS_INSTANCE.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    console.log(error);
    // if (isAxiosError<ErrorRes>(error) && error.response && error.config) {
    //   const originalRequestConfig = error.config;
    //   const errorCode = error.response.data.errorCode;
    //   const isUnauthorizeError = error.response.status === 401;
    //   const isAccessTokenError = accessTokenErrorCodes.includes(errorCode);

    //   // if s not unauthorized error
    //   if (!isUnauthorizeError) {
    //     return Promise.reject(error);
    //   }
    //   // if s not access token error
    //   if (!isAccessTokenError) {
    //     return Promise.reject(error);
    //   }

    //   // if request for refreshing token its on, we add request to queue
    //   if (isTokenRefreshing) {
    //     return new Promise((resolve, reject) => {
    //       failedRequestsQueue.push({
    //         resolve,
    //         reject,
    //         config: originalRequestConfig,
    //         error: error,
    //       });
    //     });
    //   }

    //   // we mark begging of refreshing token
    //   isTokenRefreshing = true;

    //   // refresh token logic
    //   if (isAccessTokenError && isUnauthorizeError) {
    //     try {
    //       await AXIOS_INSTANCE.get("/auth/refresh");

    //       // if we do not got an error here we resolve all other request from queue
    //       failedRequestsQueue.forEach(({ resolve, reject, config }) => {
    //         AXIOS_INSTANCE(config)
    //           .then((response) => resolve(response))
    //           .catch((error) => reject(error));
    //       });
    //     } catch (error: unknown) {
    //       console.error(error);
    //       failedRequestsQueue.forEach(({ reject, error }) => reject(error));
    //       window.location.href = "/accounts/signin";
    //       return Promise.reject(error);
    //     } finally {
    //       failedRequestsQueue = [];
    //       isTokenRefreshing = false;
    //     }
    //   }

    //   return AXIOS_INSTANCE(originalRequestConfig);
    // }
    return Promise.reject(error);
  }
);

export const customAxiosInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const source = axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data) as CancellablePromise<T>;

  promise.cancel = () => {
    source.cancel("Query was cancelled");
  };

  return promise;
};

export type ErrorType<Error> = AxiosError<Error>;
