import { redirect } from 'next/navigation';
import { getMe } from '@/lib/me';
import { CreateLotForm } from './CreateLotForm';

export default async function NewLotPage() {
  const me = await getMe();
  if (!me) redirect('/login?next=/lots/new');
  if (me.role !== 'broker' && me.role !== 'admin') {
    redirect('/dashboard');
  }
  return (
    <div>
      <div className="border-b border-neutral-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold tracking-tight">Naya lot upload karo</h1>
        <p className="text-xs text-neutral-500">Farmer ki info + lot details. 2 minutes ka kaam.</p>
      </div>
      <CreateLotForm />
    </div>
  );
}
