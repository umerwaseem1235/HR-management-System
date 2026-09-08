'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../lib/constants';
import { mockNotifications } from '../../lib/mock-data';

interface TopBarProps {
  onMenuClick: () => void;
  title?: string;
}

export default function TopBar({ onMenuClick, title }: TopBarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-600';
      case 'warning': return 'bg-yellow-100 text-yellow-600';
      case 'error': return 'bg-red-100 text-red-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#D6E4E8] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left: Menu + Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-[#263238] hover:bg-[#EAF2F4]"
        >
          <Menu size={20} />
        </button>
        {title && <h2 className="text-lg font-semibold text-[#17324D] hidden sm:block">{title}</h2>}
      </div>

      {/* Center: Search */}
      <div className="hidden md:block flex-1 max-w-md mx-8">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employees, documents..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#EAF2F4] border border-transparent text-sm text-[#263238] placeholder-gray-400 focus:bg-white focus:border-[#D6E4E8] focus:outline-none"
          />
        </div>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className="relative p-2 rounded-lg text-[#263238] hover:bg-[#EAF2F4] transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-[#D6E4E8] shadow-xl z-50">
              <div className="p-4 border-b border-[#D6E4E8]">
                <h3 className="font-semibold text-[#17324D]">Notifications</h3>
                <p className="text-xs text-gray-500">{unreadCount} unread</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {mockNotifications.slice(0, 5).map(notif => (
                  <div key={notif.id} className={`p-4 border-b border-[#D6E4E8] last:border-0 hover:bg-[#EAF2F4]/50 cursor-pointer ${!notif.read ? 'bg-[#EAF2F4]/30' : ''}`}>
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationIcon(notif.type)}`}>
                        <Bell size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#263238]">{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-[#D6E4E8] text-center">
                <button className="text-sm text-[#0F8B8D] hover:underline font-medium">View All</button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-[#EAF2F4] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#17324D] flex items-center justify-center text-white text-xs font-semibold">
              {user.avatar || user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-[#263238] leading-tight">{user.name}</p>
              <p className="text-[10px] text-gray-500">{ROLE_LABELS[user.role]}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-[#D6E4E8] shadow-xl z-50 py-1">
              <button
                onClick={() => { setShowUserMenu(false); router.push('/profile'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#263238] hover:bg-[#EAF2F4]"
              >
                <User size={16} /> My Profile
              </button>
              <button
                onClick={() => { setShowUserMenu(false); router.push('/settings'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#263238] hover:bg-[#EAF2F4]"
              >
                <Settings size={16} /> Settings
              </button>
              <div className="border-t border-[#D6E4E8] my-1" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
