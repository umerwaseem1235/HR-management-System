'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { Target, Star, TrendingUp } from 'lucide-react';
import { mockPerformanceReviews, mockGoals } from '../../lib/mock-data';

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState('reviews');

  const tabs = [
    { id: 'reviews', label: 'Reviews', count: mockPerformanceReviews.filter(r => r.status !== 'Completed').length },
    { id: 'goals', label: 'Goals' },
    { id: 'cycles', label: 'Cycles' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Growth"
          title="Performance Management"
          subtitle="Reviews, goals and appraisal cycles"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card padding="sm" hover>
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-2.5 rounded-lg"><Target size={20} className="text-purple-600" /></div>
              <div><p className="text-lg font-bold text-[#17324D]">{mockPerformanceReviews.length}</p><p className="text-xs text-gray-500">Total Reviews</p></div>
            </div>
          </Card>
          <Card padding="sm" hover>
            <div className="flex items-center gap-3">
              <div className="bg-yellow-50 p-2.5 rounded-lg"><Star size={20} className="text-yellow-600" /></div>
              <div><p className="text-lg font-bold text-[#17324D]">{mockPerformanceReviews.filter(r => r.status !== 'Completed').length}</p><p className="text-xs text-gray-500">Pending Reviews</p></div>
            </div>
          </Card>
          <Card padding="sm" hover>
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2.5 rounded-lg"><TrendingUp size={20} className="text-green-600" /></div>
              <div><p className="text-lg font-bold text-[#17324D]">{mockGoals.length}</p><p className="text-xs text-gray-500">Active Goals</p></div>
            </div>
          </Card>
        </div>

        <Card padding="none">
          <div className="px-6 pt-4"><Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /></div>
          <div className="p-6">
            {activeTab === 'reviews' && (
              <div className="space-y-3">
                {mockPerformanceReviews.map(review => (
                  <div key={review.id} className="flex items-center justify-between p-4 rounded-lg border border-[#D6E4E8]">
                    <div className="flex items-center gap-3">
                      <Avatar name={review.employeeName} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-[#263238]">{review.employeeName}</p>
                        <p className="text-xs text-gray-500">{review.cycleName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {review.managerRating && <div className="flex items-center gap-1 text-yellow-500"><Star size={14} fill="currentColor" /><span className="text-sm font-medium">{review.managerRating}/5</span></div>}
                      <Badge variant={review.status === 'Completed' ? 'success' : 'warning'}>{review.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'goals' && (
              <div className="space-y-4">
                {mockGoals.map(goal => (
                  <div key={goal.id} className="p-4 rounded-lg border border-[#D6E4E8]">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-[#263238]">{goal.title}</h4>
                      <Badge variant={goal.status === 'Completed' ? 'success' : goal.status === 'In Progress' ? 'info' : 'neutral'}>{goal.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{goal.description}</p>
                    <div className="w-full bg-[#D6E4E8] rounded-full h-2">
                      <div className="bg-[#0F8B8D] h-2 rounded-full" style={{ width: `${goal.progress}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{goal.progress}%</span><span>Due: {goal.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'cycles' && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium text-[#17324D] mb-2">Performance Cycles</p>
                <p className="text-sm">Manage review cycles and timelines.</p>
                <Button variant="primary" className="mt-4"><Target size={16} /> Create Cycle</Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
