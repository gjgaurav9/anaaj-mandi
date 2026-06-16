'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, CardBody } from '@anaaj/ui';
import type { MeUser } from '@/lib/me';
import { useT } from '@/lib/i18n';
import { clientFetch, ClientApiError } from '@/lib/clientApi';
import { PhotoUploader } from '@/components/PhotoUploader';
import { Stars } from '@/components/Stars';

const inputCls =
  'block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-wheat-500 focus:outline-none focus:ring-1 focus:ring-wheat-500';
const labelCls = 'block text-xs font-medium text-neutral-700 mb-1';

/** Strip a stored +91XXXXXXXXXX down to the 10 local digits for editing. */
function localDigits(phone: string | null): string {
  return phone ? phone.replace(/^\+91/, '') : '';
}

export function ProfileForm({ me }: { me: MeUser }) {
  const t = useT();
  const router = useRouter();
  const isBroker = me.role === 'broker';

  // --- profile fields ---
  const [name, setName] = useState(me.name ?? '');
  const [whatsapp, setWhatsapp] = useState(localDigits(me.whatsapp));
  const [businessName, setBusinessName] = useState(me.business_name ?? '');
  const [brokerMandi, setBrokerMandi] = useState(me.broker_mandi ?? '');
  const [brokerYears, setBrokerYears] = useState(
    me.broker_years != null ? String(me.broker_years) : '',
  );
  const [buyerCompany, setBuyerCompany] = useState(me.buyer_company ?? '');
  const [city, setCity] = useState(me.location?.city ?? '');
  const [district, setDistrict] = useState(me.location?.district ?? '');
  const [state, setState] = useState(me.location?.state ?? '');
  const [pincode, setPincode] = useState(me.location?.pincode ?? '');

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);

  async function saveProfile() {
    setProfileErr(null);
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      const body: Record<string, unknown> = {};
      if (name.trim()) body.name = name.trim();
      if (whatsapp.trim()) body.whatsapp = `+91${whatsapp.trim()}`;
      if (isBroker) {
        if (businessName.trim()) body.business_name = businessName.trim();
        if (brokerMandi.trim()) body.broker_mandi = brokerMandi.trim();
        if (brokerYears.trim()) body.broker_years = Number(brokerYears);
      } else {
        if (buyerCompany.trim()) body.buyer_company = buyerCompany.trim();
      }
      if (city.trim() && district.trim() && state.trim() && /^\d{6}$/.test(pincode)) {
        body.location = {
          city: city.trim(),
          district: district.trim(),
          state: state.trim(),
          pincode,
          geo: me.location?.geo ?? { type: 'Point', coordinates: [75.8577, 22.7196] },
        };
      }
      await clientFetch('/me', { method: 'PATCH', body });
      setProfileMsg(t('common.saved'));
      router.refresh();
    } catch (e) {
      setProfileErr(e instanceof ClientApiError ? e.message : 'Save failed');
    } finally {
      setSavingProfile(false);
    }
  }

  // --- KYC submission (broker only) ---
  const [gst, setGst] = useState(me.kyc.gst ?? '');
  const [panLast4, setPanLast4] = useState(me.kyc.pan_last4 ?? '');
  const [gstDoc, setGstDoc] = useState<string[]>(me.kyc.gst_doc_url ? [me.kyc.gst_doc_url] : []);
  const [savingKyc, setSavingKyc] = useState(false);
  const [kycMsg, setKycMsg] = useState<string | null>(null);
  const [kycErr, setKycErr] = useState<string | null>(null);

  async function submitKyc() {
    setKycErr(null);
    setKycMsg(null);
    setSavingKyc(true);
    try {
      const body: Record<string, unknown> = {};
      if (gst.trim()) body.gst = gst.trim().toUpperCase();
      if (panLast4.trim()) body.pan_last4 = panLast4.trim().toUpperCase();
      if (gstDoc[0]) body.gst_doc_url = gstDoc[0];
      if (brokerYears.trim()) body.broker_years = Number(brokerYears);
      await clientFetch('/me/kyc', { method: 'POST', body });
      setKycMsg(t('profile.kyc.pending'));
      router.refresh();
    } catch (e) {
      setKycErr(e instanceof ClientApiError ? e.message : 'Submit failed');
    } finally {
      setSavingKyc(false);
    }
  }

  const kycBadge =
    me.kyc.status === 'verified' ? (
      <Badge tone="success">✓ {t('common.verified')}</Badge>
    ) : me.kyc.status === 'rejected' ? (
      <Badge tone="neutral">{t('profile.kyc.rejected')}</Badge>
    ) : me.kyc.submitted_at ? (
      <Badge tone="wheat">{t('profile.kyc.pending')}</Badge>
    ) : (
      <Badge tone="neutral">{t('common.unverified')}</Badge>
    );

  return (
    <div className="space-y-6">
      {/* Identity + rating summary */}
      <Card>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-lg font-semibold">{me.name ?? me.phone}</div>
              <div className="text-xs capitalize text-neutral-500">{me.role}</div>
            </div>
            {isBroker && (
              <div className="text-right">
                {kycBadge}
                {me.rating.count > 0 && (
                  <div className="mt-1 flex items-center justify-end gap-1 text-xs text-neutral-600">
                    <Stars value={me.rating.avg} />
                    <span>
                      {me.rating.avg.toFixed(1)} · {me.rating.count} {t('common.reviews')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Editable profile */}
      <Card>
        <CardBody className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {t('profile.title')}
          </h2>
          <div>
            <label className={labelCls}>{t('profile.phone')}</label>
            <input value={me.phone} disabled className={`${inputCls} bg-neutral-100`} />
          </div>
          <div>
            <label className={labelCls}>{t('profile.name')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t('profile.whatsapp')}</label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-neutral-300 bg-neutral-50 px-2 text-sm text-neutral-500">
                +91
              </span>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10))}
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
                className={`${inputCls} rounded-l-none`}
              />
            </div>
            <p className="mt-1 text-xs text-neutral-500">{t('profile.whatsapp.help')}</p>
          </div>

          {isBroker ? (
            <>
              <div>
                <label className={labelCls}>{t('profile.business')}</label>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>{t('profile.mandi')}</label>
                  <input
                    value={brokerMandi}
                    onChange={(e) => setBrokerMandi(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>{t('profile.years')}</label>
                  <input
                    value={brokerYears}
                    onChange={(e) => setBrokerYears(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    inputMode="numeric"
                    className={inputCls}
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className={labelCls}>{t('profile.company')}</label>
              <input
                value={buyerCompany}
                onChange={(e) => setBuyerCompany(e.target.value)}
                className={inputCls}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>District</label>
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>State</label>
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>PIN</label>
              <input
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                className={inputCls}
              />
            </div>
          </div>

          {profileErr && <p className="text-sm text-rose-600">{profileErr}</p>}
          {profileMsg && <p className="text-sm text-green-700">{profileMsg}</p>}
          <Button type="button" onClick={saveProfile} disabled={savingProfile}>
            {savingProfile ? t('common.saving') : t('common.save')}
          </Button>
        </CardBody>
      </Card>

      {/* KYC / verification — brokers only */}
      {isBroker && (
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {t('profile.kyc')}
              </h2>
              {kycBadge}
            </div>

            {me.kyc.status === 'verified' ? (
              <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                {t('profile.kyc.verified')}
              </p>
            ) : (
              <>
                <p className="text-xs text-neutral-500">{t('profile.kyc.intro')}</p>
                {me.kyc.status === 'rejected' && me.kyc.reason && (
                  <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    {me.kyc.reason}
                  </p>
                )}
                <div>
                  <label className={labelCls}>{t('profile.kyc.gst')}</label>
                  <input
                    value={gst}
                    onChange={(e) => setGst(e.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    PAN last 4 <span className="text-neutral-400">({t('common.optional')})</span>
                  </label>
                  <input
                    value={panLast4}
                    onChange={(e) => setPanLast4(e.target.value.toUpperCase().slice(0, 4))}
                    maxLength={4}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>{t('profile.kyc.gstDoc')}</label>
                  <PhotoUploader value={gstDoc} onChange={(urls) => setGstDoc(urls.slice(0, 1))} />
                </div>
                {kycErr && <p className="text-sm text-rose-600">{kycErr}</p>}
                {kycMsg && <p className="text-sm text-green-700">{kycMsg}</p>}
                <Button type="button" onClick={submitKyc} disabled={savingKyc}>
                  {savingKyc ? t('common.saving') : t('profile.kyc.submit')}
                </Button>
              </>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
