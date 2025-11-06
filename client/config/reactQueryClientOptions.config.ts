import {
  MutationCache,
  QueryCache,
  QueryClientConfig,
} from "@tanstack/react-query";
import { AxiosErrorRes } from "./axios.config";
import { isAxiosError } from "axios";

import { toast } from "sonner";
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
      retry: 3,
      retryDelay: (attemptIndex) => attemptIndex * 1000,
    },
    mutations: {
      retry: 3,
      retryDelay: 500,
    },
  },
};

export default queryClientConfig;
