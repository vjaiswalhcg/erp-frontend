"use client";

import { useQuery } from "@tanstack/react-query";
import { customersApi } from "@/lib/api/customers";
import { productsApi } from "@/lib/api/products";
import { ordersApi } from "@/lib/api/orders";
import { invoicesApi } from "@/lib/api/invoices";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const { data: customers } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: productsApi.list });
  const { data: orders } = useQuery({ queryKey: ["orders"], queryFn: ordersApi.list });
  const { data: invoices } = useQuery({ queryKey: ["invoices"], queryFn: invoicesApi.list });

  const totalCustomers = customers?.length ?? 0;
  const totalProducts = products?.length ?? 0;
  const totalOrders = orders?.length ?? 0;
  const totalRevenue =
    invoices?.reduce((sum, inv) => sum + Number(inv.total ?? 0), 0) ?? 0;

  const cards = [
    { title: "Total Customers", value: totalCustomers.toLocaleString() },
    { title: "Total Products", value: totalProducts.toLocaleString() },
    { title: "Total Orders", value: totalOrders.toLocaleString() },
    { title: "Total Revenue", value: formatCurrency(totalRevenue) },
  ];

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">
              {card.title}
            </h3>
            <p className="mt-2 text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
