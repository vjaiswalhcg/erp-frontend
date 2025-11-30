"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function initialsFromUser(user?: { first_name?: string | null; last_name?: string | null; email?: string | null }) {
  const first = user?.first_name?.trim() || "";
  const last = user?.last_name?.trim() || "";
  const initialFromEmail = user?.email?.[0]?.toUpperCase() || "U";
  if (first || last) {
    const combo = `${first.charAt(0)}${last.charAt(0) || ""}`.toUpperCase().trim();
    return combo || initialFromEmail;
  }
  return initialFromEmail;
}

function nameFromUser(user?: { first_name?: string | null; last_name?: string | null; email?: string | null }) {
  const first = user?.first_name?.trim();
  const last = user?.last_name?.trim();
  if (first || last) return `${first || ""} ${last || ""}`.trim();
  return user?.email || "User";
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const initials = initialsFromUser(user as any);
  const name = nameFromUser(user as any);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-1 pr-3 shadow-sm transition hover:shadow">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-cyan-400 to-emerald-400 text-sm font-semibold text-slate-900 shadow"
          )}
        >
          {initials}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-cyan-400 to-emerald-400 text-base font-semibold text-slate-900 shadow">
              {initials}
            </div>
            <div className="text-sm">
              <div className="font-semibold text-slate-900">{name}</div>
              <div className="text-xs text-slate-500">{user?.email || ""}</div>
              <div className="text-xs text-slate-500">{user?.phone || ""}</div>
              <div className="text-xs text-slate-500 capitalize">{user?.role || ""}</div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            href="https://www.crmview.net/"
            target="_blank"
            rel="noreferrer"
            className="w-full text-sm text-blue-600 hover:underline"
          >
            CRM View
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            Sign out
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
