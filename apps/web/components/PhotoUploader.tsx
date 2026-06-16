'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { clientFetch, ClientApiError } from '@/lib/clientApi';

interface SignedUploadParams {
  timestamp: number;
  folder: string;
  signature: string;
  api_key: string;
  cloud_name: string;
}

const MAX_PHOTOS = 5;

/**
 * Broker-facing photo uploader. Asks the API to sign a Cloudinary upload, POSTs
 * the file binary straight to Cloudinary, and reports back the secure URLs.
 * Falls back to a URL-paste box if Cloudinary isn't configured (503).
 */
export function PhotoUploader({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cloudinaryDown, setCloudinaryDown] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  const remaining = MAX_PHOTOS - value.length;

  async function uploadOne(file: File): Promise<string> {
    const { upload } = await clientFetch<{ upload: SignedUploadParams }>('/lots/photos/sign', {
      method: 'POST',
    });
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', upload.api_key);
    form.append('timestamp', String(upload.timestamp));
    form.append('folder', upload.folder);
    form.append('signature', upload.signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${upload.cloud_name}/image/upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error('Cloudinary upload failed');
    const json = (await res.json()) as { secure_url?: string };
    if (!json.secure_url) throw new Error('No URL returned from Cloudinary');
    return json.secure_url;
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    const picked = Array.from(files).slice(0, remaining);
    const uploaded: string[] = [];
    try {
      for (const file of picked) {
        uploaded.push(await uploadOne(file));
      }
      onChange([...value, ...uploaded].slice(0, MAX_PHOTOS));
    } catch (e) {
      if (e instanceof ClientApiError && e.code === 'cloudinary_not_configured') {
        setCloudinaryDown(true);
        setError('Direct upload unavailable — paste an image URL instead.');
      } else {
        setError(e instanceof Error ? e.message : 'Upload failed');
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  function addManual() {
    const url = manualUrl.trim();
    if (!url) return;
    if (!url.startsWith('https://')) {
      setError('URL must start with https://');
      return;
    }
    onChange([...value, url].slice(0, MAX_PHOTOS));
    setManualUrl('');
    setError(null);
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {value.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="relative aspect-square overflow-hidden rounded-lg border border-wheat-100 bg-wheat-50"
            >
              <Image src={url} alt={`photo ${i + 1}`} fill sizes="20vw" className="object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-xs text-white"
                aria-label="Remove photo"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {remaining > 0 && !cloudinaryDown && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-wheat-300 bg-wheat-50 px-3 py-4 text-sm font-medium text-wheat-700 hover:bg-wheat-100 disabled:opacity-60"
          >
            {busy ? 'Uploading…' : `📷 Add photos (${remaining} left)`}
          </button>
        </div>
      )}

      {cloudinaryDown && remaining > 0 && (
        <div className="flex gap-2">
          <input
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://…/photo.jpg"
            className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-wheat-500 focus:outline-none focus:ring-1 focus:ring-wheat-500"
          />
          <button
            type="button"
            onClick={addManual}
            className="shrink-0 rounded-md bg-wheat-500 px-3 py-2 text-sm font-medium text-white hover:bg-wheat-600"
          >
            Add
          </button>
        </div>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
