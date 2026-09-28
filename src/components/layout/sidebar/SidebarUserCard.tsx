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
<div className="shrink-0 p-2.5 profile-shell">
  <div className="rounded-2xl border border-white/15 bg-white/10 p-2.5 shadow-inner">
        <div className="flex items-center gap-2.5">
          {/* Shared Avatar renders the photo when user.avatar is an image
              URL and clean initials otherwise — never the raw path string. */}
          <span className="relative block shrink-0 overflow-visible">
            <Avatar name={user.name} src={user.avatar} size="sm" />
            <span aria-hidden className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#024fa7] bg-green-400" />
          </span>
          <div
            aria-hidden={compact}
            className={`flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap sidebar-fade transition-all duration-300 ease-in-out ${
              compact
                ? "pointer-events-none max-w-0 overflow-hidden opacity-0"
                : "max-w-full overflow-hidden opacity-100 delay-200"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight text-white">{user.name}</p>
              <p className="truncate text-[11px] leading-tight text-white/80">
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
