"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/api/payments";
import { Payment } from "@/lib/types/payment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  Filter,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { PaymentDialog } from "./PaymentDialog";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency } from "@/lib/utils";

export function PaymentTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"received_date" | "amount">(
    "received_date"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canCreate, canEdit, canDelete } = usePermissions();

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: paymentsApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: paymentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({
        title: "Success",
        description: "Payment deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to delete payment",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedPayment(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this payment?")) {
      deleteMutation.mutate(id);
    }
  };

  const processedPayments = useMemo(() => {
    const filtered = (payments || []).filter((p) => {
      const searchTerm = search.toLowerCase();
      const matchesSearch =
        p.customer?.name?.toLowerCase().includes(searchTerm) ||
        p.customer_id.toLowerCase().includes(searchTerm) ||
        p.external_ref?.toLowerCase().includes(searchTerm) ||
        p.method?.toLowerCase().includes(searchTerm) ||
        p.note?.toLowerCase().includes(searchTerm);
      const matchesStatus =
        statusFilter === "all" ? true : p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const sorted = filtered.sort((a, b) => {
      if (sortField === "received_date") {
        const aDate = new Date(a.received_date).getTime();
        const bDate = new Date(b.received_date).getTime();
        return sortDir === "asc" ? aDate - bDate : bDate - aDate;
      }
      return sortDir === "asc"
        ? Number(a.amount) - Number(b.amount)
        : Number(b.amount) - Number(a.amount);
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
  }, [payments, search, statusFilter, sortDir, sortField, page]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = payments?.length || 0;
    const received =
      payments?.filter((p) => p.status === "received").length || 0;
    const applied = payments?.filter((p) => p.status === "applied").length || 0;
    const failed = payments?.filter((p) => p.status === "failed").length || 0;
    const totalAmount =
      payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const appliedAmount =
      payments
        ?.filter((p) => p.status === "applied")
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    return { total, received, applied, failed, totalAmount, appliedAmount };
  }, [payments]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        <p className="text-muted-foreground">Loading payments...</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      received:
        "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400",
      applied:
        "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400",
      failed:
        "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/50 dark:text-red-400",
    };
    const labels: Record<string, string> = {
      received: "Received",
      applied: "Applied",
      failed: "Failed",
    };
    return (
      <Badge variant="secondary" className={styles[status] || styles.received}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
            <p className="text-sm text-muted-foreground">
              Track received payments • {stats.total} payments
            </p>
          </div>
        </div>
        {canCreate && (
          <Button
            onClick={handleCreate}
            className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/25"
          >
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Payments
            </span>
            <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Received
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 text-blue-700 dark:text-blue-400">
            {stats.received}
          </p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Applied
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-700 dark:text-emerald-400">
            {stats.applied}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/30 dark:to-rose-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-red-700 dark:text-red-400">
              Failed
            </span>
            <div className="h-8 w-8 rounded-lg bg-red-200 dark:bg-red-800 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 text-red-700 dark:text-red-400">
            {stats.failed}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Total Amount
            </span>
            <div className="h-8 w-8 rounded-lg bg-green-200 dark:bg-green-800 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 text-green-700 dark:text-green-400">
            {formatCurrency(stats.totalAmount, "USD")}
          </p>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Search & Filter
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by customer, method, or note..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
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
            <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="received_date:desc">Newest First</SelectItem>
              <SelectItem value="received_date:asc">Oldest First</SelectItem>
              <SelectItem value="amount:desc">Amount High → Low</SelectItem>
              <SelectItem value="amount:asc">Amount Low → High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/80">
              <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                Payment Date
              </TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                Customer
              </TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                Amount
              </TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                Method
              </TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                Status
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-200">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedPayments.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <CreditCard className="h-8 w-8 text-slate-300" />
                    <p>No payments match your filters.</p>
                    {search && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setSearch("");
                          setStatusFilter("all");
                        }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              processedPayments.rows.map((payment, index) => (
                <TableRow
                  key={payment.id}
                  className={`
                    transition-colors
                    ${
                      index % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50/50 dark:bg-slate-800/30"
                    }
                    hover:bg-green-50 dark:hover:bg-green-900/20
                  `}
                >
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {formatDate(payment.received_date)}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      {payment.customer?.name || "Unknown customer"}
                      {payment.external_ref && (
                        <div className="text-xs text-muted-foreground">
                          Ref: {payment.external_ref}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(payment.amount, payment.currency)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {payment.method ? (
                      <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {payment.method}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(payment)}
                          className="h-8 w-8 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(payment.id)}
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Showing{" "}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {processedPayments.total === 0
              ? 0
              : (processedPayments.currentPage - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {Math.min(
              processedPayments.currentPage * pageSize,
              processedPayments.total
            )}
          </span>{" "}
          of{" "}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {processedPayments.total}
          </span>{" "}
          payments
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={processedPayments.currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-9 gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from(
              { length: Math.min(5, processedPayments.totalPages) },
              (_, i) => {
                let pageNum: number;
                if (processedPayments.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (processedPayments.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (
                  processedPayments.currentPage >=
                  processedPayments.totalPages - 2
                ) {
                  pageNum = processedPayments.totalPages - 4 + i;
                } else {
                  pageNum = processedPayments.currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={
                      pageNum === processedPayments.currentPage
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={`h-9 w-9 p-0 ${
                      pageNum === processedPayments.currentPage
                        ? "bg-green-600 hover:bg-green-700"
                        : ""
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              }
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={
              processedPayments.currentPage >= processedPayments.totalPages
            }
            onClick={() =>
              setPage((p) => Math.min(processedPayments.totalPages, p + 1))
            }
            className="h-9 gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <PaymentDialog
        payment={selectedPayment}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
