'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@anaaj/ui';
import {
  GRAIN_EMOJI,
  GRAIN_LABELS,
  GRAIN_VARIETY_SUGGESTIONS,
  GrainSchema,
  type Grain,
} from '@anaaj/types';
import { clientFetch, ClientApiError } from '@/lib/clientApi';

// Indore center, used when broker doesn't specify a geo point.
const INDORE_GEO: [number, number] = [75.8577, 22.7196];

const GRAIN_OPTIONS = GrainSchema.options;

const GRAIN_PALETTE: Record<Grain, { bg: string; fg: string }> = {
  wheat: { bg: 'd4a017', fg: 'ffffff' },
  soybean: { bg: '6b8e23', fg: 'ffffff' },
  chana: { bg: '8b6f47', fg: 'ffffff' },
  maize: { bg: 'daa520', fg: 'ffffff' },
  mustard: { bg: 'f4c430', fg: '4b3a0d' },
  jowar: { bg: 'b8a361', fg: 'ffffff' },
  bajra: { bg: '8b7355', fg: 'ffffff' },
  rice: { bg: 'e8d7b3', fg: '4b3a0d' },
  other: { bg: '6b7280', fg: 'ffffff' },
};

function defaultPhotoFor(grain: Grain, variety: string): string {
  const palette = GRAIN_PALETTE[grain];
  const label = encodeURIComponent(
    (variety || GRAIN_LABELS[grain]).replace(/[^A-Za-z0-9 ]/g, '').replace(/\s+/g, '+'),
  );
  return `https://placehold.co/800x600/${palette.bg}/${palette.fg}/png?text=${label}`;
}

const FormSchema = z.object({
  seller_name: z.string().min(2, 'Required').max(80),
  seller_phone: z.string().regex(/^[6-9]\d{9}$/, '10-digit Indian mobile starting 6-9'),
  seller_village: z.string().max(80).optional(),

  grain: GrainSchema,
  variety: z.string().trim().min(1, 'Variety is required').max(50),
  quantity_quintals: z.coerce.number().min(10, 'Min 10 quintals'),
  /** UI accepts ₹/qtl; converted to paise before POST. */
  price_per_quintal_rupees: z.coerce.number().positive(),

  moisture_pct: z.coerce.number().min(0).max(30),
  foreign_matter_pct: z.coerce.number().min(0).max(20),
  broken_pct: z.coerce.number().min(0).max(20),
  protein_pct: z.union([z.literal(''), z.coerce.number().min(0).max(20)]).optional(),

  city: z.string().min(2),
  district: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/, '6-digit PIN'),

  available_from: z.string().min(1),

  /** Comma- or newline-separated HTTPS URLs (optional). */
  photo_urls: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

export function CreateLotForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      grain: 'wheat',
      variety: '',
      available_from: new Date().toISOString().slice(0, 10),
      city: '',
      district: '',
      pincode: '',
    },
  });

  const grain = watch('grain');
  const variety = watch('variety');
  const varietyOptions = GRAIN_VARIETY_SUGGESTIONS[grain] ?? [];

  async function onSubmit(values: FormValues, intendedStatus: 'draft' | 'active') {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const photos = (values.photo_urls ?? '')
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const finalPhotos =
        intendedStatus === 'active' && photos.length === 0
          ? [defaultPhotoFor(values.grain, values.variety)]
          : photos;

      const body = {
        seller: {
          name: values.seller_name,
          phone: `+91${values.seller_phone}`,
          village: values.seller_village || undefined,
        },
        grain: values.grain,
        variety: values.variety.trim(),
        quantity_quintals: values.quantity_quintals,
        price_per_quintal: Math.round(values.price_per_quintal_rupees * 100),
        quality: {
          moisture_pct: values.moisture_pct,
          foreign_matter_pct: values.foreign_matter_pct,
          broken_pct: values.broken_pct,
          ...(typeof values.protein_pct === 'number' && !Number.isNaN(values.protein_pct)
            ? { protein_pct: values.protein_pct }
            : {}),
        },
        photos: finalPhotos,
        pickup_location: {
          city: values.city,
          district: values.district,
          pincode: values.pincode,
          geo: { type: 'Point', coordinates: INDORE_GEO },
        },
        available_from: values.available_from,
        status: intendedStatus,
      };
      await clientFetch<{ lot: { _id: string } }>('/lots', { method: 'POST', body });
      router.push('/lots/mine');
      router.refresh();
    } catch (e) {
      setSubmitError(e instanceof ClientApiError ? e.message : 'Could not create lot');
    } finally {
      setSubmitting(false);
    }
  }

  const input =
    'block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-wheat-500 focus:outline-none focus:ring-1 focus:ring-wheat-500';
  const label = 'block text-xs font-medium text-neutral-700 mb-1';
  const err = 'text-xs text-rose-600 mt-1';

  return (
    <form className="space-y-6 px-4 py-4" onSubmit={(e) => e.preventDefault()}>
      <Section
        title="Farmer (seller) info"
        sub="Yeh aap khud bhar rahe ho — farmer ko login nahi karna hai."
      >
        <div>
          <label className={label}>Farmer name</label>
          <input {...register('seller_name')} className={input} placeholder="Ramesh Patidar" />
          {errors.seller_name && <p className={err}>{errors.seller_name.message}</p>}
        </div>
        <div>
          <label className={label}>Farmer mobile (+91)</label>
          <input
            {...register('seller_phone')}
            className={input}
            inputMode="numeric"
            maxLength={10}
            placeholder="98765 43210"
          />
          {errors.seller_phone && <p className={err}>{errors.seller_phone.message}</p>}
        </div>
        <div>
          <label className={label}>Village (optional)</label>
          <input {...register('seller_village')} className={input} placeholder="Depalpur" />
        </div>
      </Section>

      <Section title="Lot details">
        <div>
          <label className={label}>Grain</label>
          <select {...register('grain')} className={input}>
            {GRAIN_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {GRAIN_EMOJI[g]} {GRAIN_LABELS[g]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Variety</label>
          <input
            {...register('variety')}
            className={input}
            list="variety-list"
            placeholder={varietyOptions[0] ?? 'Type the variety'}
            autoComplete="off"
          />
          {varietyOptions.length > 0 && (
            <datalist id="variety-list">
              {varietyOptions.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          )}
          {errors.variety && <p className={err}>{errors.variety.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={label}>Quantity (quintal)</label>
            <input
              {...register('quantity_quintals')}
              className={input}
              inputMode="numeric"
              placeholder="120"
            />
            {errors.quantity_quintals && <p className={err}>{errors.quantity_quintals.message}</p>}
          </div>
          <div>
            <label className={label}>Price ₹/qtl</label>
            <input
              {...register('price_per_quintal_rupees')}
              className={input}
              inputMode="numeric"
              placeholder="2500"
            />
            {errors.price_per_quintal_rupees && (
              <p className={err}>{errors.price_per_quintal_rupees.message}</p>
            )}
          </div>
        </div>
        <div>
          <label className={label}>Available from</label>
          <input {...register('available_from')} className={input} type="date" />
        </div>
      </Section>

      <Section title="Quality parameters">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Moisture %" err={errors.moisture_pct?.message}>
            <input
              {...register('moisture_pct')}
              className={input}
              inputMode="decimal"
              placeholder="11.2"
            />
          </Field>
          <Field label="Foreign matter %" err={errors.foreign_matter_pct?.message}>
            <input
              {...register('foreign_matter_pct')}
              className={input}
              inputMode="decimal"
              placeholder="0.8"
            />
          </Field>
          <Field label="Broken %" err={errors.broken_pct?.message}>
            <input
              {...register('broken_pct')}
              className={input}
              inputMode="decimal"
              placeholder="1.5"
            />
          </Field>
          <Field label="Protein % (optional)">
            <input
              {...register('protein_pct')}
              className={input}
              inputMode="decimal"
              placeholder="11.8"
            />
          </Field>
        </div>
      </Section>

      <Section title="Pickup location">
        <div className="grid grid-cols-2 gap-2">
          <Field label="City" err={errors.city?.message}>
            <input {...register('city')} className={input} />
          </Field>
          <Field label="District" err={errors.district?.message}>
            <input {...register('district')} className={input} />
          </Field>
        </div>
        <Field label="PIN code" err={errors.pincode?.message}>
          <input {...register('pincode')} className={input} inputMode="numeric" maxLength={6} />
        </Field>
      </Section>

      <Section
        title="Photos (optional)"
        sub="HTTPS URLs, ek line me ek URL. Empty rakha to default placeholder use hoga."
      >
        <textarea
          {...register('photo_urls')}
          rows={3}
          className={`${input} resize-y`}
          placeholder="https://res.cloudinary.com/..."
        />
        <p className="text-xs text-neutral-500">
          Preview placeholder for{' '}
          <span className="font-medium text-wheat-600">
            {GRAIN_LABELS[grain]} · {variety || '(variety)'}
          </span>
        </p>
      </Section>

      {submitError && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{submitError}</p>
      )}

      <div className="sticky bottom-16 -mx-4 flex gap-2 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur md:bottom-0">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={handleSubmit((v) => onSubmit(v, 'draft'))}
          disabled={submitting}
        >
          Save draft
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1"
          onClick={handleSubmit((v) => onSubmit(v, 'active'))}
          disabled={submitting}
        >
          {submitting ? 'Saving…' : 'Publish lot'}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">{title}</h2>
        {sub && <p className="text-xs text-neutral-500">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  err,
  children,
}: {
  label: string;
  err?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-700">{label}</label>
      {children}
      {err && <p className="mt-1 text-xs text-rose-600">{err}</p>}
    </div>
  );
}
