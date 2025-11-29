"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api/orders";
import { Order } from "@/lib/types/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { OrderDialog } from "./OrderDialog";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

export function OrderTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"order_date" | "total" | "status">(
    "order_date"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: ordersApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: ordersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({
        title: "Success",
        description: "Order deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete order",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedOrder(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      deleteMutation.mutate(id);
    }
  };

  const processedOrders = useMemo(() => {
    const filtered = (orders || []).filter((o) => {
      const searchTerm = search.toLowerCase();
      const matchesSearch =
        o.customer?.name?.toLowerCase().includes(searchTerm) ||
        o.customer_id.toLowerCase().includes(searchTerm) ||
        o.external_ref?.toLowerCase().includes(searchTerm);
      const matchesStatus =
        statusFilter === "all" ? true : o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const sorted = filtered.sort((a, b) => {
      if (sortField === "order_date") {
        const aDate = new Date(a.order_date).getTime();
        const bDate = new Date(b.order_date).getTime();
        return sortDir === "asc" ? aDate - bDate : bDate - aDate;
      }
      if (sortField === "total") {
        return sortDir === "asc"
          ? Number(a.total) - Number(b.total)
          : Number(b.total) - Number(a.total);
      }
      return sortDir === "asc"
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    });

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return {
      rows: sorted.slice(start, end),
      total: sorted.length,
      totalPages,
      currentPage,
    };
  }, [orders, search, statusFilter, sortDir, sortField, page]);

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(field === "order_date" ? "desc" : "asc");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      draft: "secondary",
      confirmed: "default",
      fulfilled: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Orders</h2>
          <p className="text-sm text-muted-foreground">
            Track, filter, and manage recent orders.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Order
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Input
          placeholder="Search by customer, ref, or ID"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={`${sortField}:${sortDir}`}
          onValueChange={(value) => {
            const [field, dir] = value.split(":") as [
              typeof sortField,
              typeof sortDir
            ];
            setSortField(field);
            setSortDir(dir);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="order_date:desc">Newest first</SelectItem>
            <SelectItem value="order_date:asc">Oldest first</SelectItem>
            <SelectItem value="total:desc">Total high -&gt; low</SelectItem>
            <SelectItem value="total:asc">Total low -&gt; high</SelectItem>
            <SelectItem value="status:asc">Status A -&gt; Z</SelectItem>
            <SelectItem value="status:desc">Status Z -&gt; A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("order_date")}
              >
                Order Date{" "}
                {sortField === "order_date"
                  ? sortDir === "asc"
                    ? "(asc)"
                    : "(desc)"
                  : ""}
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("status")}
              >
                Status{" "}
                {sortField === "status"
                  ? sortDir === "asc"
                    ? "(asc)"
                    : "(desc)"
                  : ""}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("total")}
              >
                Total{" "}
                {sortField === "total"
                  ? sortDir === "asc"
                    ? "(asc)"
                    : "(desc)"
                  : ""}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedOrders.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No orders match your filters.
                </TableCell>
              </TableRow>
            ) : (
              processedOrders.rows.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{formatDate(order.order_date)}</TableCell>
                  <TableCell className="font-medium">
                    {order.customer?.name || "Unnamed customer"}
                    <div className="text-xs text-muted-foreground">
                      {order.external_ref || order.customer_id}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {formatCurrency(Number(order.total), order.currency)}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(order)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(order.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {(processedOrders.currentPage - 1) * pageSize + 1}-
          {Math.min(
            processedOrders.currentPage * pageSize,
            processedOrders.total
          )}{" "}
          of {processedOrders.total}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={processedOrders.currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={processedOrders.currentPage >= processedOrders.totalPages}
            onClick={() =>
              setPage((p) => Math.min(processedOrders.totalPages, p + 1))
            }
          >
            Next
          </Button>
        </div>
      </div>

      <OrderDialog
        order={selectedOrder}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
