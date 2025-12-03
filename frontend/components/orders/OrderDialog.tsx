"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api/orders";
import { customersApi } from "@/lib/api/customers";
import { productsApi } from "@/lib/api/products";
import { usersApi } from "@/lib/api/users";
import { Order, OrderCreate, OrderUpdate } from "@/lib/types/order";
import { useAuth } from "@/hooks/use-auth";
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
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const lineItemSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit_price: z.coerce.number().min(0, "Price must be positive"),
  tax_rate: z.coerce.number().min(0).default(0),
});

const orderSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  order_date: z.string(),
  status: z.enum(["draft", "confirmed", "fulfilled", "closed"]).default("draft"),
  currency: z.string().default("USD"),
  notes: z.string().optional(),
  lines: z.array(lineItemSchema).min(1, "At least one line item is required"),
  owner_id: z.string().optional(),
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
  const { user } = useAuth();

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: customersApi.list,
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.list,
  });

  const { data: users } = useQuery({
    queryKey: ["users-names"],
    queryFn: usersApi.listNames,
  });

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_id: "",
      order_date: new Date().toISOString().split("T")[0],
      status: "draft",
      currency: "USD",
      notes: "",
      lines: [{ product_id: "", quantity: 1, unit_price: 0, tax_rate: 0 }],
      owner_id: user?.id || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  useEffect(() => {
    if (!order) {
      form.reset({
        customer_id: "",
        order_date: new Date().toISOString().split("T")[0],
        status: "draft",
        currency: "USD",
        notes: "",
        lines: [{ product_id: "", quantity: 1, unit_price: 0, tax_rate: 0 }],
        owner_id: user?.id || "",
      });
      return;
    }
    
    const lines = (order.lines && order.lines.length > 0)
      ? order.lines.map(line => ({
          product_id: line.product_id,
          quantity: Number(line.quantity),
          unit_price: Number(line.unit_price),
          tax_rate: Number(line.tax_rate || 0),
        }))
      : [{ product_id: "", quantity: 1, unit_price: 0, tax_rate: 0 }];

    form.reset({
      customer_id: order.customer_id,
      order_date: order.order_date.split("T")[0],
      status: order.status,
      currency: order.currency,
      notes: order.notes || "",
      lines,
      owner_id: order.owner_id || "",
    });
    setApiError(null);
  }, [order, form, user]);

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
      lines: data.lines,
      owner_id: data.owner_id || undefined,
    };
    mutation.mutate(payload);
  };

  // Calculate totals
  const watchedLines = form.watch("lines");
  const subtotal = watchedLines?.reduce((sum, line) => {
    return sum + (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
  }, 0) || 0;

  const handleProductChange = (index: number, productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      form.setValue(`lines.${index}.unit_price`, product.price);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="owner_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <FormControl>
                    <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2">
                      <option value="">Select owner (defaults to you)</option>
                      {users?.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Line Items Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Line Items *</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ product_id: "", quantity: 1, unit_price: 0, tax_rate: 0 })}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Line
                </Button>
              </div>
              
              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-2 bg-muted/50 p-2 text-xs font-medium">
                  <div className="col-span-5">Product</div>
                  <div className="col-span-2">Qty</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-2">Total</div>
                  <div className="col-span-1"></div>
                </div>
                
                {fields.map((field, index) => {
                  const lineTotal = (Number(watchedLines?.[index]?.quantity) || 0) * 
                                    (Number(watchedLines?.[index]?.unit_price) || 0);
                  return (
                    <div key={field.id} className="grid grid-cols-12 gap-2 p-2 border-t items-center">
                      <div className="col-span-5">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.product_id`}
                          render={({ field }) => (
                            <select 
                              {...field} 
                              className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                              onChange={(e) => {
                                field.onChange(e);
                                handleProductChange(index, e.target.value);
                              }}
                            >
                              <option value="">Select...</option>
                              {products?.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          )}
                        />
                      </div>
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.quantity`}
                          render={({ field }) => (
                            <Input {...field} type="number" min="1" className="h-9" />
                          )}
                        />
                      </div>
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.unit_price`}
                          render={({ field }) => (
                            <Input {...field} type="number" step="0.01" min="0" className="h-9" />
                          )}
                        />
                      </div>
                      <div className="col-span-2 text-sm font-medium">
                        {formatCurrency(lineTotal)}
                      </div>
                      <div className="col-span-1">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Totals */}
                <div className="grid grid-cols-12 gap-2 p-2 border-t bg-muted/30">
                  <div className="col-span-9 text-right font-medium">Subtotal:</div>
                  <div className="col-span-2 font-bold">{formatCurrency(subtotal)}</div>
                  <div className="col-span-1"></div>
                </div>
              </div>
              {form.formState.errors.lines && (
                <p className="text-sm text-destructive">{form.formState.errors.lines.message}</p>
              )}
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
