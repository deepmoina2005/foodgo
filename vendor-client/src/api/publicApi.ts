import { axiosInstance } from "./axiosInstance";

export const publicApi = {
  restaurants: (params?: Record<string, unknown>) =>
    axiosInstance.get("/restaurants", { params }),
  restaurant: (id: number | string) =>
    axiosInstance.get(`/restaurants/${id}`),
  foods: (params?: Record<string, unknown>) =>
    axiosInstance.get("/foods", { params }),
  food: (id: number | string) => axiosInstance.get(`/foods/${id}`),
  categories: () => axiosInstance.get("/categories"),
};
