import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TrackingDashboard from './components/TrackingDashboard';

export const dynamic = 'force-dynamic';

export default async function TrackingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <TrackingDashboard />
      </div>
    </main>
  );
}
