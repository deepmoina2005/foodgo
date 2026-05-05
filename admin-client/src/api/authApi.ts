import { axiosInstance } from "./axiosInstance";

export const authApi = {
  register: (payload: unknown) => axiosInstance.post("/auth/register", payload),
  login: (payload: unknown) => axiosInstance.post("/auth/login", payload),
  logout: () => axiosInstance.post("/auth/logout"),
  me: () => axiosInstance.get("/auth/me"),
  profile: (payload: FormData | Record<string, unknown>) =>
    payload instanceof FormData
      ? (() => {
          const form = payload;
          form.append("_method", "PUT");
          return axiosInstance.post("/auth/profile", form, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        })()
      : axiosInstance.put("/auth/profile", payload),
  changePassword: (payload: unknown) =>
    axiosInstance.post("/auth/change-password", payload),
};
