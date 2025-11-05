import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  magicLinkAuthenticateQueryFn,
  MagicLinkAuthenticateQueryFnResult,
  magicLinkResendMutationFn,
  MagicLinkResendMutationFnResult,
  magicLinkSignInMutationFn,
  MagicLinkSignInMutationFnResult,
  magicLinkSignUpMutationFn,
  MagicLinkSignUpMutationFnResult,
} from "../client/magic-link-authentication-module";
import { AxiosErrorRes } from "@/config/axios.config";
import {
  MagicLinkSignInRequestBody,
  MagicLinkSignUpRequestBody,
} from "../client/client.schemas";

export const MagicLink = {
  SignUp: {
    useMutation: (
      options?: UseMutationOptions<
        MagicLinkSignUpMutationFnResult,
        AxiosErrorRes,
        MagicLinkSignUpRequestBody
      >
    ) => {
      return useMutation<
        MagicLinkSignUpMutationFnResult,
        AxiosErrorRes,
        MagicLinkSignUpRequestBody
      >({
        ...options,
        mutationKey: ["user"],
        mutationFn: (data: MagicLinkSignUpRequestBody) =>
          magicLinkSignUpMutationFn(data),
      });
    },
  },
  SignIn: {
    useMutation: (
      options?: UseMutationOptions<
        MagicLinkSignInMutationFnResult,
        AxiosErrorRes,
        MagicLinkSignInRequestBody
      >
    ) => {
      return useMutation<
        MagicLinkSignInMutationFnResult,
        AxiosErrorRes,
        MagicLinkSignInRequestBody
      >({
        ...options,
        mutationKey: ["user"],
        mutationFn: (data: MagicLinkSignInRequestBody) =>
          magicLinkSignInMutationFn(data),
      });
    },
  },
  ResendLink: {
    useMutation: (
      options?: UseMutationOptions<
        MagicLinkResendMutationFnResult,
        AxiosErrorRes,
        MagicLinkSignInRequestBody
      >
    ) => {
      return useMutation<
        MagicLinkResendMutationFnResult,
        AxiosErrorRes,
        MagicLinkSignInRequestBody
      >({
        ...options,
        mutationKey: ["user"],
        mutationFn: (data: MagicLinkSignInRequestBody) =>
          magicLinkResendMutationFn(data),
      });
    },
  },
  Authenticate: {
    useQuery: (
      token: string,
      options?: UseQueryOptions<
        MagicLinkAuthenticateQueryFnResult,
        AxiosErrorRes
      >
    ) => {
      return useQuery<MagicLinkAuthenticateQueryFnResult, AxiosErrorRes>({
        queryKey: ["user"],
        queryFn: () => magicLinkAuthenticateQueryFn(token),
        ...options,
      });
    },
  },
};
