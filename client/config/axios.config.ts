import { AxiosError, AxiosRequestConfig, AxiosInstance } from "axios";
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

AXIOS_INSTANCE.interceptors.response.use(
  (response) => {
    console.log(response);
    if (response.status === 201 && response.data.data.url) {
      window.location.href = response.data.data.url;
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const { data, status } = error.response;
      if (data === "Unauthorized" && status === 401) {
        // aici poți implementa retry pe /refresh
      }
    }
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
