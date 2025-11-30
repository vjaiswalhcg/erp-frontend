"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi, UserCreatePayload, UserUpdatePayload } from "@/lib/api/users";
import { User, UserRole } from "@/lib/types/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

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

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase();
    return (users || []).filter(
      (u) => u.email.toLowerCase().includes(term) || u.role.toLowerCase().includes(term)
    );
  }, [users, search]);

  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-destructive">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Users</h1>
          <p className="text-sm text-muted-foreground">Manage user access and roles.</p>
        </div>
        <Button onClick={handleCreate}>Create User</Button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Search by email or role"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs"
          />
          <div className="text-sm text-muted-foreground">
            {filteredUsers.length} user{filteredUsers.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const name = `${u.first_name || ""} ${u.last_name || ""}`.trim();
                  return (
                    <tr key={u.id} className="border-t text-sm">
                      <td className="px-3 py-2">{name || "-"}</td>
                      <td className="px-3 py-2">{u.email}</td>
                      <td className="px-3 py-2">
                        <Badge variant="secondary">{u.role}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={u.is_active ? "default" : "destructive"}>
                          {u.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(u)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedUser ? "Edit User" : "Create User"}</DialogTitle>
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
                    <FormLabel>Password {selectedUser ? "(leave blank to keep)" : ""}</FormLabel>
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
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
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
