"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/api/payments";
import { customersApi } from "@/lib/api/customers";
import { invoicesApi } from "@/lib/api/invoices";
import { Payment, PaymentCreate, PaymentUpdate } from "@/lib/types/payment";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const paymentSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  received_date: z.string(),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  currency: z.string().default("USD"),
  method: z.string().optional(),
  note: z.string().optional(),
  invoice_id: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentDialogProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentDialog({ payment, open, onOpenChange }: PaymentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: customersApi.list,
  });

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: invoicesApi.list,
  });

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      customer_id: "",
      received_date: new Date().toISOString().split('T')[0],
      amount: 0,
      currency: "USD",
      method: "",
      note: "",
      invoice_id: "",
    },
  });

  useEffect(() => {
    if (!payment) {
      form.reset({
        customer_id: "",
        received_date: new Date().toISOString().split("T")[0],
        amount: 0,
        currency: "USD",
        method: "",
        note: "",
        invoice_id: "",
      });
      setApiError(null);
      return;
    }
    form.reset({
      customer_id: payment.customer_id,
      received_date: payment.received_date.split("T")[0],
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method || "",
      note: payment.note || "",
      invoice_id: payment.invoice_id || "",
    });
    setApiError(null);
  }, [payment, form]);

  const createMutation = useMutation({
    mutationFn: (payload: PaymentCreate | PaymentUpdate) =>
      payment ? paymentsApi.update(payment.id, payload as PaymentUpdate) : paymentsApi.create(payload as PaymentCreate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({
        title: "Success",
        description: payment ? "Payment updated successfully" : "Payment created successfully",
      });
      setApiError(null);
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      let message = "Failed to save payment";
      const url = error?.config?.url;
      const method = error?.config?.method?.toUpperCase?.();
      if (Array.isArray(detail)) {
        const first = detail[0] || {};
        const loc = Array.isArray(first.loc) ? first.loc.join(" -> ") : undefined;
        if (first.msg) {
          message = loc ? `${first.msg} (${loc})` : first.msg;
        }
      } else if (typeof detail === "string" && detail.trim().length > 0) {
        message = detail;
      } else if (error?.response?.data) {
        try {
          message = JSON.stringify(error.response.data, null, 2);
        } catch {
          message = "Failed to save payment (see console for details)";
        }
      } else if (error?.message) {
        message = method && url ? `${error.message} (${method} ${url})` : error.message;
      } else if (url) {
        message = `Request failed (${method || "REQUEST"} ${url})`;
      }
      if (error?.response?.status) {
        message = `[${error.response.status}] ${message}`;
      }
      setApiError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentFormValues) => {
    const payload: PaymentCreate | PaymentUpdate = {
      customer_id: data.customer_id,
      invoice_id: data.invoice_id || undefined,
      received_date: data.received_date,
      amount: data.amount,
      currency: data.currency,
      method: data.method || undefined,
      note: data.note || undefined,
    };

    createMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{payment ? "Edit Payment" : "Create Payment"}</DialogTitle>
        </DialogHeader>
        {apiError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {apiError}
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer *</FormLabel>
                  <FormControl>
                    <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2">
                      <option value="">Select customer</option>
                      {customers?.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="received_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" min="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <FormControl>
                      <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2">
                        <option value="">Select method</option>
                        <option value="cash">Cash</option>
                        <option value="check">Check</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="other">Other</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Optional notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="invoice_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apply to Invoice (Optional)</FormLabel>
                  <FormControl>
                    <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2">
                      <option value="">No invoice</option>
                      {invoices?.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.customer?.name} - {new Date(inv.invoice_date).toLocaleDateString()} - ${inv.total}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {payment ? "Save Changes" : "Create Payment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
