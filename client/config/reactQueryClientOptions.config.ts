import {
  MutationCache,
  QueryCache,
  QueryClientConfig,
} from "@tanstack/react-query";
import { AxiosErrorRes } from "./axios.config";
import { isAxiosError } from "axios";
import { toast } from "sonner";

let lastDelay = 1000;

const decorrelatedRetryDelay = () => {
  const base = 1000;
  const max = 30000;
  lastDelay = Math.min(max, Math.random() * (lastDelay * 3 - base) + base);
  return lastDelay;
};

const queryClientConfig: QueryClientConfig = {
  queryCache: new QueryCache({
    // onError from the QueryCache is called only once when a query completely fails — meaning after all retries have been exhausted, not on each individual retry attempt.
    onError: (error) => {
      if (isAxiosError<AxiosErrorRes>(error)) {
        const msg = error.response?.data?.message || error.message;
        toast.error(`Axios error: ${msg}`);
      } else {
        toast.error(`Unknown error: ${(error as Error).message}`);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (isAxiosError<AxiosErrorRes>(error)) {
        const msg = error.response?.data?.message || error.message;
        toast.error(`Axios error: ${msg}`);
      } else {
        toast.error(`Unknown error: ${(error as Error).message}`);
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 0,
      retry: (failureCount, error) => {
        if (isAxiosError<AxiosErrorRes>(error)) {
          const status = error.response?.status;
          if (status && status >= 400 && status < 500) return false;
        }
        return failureCount < 3;
      },
      retryDelay: decorrelatedRetryDelay,
    },
    mutations: {
      retry: (failureCount, error) => {
        if (isAxiosError<AxiosErrorRes>(error)) {
          const status = error.response?.status;
          if (status && status >= 400 && status < 500) return false;
        }
        return failureCount < 3;
      },
      retryDelay: decorrelatedRetryDelay,
    },
  },
};

export default queryClientConfig;
