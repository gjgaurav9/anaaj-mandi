'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardBody } from '@anaaj/ui';
import { TICKET_CATEGORY_LABELS, type TicketCategory } from '@anaaj/types';
import { useT } from '@/lib/i18n';
import { clientFetch, ClientApiError } from '@/lib/clientApi';

interface TicketItem {
  _id: string;
  category: TicketCategory;
  message: string;
  status: string;
  admin_note: string | null;
  created_at: string;
}

const CATEGORIES: TicketCategory[] = ['payment', 'quality', 'delivery', 'account', 'other'];

const STATUS_TONE: Record<string, string> = {
  open: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-neutral-200 text-neutral-700',
};

export function HelpForm({
  authed,
  supportWhatsApp,
}: {
  authed: boolean;
  supportWhatsApp: string;
}) {
  const t = useT();
  const [category, setCategory] = useState<TicketCategory>('payment');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tickets, setTickets] = useState<TicketItem[]>([]);

  useEffect(() => {
    if (!authed) return;
    clientFetch<{ items: TicketItem[] }>('/support/tickets/mine')
      .then((d) => setTickets(d.items))
      .catch(() => {});
  }, [authed, done]);

  async function submit() {
    setErr(null);
    setSubmitting(true);
    try {
      await clientFetch('/support/tickets', { method: 'POST', body: { category, message } });
      setDone(true);
      setMessage('');
    } catch (e) {
      setErr(e instanceof ClientApiError ? e.message : 'Could not submit');
    } finally {
      setSubmitting(false);
    }
  }

  const waLink = supportWhatsApp
    ? `https://wa.me/${supportWhatsApp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
        'Namaste, Anaaj Mandi support se baat karni hai.',
      )}`
    : null;

  return (
    <div className="space-y-6">
      {/* Report form */}
      <Card>
        <CardBody className="space-y-4">
          {done ? (
            <div className="space-y-3 text-center">
              <p className="text-3xl">✅</p>
              <p className="font-medium text-green-700">{t('help.submitted')}</p>
              <Button type="button" variant="secondary" onClick={() => setDone(false)}>
                {t('help.submit')}
              </Button>
            </div>
          ) : authed ? (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  {t('help.category')}
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {CATEGORIES.map((c) => (
                    <label
                      key={c}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                        category === c
                          ? 'border-wheat-500 bg-wheat-50 text-wheat-700'
                          : 'border-neutral-300 text-neutral-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={c}
                        checked={category === c}
                        onChange={() => setCategory(c)}
                        className="accent-wheat-500"
                      />
                      {t(`cat.${c}`) || TICKET_CATEGORY_LABELS[c]}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  {t('help.message')}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  className="block w-full resize-y rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-wheat-500 focus:outline-none focus:ring-1 focus:ring-wheat-500"
                />
              </div>
              {err && <p className="text-sm text-rose-600">{err}</p>}
              <Button
                type="button"
                onClick={submit}
                disabled={submitting || message.trim().length < 5}
              >
                {submitting ? t('common.saving') : t('help.submit')}
              </Button>
            </>
          ) : (
            <p className="text-sm text-neutral-600">
              <a href="/login?next=/help" className="font-medium text-wheat-600 underline">
                {t('header.signIn')}
              </a>{' '}
              {t('help.intro')}
            </p>
          )}

          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              💬 {t('help.whatsapp')}
            </a>
          )}
        </CardBody>
      </Card>

      {/* Past reports */}
      {authed && (
        <Card>
          <CardBody className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              {t('help.myTickets')}
            </h2>
            {tickets.length === 0 ? (
              <p className="text-sm text-neutral-500">{t('help.noTickets')}</p>
            ) : (
              <ul className="space-y-3">
                {tickets.map((ti) => (
                  <li key={ti._id} className="rounded-md border border-neutral-100 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {t(`cat.${ti.category}`) || TICKET_CATEGORY_LABELS[ti.category]}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          STATUS_TONE[ti.status] ?? 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {ti.status}
                      </span>
                    </div>
                    <p className="mt-1 text-neutral-600">{ti.message}</p>
                    {ti.admin_note && (
                      <p className="mt-1 rounded bg-wheat-50 px-2 py-1 text-xs text-wheat-700">
                        ↳ {ti.admin_note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
