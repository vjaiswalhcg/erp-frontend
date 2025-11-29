import apiClient from "./client";
import { Customer, CustomerCreate, CustomerUpdate } from "@/lib/types/customer";

export const customersApi = {
  list: async (): Promise<Customer[]> => {
    const { data } = await apiClient.get<Customer[]>("/customers/");
    return data;
  },

  get: async (id: string): Promise<Customer> => {
    const { data } = await apiClient.get<Customer>(`/customers/${id}`);
    return data;
  },

  create: async (customer: CustomerCreate): Promise<Customer> => {
    const { data } = await apiClient.post<Customer>("/customers/", customer);
    return data;
  },

  update: async (id: string, customer: CustomerUpdate): Promise<Customer> => {
    const { data } = await apiClient.put<Customer>(
      `/customers/${id}`,
      customer
    );
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },
};
