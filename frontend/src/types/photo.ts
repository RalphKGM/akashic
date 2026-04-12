export type PhotoRecord = {
  id?: string | null;
  device_asset_id?: string | null;
  uri?: string | null;
  descriptive?: string | null;
  literal?: string | null;
  category?: string | null;
  tags?: string | null;
  is_favorite?: boolean;
  is_archived?: boolean;
  is_hidden?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type UploadProgress = {
  current: number;
  total: number;
  done: boolean;
  source?: string;
  uploadedCount?: number;
  duplicateCount?: number;
  failedCount?: number;
};
