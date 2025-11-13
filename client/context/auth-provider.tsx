"use client";
import React, { createContext, useContext } from "react";
import client from "@/api/index";
import {
  GetCurrentSessionSuccessResponse,
  UserData,
} from "@/api/client/client.schemas";
import { AxiosErrorRes } from "@/config/axios.config";
import {
  QueryObserverResult,
  RefetchOptions,
  RefetchQueryFilters,
} from "@tanstack/react-query";

type AuthContextType = {
  user?: UserData;
  error: AxiosErrorRes | null;
  isLoading: boolean;
  isFetching: boolean;
  refetch: <TPageData>(
    options?: (RefetchOptions & RefetchQueryFilters<TPageData>) | undefined
  ) => Promise<
    QueryObserverResult<GetCurrentSessionSuccessResponse, AxiosErrorRes>
  >;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data, error, isLoading, isFetching, refetch } =
    client.Session.GetCurrent.useQuery({
      staleTime: Infinity,
    });
  const user = data?.data.user;

  return (
    <AuthContext.Provider
      value={{ user, error, isLoading, isFetching, refetch }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within a AuthProvider");
  }
  return context;
};
