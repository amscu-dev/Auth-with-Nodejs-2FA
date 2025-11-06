import { useQuery, UseQueryOptions } from "@tanstack/react-query";
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
    useQuery: (
      options?: UseQueryOptions<
        OidcGoogleAuthUrlGetQueryFnResult,
        AxiosErrorRes
      >
    ) => {
      return useQuery<OidcGoogleAuthUrlGetQueryFnResult, AxiosErrorRes>({
        ...options,
        queryKey: ["google-auth-url"],
        queryFn: () => oidcGoogleAuthUrlGetQueryFn(),
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
    useQuery: (
      options?: UseQueryOptions<
        OidcGithubAuthUrlGetQueryFnResult,
        AxiosErrorRes
      >
    ) => {
      return useQuery<OidcGithubAuthUrlGetQueryFnResult, AxiosErrorRes>({
        ...options,
        queryKey: ["github-auth-url"],
        queryFn: () => oidcGithubAuthUrlGetQueryFn(),
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
