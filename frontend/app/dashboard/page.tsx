"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { customersApi } from "@/lib/api/customers";
import { productsApi } from "@/lib/api/products";
import { ordersApi } from "@/lib/api/orders";
import { invoicesApi } from "@/lib/api/invoices";
import { paymentsApi } from "@/lib/api/payments";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  Users, 
  Package, 
  ShoppingCart, 
  FileText, 
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { data: customers } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: productsApi.list });
  const { data: orders } = useQuery({ queryKey: ["orders"], queryFn: ordersApi.list });
  const { data: invoices } = useQuery({ queryKey: ["invoices"], queryFn: invoicesApi.list });
  const { data: payments } = useQuery({ queryKey: ["payments"], queryFn: paymentsApi.list });

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalCustomers = customers?.length ?? 0;
    const totalProducts = products?.length ?? 0;
    const totalOrders = orders?.length ?? 0;
    const totalInvoices = invoices?.length ?? 0;
    
    const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.total ?? 0), 0) ?? 0;
    const totalPayments = payments?.reduce((sum, p) => sum + Number(p.amount ?? 0), 0) ?? 0;
    
    // Orders by status
    const ordersByStatus = orders?.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) ?? {};
    
    // Invoices by status
    const invoicesByStatus = invoices?.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) ?? {};
    
    // Outstanding invoices (not paid)
    const outstandingInvoices = invoices?.filter(inv => inv.status !== 'paid') ?? [];
    const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + Number(inv.total ?? 0), 0);
    
    // Recent orders (last 5)
    const recentOrders = [...(orders ?? [])]
      .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
      .slice(0, 5);
    
    // Recent payments (last 5)
    const recentPayments = [...(payments ?? [])]
      .sort((a, b) => new Date(b.received_date).getTime() - new Date(a.received_date).getTime())
      .slice(0, 5);

    return {
      totalCustomers,
      totalProducts,
      totalOrders,
      totalInvoices,
      totalRevenue,
      totalPayments,
      outstandingAmount,
      ordersByStatus,
      invoicesByStatus,
      recentOrders,
      recentPayments,
    };
  }, [customers, products, orders, invoices, payments]);

  const statCards = [
    { 
      title: "Total Customers", 
      value: metrics.totalCustomers.toLocaleString(),
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    { 
      title: "Total Products", 
      value: metrics.totalProducts.toLocaleString(),
      icon: Package,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    { 
      title: "Total Orders", 
      value: metrics.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    { 
      title: "Total Revenue", 
      value: formatCurrency(metrics.totalRevenue),
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
  ];

  const getStatusBadge = (status: string, type: 'order' | 'invoice') => {
    const orderVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      confirmed: "default",
      fulfilled: "outline",
      closed: "outline",
    };
    const invoiceVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      posted: "default",
      paid: "default",
      written_off: "outline",
    };
    const variants = type === 'order' ? orderVariants : invoiceVariants;
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your ERP dashboard overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="mt-1 text-3xl font-bold">{card.value}</p>
                </div>
                <div className={`rounded-full p-3 ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span className="text-sm font-medium">Total Payments Received</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {formatCurrency(metrics.totalPayments)}
          </p>
        </div>
        
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Outstanding Invoices</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-orange-600">
            {formatCurrency(metrics.outstandingAmount)}
          </p>
        </div>
        
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Total Invoices</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{metrics.totalInvoices}</p>
        </div>
      </div>

      {/* Order & Invoice Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Orders by Status</h3>
          <div className="space-y-3">
            {Object.entries(metrics.ordersByStatus).length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet</p>
            ) : (
              Object.entries(metrics.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(status, 'order')}
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Invoices by Status</h3>
          <div className="space-y-3">
            {Object.entries(metrics.invoicesByStatus).length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet</p>
            ) : (
              Object.entries(metrics.invoicesByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(status, 'invoice')}
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Recent Orders</h3>
          <div className="space-y-3">
            {metrics.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent orders</p>
            ) : (
              metrics.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{order.customer?.name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.order_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(Number(order.total), order.currency)}</p>
                    {getStatusBadge(order.status, 'order')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Recent Payments</h3>
          <div className="space-y-3">
            {metrics.recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent payments</p>
            ) : (
              metrics.recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{payment.customer?.name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(payment.received_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      +{formatCurrency(Number(payment.amount), payment.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">{payment.method || "N/A"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
