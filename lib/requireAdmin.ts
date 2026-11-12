import { createClient } from '@/lib/supabaseServer';

export async function isRequestAdmin(request: Request): Promise<boolean> {
  const header = request.headers.get('authorization') ?? '';
  if (!header.toLowerCase().startsWith('bearer ')) return false;
  const accessToken = header.slice(7).trim();
  if (!accessToken) return false;

  try {
    const supabase = await createClient(accessToken);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return false;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    return !error && data?.role === 'admin';
  } catch {
    return false;
  }
}

export function adminOnlyResponse(): Response {
  return Response.json(
    { message: 'Samo administrator može da mijenja zadatke.' },
    { status: 401 },
  );
}
