"use client";

import React from "react";
import Badge from "../ui/Badge";
import { diffInDaysInclusive } from "./leave-utils";

export { diffInDaysInclusive };

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "danger" | "warning" | "neutral"> = {
    Pending: "warning",
    Approved: "success",
    Rejected: "danger",
    Cancelled: "neutral",
  };
  return <Badge variant={map[status] || "neutral"}>{status}</Badge>;
}

export default StatusBadge;
