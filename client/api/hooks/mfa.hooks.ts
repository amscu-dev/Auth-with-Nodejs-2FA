import { AxiosErrorRes } from "@/config/axios.config";
import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import {
  mfaBackupCodeConsumeMutationFn,
  MfaBackupCodeConsumeMutationFnResult,
  mfaBackupCodeLoginMutationFn,
  MfaBackupCodeLoginMutationFnResult,
  mfaRevokeMutationFn,
  MfaRevokeMutationFnResult,
  mfaSetupQueryFn,
  MfaSetupQueryFnResult,
  mfaVerifyForgotPasswordMutationFn,
  MfaVerifyForgotPasswordMutationFnResult,
  mfaVerifyLoginMutationFn,
  MfaVerifyLoginMutationFnResult,
  mfaVerifyMutationFn,
  MfaVerifyMutationFnResult,
} from "../client/mfa-module";
import {
  MfaBackupCodeConsumeMutationFnBody,
  MfaBackupCodeLoginMutationFnBody,
  MfaRevokeMutationFnBody,
  MfaVerifyForgotPasswordMutationFnBody,
  MfaVerifyLoginMutationFnBody,
  MfaVerifyMutationFnBody,
} from "../client/client.schemas";

const Mfa = {
  Setup: {
    useMutation: (
      options?: UseMutationOptions<MfaSetupQueryFnResult, AxiosErrorRes>
    ) => {
      return useMutation<MfaSetupQueryFnResult, AxiosErrorRes>({
        ...options,
        mutationKey: ["mfa-setup"],
        mutationFn: () => mfaSetupQueryFn(),
      });
    },
  },
  VerifySetup: {
    useMutation: (
      options?: UseMutationOptions<
        MfaVerifyMutationFnResult,
        AxiosErrorRes,
        MfaVerifyMutationFnBody
      >
    ) => {
      return useMutation<
        MfaVerifyMutationFnResult,
        AxiosErrorRes,
        MfaVerifyMutationFnBody
      >({
        mutationKey: ["mfa-verify"],
        mutationFn: (data: MfaVerifyMutationFnBody) =>
          mfaVerifyMutationFn(data),
        ...options,
      });
    },
  },
  Revoke: {
    useMutation: (
      options?: UseMutationOptions<
        MfaRevokeMutationFnResult,
        AxiosErrorRes,
        MfaRevokeMutationFnBody
      >
    ) => {
      return useMutation<
        MfaRevokeMutationFnResult,
        AxiosErrorRes,
        MfaRevokeMutationFnBody
      >({
        ...options,
        mutationKey: ["mfa-revoke"],
        mutationFn: (data: MfaRevokeMutationFnBody) =>
          mfaRevokeMutationFn(data),
      });
    },
  },
  BackUpCodeConsume: {
    useMutation: (
      options?: UseMutationOptions<
        MfaBackupCodeConsumeMutationFnResult,
        AxiosErrorRes,
        MfaBackupCodeConsumeMutationFnBody
      >
    ) => {
      return useMutation<
        MfaBackupCodeConsumeMutationFnResult,
        AxiosErrorRes,
        MfaBackupCodeConsumeMutationFnBody
      >({
        ...options,
        mutationKey: ["backup-code-consume"],
        mutationFn: (data: MfaBackupCodeConsumeMutationFnBody) =>
          mfaBackupCodeConsumeMutationFn(data),
      });
    },
  },
  BackUpCodeLogin: {
    useMutation: (
      options?: UseMutationOptions<
        MfaBackupCodeLoginMutationFnResult,
        AxiosErrorRes,
        MfaBackupCodeLoginMutationFnBody
      >
    ) => {
      return useMutation<
        MfaBackupCodeLoginMutationFnResult,
        AxiosErrorRes,
        MfaBackupCodeLoginMutationFnBody
      >({
        ...options,
        mutationKey: ["backup-code-login"],
        mutationFn: (data: MfaBackupCodeLoginMutationFnBody) =>
          mfaBackupCodeLoginMutationFn(data),
      });
    },
  },
  VerifyLogin: {
    useMutation: (
      options?: UseMutationOptions<
        MfaVerifyLoginMutationFnResult,
        AxiosErrorRes,
        MfaVerifyLoginMutationFnBody
      >
    ) => {
      return useMutation<
        MfaVerifyLoginMutationFnResult,
        AxiosErrorRes,
        MfaVerifyLoginMutationFnBody
      >({
        ...options,
        mutationKey: ["verify-login"],
        mutationFn: (data: MfaVerifyLoginMutationFnBody) =>
          mfaVerifyLoginMutationFn(data),
      });
    },
  },
  VerifyForgotPassword: {
    useMutation: (
      options?: UseMutationOptions<
        MfaVerifyForgotPasswordMutationFnResult,
        AxiosErrorRes,
        MfaVerifyForgotPasswordMutationFnBody
      >
    ) => {
      return useMutation<
        MfaVerifyForgotPasswordMutationFnResult,
        AxiosErrorRes,
        MfaVerifyForgotPasswordMutationFnBody
      >({
        ...options,
        mutationKey: ["varify-forgot-password"],
        mutationFn: (data: MfaVerifyForgotPasswordMutationFnBody) =>
          mfaVerifyForgotPasswordMutationFn(data),
      });
    },
  },
};
export default Mfa;
