"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customersApi } from "@/lib/api/customers";
import { Customer } from "@/lib/types/customer";
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
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CustomerDialog } from "./CustomerDialog";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";

export function CustomerTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"name" | "email" | "currency">(
    "name"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canCreate, canEdit, canDelete } = usePermissions();

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: customersApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: customersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedCustomer(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      deleteMutation.mutate(id);
    }
  };

  const processedCustomers = useMemo(() => {
    const filtered = (customers || []).filter((c) => {
      const searchTerm = search.toLowerCase();
      const matchesSearch =
        c.name?.toLowerCase().includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm) ||
        c.phone?.toLowerCase().includes(searchTerm) ||
        c.external_ref?.toLowerCase().includes(searchTerm);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? c.is_active
          : !c.is_active;

      return matchesSearch && matchesStatus;
    });

    const sorted = filtered.sort((a, b) => {
      if (sortField === "name") {
        return sortDir === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortField === "email") {
        const aEmail = a.email || "";
        const bEmail = b.email || "";
        return sortDir === "asc"
          ? aEmail.localeCompare(bEmail)
          : bEmail.localeCompare(aEmail);
      }
      return sortDir === "asc"
        ? a.currency.localeCompare(b.currency)
        : b.currency.localeCompare(a.currency);
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
  }, [customers, search, statusFilter, sortDir, sortField, page]);

  // Calculate stats for summary
  const stats = useMemo(() => {
    const total = customers?.length || 0;
    const active = customers?.filter((c) => c.is_active).length || 0;
    const inactive = total - active;
    return { total, active, inactive };
  }, [customers]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-muted-foreground">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
            <p className="text-sm text-muted-foreground">
              Manage your customer database • {stats.total} total
            </p>
          </div>
        </div>
        {canCreate && (
          <Button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Customers
            </span>
            <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Active
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-700 dark:text-emerald-400">
            {stats.active}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Inactive
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-200 dark:bg-amber-800 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-amber-500"></div>
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 text-amber-700 dark:text-amber-400">
            {stats.inactive}
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
              placeholder="Search by name, email, phone, or reference..."
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
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
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
              <SelectItem value="name:asc">Name A → Z</SelectItem>
              <SelectItem value="name:desc">Name Z → A</SelectItem>
              <SelectItem value="email:asc">Email A → Z</SelectItem>
              <SelectItem value="email:desc">Email Z → A</SelectItem>
              <SelectItem value="currency:asc">Currency A → Z</SelectItem>
              <SelectItem value="currency:desc">Currency Z → A</SelectItem>
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
                Name
              </TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                Email
              </TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                Phone
              </TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                Currency
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
            {processedCustomers.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-slate-300" />
                    <p>No customers match your filters.</p>
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
              processedCustomers.rows.map((customer, index) => (
                <TableRow
                  key={customer.id}
                  className={`
                    transition-colors
                    ${
                      index % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50/50 dark:bg-slate-800/30"
                    }
                    hover:bg-blue-50 dark:hover:bg-blue-900/20
                  `}
                >
                  <TableCell className="font-medium">
                    <div>
                      {customer.name}
                      {customer.external_ref && (
                        <div className="text-xs text-muted-foreground">
                          Ref: {customer.external_ref}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {customer.email || (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {customer.phone || (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {customer.currency}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={customer.is_active ? "default" : "secondary"}
                      className={
                        customer.is_active
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400"
                      }
                    >
                      {customer.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(customer)}
                          className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(customer.id)}
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
            {processedCustomers.total === 0
              ? 0
              : (processedCustomers.currentPage - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {Math.min(
              processedCustomers.currentPage * pageSize,
              processedCustomers.total
            )}
          </span>{" "}
          of{" "}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {processedCustomers.total}
          </span>{" "}
          customers
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={processedCustomers.currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-9 gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from(
              { length: Math.min(5, processedCustomers.totalPages) },
              (_, i) => {
                let pageNum: number;
                if (processedCustomers.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (processedCustomers.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (
                  processedCustomers.currentPage >=
                  processedCustomers.totalPages - 2
                ) {
                  pageNum = processedCustomers.totalPages - 4 + i;
                } else {
                  pageNum = processedCustomers.currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={
                      pageNum === processedCustomers.currentPage
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={`h-9 w-9 p-0 ${
                      pageNum === processedCustomers.currentPage
                        ? "bg-blue-600 hover:bg-blue-700"
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
              processedCustomers.currentPage >= processedCustomers.totalPages
            }
            onClick={() =>
              setPage((p) => Math.min(processedCustomers.totalPages, p + 1))
            }
            className="h-9 gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CustomerDialog
        customer={selectedCustomer}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
