"use client";

import { useState } from "react";
import Image from "next/image";
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

const AVATAR_URL =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&w=120&q=80";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-1 pr-3 shadow-sm transition hover:shadow">
        <div className="relative h-10 w-10 overflow-hidden rounded-full">
          <Image src={AVATAR_URL} alt="Avatar" fill className="object-cover" />
        </div>
        <div className="hidden text-left text-sm leading-tight sm:block">
          <div className="font-semibold text-slate-900">{user?.email || "User"}</div>
          <div className="text-xs text-slate-500">{user?.role || "..."}</div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-full">
              <Image src={AVATAR_URL} alt="Avatar" fill className="object-cover" />
            </div>
            <div className="text-sm">
              <div className="font-semibold text-slate-900">{user?.email || "User"}</div>
              <div className="text-xs text-slate-500">{user?.role || "..."}</div>
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
