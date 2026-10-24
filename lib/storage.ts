import { supabase } from './supabaseClient';

const BUCKET_NAME = 'lesson_pdfs';

export async function uploadPDF(
  file: File,
  fileName: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;
  return data.path;
}

export async function deletePDF(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) throw error;
}

export function getPublicURL(path: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function getStorageUsage(): Promise<number> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) throw error;

    let totalSize = 0;
    for (const file of data || []) {
      // Only count files (items with id are files)
      if (file.id && file.metadata?.size) {
        totalSize += file.metadata.size;
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Failed to get storage usage:', error);
    return 0;
  }
}
