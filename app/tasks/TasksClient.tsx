'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { isAdmin, signIn, signOut } from '@/lib/auth';
import { MAX_TASK_BYTES } from '@/lib/taskRules';
import Navbar from '../(components)/Navbar';
import ConfirmDialog from '../(components)/ConfirmDialog';
import Notification from '../(components)/Notification';
import TaskPdfModal from './TaskPdfModal';

type TaskRow = {
  id: string;
  title: string;
  code?: string;
  isPublic?: boolean;
  filename?: string;
};

type Notice = { message: string; type: 'success' | 'error' | 'warning' };
type OpenPdf = { title: string; url: string; revoke: boolean };

const inputClass =
  'w-full rounded border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500';

export default function TasksClient() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [opening, setOpening] = useState(false);
  const [pdf, setPdf] = useState<OpenPdf | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [title, setTitle] = useState('');
  const [taskCode, setTaskCode] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState<TaskRow | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const loadTasks = useCallback(async () => {
    const headers = await authHeaders();
    const response = await fetch('/api/tasks', { headers, cache: 'no-store' });
    const body = (await response.json()) as { tasks?: TaskRow[]; message?: string };
    if (!response.ok) throw new Error(body.message || 'Zadaci nisu učitani.');
    setTasks(body.tasks ?? []);
  }, []);

  const refreshAuth = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsAdminUser(false);
      return;
    }
    setIsAdminUser(await isAdmin(user.id));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await refreshAuth();
        if (active) await loadTasks();
      } catch (error) {
        if (active) {
          setNotice({
            message: error instanceof Error ? error.message : 'Zadaci nisu učitani.',
            type: 'error',
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void refreshAuth().then(() => loadTasks()).catch(() => undefined);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadTasks, refreshAuth]);

  useEffect(() => {
    return () => {
      if (pdf?.revoke) URL.revokeObjectURL(pdf.url);
    };
  }, [pdf]);

  const strips = isAdminUser ? tasks.filter((task) => task.isPublic) : tasks;

  async function openByCode(event: React.FormEvent) {
    event.preventDefault();
    setCodeError('');
    if (!code.trim()) {
      setCodeError('Unesi kod.');
      return;
    }
    setOpening(true);
    try {
      const response = await fetch('/api/tasks/open', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setCodeError(body?.message || 'Pogrešan kod. Pokušaj ponovo.');
        return;
      }
      const blob = await response.blob();
      const taskTitle = decodeURIComponent(response.headers.get('x-task-title') || 'Zadatak');
      showPdf(taskTitle, URL.createObjectURL(blob), true);
      setCode('');
    } catch {
      setCodeError('Zadatak trenutno nije dostupan.');
    } finally {
      setOpening(false);
    }
  }

  function showPdf(taskTitle: string, url: string, revoke: boolean) {
    setPdf((current) => {
      if (current?.revoke) URL.revokeObjectURL(current.url);
      return { title: taskTitle, url, revoke };
    });
  }

  function resetForm() {
    setEditing(null);
    setTitle('');
    setTaskCode('');
    setIsPublic(false);
    setFile(null);
    setFileKey((value) => value + 1);
    setFormError('');
  }

  function beginEdit(task: TaskRow) {
    setEditing(task);
    setTitle(task.title);
    setTaskCode(task.code ?? '');
    setIsPublic(Boolean(task.isPublic));
    setFile(null);
    setFileKey((value) => value + 1);
    setFormError('');
  }

  async function saveTask(event: React.FormEvent) {
    event.preventDefault();
    setFormError('');
    if (file && file.size > MAX_TASK_BYTES) {
      setFormError('PDF može imati najviše 4 MB.');
      return;
    }
    if (!editing && !file) {
      setFormError('PDF je obavezan.');
      return;
    }

    setSaving(true);
    try {
      const headers = await authHeaders();
      const response = editing
        ? await saveExisting(editing.id, headers)
        : await createNew(headers);
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) throw new Error(body?.message || 'Zadatak nije sačuvan.');
      resetForm();
      await loadTasks();
      setNotice({
        message: editing ? 'Zadatak je sačuvan.' : 'Zadatak je dodat.',
        type: 'success',
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Zadatak nije sačuvan.');
    } finally {
      setSaving(false);
    }
  }

  async function createNew(headers: Record<string, string>) {
    const form = new FormData();
    form.set('title', title);
    form.set('code', taskCode);
    form.set('isPublic', String(isPublic));
    if (file) form.set('file', file);
    return fetch('/api/tasks', { method: 'POST', headers, body: form });
  }

  async function saveExisting(id: string, headers: Record<string, string>) {
    if (file) {
      const form = new FormData();
      form.set('title', title);
      form.set('code', taskCode);
      form.set('isPublic', String(isPublic));
      form.set('file', file);
      return fetch(`/api/tasks/${id}`, { method: 'PUT', headers, body: form });
    }
    return fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ title, code: taskCode, isPublic }),
    });
  }

  async function togglePublic(task: TaskRow) {
    try {
      const headers = await authHeaders();
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          code: task.code,
          isPublic: !task.isPublic,
        }),
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) throw new Error(body?.message || 'Zadatak nije sačuvan.');
      await loadTasks();
    } catch (error) {
      setNotice({
        message: error instanceof Error ? error.message : 'Zadatak nije sačuvan.',
        type: 'error',
      });
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      const headers = await authHeaders();
      const response = await fetch(`/api/tasks/${deleting.id}`, {
        method: 'DELETE',
        headers,
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) throw new Error(body?.message || 'Zadatak nije obrisan.');
      if (editing?.id === deleting.id) resetForm();
      setDeleting(null);
      await loadTasks();
      setNotice({ message: 'Zadatak je obrisan.', type: 'success' });
    } catch (error) {
      setNotice({
        message: error instanceof Error ? error.message : 'Zadatak nije obrisan.',
        type: 'error',
      });
    }
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoginError('');
    try {
      await signIn(loginEmail, loginPassword);
      setShowLogin(false);
      setLoginEmail('');
      setLoginPassword('');
      await refreshAuth();
      await loadTasks();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Prijava nije uspjela.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Zadaci</h1>
        <p className="mt-2 text-gray-600">
          Upiši kod koji ti je dao profesor i otvori zadatak.
        </p>

        <form onSubmit={openByCode} className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <label htmlFor="task-code" className="mb-2 block text-sm font-medium text-gray-700">
            Kod
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="task-code"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setCodeError('');
              }}
              autoComplete="off"
              spellCheck={false}
              className={inputClass}
              placeholder="Upiši kod"
            />
            <button
              type="submit"
              disabled={opening}
              className="rounded bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {opening ? 'Otvaram…' : 'Otvori'}
            </button>
          </div>
          {codeError && (
            <p role="alert" className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
              {codeError}
            </p>
          )}
        </form>

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Javni zadaci</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Učitavanje…</p>
          ) : strips.length === 0 ? (
            <p className="text-sm text-gray-500">Nema javnih zadataka.</p>
          ) : (
            <ul className="space-y-2">
              {strips.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => showPdf(task.title, `/api/tasks/${task.id}/file`, false)}
                    className="flex w-full items-center justify-between gap-3 rounded-r-lg border border-gray-200 border-l-4 border-l-blue-600 bg-white px-4 py-3 text-left shadow-sm transition hover:bg-blue-50"
                  >
                    <span className="font-medium text-gray-900">{task.title}</span>
                    <span className="shrink-0 text-sm font-medium text-blue-700">Otvori</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {isAdminUser && (
          <section className="mt-10 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? 'Izmjena zadatka' : 'Novi zadatak'}
              </h2>
              <button
                type="button"
                onClick={() =>
                  void signOut().then(async () => {
                    await refreshAuth();
                    await loadTasks();
                  })
                }
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                Odjava
              </button>
            </div>
            <form onSubmit={saveTask} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="task-title">
                  Naslov
                </label>
                <input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="new-task-code">
                  Kod
                </label>
                <input id="new-task-code" value={taskCode} onChange={(event) => setTaskCode(event.target.value)} className={inputClass} autoComplete="off" required />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(event) => setIsPublic(event.target.checked)}
                />
                Javno dostupno
              </label>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="task-pdf">
                  PDF
                </label>
                <input
                  id="task-pdf"
                  key={fileKey}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-gray-700"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {editing
                    ? 'Ako ne izabereš novi PDF, ostaje postojeći. Najviše 4 MB.'
                    : 'Najviše 4 MB.'}
                </p>
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-2">
                {editing && (
                  <button type="button" onClick={resetForm} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Poništi
                  </button>
                )}
                <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                  {saving ? 'Čuvam…' : editing ? 'Sačuvaj' : 'Dodaj zadatak'}
                </button>
              </div>
            </form>

            <ul className="mt-6 divide-y divide-gray-100 border-t border-gray-100">
              {tasks.length === 0 && (
                <li className="py-4 text-sm text-gray-500">Još nema zadataka.</li>
              )}
              {tasks.map((task) => (
                <li key={task.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      Kod: <span className="font-medium text-gray-900">{task.code}</span>
                      {' · '}
                      {task.isPublic ? 'Javno' : 'Samo uz kod'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => togglePublic(task)} className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      {task.isPublic ? 'Sakrij' : 'Učini javnim'}
                    </button>
                    <button type="button" onClick={() => beginEdit(task)} className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">
                      Promijeni
                    </button>
                    <button type="button" onClick={() => setDeleting(task)} className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700">
                      Obriši
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {!isAdminUser && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            type="button"
            onClick={() => setShowLogin(true)}
            className="rounded-full bg-gray-600 px-4 py-2 text-sm font-medium text-white opacity-70 hover:opacity-100"
          >
            Admin pristup
          </button>
        </div>
      )}

      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowLogin(false)}>
          <form
            onSubmit={handleLogin}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 className="mb-4 text-xl font-semibold">Admin pristup</h2>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} className={`${inputClass} mb-3`} required />
            <label className="mb-1 block text-sm font-medium text-gray-700">Lozinka</label>
            <input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} className={`${inputClass} mb-3`} required />
            {loginError && <p className="mb-3 text-sm text-red-600">{loginError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowLogin(false)} className="flex-1 rounded border border-gray-300 px-4 py-2 font-medium text-gray-700">
                Poništi
              </button>
              <button type="submit" className="flex-1 rounded bg-blue-600 px-4 py-2 font-medium text-white">
                Prijava
              </button>
            </div>
          </form>
        </div>
      )}

      {pdf && <TaskPdfModal title={pdf.title} pdfUrl={pdf.url} onClose={() => setPdf(null)} />}

      {deleting && (
        <ConfirmDialog
          title="Brisanje zadatka"
          message="Obrisati ovaj zadatak? PDF se briše zajedno s njim."
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}

      {notice && (
        <Notification message={notice.message} type={notice.type} onClose={() => setNotice(null)} />
      )}
    </div>
  );
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}
