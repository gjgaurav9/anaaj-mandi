import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config.js';

let configured = false;

function configure() {
  if (configured) return;
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary not configured: set CLOUDINARY_* env vars');
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export interface SignedUploadParams {
  timestamp: number;
  folder: string;
  signature: string;
  api_key: string;
  cloud_name: string;
}

/**
 * Signs a Cloudinary upload from the API side so the browser can POST the
 * binary directly to Cloudinary without going through us. Caller passes
 * the resulting URL back to POST /lots/:id/photos.
 */
export function signLotUpload(): SignedUploadParams {
  configure();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = env.CLOUDINARY_UPLOAD_FOLDER;
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    env.CLOUDINARY_API_SECRET!,
  );
  return {
    timestamp,
    folder,
    signature,
    api_key: env.CLOUDINARY_API_KEY!,
    cloud_name: env.CLOUDINARY_CLOUD_NAME!,
  };
}
