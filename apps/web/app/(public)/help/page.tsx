import { getMe } from '@/lib/me';
import { HelpForm } from './HelpForm';
import { HelpHeader } from './HelpHeader';
import { HelpFaq } from './HelpFaq';

export const dynamic = 'force-dynamic';

export default async function HelpPage() {
  const me = await getMe();
  const supportWhatsApp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '';

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-10">
      <HelpHeader />
      <div className="mt-6">
        <HelpForm authed={Boolean(me)} supportWhatsApp={supportWhatsApp} />
      </div>
      <div className="mt-8">
        <HelpFaq />
      </div>
    </div>
  );
}
