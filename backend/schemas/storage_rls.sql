-- Policies for expenses bucket
CREATE POLICY "Allow authenticated users to upload expense documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'expenses');

CREATE POLICY "Allow authenticated users to view their own expense documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'expenses' AND owner = auth.uid());

CREATE POLICY "Allow authenticated users to update their own expense documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'expenses' AND owner = auth.uid());

CREATE POLICY "Allow authenticated users to delete their own expense documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'expenses' AND owner = auth.uid());