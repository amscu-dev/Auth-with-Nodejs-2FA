import { AxiosError, AxiosRequestConfig, AxiosInstance } from "axios";
import axios from "axios";
import { env } from "@/env";

interface CancellablePromise<T> extends Promise<T> {
  cancel: () => void;
}

const AXIOS_INSTANCE: AxiosInstance = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  (error) => {
    const { data, status } = error.response;
    if (data === "Unauthorized" && status === 401) {
      // aici poți implementa retry pe /refresh
    }
    return Promise.reject({ ...data });
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

// In some case with react-query and swr you want to be able to override the return error type so you can also do it here like this
export type ErrorType<Error> = AxiosError<Error>;
