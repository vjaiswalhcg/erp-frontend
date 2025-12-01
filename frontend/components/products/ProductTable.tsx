"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/lib/api/products";
import { Product } from "@/lib/types/product";
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
  Package,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import { ProductDialog } from "./ProductDialog";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency } from "@/lib/utils";

export function ProductTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"name" | "sku" | "price">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canCreate, canEdit, canDelete } = usePermissions();

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  const processedProducts = useMemo(() => {
    const filtered = (products || []).filter((p) => {
      const searchTerm = search.toLowerCase();
      const matchesSearch =
        p.name?.toLowerCase().includes(searchTerm) ||
        p.sku?.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm) ||
        p.external_ref?.toLowerCase().includes(searchTerm);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? p.is_active
          : !p.is_active;

      return matchesSearch && matchesStatus;
    });

    const sorted = filtered.sort((a, b) => {
      if (sortField === "name") {
        return sortDir === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortField === "sku") {
        return sortDir === "asc"
          ? a.sku.localeCompare(b.sku)
          : b.sku.localeCompare(a.sku);
      }
      return sortDir === "asc" ? a.price - b.price : b.price - a.price;
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
  }, [products, search, statusFilter, sortDir, sortField, page]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = products?.length || 0;
    const active = products?.filter((p) => p.is_active).length || 0;
    const inactive = total - active;
    const totalValue =
      products?.reduce((sum, p) => sum + (p.is_active ? p.price : 0), 0) || 0;
    return { total, active, inactive, totalValue };
  }, [products]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Products</h1>
            <p className="text-sm text-muted-foreground">
              Manage your product catalog • {stats.total} items
            </p>
          </div>
        </div>
        {canCreate && (
          <Button
            onClick={handleCreate}
            className="bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/25"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Products
            </span>
            <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <Package className="h-4 w-4 text-slate-600 dark:text-slate-400" />
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
        <div className="bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/20 rounded-xl border border-violet-200 dark:border-violet-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-violet-700 dark:text-violet-400">
              Catalog Value
            </span>
            <div className="h-8 w-8 rounded-lg bg-violet-200 dark:bg-violet-800 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 text-violet-700 dark:text-violet-400">
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
              placeholder="Search by name, SKU, or description..."
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
              <SelectItem value="sku:asc">SKU A → Z</SelectItem>
              <SelectItem value="sku:desc">SKU Z → A</SelectItem>
              <SelectItem value="price:asc">Price Low → High</SelectItem>
              <SelectItem value="price:desc">Price High → Low</SelectItem>
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
                SKU
              </TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                Name
              </TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                Description
              </TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-200">
                Price
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
            {processedProducts.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-slate-300" />
                    <p>No products match your filters.</p>
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
              processedProducts.rows.map((product, index) => (
                <TableRow
                  key={product.id}
                  className={`
                    transition-colors
                    ${
                      index % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50/50 dark:bg-slate-800/30"
                    }
                    hover:bg-violet-50 dark:hover:bg-violet-900/20
                  `}
                >
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                      {product.sku}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      {product.name}
                      {product.external_ref && (
                        <div className="text-xs text-muted-foreground">
                          Ref: {product.external_ref}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {product.description || (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(product.price, product.currency)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.is_active ? "default" : "secondary"}
                      className={
                        product.is_active
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400"
                      }
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product)}
                          className="h-8 w-8 hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-900/30"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
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
            {processedProducts.total === 0
              ? 0
              : (processedProducts.currentPage - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {Math.min(
              processedProducts.currentPage * pageSize,
              processedProducts.total
            )}
          </span>{" "}
          of{" "}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {processedProducts.total}
          </span>{" "}
          products
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={processedProducts.currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-9 gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from(
              { length: Math.min(5, processedProducts.totalPages) },
              (_, i) => {
                let pageNum: number;
                if (processedProducts.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (processedProducts.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (
                  processedProducts.currentPage >=
                  processedProducts.totalPages - 2
                ) {
                  pageNum = processedProducts.totalPages - 4 + i;
                } else {
                  pageNum = processedProducts.currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={
                      pageNum === processedProducts.currentPage
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={`h-9 w-9 p-0 ${
                      pageNum === processedProducts.currentPage
                        ? "bg-violet-600 hover:bg-violet-700"
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
              processedProducts.currentPage >= processedProducts.totalPages
            }
            onClick={() =>
              setPage((p) => Math.min(processedProducts.totalPages, p + 1))
            }
            className="h-9 gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ProductDialog
        product={selectedProduct}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
