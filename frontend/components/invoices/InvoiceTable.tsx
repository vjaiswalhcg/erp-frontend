"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi } from "@/lib/api/invoices";
import { Invoice } from "@/lib/types/invoice";
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
  FileText,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { InvoiceDialog } from "./InvoiceDialog";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency } from "@/lib/utils";

export function InvoiceTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<
    "invoice_date" | "due_date" | "total"
  >("invoice_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canCreate, canEdit, canDelete } = usePermissions();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: invoicesApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: invoicesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedInvoice(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      deleteMutation.mutate(id);
    }
  };

  const processedInvoices = useMemo(() => {
    const filtered = (invoices || []).filter((inv) => {
      const searchTerm = search.toLowerCase();
      const matchesSearch =
        inv.customer?.name?.toLowerCase().includes(searchTerm) ||
        inv.customer_id.toLowerCase().includes(searchTerm) ||
        inv.external_ref?.toLowerCase().includes(searchTerm);
      const matchesStatus =
        statusFilter === "all" ? true : inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const sorted = filtered.sort((a, b) => {
      if (sortField === "invoice_date") {
        const aDate = new Date(a.invoice_date).getTime();
        const bDate = new Date(b.invoice_date).getTime();
        return sortDir === "asc" ? aDate - bDate : bDate - aDate;
      }
      if (sortField === "due_date") {
        const aDate = a.due_date ? new Date(a.due_date).getTime() : 0;
        const bDate = b.due_date ? new Date(b.due_date).getTime() : 0;
        return sortDir === "asc" ? aDate - bDate : bDate - aDate;
      }
      return sortDir === "asc"
        ? Number(a.total) - Number(b.total)
        : Number(b.total) - Number(a.total);
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
  }, [invoices, search, statusFilter, sortDir, sortField, page]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = invoices?.length || 0;
    const draft = invoices?.filter((i) => i.status === "draft").length || 0;
    const posted = invoices?.filter((i) => i.status === "posted").length || 0;
    const paid = invoices?.filter((i) => i.status === "paid").length || 0;
    const totalValue =
      invoices?.reduce((sum, i) => sum + Number(i.total), 0) || 0;
    const unpaidValue =
      invoices
        ?.filter((i) => i.status === "posted")
        .reduce((sum, i) => sum + Number(i.total), 0) || 0;
    return { total, draft, posted, paid, totalValue, unpaidValue };
  }, [invoices]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
        <p className="text-muted-foreground">Loading invoices...</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft:
        "bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400",
      posted:
        "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/50 dark:text-amber-400",
      paid: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400",
      written_off:
        "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/50 dark:text-red-400",
    };
    const labels: Record<string, string> = {
      draft: "Draft",
      posted: "Posted",
      paid: "Paid",
      written_off: "Written Off",
    };
    return (
      <Badge variant="secondary" className={styles[status] || styles.draft}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/25">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
            <p className="text-sm text-muted-foreground">
              Manage billing and invoices • {stats.total} invoices
            </p>
          </div>
        </div>
        {canCreate && (
          <Button
            onClick={handleCreate}
            className="bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/25"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Invoices
            </span>
            <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/50 dark:to-gray-900/30 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Draft
            </span>
            <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <Clock className="h-4 w-4 text-slate-500" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 text-slate-600 dark:text-slate-400">
            {stats.draft}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Posted
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-200 dark:bg-amber-800 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 text-amber-700 dark:text-amber-400">
            {stats.posted}
          </p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Paid
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-700 dark:text-emerald-400">
            {stats.paid}
          </p>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/20 rounded-xl border border-teal-200 dark:border-teal-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-teal-700 dark:text-teal-400">
              Total Value
            </span>
            <div className="h-8 w-8 rounded-lg bg-teal-200 dark:bg-teal-800 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 text-teal-700 dark:text-teal-400">
            {formatCurrency(stats.totalValue, "USD")}
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
              placeholder="Search by customer, ref, or ID..."
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="posted">Posted</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="written_off">Written Off</SelectItem>
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
              <SelectItem value="invoice_date:desc">Newest First</SelectItem>
              <SelectItem value="invoice_date:asc">Oldest First</SelectItem>
              <SelectItem value="due_date:asc">Due Date (Soon)</SelectItem>
              <SelectItem value="due_date:desc">Due Date (Later)</SelectItem>
              <SelectItem value="total:desc">Total High → Low</SelectItem>
              <SelectItem value="total:asc">Total Low → High</SelectItem>
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
                Invoice Date
              </TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                Customer
              </TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                Due Date
              </TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                Status
              </TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                Total
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-200">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedInvoices.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-slate-300" />
                    <p>No invoices match your filters.</p>
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
              processedInvoices.rows.map((invoice, index) => (
                <TableRow
                  key={invoice.id}
                  className={`
                    transition-colors
                    ${
                      index % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50/50 dark:bg-slate-800/30"
                    }
                    hover:bg-teal-50 dark:hover:bg-teal-900/20
                  `}
                >
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {formatDate(invoice.invoice_date)}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      {invoice.customer?.name || "Unknown customer"}
                      {invoice.external_ref && (
                        <div className="text-xs text-muted-foreground">
                          Ref: {invoice.external_ref}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {formatDate(invoice.due_date)}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(invoice)}
                          className="h-8 w-8 hover:bg-teal-100 hover:text-teal-600 dark:hover:bg-teal-900/30"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(invoice.id)}
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
            {processedInvoices.total === 0
              ? 0
              : (processedInvoices.currentPage - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {Math.min(
              processedInvoices.currentPage * pageSize,
              processedInvoices.total
            )}
          </span>{" "}
          of{" "}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {processedInvoices.total}
          </span>{" "}
          invoices
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={processedInvoices.currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-9 gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from(
              { length: Math.min(5, processedInvoices.totalPages) },
              (_, i) => {
                let pageNum: number;
                if (processedInvoices.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (processedInvoices.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (
                  processedInvoices.currentPage >=
                  processedInvoices.totalPages - 2
                ) {
                  pageNum = processedInvoices.totalPages - 4 + i;
                } else {
                  pageNum = processedInvoices.currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={
                      pageNum === processedInvoices.currentPage
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={`h-9 w-9 p-0 ${
                      pageNum === processedInvoices.currentPage
                        ? "bg-teal-600 hover:bg-teal-700"
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
              processedInvoices.currentPage >= processedInvoices.totalPages
            }
            onClick={() =>
              setPage((p) => Math.min(processedInvoices.totalPages, p + 1))
            }
            className="h-9 gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <InvoiceDialog
        invoice={selectedInvoice}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
