"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { invoicesApi } from "@/lib/api/invoices";
import { customersApi } from "@/lib/api/customers";
import { ordersApi } from "@/lib/api/orders";
import { productsApi } from "@/lib/api/products";
import { usersApi } from "@/lib/api/users";
import { Invoice, InvoiceCreate, InvoiceUpdate } from "@/lib/types/invoice";
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
  product_id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit_price: z.coerce.number().min(0, "Price must be positive"),
  tax_rate: z.coerce.number().min(0).default(0),
});

const invoiceSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  order_id: z.string().optional(),
  invoice_date: z.string(),
  due_date: z.string().optional(),
  status: z.enum(["draft", "posted", "paid", "written_off"]).default("draft"),
  tax_total: z.coerce.number().min(0, "Tax must be positive"),
  currency: z.string().default("USD"),
  notes: z.string().optional(),
  lines: z.array(lineItemSchema).min(1, "At least one line item is required"),
  owner_id: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDialog({ invoice, open, onOpenChange }: InvoiceDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const { user } = useAuth();

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: customersApi.list,
  });

  const { data: orders } = useQuery({
    queryKey: ["orders"],
    queryFn: ordersApi.list,
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.list,
  });

  const { data: users } = useQuery({
    queryKey: ["users-names"],
    queryFn: usersApi.listNames,
  });

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customer_id: "",
      order_id: "",
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: "",
      status: "draft",
      tax_total: 0,
      currency: "USD",
      notes: "",
      lines: [{ product_id: "", description: "", quantity: 1, unit_price: 0, tax_rate: 0 }],
      owner_id: user?.id || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  useEffect(() => {
    if (!invoice) {
      form.reset({
        customer_id: "",
        order_id: "",
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: "",
        status: "draft",
        tax_total: 0,
        currency: "USD",
        notes: "",
        lines: [{ product_id: "", description: "", quantity: 1, unit_price: 0, tax_rate: 0 }],
        owner_id: user?.id || "",
      });
      setApiError(null);
      return;
    }

    const lines = (invoice.lines && invoice.lines.length > 0)
      ? invoice.lines.map(line => ({
          product_id: line.product_id || "",
          description: line.description || "",
          quantity: Number(line.quantity),
          unit_price: Number(line.unit_price),
          tax_rate: Number(line.tax_rate || 0),
        }))
      : [{ product_id: "", description: "", quantity: 1, unit_price: 0, tax_rate: 0 }];

    form.reset({
      customer_id: invoice.customer_id,
      order_id: invoice.order_id || "",
      invoice_date: invoice.invoice_date.split("T")[0],
      due_date: invoice.due_date ? invoice.due_date.split("T")[0] : "",
      status: invoice.status as InvoiceFormValues["status"],
      tax_total: invoice.tax_total || 0,
      currency: invoice.currency,
      notes: invoice.notes || "",
      lines,
      owner_id: invoice.owner_id || "",
    });
    setApiError(null);
  }, [invoice, form, user]);

  const createMutation = useMutation({
    mutationFn: (payload: InvoiceCreate | InvoiceUpdate) =>
      invoice
        ? invoicesApi.update(invoice.id, payload as InvoiceUpdate)
        : invoicesApi.create(payload as InvoiceCreate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({
        title: "Success",
        description: invoice ? "Invoice updated successfully" : "Invoice created successfully",
      });
      setApiError(null);
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      let message = "Failed to save invoice";
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

  const onSubmit = (data: InvoiceFormValues) => {
    const payload: InvoiceCreate | InvoiceUpdate = {
      customer_id: data.customer_id,
      order_id: data.order_id || undefined,
      invoice_date: data.invoice_date,
      due_date: data.due_date || undefined,
      status: data.status,
      tax_total: data.tax_total,
      currency: data.currency,
      notes: data.notes,
      lines: data.lines.map(line => ({
        product_id: line.product_id || undefined,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        tax_rate: line.tax_rate,
      })),
      owner_id: data.owner_id || undefined,
    };
    createMutation.mutate(payload);
  };

  // Calculate totals
  const watchedLines = form.watch("lines");
  const watchedTax = form.watch("tax_total") || 0;
  const subtotal = watchedLines?.reduce((sum, line) => {
    return sum + (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
  }, 0) || 0;
  const total = subtotal + Number(watchedTax);

  const handleProductChange = (index: number, productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      form.setValue(`lines.${index}.description`, product.name);
      form.setValue(`lines.${index}.unit_price`, product.price);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? "Edit Invoice" : "Create Invoice"}</DialogTitle>
        </DialogHeader>
        {apiError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {apiError}
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="order_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order (Optional)</FormLabel>
                    <FormControl>
                      <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2">
                        <option value="">No order</option>
                        {orders?.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.customer?.name} - {new Date(o.order_date).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="invoice_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
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
                        <option value="posted">Posted</option>
                        <option value="paid">Paid</option>
                        <option value="written_off">Written off</option>
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
                  onClick={() => append({ product_id: "", description: "", quantity: 1, unit_price: 0, tax_rate: 0 })}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Line
                </Button>
              </div>
              
              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-2 bg-muted/50 p-2 text-xs font-medium">
                  <div className="col-span-4">Description</div>
                  <div className="col-span-2">Product</div>
                  <div className="col-span-2">Qty</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-1">Total</div>
                  <div className="col-span-1"></div>
                </div>
                
                {fields.map((field, index) => {
                  const lineTotal = (Number(watchedLines?.[index]?.quantity) || 0) * 
                                    (Number(watchedLines?.[index]?.unit_price) || 0);
                  return (
                    <div key={field.id} className="grid grid-cols-12 gap-2 p-2 border-t items-center">
                      <div className="col-span-4">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.description`}
                          render={({ field }) => (
                            <Input {...field} placeholder="Description" className="h-9" />
                          )}
                        />
                      </div>
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.product_id`}
                          render={({ field }) => (
                            <select 
                              {...field} 
                              className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                              onChange={(e) => {
                                field.onChange(e);
                                handleProductChange(index, e.target.value);
                              }}
                            >
                              <option value="">None</option>
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
                      <div className="col-span-1 text-xs font-medium">
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
                <div className="space-y-1 p-2 border-t bg-muted/30">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-10 text-right text-sm">Subtotal:</div>
                    <div className="col-span-2 font-medium text-sm">{formatCurrency(subtotal)}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-8 text-right text-sm">Tax:</div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name="tax_total"
                        render={({ field }) => (
                          <Input {...field} type="number" step="0.01" min="0" className="h-8 text-sm" />
                        )}
                      />
                    </div>
                    <div className="col-span-2"></div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 pt-1 border-t">
                    <div className="col-span-10 text-right font-semibold">Total:</div>
                    <div className="col-span-2 font-bold">{formatCurrency(total)}</div>
                  </div>
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
              <Button type="submit" disabled={createMutation.isPending}>
                {invoice ? "Save Changes" : "Create Invoice"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
