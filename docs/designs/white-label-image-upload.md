# White Label Image Upload Design

## Overview
Replace the current text-based URL inputs for "Company Logo" and "Product Logo" in the White Label settings with a user-friendly image upload component. This enhances the user experience by removing the need for users to host images externally and paste URLs.

## Goals
- Allow users to upload images directly from their device.
- Store images securely in Supabase Storage.
- Provide immediate visual feedback (preview) of the selected/uploaded image.
- Maintain support for the existing data model (storing URLs in the database).

## Architecture

### 1. Storage Provider
We will use **Supabase Storage** as the backend storage provider.

- **Bucket Name**: `branding` (public bucket)
- **Path Structure**: `branding/{tenant_id}/{file_name}` or `branding/global/{file_name}` if system-wide. Since these are system settings, we can use `branding/system/`.
- **Access Policy**:
  - **Read**: Public (Role: `anon`) - Required for displaying logos on public pages (login, etc.).
  - **Write**: Authenticated Admins only (Role: `authenticated` with admin check).

### 2. Dependencies
- **`@supabase/supabase-js`**: Required for client-side file upload.
- **`lucide-react`**: For upload/image icons (already installed).

### 3. Component Design: `ImageUpload`
A reusable component wrapping the upload logic.

**Path**: `src/components/ui/image-upload.tsx`

**Props**:
```typescript
interface ImageUploadProps {
  value?: string // The current image URL
  onChange: (url: string) => void
  disabled?: boolean
  bucket?: string // Default 'branding'
  pathPrefix?: string // Default 'system'
}
```

**States**:
- **Idle/Empty**: Displays a placeholder with an upload icon and click-to-upload area.
- **Uploading**: Displays a spinner or progress indicator.
- **Success/Filled**: Displays the image preview with an "X" or "Edit" button to remove/replace.
- **Error**: Displays error message (e.g., "File too large").

**Logic**:
1. User selects a file via input (hidden) or drag-and-drop.
2. Component validates file type (image/*) and size (e.g., < 2MB).
3. Component initializes Supabase client (singleton).
4. Uploads file to Supabase Storage:
   ```typescript
   const { data, error } = await supabase.storage
     .from(bucket)
     .upload(`${pathPrefix}/${Date.now()}-${file.name}`, file)
   ```
5. Retrieves public URL:
   ```typescript
   const { data } = supabase.storage.from(bucket).getPublicUrl(path)
   ```
6. Calls `onChange(publicUrl)`.

### 4. Form Integration
**File**: `src/components/forms/white-label-settings-form.tsx`

- **Current**:
  ```tsx
  <Input {...form.register('companyLogo')} placeholder="https://..." />
  ```
- **Proposed**:
  ```tsx
  <ImageUpload 
    value={form.watch('companyLogo')} 
    onChange={(url) => form.setValue('companyLogo', url)} 
  />
  ```
- The Zod schema (`WhiteLabelSettingsSchema`) remains `z.string().url().optional()`, which fits the string URL returned by the uploader.

### 5. Infrastructure Setup
1. **Environment Variables**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`.
2. **Supabase Client**: Create `src/lib/supabase/client.ts` for browser usage.
3. **Storage Bucket**: Create `branding` bucket in Supabase dashboard.
4. **RLS Policies**:
   - SELECT: Enable for all (public).
   - INSERT/UPDATE/DELETE: Enable for authenticated users.

## Implementation Plan

1.  **Install Dependencies**: `npm install @supabase/supabase-js`
2.  **Setup Supabase Client**: Create `src/lib/supabase/client.ts`.
3.  **Create Component**: Implement `src/components/ui/image-upload.tsx`.
4.  **Update Form**: Modify `src/components/forms/white-label-settings-form.tsx` to use the new component.
5.  **Config**: Verify `.env` and Supabase bucket creation (manual step or migration script if applicable).

## Considerations
- **Next.js Image Optimization**: If using `next/image` for the preview, `next.config.ts` needs `images.remotePatterns` configured for the Supabase domain.
- **File Cleanup**: This design does not automatically delete old images when replaced. A separate cleanup job or Edge Function trigger could handle this, but for logos, the storage cost is negligible.

---

## Supabase Setup Guide

### Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project dashboard under **Settings > API**.

### Storage Bucket Setup

1. **Navigate to Storage**: In your Supabase dashboard, go to **Storage** in the left sidebar.

2. **Create Bucket**: Click "New bucket" and create a bucket named `branding`.

3. **Set as Public**: Enable the "Public bucket" option during creation (required for displaying logos on public pages like login).

4. **Configure RLS Policies**: After creating the bucket, set up Row Level Security policies:

   **Policy 1 - Public Read Access**:
   - Policy name: `Public Read`
   - Allowed operations: `SELECT`
   - Target roles: Check "anon" (public access)
   - Policy definition: `true`

   **Policy 2 - Authenticated Upload Access**:
   - Policy name: `Authenticated Upload`
   - Allowed operations: `INSERT`, `UPDATE`, `DELETE`
   - Target roles: Check "authenticated"
   - Policy definition: `true`

   Alternatively, use SQL in the Supabase SQL Editor:

   ```sql
   -- Allow public read access
   CREATE POLICY "Public Read" ON storage.objects
   FOR SELECT USING (bucket_id = 'branding');

   -- Allow authenticated users to upload
   CREATE POLICY "Authenticated Upload" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'branding' AND auth.role() = 'authenticated');

   -- Allow authenticated users to update
   CREATE POLICY "Authenticated Update" ON storage.objects
   FOR UPDATE USING (bucket_id = 'branding' AND auth.role() = 'authenticated');

   -- Allow authenticated users to delete
   CREATE POLICY "Authenticated Delete" ON storage.objects
   FOR DELETE USING (bucket_id = 'branding' AND auth.role() = 'authenticated');
   ```

### File Structure

Uploaded files are stored with the following path structure:
- Company logos: `branding/system/company/{timestamp}-{filename}`
- Product logos: `branding/system/product/{timestamp}-{filename}`

