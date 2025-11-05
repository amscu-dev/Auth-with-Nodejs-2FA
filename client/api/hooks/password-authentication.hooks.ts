import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import {
  AuthEmailVerifyMutationFnBody,
  ForgotPasswordRequestBody,
  ResetPasswordRequestBody,
  UserLoginRequestBody,
  UserRegistrationRequestBody,
} from "../client/client.schemas";
import { AxiosErrorRes } from "@/config/axios.config";
import {
  authEmailVerifyMutationFn,
  AuthEmailVerifyMutationFnResult,
  authLogoutMutationFn,
  AuthLogoutMutationFnResult,
  authPasswordForgotMutationFn,
  AuthPasswordForgotMutationFnResult,
  authPasswordResetMutationFn,
  AuthPasswordResetMutationFnResult,
  authSignInMutationFn,
  AuthSignInMutationFnResult,
  authSignUpMutationFn,
  AuthSignUpMutationFnResult,
} from "../client/password-authentication-module";

export const PasswordAuth = {
  SignUp: {
    useMutation: (
      options?: UseMutationOptions<
        AuthSignUpMutationFnResult,
        AxiosErrorRes,
        UserRegistrationRequestBody
      >
    ) => {
      return useMutation<
        AuthSignUpMutationFnResult,
        AxiosErrorRes,
        UserRegistrationRequestBody
      >({
        ...options,
        mutationKey: ["user"],
        mutationFn: (data: UserRegistrationRequestBody) =>
          authSignUpMutationFn(data),
      });
    },
  },
  SignIn: {
    useMutation: (
      options?: UseMutationOptions<
        AuthSignInMutationFnResult,
        AxiosErrorRes,
        UserLoginRequestBody
      >
    ) => {
      return useMutation<
        AuthSignInMutationFnResult,
        AxiosErrorRes,
        UserLoginRequestBody
      >({
        ...options,
        mutationKey: ["user"],
        mutationFn: (data: UserLoginRequestBody) => authSignInMutationFn(data),
      });
    },
  },
  VerifyEmail: {
    useMutation: (
      options?: UseMutationOptions<
        AuthEmailVerifyMutationFnResult,
        AxiosErrorRes,
        AuthEmailVerifyMutationFnBody
      >
    ) => {
      return useMutation<
        AuthEmailVerifyMutationFnResult,
        AxiosErrorRes,
        AuthEmailVerifyMutationFnBody
      >({
        ...options,
        mutationKey: ["email-verified"],
        mutationFn: (data: AuthEmailVerifyMutationFnBody) =>
          authEmailVerifyMutationFn(data),
      });
    },
  },
  ForgotPassword: {
    useMutation: (
      options?: UseMutationOptions<
        AuthPasswordForgotMutationFnResult,
        AxiosErrorRes,
        ForgotPasswordRequestBody
      >
    ) => {
      return useMutation<
        AuthPasswordForgotMutationFnResult,
        AxiosErrorRes,
        ForgotPasswordRequestBody
      >({
        ...options,
        mutationKey: ["password-forgot"],
        mutationFn: (data: ForgotPasswordRequestBody) =>
          authPasswordForgotMutationFn(data),
      });
    },
  },
  ResetPassword: {
    useMutation: (
      options?: UseMutationOptions<
        AuthPasswordResetMutationFnResult,
        AxiosErrorRes,
        ResetPasswordRequestBody
      >
    ) => {
      return useMutation<
        AuthPasswordResetMutationFnResult,
        AxiosErrorRes,
        ResetPasswordRequestBody
      >({
        ...options,
        mutationKey: ["password-reset"],
        mutationFn: (data: ResetPasswordRequestBody) =>
          authPasswordResetMutationFn(data),
      });
    },
  },
  Logout: {
    useMutation: (
      options?: UseMutationOptions<AuthLogoutMutationFnResult, AxiosErrorRes>
    ) => {
      return useMutation<AuthLogoutMutationFnResult, AxiosErrorRes>({
        ...options,
        mutationKey: ["user"],
        mutationFn: () => authLogoutMutationFn(),
      });
    },
  },
};

export default PasswordAuth;
