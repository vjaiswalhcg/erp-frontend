import apiClient from "./client";
import { Payment, PaymentCreate, PaymentUpdate } from "@/lib/types/payment";

export const paymentsApi = {
  list: async (): Promise<Payment[]> => {
    const { data } = await apiClient.get<Payment[]>("/payments/");
    return data;
  },

  get: async (id: string): Promise<Payment> => {
    const { data } = await apiClient.get<Payment>(`/payments/${id}`);
    return data;
  },

  create: async (payment: PaymentCreate): Promise<Payment> => {
    const { data } = await apiClient.post<Payment>("/payments/", payment);
    return data;
  },

  update: async (id: string, payment: PaymentUpdate): Promise<Payment> => {
    const { data } = await apiClient.put<Payment>(`/payments/${id}`, payment);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/payments/${id}`);
  },
};
