'use server';

import { revalidateTag } from 'next/cache';
import {
  decorateLesson,
  sortPresentedLessons,
  withPinTag,
  PIN_TAG_PREFIX,
  visibleTags,
} from '@/lib/lessonOrder';
import { createClient } from '@/lib/supabaseServer';
import type { Lesson } from '@/lib/types';

const LESSON_LIST_COLUMNS =
  'id, title, description, grade, pdf_path, tags, created_at, updated_at, created_by';

async function fetchLessonsFromDb(): Promise<Lesson[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lessons')
    .select(LESSON_LIST_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getLessons(): Promise<Lesson[]> {
  const lessons = await fetchLessonsFromDb();
  return sortPresentedLessons(lessons.map(decorateLesson));
}

export async function setLessonPinned(
  id: string,
  pinned: boolean,
  accessToken?: string,
): Promise<Lesson[]> {
  const supabase = await createClient(accessToken);
  await assertAdmin(accessToken, supabase);

  const { data: existing, error: readError } = await supabase
    .from('lessons')
    .select('tags')
    .eq('id', id)
    .single();

  if (readError || !existing) throw new Error('Kartica nije pronađena.');

  const { error } = await supabase
    .from('lessons')
    .update({ tags: withPinTag(existing.tags, pinned) })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidateTag('lessons', 'max');
  return getLessons();
}

async function assertAdmin(
  accessToken?: string,
  existing?: Awaited<ReturnType<typeof createClient>>,
): Promise<void> {
  const supabase = existing ?? (await createClient(accessToken));
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error('Niste prijavljeni.');

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (error || data?.role !== 'admin') {
    throw new Error('Samo administrator može da zakači karticu.');
  }
}

export async function createLesson(
  title: string,
  description: string,
  grade: number,
  pdf_path: string,
  tags: string[],
  accessToken?: string
): Promise<Lesson> {
  const supabase = await createClient(accessToken);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('lessons')
    .insert({
      title,
      description,
      grade,
      pdf_path,
      tags,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.message?.toLowerCase().includes('tags')) {
      throw new Error(
        'Kolona "tags" ne postoji u bazi. Pokreni SQL iz SUPABASE_SETUP.md.'
      );
    }
    throw new Error(error.message);
  }
  revalidateTag('lessons', 'max');
  return data;
}

export async function updateLesson(
  id: string,
  title: string,
  description: string,
  grade: number,
  pdf_path: string,
  tags: string[],
  accessToken?: string
): Promise<Lesson> {
  const supabase = await createClient(accessToken);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) throw new Error('Not authenticated');

  const { data: existing } = await supabase
    .from('lessons')
    .select('tags')
    .eq('id', id)
    .maybeSingle();
  const pinTag = (existing?.tags ?? []).find(
    (tag: string) => typeof tag === 'string' && tag.startsWith(PIN_TAG_PREFIX),
  );
  const tagsToSave = pinTag ? [pinTag, ...visibleTags(tags)] : visibleTags(tags);

  const { data, error } = await supabase
    .from('lessons')
    .update({
      title,
      description,
      grade,
      pdf_path,
      tags: tagsToSave,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.message?.toLowerCase().includes('tags')) {
      throw new Error(
        'Kolona "tags" ne postoji u bazi. Pokreni SQL iz SUPABASE_SETUP.md.'
      );
    }
    throw new Error(error.message);
  }
  revalidateTag('lessons', 'max');
  return decorateLesson(data);
}

export async function deleteLesson(
  id: string,
  pdf_path: string,
  accessToken?: string
): Promise<void> {
  const supabase = await createClient(accessToken);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) throw new Error('Not authenticated');

  // Delete PDF from storage
  try {
    const { error: storageError } = await supabase.storage
      .from('lesson_pdfs')
      .remove([pdf_path]);
    if (storageError) console.error('Failed to delete PDF:', storageError);
  } catch (err) {
    console.error('Failed to delete PDF:', err);
  }

  // Delete lesson record
  const { error } = await supabase.from('lessons').delete().eq('id', id);

  if (error) throw error;
  revalidateTag('lessons', 'max');
}
