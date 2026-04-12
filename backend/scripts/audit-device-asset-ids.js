import dotenv from 'dotenv';
import { createAdminSupabaseClient } from '../config/supabase.js';

dotenv.config();

const classifyDeviceAssetId = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return 'missing';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)) {
    return 'uuid_like';
  }
  if (/^\d+$/.test(normalized)) return 'numeric_like';
  if (normalized.startsWith('ph://') || normalized.startsWith('content://') || normalized.startsWith('file://')) {
    return 'uri_like';
  }
  if (/\.(jpg|jpeg|png|heic|webp)$/i.test(normalized) || normalized.includes('_')) {
    return 'filename_like';
  }
  return 'unknown';
};

const main = async () => {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('photo')
    .select('id, user_id, device_asset_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error) {
    console.error('Failed to audit photo asset IDs:', error.message);
    process.exit(1);
  }

  const summary = {};
  const suspicious = [];

  for (const photo of data || []) {
    const classification = classifyDeviceAssetId(photo.device_asset_id);
    summary[classification] = (summary[classification] || 0) + 1;

    if (classification === 'missing' || classification === 'filename_like' || classification === 'unknown') {
      suspicious.push({
        id: photo.id,
        user_id: photo.user_id,
        device_asset_id: photo.device_asset_id,
        created_at: photo.created_at,
        classification,
      });
    }
  }

  console.log(JSON.stringify({
    scanned: data?.length || 0,
    summary,
    suspicious: suspicious.slice(0, 100),
  }, null, 2));
};

main().catch((error) => {
  console.error('Audit failed:', error.message);
  process.exit(1);
});
