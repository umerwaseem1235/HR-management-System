"use client";

import React from "react";
import { LogOut } from "lucide-react";
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
      <div className="rounded-2xl border border-white/15 bg-white/10 p-2.5 shadow-inner">
        <div className="flex items-center gap-2.5">
          <span className="relative shrink-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0265cc] text-xs font-bold shadow-md ring-2 ring-white/30">
              {user.avatar ||
                user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#024fa7] bg-green-400" />
          </span>
          <div
            className={`flex min-w-0 flex-1 items-center gap-2 overflow-hidden whitespace-nowrap sidebar-fade ${compact ? "opacity-0" : "opacity-100"}`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">{user.name}</p>
              <p className="text-[11px] text-white">
                {ROLE_LABELS[user.role]}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="shrink-0 rounded-lg p-1.5 text-white transition-colors hover:bg-red-500/20 hover:text-red-300"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SidebarUserCard;
