'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody } from '@anaaj/ui';
import { REVIEW_DIMENSIONS, type ReviewScores } from '@anaaj/types';
import { useT } from '@/lib/i18n';
import { clientFetch, ClientApiError } from '@/lib/clientApi';
import { Stars, StarInput } from './Stars';

interface ReviewItem {
  _id: string;
  buyer: { _id: string; name: string | null };
  scores: ReviewScores;
  overall: number;
  comment: string;
  created_at: string;
}

interface BrokerReviewsResponse {
  rating: { avg: number; count: number };
  items: ReviewItem[];
}

const EMPTY_SCORES: ReviewScores = {
  payment_on_time: 0,
  quality_match: 0,
  delivery: 0,
  ease_of_deal: 0,
};

/**
 * Trust + ratings block for a broker. Shows the verified badge, years in
 * business, the aggregate rating, the review list, and — for buyers — a form
 * to leave / update their own review.
 */
export function BrokerTrust({
  brokerId,
  verified,
  brokerYears,
  lotId,
  canReview,
}: {
  brokerId: string;
  verified: boolean;
  brokerYears: number | null;
  lotId?: string;
  canReview: boolean;
}) {
  const t = useT();
  const [data, setData] = useState<BrokerReviewsResponse | null>(null);
  const [scores, setScores] = useState<ReviewScores>(EMPTY_SCORES);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    clientFetch<BrokerReviewsResponse>(`/reviews/broker/${brokerId}`)
      .then((d) => alive && setData(d))
      .catch(() => alive && setData({ rating: { avg: 0, count: 0 }, items: [] }));
    if (canReview) {
      clientFetch<{ review: ReviewItem | null }>(`/reviews/mine/${brokerId}`)
        .then((d) => {
          if (alive && d.review) {
            setScores(d.review.scores);
            setComment(d.review.comment);
          }
        })
        .catch(() => {});
    }
    return () => {
      alive = false;
    };
  }, [brokerId, canReview]);

  const allRated = Object.values(scores).every((v) => v >= 1);

  async function submit() {
    setErr(null);
    setMsg(null);
    if (!allRated) {
      setErr('Please rate all four points.');
      return;
    }
    setSaving(true);
    try {
      await clientFetch('/reviews', {
        method: 'POST',
        body: { broker_id: brokerId, ...(lotId ? { lot_id: lotId } : {}), scores, comment },
      });
      setMsg(t('reviews.thanks'));
      setEditing(false);
      const refreshed = await clientFetch<BrokerReviewsResponse>(`/reviews/broker/${brokerId}`);
      setData(refreshed);
    } catch (e) {
      setErr(e instanceof ClientApiError ? e.message : 'Could not submit');
    } finally {
      setSaving(false);
    }
  }

  const rating = data?.rating ?? { avg: 0, count: 0 };

  return (
    <Card>
      <CardBody className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {t('reviews.title')}
          </h2>
          <div className="flex items-center gap-2">
            {verified && <Badge tone="success">✓ {t('common.verified')}</Badge>}
            {brokerYears != null && brokerYears > 0 && (
              <Badge tone="wheat">
                {brokerYears} {t('common.years')}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {rating.count > 0 ? (
            <>
              <Stars value={rating.avg} size="md" />
              <span className="font-medium">{rating.avg.toFixed(1)}</span>
              <span className="text-neutral-500">
                · {rating.count} {t('common.reviews')}
              </span>
            </>
          ) : (
            <span className="text-neutral-500">{t('reviews.none')}</span>
          )}
        </div>

        {/* Review list */}
        {data && data.items.length > 0 && (
          <ul className="space-y-3 border-t border-neutral-100 pt-3">
            {data.items.slice(0, 5).map((r) => (
              <li key={r._id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.buyer.name ?? 'Buyer'}</span>
                  <Stars value={r.overall} />
                </div>
                {r.comment && <p className="text-neutral-600">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}

        {/* Buyer review form */}
        {canReview && (
          <div className="border-t border-neutral-100 pt-3">
            {!editing ? (
              <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
                {rating.count > 0 && allRated ? t('reviews.update') : t('reviews.rate')}
              </Button>
            ) : (
              <div className="space-y-3">
                {REVIEW_DIMENSIONS.map((d) => (
                  <div key={d.key} className="flex items-center justify-between gap-2">
                    <span className="text-neutral-700">{t(`reviews.dim.${d.key}`)}</span>
                    <StarInput
                      label={t(`reviews.dim.${d.key}`)}
                      value={scores[d.key]}
                      onChange={(v) => setScores((s) => ({ ...s, [d.key]: v }))}
                    />
                  </div>
                ))}
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  maxLength={600}
                  placeholder={t('reviews.comment')}
                  className="block w-full resize-y rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-wheat-500 focus:outline-none focus:ring-1 focus:ring-wheat-500"
                />
                {err && <p className="text-xs text-rose-600">{err}</p>}
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="button" onClick={submit} disabled={saving}>
                    {saving ? t('common.saving') : t('reviews.submit')}
                  </Button>
                </div>
              </div>
            )}
            {msg && !editing && <p className="mt-2 text-xs text-green-700">{msg}</p>}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
