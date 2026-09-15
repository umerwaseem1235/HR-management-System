'use client';

import React from 'react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Avatar from '../../ui/Avatar';
import Button from '../../ui/Button';
import { Mail, Phone, MapPin, Calendar, Edit } from 'lucide-react';
import { Employee } from '../../../lib/types';

interface DetailHeaderProps {
  employee: Employee;
}

function statusBadge(status: string) {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
    Active: 'success', Inactive: 'danger', 'On Notice': 'warning', Probation: 'info',
  };
  return <Badge variant={map[status] || 'neutral'} size="md">{status}</Badge>;
}

export default function DetailHeader({ employee }: DetailHeaderProps) {
  return (
    <Card>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <Avatar name={`${employee.firstName} ${employee.lastName}`} size="xl" />
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#17324D]">{employee.firstName} {employee.lastName}</h1>
            {statusBadge(employee.status)}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Mail size={14} /> {employee.email}</span>
            <span className="flex items-center gap-1"><Phone size={14} /> {employee.phone}</span>
            <span className="flex items-center gap-1"><MapPin size={14} /> {employee.branch}</span>
            <span className="flex items-center gap-1"><Calendar size={14} /> Joined {employee.joiningDate}</span>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Edit size={14} /> Edit
        </Button>
      </div>
    </Card>
  );
}
