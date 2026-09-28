"use client";

import React from "react";
import { LogOut } from "lucide-react";
import Avatar from "../../ui/Avatar";
import { ROLE_LABELS } from "../../../lib/constants";
import type { User } from "../../../lib/types";

interface SidebarUserCardProps {
  user: User;
  compact: boolean;
  onLogout: () => void;
}

export function SidebarUserCard({ user, compact, onLogout }: SidebarUserCardProps) {
  return (
    <div className="shrink-0 p-2.5">
      <div className="rounded-2xl border border-white/15 bg-white/10 p-2.5 shadow-inner backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.06]">
        <div className="flex items-center gap-2.5">
          {/* Shared Avatar renders the uploaded photo for image URLs
              (including base64 data URLs) and clean initials otherwise. */}
          <span className="relative block shrink-0 overflow-visible">
            <Avatar name={user.name} src={user.avatar} size="sm" className="shadow-md ring-2 ring-white/30 dark:ring-white/20" />
            <span aria-hidden className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#024fa7] bg-green-400 dark:border-[#0f1b2e]" />
          </span>
          <div
            className={`flex min-w-0 flex-1 items-center gap-2 overflow-hidden whitespace-nowrap sidebar-fade ${compact ? "opacity-0" : "opacity-100"}`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">{user.name}</p>
              <p className="text-[11px] text-white/70 dark:text-slate-400">
                {ROLE_LABELS[user.role]}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="shrink-0 rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white dark:text-slate-300 dark:hover:bg-red-500/20 dark:hover:text-red-300"
              title="Logout"
            >
              <LogOut size={16} className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SidebarUserCard;
