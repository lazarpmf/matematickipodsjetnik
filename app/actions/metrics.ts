'use server';

import { createClient } from '@/lib/supabaseServer';

export async function logPageVisit() {
  const supabase = await createClient();
  try {
    await supabase.from('visits').insert({});
  } catch (error) {
    console.error('Failed to log visit:', error);
  }
}
