'use client';

import React from 'react';
import Card from '../../ui/Card';
import Tabs from '../../ui/Tabs';
import { Employee, Payslip } from '../../../lib/types';
import ActivityHistory from './ActivityHistory';

interface DetailTabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  employee: Employee;
  employeeSlips: Payslip[];
  onTabChange: (tab: string) => void;
}

export default function DetailTabs({ tabs, activeTab, employee, employeeSlips, onTabChange }: DetailTabsProps) {
  return (
    <Card padding="none">
      <div className="px-6 pt-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
      </div>
      <div className="p-6">
        <ActivityHistory activeTab={activeTab} employee={employee} employeeSlips={employeeSlips} />
      </div>
    </Card>
  );
}
