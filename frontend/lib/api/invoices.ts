import apiClient from "./client";
import { Invoice, InvoiceCreate, InvoiceUpdate } from "@/lib/types/invoice";

export const invoicesApi = {
  list: async (): Promise<Invoice[]> => {
    const { data } = await apiClient.get<Invoice[]>("/invoices/");
    return data;
  },

  get: async (id: string): Promise<Invoice> => {
    const { data } = await apiClient.get<Invoice>(`/invoices/${id}`);
    return data;
  },

  create: async (invoice: InvoiceCreate): Promise<Invoice> => {
    const { data } = await apiClient.post<Invoice>("/invoices/", invoice);
    return data;
  },

  update: async (id: string, invoice: InvoiceUpdate): Promise<Invoice> => {
    const { data } = await apiClient.put<Invoice>(`/invoices/${id}`, invoice);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/invoices/${id}`);
  },
};
