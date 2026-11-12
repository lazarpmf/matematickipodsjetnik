import { publicFileResponse } from '@/lib/taskHttp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    return await publicFileResponse(id);
  } catch (error) {
    console.error('Failed to read public task:', error);
    return Response.json({ message: 'Zadatak trenutno nije dostupan.' }, { status: 500 });
  }
}
