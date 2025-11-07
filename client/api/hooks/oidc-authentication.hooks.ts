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
    useQuery: (
      params: OidcGoogleCallbackGetQueryFnParams,
      options?: UseQueryOptions<
        OidcGoogleCallbackGetQueryFnResult,
        AxiosErrorRes
      >
    ) => {
      return useQuery<OidcGoogleCallbackGetQueryFnResult, AxiosErrorRes>({
        ...options,
        queryKey: ["user"],
        queryFn: () => oidcGoogleCallbackGetQueryFn(params),
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
    useQuery: (
      params: OidcGithubCallbackGetQueryFnParams,
      options?: UseQueryOptions<
        OidcGithubCallbackGetQueryFnResult,
        AxiosErrorRes
      >
    ) => {
      return useQuery<OidcGithubCallbackGetQueryFnResult, AxiosErrorRes>({
        ...options,
        queryKey: ["user"],
        queryFn: () => oidcGithubCallbackGetQueryFn(params),
      });
    },
  },
};
export default OIDC;
