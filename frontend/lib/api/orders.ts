import apiClient from "./client";
import { Order, OrderCreate, OrderUpdate } from "@/lib/types/order";

export const ordersApi = {
  list: async (): Promise<Order[]> => {
    const { data } = await apiClient.get<Order[]>("/orders/");
    return data;
  },

  get: async (id: string): Promise<Order> => {
    const { data } = await apiClient.get<Order>(`/orders/${id}`);
    return data;
  },

  create: async (order: OrderCreate): Promise<Order> => {
    const { data } = await apiClient.post<Order>("/orders/", order);
    return data;
  },

  update: async (id: string, order: OrderUpdate): Promise<Order> => {
    const { data } = await apiClient.put<Order>(`/orders/${id}`, order);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/orders/${id}`);
  },
};
