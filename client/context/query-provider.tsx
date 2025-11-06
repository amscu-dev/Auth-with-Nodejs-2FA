"use client";
import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import queryClientConfig from "@/config/reactQueryClientOptions.config";

interface Props {
  children: ReactNode;
}

export default function QueryProvider({ children }: Props) {
  const queryClient = new QueryClient(queryClientConfig);
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
