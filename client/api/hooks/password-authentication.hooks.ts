import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import {
  AuthEmailVerifyMutationFnBody,
  AuthPasswordForgotMutationFn200,
  AuthSignInMutationFn200,
  EmailConfirmedSuccessResponse,
  ForgotPasswordRequestBody,
  LogoutSuccessResponse,
  RegistrationSuccessReponse,
  ResetPasswordRequestBody,
  ResetPasswordSuccessResponse,
  UserLoginRequestBody,
  UserRegistrationRequestBody,
} from "../client/client.schemas";
import { AxiosErrorRes } from "@/config/axios.config";
import {
  authEmailVerifyMutationFn,
  authLogoutMutationFn,
  authPasswordForgotMutationFn,
  authPasswordResetMutationFn,
  authSignInMutationFn,
  authSignUpMutationFn,
} from "../client/password-authentication-module";

export const PasswordAuth = {
  SignUp: {
    useMutation: (
      options?: UseMutationOptions<
        RegistrationSuccessReponse,
        AxiosErrorRes,
        UserRegistrationRequestBody
      >
    ) => {
      return useMutation<
        RegistrationSuccessReponse,
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
        AuthSignInMutationFn200,
        AxiosErrorRes,
        UserLoginRequestBody
      >
    ) => {
      return useMutation<
        AuthSignInMutationFn200,
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
        EmailConfirmedSuccessResponse,
        AxiosErrorRes,
        AuthEmailVerifyMutationFnBody
      >
    ) => {
      return useMutation<
        EmailConfirmedSuccessResponse,
        AxiosErrorRes,
        AuthEmailVerifyMutationFnBody
      >({
        ...options,
        mutationKey: ["user"],
        mutationFn: (data: AuthEmailVerifyMutationFnBody) =>
          authEmailVerifyMutationFn(data),
      });
    },
  },
  ForgotPassword: {
    useMutation: (
      options?: UseMutationOptions<
        AuthPasswordForgotMutationFn200,
        AxiosErrorRes,
        ForgotPasswordRequestBody
      >
    ) => {
      return useMutation<
        AuthPasswordForgotMutationFn200,
        AxiosErrorRes,
        ForgotPasswordRequestBody
      >({
        ...options,
        mutationKey: ["user"],
        mutationFn: (data: ForgotPasswordRequestBody) =>
          authPasswordForgotMutationFn(data),
      });
    },
  },
  ResetPassword: {
    useMutation: (
      options?: UseMutationOptions<
        ResetPasswordSuccessResponse,
        AxiosErrorRes,
        ResetPasswordRequestBody
      >
    ) => {
      return useMutation<
        ResetPasswordSuccessResponse,
        AxiosErrorRes,
        ResetPasswordRequestBody
      >({
        ...options,
        mutationKey: ["user"],
        mutationFn: (data: ResetPasswordRequestBody) =>
          authPasswordResetMutationFn(data),
      });
    },
  },
  Logout: {
    useMutation: (
      options?: UseMutationOptions<LogoutSuccessResponse, AxiosErrorRes>
    ) => {
      return useMutation<LogoutSuccessResponse, AxiosErrorRes>({
        ...options,
        mutationKey: ["user"],
        mutationFn: () => authLogoutMutationFn(),
      });
    },
  },
};

export default PasswordAuth;
