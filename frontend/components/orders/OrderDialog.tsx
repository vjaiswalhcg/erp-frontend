"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api/orders";
import { customersApi } from "@/lib/api/customers";
import { productsApi } from "@/lib/api/products";
import { Order, OrderCreate, OrderUpdate } from "@/lib/types/order";
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

const orderSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  order_date: z.string(),
  status: z.enum(["draft", "confirmed", "fulfilled", "closed"]).default("draft"),
  currency: z.string().default("USD"),
  notes: z.string().optional(),
  product_id: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit_price: z.coerce.number().min(0, "Price must be positive"),
});

type OrderFormValues = z.infer<typeof orderSchema>;

interface OrderDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDialog({ order, open, onOpenChange }: OrderDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: customersApi.list,
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.list,
  });

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_id: "",
      order_date: new Date().toISOString().split("T")[0],
      status: "draft",
      currency: "USD",
      notes: "",
      product_id: "",
      quantity: 1,
      unit_price: 0,
    },
  });

  useEffect(() => {
    if (!order) {
      form.reset({
        customer_id: "",
        order_date: new Date().toISOString().split("T")[0],
        status: "draft",
        currency: "USD",
        notes: "",
        product_id: "",
        quantity: 1,
        unit_price: 0,
      });
      return;
    }
    const firstLine = order.lines?.[0];
    form.reset({
      customer_id: order.customer_id,
      order_date: order.order_date.split("T")[0],
      status: order.status,
      currency: order.currency,
      notes: order.notes || "",
      product_id: firstLine?.product_id || "",
      quantity: firstLine ? Number(firstLine.quantity) : 1,
      unit_price: firstLine ? Number(firstLine.unit_price) : 0,
    });
    setApiError(null);
  }, [order, form]);

  const mutation = useMutation({
    mutationFn: (payload: OrderCreate | OrderUpdate) =>
      order
        ? ordersApi.update(order.id, payload as OrderUpdate)
        : ordersApi.create(payload as OrderCreate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({
        title: "Success",
        description: order ? "Order updated" : "Order created",
      });
      setApiError(null);
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      // Try to surface validation details from FastAPI/Pydantic or raw body
      const detail = error?.response?.data?.detail;
      let message = "Failed to save order";
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
          message = "Failed to save order (see console for details)";
        }
      } else if (error?.message) {
        message = error.message;
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

  const onSubmit = (data: OrderFormValues) => {
    const payload: OrderCreate | OrderUpdate = {
      customer_id: data.customer_id,
      order_date: data.order_date,
      status: data.status as Order["status"],
      currency: data.currency,
      notes: data.notes,
      lines: [
        {
          product_id: data.product_id,
          quantity: data.quantity,
          unit_price: data.unit_price,
          tax_rate: 0,
        },
      ],
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{order ? "Edit Order" : "Create Order"}</DialogTitle>
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
                name="order_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Date *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2">
                        <option value="draft">Draft</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="fulfilled">Fulfilled</option>
                        <option value="closed">Closed</option>
                        <option value="closed">Closed</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product *</FormLabel>
                  <FormControl>
                    <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                      onChange={(e) => {
                        field.onChange(e);
                        const product = products?.find(p => p.id === e.target.value);
                        if (product) {
                          form.setValue('unit_price', product.price);
                        }
                      }}>
                      <option value="">Select product</option>
                      {products?.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} - {p.price}</option>
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
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" min="0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
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

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {order ? "Save Changes" : "Create Order"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
