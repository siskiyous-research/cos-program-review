import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SLOPageContent from './components/SLOPageContent';

export const dynamic = 'force-dynamic';

export default async function SLOTrackingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-4 text-sm">
          <a href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            Review Assistant
          </a>
          <span className="text-gray-300">/</span>
          <a href="/tracking" className="text-blue-600 hover:text-blue-800 font-medium">
            Program Review Tracking
          </a>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500">SLO Assessment Tracking</span>
        </nav>
        <SLOPageContent />
      </div>
    </main>
  );
}
