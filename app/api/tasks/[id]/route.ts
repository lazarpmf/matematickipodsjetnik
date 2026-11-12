import { deleteTask, updateTask } from '@/lib/taskStore';
import { adminOnlyResponse, isRequestAdmin } from '@/lib/requireAdmin';
import { readPdfUpload, taskErrorResponse } from '@/lib/taskHttp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  if (!(await isRequestAdmin(request))) return adminOnlyResponse();
  const { id } = await context.params;

  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as {
        title?: unknown;
        code?: unknown;
        isPublic?: unknown;
      };
      const task = await updateTask(id, {
        title: String(body.title ?? ''),
        code: String(body.code ?? ''),
        isPublic: body.isPublic === true,
      });
      return Response.json({ task });
    }

    const form = await request.formData();
    const upload = await readPdfUpload(form.get('file'));
    const task = await updateTask(id, {
      title: String(form.get('title') ?? ''),
      code: String(form.get('code') ?? ''),
      isPublic: form.get('isPublic') === 'true',
      bytes: upload?.bytes,
      filename: upload?.filename,
    });
    return Response.json({ task });
  } catch (error) {
    return taskErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!(await isRequestAdmin(request))) return adminOnlyResponse();
  const { id } = await context.params;

  try {
    await deleteTask(id);
    return Response.json({ ok: true });
  } catch (error) {
    return taskErrorResponse(error);
  }
}
