import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  passkeyAddPasskeyByUserIdInitMutationFn,
  PasskeyAddPasskeyByUserIdInitMutationFnResult,
  passkeyAddPasskeyByUserIdVerifyMutationFn,
  PasskeyAddPasskeyByUserIdVerifyMutationFnResult,
  passkeyAllGetByUserIdQueryFn,
  PasskeyAllGetByUserIdQueryFnResult,
  passkeyRemovePasskeyByIdInitMutationFn,
  PasskeyRemovePasskeyByIdInitMutationFnResult,
  passkeyRemovePasskeyByIdVerifyMutationFn,
  PasskeyRemovePasskeyByIdVerifyMutationFnResult,
  passkeySignInInitMutationFn,
  PasskeySignInInitMutationFnResult,
  passkeySignInVerifyMutationFn,
  PasskeySignInVerifyMutationFnResult,
  passkeySignUpInitMutationFn,
  PasskeySignUpInitMutationFnResult,
  passkeySignUpVerifyMutationFn,
  PasskeySignUpVerifyMutationFnResult,
} from "../client/passkey-authentication-module";
import { AxiosErrorRes } from "@/config/axios.config";
import {
  PasskeyCompletAuthenticationRequestBody,
  PasskeyCompletRegistrationRequestBody,
  PasskeySignUpInitMutationFnBody,
} from "../client/client.schemas";

const Passkey = {
  SignUpInit: {
    useMutation: (
      options?: UseMutationOptions<
        PasskeySignUpInitMutationFnResult,
        AxiosErrorRes,
        PasskeySignUpInitMutationFnBody
      >
    ) => {
      return useMutation<
        PasskeySignUpInitMutationFnResult,
        AxiosErrorRes,
        PasskeySignUpInitMutationFnBody
      >({
        ...options,
        mutationKey: ["passkey-signup-init"],
        mutationFn: (data: PasskeySignUpInitMutationFnBody) =>
          passkeySignUpInitMutationFn(data),
      });
    },
  },
  SignUpVerify: {
    useMutation: (
      options?: UseMutationOptions<
        PasskeySignUpVerifyMutationFnResult,
        AxiosErrorRes,
        PasskeyCompletRegistrationRequestBody
      >
    ) => {
      return useMutation<
        PasskeySignUpVerifyMutationFnResult,
        AxiosErrorRes,
        PasskeyCompletRegistrationRequestBody
      >({
        ...options,
        mutationKey: ["passkey-signup-verify"],
        mutationFn: (data: PasskeyCompletRegistrationRequestBody) =>
          passkeySignUpVerifyMutationFn(data),
      });
    },
  },
  SignInInit: {
    useMutation: (
      options?: UseMutationOptions<
        PasskeySignInInitMutationFnResult,
        AxiosErrorRes
      >
    ) => {
      return useMutation<PasskeySignInInitMutationFnResult, AxiosErrorRes>({
        ...options,
        mutationKey: ["passkey-signin-init"],
        mutationFn: () => passkeySignInInitMutationFn(),
      });
    },
  },
  SignInVerify: {
    useMutation: (
      options?: UseMutationOptions<
        PasskeySignInVerifyMutationFnResult,
        AxiosErrorRes,
        PasskeyCompletAuthenticationRequestBody
      >
    ) => {
      return useMutation<
        PasskeySignInVerifyMutationFnResult,
        AxiosErrorRes,
        PasskeyCompletAuthenticationRequestBody
      >({
        ...options,
        mutationKey: ["passkey-signin-verify"],
        mutationFn: (data: PasskeyCompletAuthenticationRequestBody) =>
          passkeySignInVerifyMutationFn(data),
      });
    },
  },
  AddPasskeyInit: {
    useMutation: (
      options?: UseMutationOptions<
        PasskeyAddPasskeyByUserIdInitMutationFnResult,
        AxiosErrorRes,
        { userid: string }
      >
    ) => {
      return useMutation<
        PasskeyAddPasskeyByUserIdInitMutationFnResult,
        AxiosErrorRes,
        { userid: string }
      >({
        ...options,
        mutationKey: ["passkey-add-init"],
        mutationFn: ({ userid }) =>
          passkeyAddPasskeyByUserIdInitMutationFn(userid),
      });
    },
  },
  AddPasskeyVerify: {
    useMutation: (
      options?: UseMutationOptions<
        PasskeyAddPasskeyByUserIdVerifyMutationFnResult,
        AxiosErrorRes,
        { data: PasskeyCompletRegistrationRequestBody; userid: string }
      >
    ) => {
      return useMutation<
        PasskeyAddPasskeyByUserIdVerifyMutationFnResult,
        AxiosErrorRes,
        { data: PasskeyCompletRegistrationRequestBody; userid: string }
      >({
        ...options,
        mutationKey: ["passkey-add-verify"],
        mutationFn: ({ userid, data }) =>
          passkeyAddPasskeyByUserIdVerifyMutationFn(userid, data),
      });
    },
  },
  RemovePasskeyInit: {
    useMutation: (
      options?: UseMutationOptions<
        PasskeyRemovePasskeyByIdInitMutationFnResult,
        AxiosErrorRes,
        { credentialid: string; userid: string }
      >
    ) => {
      return useMutation<
        PasskeyRemovePasskeyByIdInitMutationFnResult,
        AxiosErrorRes,
        { credentialid: string; userid: string }
      >({
        ...options,
        mutationKey: ["passkey-remove-init"],
        mutationFn: ({ userid, credentialid }) =>
          passkeyRemovePasskeyByIdInitMutationFn(userid, credentialid),
      });
    },
  },
  RemovePasskeyVerify: {
    useMutation: (
      options?: UseMutationOptions<
        PasskeyRemovePasskeyByIdVerifyMutationFnResult,
        AxiosErrorRes,
        {
          credentialid: string;
          userid: string;
          data: PasskeyCompletAuthenticationRequestBody;
        }
      >
    ) => {
      return useMutation<
        PasskeyRemovePasskeyByIdVerifyMutationFnResult,
        AxiosErrorRes,
        {
          credentialid: string;
          userid: string;
          data: PasskeyCompletAuthenticationRequestBody;
        }
      >({
        ...options,
        mutationKey: ["passkey-remove-verify"],
        mutationFn: ({ userid, credentialid, data }) =>
          passkeyRemovePasskeyByIdVerifyMutationFn(userid, credentialid, data),
      });
    },
  },
  GetAll: {
    useQuery: (
      userid: string,
      options?: UseQueryOptions<
        PasskeyAllGetByUserIdQueryFnResult,
        AxiosErrorRes
      >
    ) => {
      return useQuery<PasskeyAllGetByUserIdQueryFnResult, AxiosErrorRes>({
        ...options,
        queryKey: ["passkeys", userid],
        queryFn: () => passkeyAllGetByUserIdQueryFn(userid),
      });
    },
  },
};
export default Passkey;
