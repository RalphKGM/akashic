CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

DROP TABLE IF EXISTS public.album_photo;
DROP TABLE IF EXISTS public.album;
DROP TABLE IF EXISTS public.known_face;
DROP TABLE IF EXISTS public.photo;

CREATE TABLE IF NOT EXISTS public.photo (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               uuid DEFAULT auth.uid() REFERENCES auth.users(id),
    device_asset_id       text NULL,
    descriptive           text NOT NULL,
    literal               text NOT NULL,
    category              text NULL,
    faces                 text NULL,
    descriptive_embedding vector(1536) NULL,
    literal_embedding     vector(1536) NULL,
    tags                  text NULL,
    created_at            timestamptz DEFAULT now(),
    updated_at            timestamptz DEFAULT now(),
    fts tsvector GENERATED ALWAYS AS (
        to_tsvector(
            'english'::regconfig,
            COALESCE(descriptive, '') || ' ' ||
            COALESCE(literal, '') || ' ' ||
            COALESCE(tags, '') || ' ' ||
            COALESCE(faces, '')
        )
    ) STORED
);

CREATE INDEX IF NOT EXISTS photo_fts_idx
    ON public.photo USING gin (fts);

CREATE INDEX IF NOT EXISTS photo_descriptive_embedding_idx
    ON public.photo USING hnsw (descriptive_embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS photo_literal_embedding_idx
    ON public.photo USING hnsw (literal_embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER photo_updated_at
    BEFORE UPDATE ON public.photo
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.photo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own photos" ON public.photo;

CREATE POLICY "Users can manage their own photos"
    ON public.photo FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP FUNCTION IF EXISTS public.hybrid_search_photos(text,vector,integer,uuid,double precision,double precision,integer);

CREATE OR REPLACE FUNCTION public.hybrid_search_photos(
    query_text TEXT,
    query_embedding VECTOR(1536),
    match_count INT,
    user_id UUID,
    full_text_weight FLOAT = 1.0,
    semantic_weight FLOAT = 2.0,
    rrf_k INT = 50
)
RETURNS TABLE (
    id UUID,
    device_asset_id TEXT,
    descriptive TEXT,
    literal TEXT,
    tags TEXT,
    category TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE sql AS $$
WITH full_text AS (
    SELECT
        p.id,
        row_number() OVER (ORDER BY ts_rank_cd(p.fts, websearch_to_tsquery(query_text)) DESC) AS rank_ix
    FROM public.photo p
    WHERE p.user_id = hybrid_search_photos.user_id
      AND p.fts @@ websearch_to_tsquery(query_text)
    LIMIT LEAST(match_count, 30) * 2
),
semantic AS (
    SELECT
        p.id,
        row_number() OVER (
            ORDER BY LEAST(
                p.descriptive_embedding <=> query_embedding,
                COALESCE(p.literal_embedding <=> query_embedding, 1)
            )
        ) AS rank_ix
    FROM public.photo p
    WHERE p.user_id = hybrid_search_photos.user_id
      AND p.descriptive_embedding IS NOT NULL
      AND LEAST(
            p.descriptive_embedding <=> query_embedding,
            COALESCE(p.literal_embedding <=> query_embedding, 1)
          ) < 0.75
    LIMIT LEAST(match_count, 30) * 2
)
SELECT
    p.id,
    p.device_asset_id,
    p.descriptive,
    p.literal,
    p.tags,
    p.category,
    p.created_at
FROM full_text
FULL OUTER JOIN semantic ON full_text.id = semantic.id
JOIN public.photo p ON COALESCE(full_text.id, semantic.id) = p.id
ORDER BY (
    COALESCE(1.0 / (rrf_k + full_text.rank_ix), 0.0) * full_text_weight +
    COALESCE(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight
) DESC
LIMIT LEAST(match_count, 30);
$$;

CREATE TABLE IF NOT EXISTS public.album (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  cover_photo_id uuid NULL REFERENCES public.photo(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS album_user_name_unique
  ON public.album (user_id, lower(name));

CREATE TABLE IF NOT EXISTS public.album_photo (
  album_id uuid NOT NULL REFERENCES public.album(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES public.photo(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (album_id, photo_id)
);

CREATE TRIGGER album_updated_at
    BEFORE UPDATE ON public.album
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.album ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own albums" ON public.album;

CREATE POLICY "Users can manage their own albums"
  ON public.album FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.album_photo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own album_photo" ON public.album_photo;

CREATE POLICY "Users can manage their own album_photo"
ON public.album_photo
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.album a
    WHERE a.id = album_photo.album_id
      AND a.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.album a
    WHERE a.id = album_photo.album_id
      AND a.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.photo p
    WHERE p.id = album_photo.photo_id
      AND p.user_id = auth.uid()
  )
);

CREATE TABLE IF NOT EXISTS public.known_face (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  descriptor FLOAT8[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.known_face ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own faces" ON public.known_face;

CREATE POLICY "Users can manage their own faces"
ON public.known_face
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
