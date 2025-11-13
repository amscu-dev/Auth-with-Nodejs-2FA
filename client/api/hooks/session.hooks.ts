import { AxiosErrorRes } from "@/config/axios.config";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  sessionAllGetQueryFn,
  SessionAllGetQueryFnResult,
  sessionGetCurrentQueryFn,
  SessionGetCurrentQueryFnResult,
  sessionRemoveByIdMutationFn,
  SessionRemoveByIdMutationFnResult,
} from "../client/session-module";

const Session = {
  GetAll: {
    useQuery: (
      options?: UseQueryOptions<SessionAllGetQueryFnResult, AxiosErrorRes>
    ) => {
      return useQuery<SessionAllGetQueryFnResult, AxiosErrorRes>({
        queryKey: ["sessions"],
        queryFn: () => sessionAllGetQueryFn(),
        ...options,
      });
    },
  },
  GetCurrent: {
    useQuery: (
      options?: Omit<
        UseQueryOptions<SessionGetCurrentQueryFnResult, AxiosErrorRes>,
        "queryKey" | "queryFn"
      >
    ) => {
      return useQuery<SessionGetCurrentQueryFnResult, AxiosErrorRes>({
        queryKey: ["userSession"],
        queryFn: () => sessionGetCurrentQueryFn(),
        ...options,
      });
    },
  },
  RemoveSession: {
    useMutation: (
      options?: UseMutationOptions<
        SessionRemoveByIdMutationFnResult,
        AxiosErrorRes,
        { id: string }
      >
    ) => {
      return useMutation<
        SessionRemoveByIdMutationFnResult,
        AxiosErrorRes,
        { id: string }
      >({
        ...options,
        mutationKey: ["user"],
        mutationFn: ({ id }) => sessionRemoveByIdMutationFn(id),
      });
    },
  },
};
export default Session;
