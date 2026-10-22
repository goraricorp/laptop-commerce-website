UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 10000000,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif'
  ]::text[]
WHERE id = 'demo';

DROP POLICY IF EXISTS "demo_avatar_insert" ON storage.objects;

CREATE POLICY "demo_avatar_insert"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'demo'
  AND (storage.foldername(name))[1] = 'users'
);
