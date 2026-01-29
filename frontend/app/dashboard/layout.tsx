'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  Settings,
  CreditCard,
  History,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenType');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin">
          <Shield className="w-8 h-8 text-blue-500" />
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
    },
    {
      label: 'History',
      href: '/dashboard/history',
      icon: History,
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
    },
    {
      label: 'Billing',
      href: '/dashboard/billing',
      icon: CreditCard,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-800 border-r border-slate-700 transition-all duration-300 fixed h-screen overflow-y-auto`}
      >
        {/* Sidebar header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-white">Sentinel</h1>
                <p className="text-xs text-slate-400">Shield AI</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-slate-700 rounded transition"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-slate-400" />
            ) : (
              <Menu className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700/50 rounded-lg transition group"
              >
                <IconComponent className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout button */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`${
          sidebarOpen ? 'ml-64' : 'ml-20'
        } flex-1 transition-all duration-300`}
      >
        {/* Top bar */}
        <div className="bg-slate-800 border-b border-slate-700 px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">SentinelShield AI</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">
                Welcome back,{' '}
                <span className="text-blue-400 font-semibold">User</span>
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
