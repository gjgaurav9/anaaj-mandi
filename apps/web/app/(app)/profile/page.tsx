import { redirect } from 'next/navigation';
import { getMe } from '@/lib/me';
import { ProfileForm } from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const me = await getMe();
  if (!me) redirect('/login?next=/profile');

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-10">
      <ProfileForm me={me} />
    </div>
  );
}
