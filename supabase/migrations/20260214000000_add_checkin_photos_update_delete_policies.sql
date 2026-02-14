-- Add missing UPDATE and DELETE storage policies for checkin-photos bucket.
-- The upload component uses upsert: true which requires UPDATE permission,
-- and the remove button needs DELETE permission.

-- Allow users to update (overwrite) their own check-in photos
CREATE POLICY "Users can update own check-in photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'checkin-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own check-in photos
CREATE POLICY "Users can delete own check-in photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'checkin-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
