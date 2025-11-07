import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  AuthCheckEmailMutationFnBody,
  AuthEmailVerifyMutationFnBody,
  AuthResendEmailMutationFnBody,
  ForgotPasswordRequestBody,
  ResetPasswordRequestBody,
  UserLoginRequestBody,
  UserRegistrationRequestBody,
} from "../client/client.schemas";
import { AxiosErrorRes } from "@/config/axios.config";
import {
  authCheckEmailMutationFn,
  AuthCheckEmailMutationFnResult,
  authEmailVerifyMutationFn,
  AuthEmailVerifyMutationFnResult,
  authLogoutMutationFn,
  AuthLogoutMutationFnResult,
  authPasswordForgotMutationFn,
  AuthPasswordForgotMutationFnResult,
  authPasswordResetMutationFn,
  AuthPasswordResetMutationFnResult,
  authResendEmailMutationFn,
  AuthResendEmailMutationFnResult,
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
  ResendEmail: {
    useMutation: (
      options?: UseMutationOptions<
        AuthResendEmailMutationFnResult,
        AxiosErrorRes,
        AuthResendEmailMutationFnBody
      >
    ) => {
      return useMutation<
        AuthResendEmailMutationFnResult,
        AxiosErrorRes,
        AuthResendEmailMutationFnBody
      >({
        ...options,
        mutationKey: ["email-resend"],
        mutationFn: (data: AuthResendEmailMutationFnBody) =>
          authResendEmailMutationFn(data),
      });
    },
  },
  CheckEmail: {
    useQuery: (
      email: string,
      options?: UseQueryOptions<AuthCheckEmailMutationFnResult, AxiosErrorRes>
    ) => {
      return useQuery<AuthCheckEmailMutationFnResult, AxiosErrorRes>({
        ...options,
        queryKey: ["auth", "email-existence", email] as const,
        enabled: !!email,
        queryFn: () => authCheckEmailMutationFn({ email }),
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
