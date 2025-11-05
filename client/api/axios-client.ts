import { AxiosInstance } from "axios";
import axios from "axios";
import { env } from "@/env";

let api: AxiosInstance;

export function customAxiosInstance(): AxiosInstance {
  if (!api) {
    console.log("New instance created");
    api = axios.create({
      baseURL: env.NEXT_PUBLIC_API_BASE_URL,
      withCredentials: true,
      timeout: 10000,
    });

    api.interceptors.response.use(
      (response) => response,
      (error) => {
        const { data, status } = error.response ?? {};
        if (data === "Unauthorized" && status === 401) {
          // aici poți implementa retry pe /refresh
        }
        return Promise.reject({ ...data });
      }
    );
  }

  return api;
}
