import axios from "axios";

const options = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
};

const API = axios.create(options);

API.interceptors.response.use(
  (response) => {
    console.log(response.data);
    return response;
  },
  (error) => {
    console.log(error);
    console.log(error.response);
    const { data, status } = error.response;
    if (data === "Unauthorized" && status === 401) {
      // retry pe endpoint ul de /refrehs
    }
    return Promise.reject({
      ...data,
    });
  }
);

export default API;
