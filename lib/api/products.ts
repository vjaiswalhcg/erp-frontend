import apiClient from "./client";
import { Product, ProductCreate, ProductUpdate } from "@/lib/types/product";

export const productsApi = {
  list: async (): Promise<Product[]> => {
    const { data } = await apiClient.get<Product[]>("/products/");
    return data;
  },

  get: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get<Product>(`/products/${id}`);
    return data;
  },

  create: async (product: ProductCreate): Promise<Product> => {
    const { data } = await apiClient.post<Product>("/products/", product);
    return data;
  },

  update: async (id: string, product: ProductUpdate): Promise<Product> => {
    const { data } = await apiClient.put<Product>(`/products/${id}`, product);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
