import { supabase } from './supabaseClient';

export async function logVisit(): Promise<void> {
  try {
    await supabase.from('visits').insert({});
  } catch (error) {
    console.error('Failed to log visit:', error);
  }
}

export async function getVisitCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Failed to get visit count:', error);
    return 0;
  }
}
