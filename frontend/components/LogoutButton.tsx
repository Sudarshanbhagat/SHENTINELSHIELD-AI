'use client';

import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';
import { LogOut } from 'lucide-react';

export const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await logout(router);
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition duration-200"
      title="Logout"
    >
      <LogOut className="w-4 h-4" />
      Logout
    </button>
  );
};
