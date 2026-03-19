'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AuthHeaderProps {
  userEmail: string;
}

export function AuthHeader({ userEmail }: AuthHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-slate-500">{userEmail}</span>
      <button
        onClick={handleLogout}
        className="px-3 py-1 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors"
      >
        Log out
      </button>
    </div>
  );
}
