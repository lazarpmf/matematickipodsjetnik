import { createTask } from '@/lib/taskStore';
import { adminOnlyResponse, isRequestAdmin } from '@/lib/requireAdmin';
import { readPdfUpload, taskErrorResponse, taskListResponse } from '@/lib/taskHttp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    return await taskListResponse(await isRequestAdmin(request));
  } catch (error) {
    console.error('Failed to list tasks:', error);
    return Response.json({ message: 'Zadaci trenutno nisu dostupni.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isRequestAdmin(request))) return adminOnlyResponse();

  try {
    const form = await request.formData();
    const upload = await readPdfUpload(form.get('file'));
    if (!upload) {
      return Response.json({ message: 'PDF je obavezan.' }, { status: 400 });
    }
    const task = await createTask({
      title: String(form.get('title') ?? ''),
      code: String(form.get('code') ?? ''),
      isPublic: form.get('isPublic') === 'true',
      bytes: upload.bytes,
      filename: upload.filename,
    });
    return Response.json({ task }, { status: 201 });
  } catch (error) {
    return taskErrorResponse(error);
  }
}
