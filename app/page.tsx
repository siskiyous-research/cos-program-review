import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ReviewApp from './components/ReviewApp';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <ReviewApp user={{ id: user.id, email: user.email }} />;
}
