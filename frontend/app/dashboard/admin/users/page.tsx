"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  usersApi,
  UserCreatePayload,
  UserUpdatePayload,
} from "@/lib/api/users";
import { User, UserRole } from "@/lib/types/user";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Users,
  Shield,
  ShieldCheck,
  UserCog,
  Eye,
  Plus,
  Search,
  Filter,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(["admin", "manager", "staff", "viewer"]),
  is_active: z.boolean().default(true),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"name" | "email" | "role">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.list,
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "viewer",
      is_active: true,
      first_name: "",
      last_name: "",
      phone: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      if (selectedUser) {
        const payload: UserUpdatePayload = {
          email: values.email,
          role: values.role as UserRole,
          is_active: values.is_active,
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone,
        };
        if (values.password) {
          payload.password = values.password;
        }
        return usersApi.update(selectedUser.id, payload);
      } else {
        const payload: UserCreatePayload = {
          email: values.email,
          password: values.password || "",
          role: values.role as UserRole,
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone,
        };
        return usersApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Success",
        description: selectedUser ? "User updated" : "User created",
      });
      setIsDialogOpen(false);
      setSelectedUser(null);
      form.reset({
        email: "",
        password: "",
        role: "viewer",
        is_active: true,
      });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      const message =
        detail ||
        error?.message ||
        "Failed to save user (check role/permissions)";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    form.reset({
      email: user.email,
      password: "",
      role: user.role,
      is_active: user.is_active,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    form.reset({
      email: "",
      password: "",
      role: "viewer",
      is_active: true,
      first_name: "",
      last_name: "",
      phone: "",
    });
    setIsDialogOpen(true);
  };

  const processedUsers = useMemo(() => {
    const filtered = (users || []).filter((u) => {
      const term = search.toLowerCase();
      const name = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
      const matchesSearch =
        u.email.toLowerCase().includes(term) ||
        name.includes(term) ||
        u.role.toLowerCase().includes(term);

      const matchesRole = roleFilter === "all" ? true : u.role === roleFilter;
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? u.is_active
          : !u.is_active;

      return matchesSearch && matchesRole && matchesStatus;
    });

    const sorted = filtered.sort((a, b) => {
      if (sortField === "name") {
        const aName = `${a.first_name || ""} ${a.last_name || ""}`.trim();
        const bName = `${b.first_name || ""} ${b.last_name || ""}`.trim();
        return sortDir === "asc"
          ? aName.localeCompare(bName)
          : bName.localeCompare(aName);
      }
      if (sortField === "email") {
        return sortDir === "asc"
          ? a.email.localeCompare(b.email)
          : b.email.localeCompare(a.email);
      }
      return sortDir === "asc"
        ? a.role.localeCompare(b.role)
        : b.role.localeCompare(a.role);
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
  }, [users, search, roleFilter, statusFilter, sortDir, sortField, page]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = users?.length || 0;
    const active = users?.filter((u) => u.is_active).length || 0;
    const admins = users?.filter((u) => u.role === "admin").length || 0;
    const managers = users?.filter((u) => u.role === "manager").length || 0;
    const staff = users?.filter((u) => u.role === "staff").length || 0;
    const viewers = users?.filter((u) => u.role === "viewer").length || 0;
    return { total, active, admins, managers, staff, viewers };
  }, [users]);

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin:
        "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/50 dark:text-red-400",
      manager:
        "bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/50 dark:text-purple-400",
      staff:
        "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400",
      viewer:
        "bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400",
    };
    return (
      <Badge variant="secondary" className={styles[role] || styles.viewer}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <Shield className="h-12 w-12 mx-auto text-destructive/50 mb-4" />
        <h2 className="text-lg font-semibold text-destructive mb-2">
          Access Denied
        </h2>
        <p className="text-destructive/80">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600"></div>
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/25">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage user accounts and permissions • {stats.total} users
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/25"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total
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
        <div className="bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/30 dark:to-rose-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-red-700 dark:text-red-400">
              Admins
            </span>
            <div className="h-8 w-8 rounded-lg bg-red-200 dark:bg-red-800 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 text-red-700 dark:text-red-400">
            {stats.admins}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
              Managers
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-200 dark:bg-purple-800 flex items-center justify-center">
              <UserCog className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 text-purple-700 dark:text-purple-400">
            {stats.managers}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Staff
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 text-blue-700 dark:text-blue-400">
            {stats.staff}
          </p>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/50 dark:to-gray-900/30 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Viewers
            </span>
            <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <Eye className="h-4 w-4 text-slate-500" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2 text-slate-600 dark:text-slate-400">
            {stats.viewers}
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
        <div className="grid gap-3 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
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
              <SelectItem value="role:asc">Role A → Z</SelectItem>
              <SelectItem value="role:desc">Role Z → A</SelectItem>
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
                Role
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
            {processedUsers.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-slate-300" />
                    <p>No users match your filters.</p>
                    {search && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setSearch("");
                          setRoleFilter("all");
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
              processedUsers.rows.map((user, index) => {
                const name =
                  `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                  "—";
                return (
                  <TableRow
                    key={user.id}
                    className={`
                      transition-colors
                      ${
                        index % 2 === 0
                          ? "bg-white dark:bg-slate-900"
                          : "bg-slate-50/50 dark:bg-slate-800/30"
                      }
                      hover:bg-rose-50 dark:hover:bg-rose-900/20
                    `}
                  >
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {user.phone || <span className="text-slate-400">—</span>}
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.is_active ? "default" : "secondary"}
                        className={
                          user.is_active
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400"
                        }
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(user)}
                        className="h-8 w-8 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Showing{" "}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {processedUsers.total === 0
              ? 0
              : (processedUsers.currentPage - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {Math.min(
              processedUsers.currentPage * pageSize,
              processedUsers.total
            )}
          </span>{" "}
          of{" "}
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {processedUsers.total}
          </span>{" "}
          users
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={processedUsers.currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-9 gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from(
              { length: Math.min(5, processedUsers.totalPages) },
              (_, i) => {
                let pageNum: number;
                if (processedUsers.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (processedUsers.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (
                  processedUsers.currentPage >=
                  processedUsers.totalPages - 2
                ) {
                  pageNum = processedUsers.totalPages - 4 + i;
                } else {
                  pageNum = processedUsers.currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={
                      pageNum === processedUsers.currentPage
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={`h-9 w-9 p-0 ${
                      pageNum === processedUsers.currentPage
                        ? "bg-rose-600 hover:bg-rose-700"
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
            disabled={processedUsers.currentPage >= processedUsers.totalPages}
            onClick={() =>
              setPage((p) => Math.min(processedUsers.totalPages, p + 1))
            }
            className="h-9 gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Edit User" : "Create User"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((vals) => mutation.mutate(vals))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Password {selectedUser ? "(leave blank to keep)" : ""}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="********" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="First name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Last name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="staff">Staff</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Active</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {selectedUser ? "Save Changes" : "Create User"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
