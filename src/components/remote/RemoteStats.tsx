'use client';

import React from 'react';
import StatCard from '../ui/StatCard';

export interface RemoteCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  currentlyRemote: number;
}

interface RemoteStatsProps {
  isEmployee: boolean;
  counts: RemoteCounts;
}

export default function RemoteStats({ isEmployee, counts }: RemoteStatsProps) {
  return (
    <div className={isEmployee ? "grid grid-cols-2 lg:grid-cols-4 gap-4" : "grid grid-cols-2 lg:grid-cols-5 gap-4"}>
      <StatCard title="Total Requests" value={counts.total} iconName="global" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
      <StatCard title="Pending" value={counts.pending} iconName="time" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
      <StatCard title="Approved" value={counts.approved} iconName="presentToday" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
      <StatCard title="Rejected" value={counts.rejected} iconName="absentToday" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
      {!isEmployee && (
        <StatCard title="Currently Remote" value={counts.currentlyRemote} iconName="global" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
      )}
    </div>
  );
}
