import { openTaskResponse } from '@/lib/taskHttp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let code = '';
  try {
    const body = (await request.json()) as { code?: unknown };
    code = typeof body.code === 'string' ? body.code : '';
  } catch {
    code = '';
  }

  if (!code.trim()) {
    return Response.json({ message: 'Unesi kod.' }, { status: 400 });
  }
  if (code.length > 40) {
    return Response.json({ message: 'Pogrešan kod. Pokušaj ponovo.' }, { status: 401 });
  }

  try {
    return await openTaskResponse(code);
  } catch (error) {
    console.error('Failed to open task:', error);
    return Response.json({ message: 'Zadatak trenutno nije dostupan.' }, { status: 500 });
  }
}
