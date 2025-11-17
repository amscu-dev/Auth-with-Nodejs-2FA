import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  oidcGithubAuthUrlGetQueryFn,
  OidcGithubAuthUrlGetQueryFnResult,
  oidcGithubCallbackGetQueryFn,
  OidcGithubCallbackGetQueryFnResult,
  oidcGoogleAuthUrlGetQueryFn,
  OidcGoogleAuthUrlGetQueryFnResult,
  oidcGoogleCallbackGetQueryFn,
  OidcGoogleCallbackGetQueryFnResult,
} from "../client/oidc-authentication-module";
import { AxiosErrorRes } from "@/config/axios.config";
import {
  OidcGithubCallbackGetQueryFnParams,
  OidcGoogleCallbackGetQueryFnParams,
} from "../client/client.schemas";

const OIDC = {
  GoogleAuth: {
    useMutation: (
      options?: UseMutationOptions<
        OidcGoogleAuthUrlGetQueryFnResult,
        AxiosErrorRes
      >
    ) => {
      return useMutation<OidcGoogleAuthUrlGetQueryFnResult, AxiosErrorRes>({
        ...options,
        mutationKey: ["google-auth-url"],
        mutationFn: () => oidcGoogleAuthUrlGetQueryFn(),
      });
    },
  },
  GoogleCallback: {
    useMutation: (
      options?: UseMutationOptions<
        OidcGoogleCallbackGetQueryFnResult,
        AxiosErrorRes,
        OidcGoogleCallbackGetQueryFnParams
      >
    ) => {
      return useMutation<
        OidcGoogleCallbackGetQueryFnResult,
        AxiosErrorRes,
        OidcGoogleCallbackGetQueryFnParams
      >({
        ...options,
        mutationKey: ["user"],
        mutationFn: (params: OidcGoogleCallbackGetQueryFnParams) =>
          oidcGoogleCallbackGetQueryFn(params),
      });
    },
  },
  GithubAuth: {
    useMutation: (
      options?: UseMutationOptions<
        OidcGithubAuthUrlGetQueryFnResult,
        AxiosErrorRes
      >
    ) => {
      return useMutation<OidcGithubAuthUrlGetQueryFnResult, AxiosErrorRes>({
        ...options,
        mutationKey: ["github-auth-url"],
        mutationFn: () => oidcGithubAuthUrlGetQueryFn(),
      });
    },
  },
  GithubCallback: {
    useMutation: (
      options?: UseMutationOptions<
        OidcGithubCallbackGetQueryFnResult,
        AxiosErrorRes,
        OidcGithubCallbackGetQueryFnParams
      >
    ) => {
      return useMutation<
        OidcGithubCallbackGetQueryFnResult,
        AxiosErrorRes,
        OidcGithubCallbackGetQueryFnParams
      >({
        ...options,
        mutationKey: ["user"],
        mutationFn: (params: OidcGithubCallbackGetQueryFnParams) =>
          oidcGithubCallbackGetQueryFn(params),
      });
    },
  },
};
export default OIDC;
