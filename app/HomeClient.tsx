'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getCurrentUser, isAdmin, signIn } from '@/lib/auth';
import { logPageVisit } from './actions/metrics';
import { getLessons, createLesson, updateLesson, deleteLesson, setLessonPinned } from './actions/lessons';
import { applyPins, nextPinOrder } from '@/lib/lessonOrder';
import type { Lesson } from '@/lib/types';
import Navbar from './(components)/Navbar';
import SearchBar from './(components)/SearchBar';
import CardGrid from './(components)/CardGrid';
import CardModal from './(components)/CardModal';
import AdminBar from './(components)/AdminBar';
import LessonForm from './(components)/LessonForm';
import ConfirmDialog from './(components)/ConfirmDialog';
import Pagination from './(components)/Pagination';
import Notification from './(components)/Notification';

interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'warning';
}

const ITEMS_PER_PAGE = 20;

interface HomeClientProps {
  initialLessons: Lesson[];
}

export default function HomeClient({ initialLessons }: HomeClientProps) {
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
  const [pinningId, setPinningId] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [isRefreshingLessons, setIsRefreshingLessons] = useState(false);
  const aboutRef = useRef<HTMLElement | null>(null);

  const filteredLessons = useMemo(() => {
    let filtered = lessons;

    if (selectedGrade !== null) {
      filtered = filtered.filter((l) => l.grade === selectedGrade);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((l) => {
        const tags = l.tags && l.tags.length > 0 ? l.tags : ['#matematika'];
        return (
          l.title.toLowerCase().includes(query) ||
          tags.some((tag) => tag.toLowerCase().includes(query))
        );
      });
    }

    return filtered;
  }, [lessons, searchQuery, selectedGrade]);

  const totalPages = Math.ceil(filteredLessons.length / ITEMS_PER_PAGE);

  const paginatedLessons = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLessons.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredLessons, currentPage]);

  useEffect(() => {
    void logPageVisit();
    void checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void checkAuth();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGrade]);

  useEffect(() => {
    if (!showAbout) return;
    setSelectedLesson(null);
    aboutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [showAbout]);

  async function refreshLessons(options?: { silent?: boolean }) {
    try {
      if (!options?.silent) setIsRefreshingLessons(true);
      const data = await getLessons();
      setLessons(data);
    } catch (error) {
      console.error('Failed to load lessons:', error);
    } finally {
      if (!options?.silent) setIsRefreshingLessons(false);
    }
  }

  async function handleTogglePin(lesson: Lesson) {
    if (pinningId) return;

    const pinned = !lesson.pinned;
    const previous = lessons;
    const previousPage = currentPage;
    const order = previous.filter((item) => item.pinned).map((item) => item.id);

    setPinningId(lesson.id);
    setLessons(applyPins(previous, nextPinOrder(order, lesson.id, pinned)));
    setCurrentPage(1);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await setLessonPinned(lesson.id, pinned, session?.access_token);
      setNotification({
        message: pinned
          ? 'Kartica je zakačena i sada je prva na sajtu.'
          : 'Kartica više nije zakačena.',
        type: 'success',
      });
      await refreshLessons({ silent: true });
    } catch (error) {
      setLessons(previous);
      setCurrentPage(previousPage);
      setNotification({
        message: error instanceof Error ? error.message : 'Kartica nije zakačena.',
        type: 'error',
      });
    } finally {
      setPinningId(null);
    }
  }

  async function checkAuth() {
    const user = await getCurrentUser();
    if (user) {
      const admin = await isAdmin(user.id);
      setIsAdminUser(admin);
    } else {
      setIsAdminUser(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');

    try {
      await signIn(loginEmail, loginPassword);
      setShowLogin(false);
      setLoginEmail('');
      setLoginPassword('');
      await checkAuth();
      await refreshLessons();
    } catch (error: any) {
      setLoginError(error.message || 'Login failed');
    }
  }

  async function handleSaveLesson(data: {
    title: string;
    description: string;
    grade: number;
    pdf_path: string;
    tags: string[];
  }) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (editingLesson) {
        await updateLesson(
          editingLesson.id,
          data.title,
          data.description,
          data.grade,
          data.pdf_path,
          data.tags,
          accessToken
        );
        setNotification({
          message: 'Lekcija je uspješno ažurirana',
          type: 'warning',
        });
      } else {
        await createLesson(
          data.title,
          data.description,
          data.grade,
          data.pdf_path,
          data.tags,
          accessToken
        );
        setNotification({
          message: 'Nova lekcija je uspješno dodata',
          type: 'success',
        });
      }
      setShowLessonForm(false);
      setEditingLesson(null);
      await refreshLessons();
    } catch (error: any) {
      alert(error.message || 'Failed to save lesson');
      throw error;
    }
  }

  async function handleDeleteLesson() {
    if (!deletingLesson) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      await deleteLesson(deletingLesson.id, deletingLesson.pdf_path, accessToken);
      setDeletingLesson(null);
      setNotification({
        message: 'Lekcija je uspješno obrisana',
        type: 'error',
      });
      await refreshLessons();
    } catch (error: any) {
      alert(error.message || 'Failed to delete lesson');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onAboutClick={() => setShowAbout(true)}
        onHomeClick={() => setShowAbout(false)}
        isAboutActive={showAbout}
      />
      <h1 className="sr-only">Matematički podsjetnik</h1>
      {!showAbout && (
        <SearchBar
          onSearch={setSearchQuery}
          onGradeFilter={setSelectedGrade}
          selectedGrade={selectedGrade}
        />
      )}
      <div className="py-8">
        {showAbout ? (
          <section
            id="about"
            ref={aboutRef}
            className="mx-auto max-w-4xl px-4 pb-16"
          >
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                O nama
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Dragi učenici, tokom rada s vama primijetio sam nekoliko
                  obrazaca koji su uobičajeni, ali veoma važni za vaše dalje
                  napredovanje u matematici. Prije svega, primjetno je da se
                  gradivo, formule i objašnjenja relativno brzo zaboravljaju,
                  naročito kada se ne obnavljaju redovno. Takođe sam primijetio
                  da često izostaje strpljenje da se odgovori potraže u ranijim
                  sveskama, udžbenicima ili bilješkama koje ste već jednom
                  savladali.
                </p>
                <p>
                  Želim da naglasim da ovo nije kritika, već realno zapažanje.
                  Zaboravljanje je prirodan proces i sastavni dio učenja.
                  Problem ne nastaje kada nešto zaboravimo, već kada zbog toga
                  odustanemo od traženja rješenja i ponovnog razumijevanja.
                </p>
                <p>
                  Upravo iz tog razloga sam odlučio da dam svoj doprinos i
                  pokušam da vam olakšam učenje. Kao profesor matematike, ali i
                  kao neko ko razumije izazove savremenog učenja, osmislio sam
                  aplikaciju „Matematički podsjetnik“. Cilj ove aplikacije je
                  da na jednom mjestu objedini matematičke pojmove, formule i
                  osnovna objašnjenja, kako biste jednostavnim pretraživanjem
                  mogli brzo pronaći informacije koje su vam potrebne.
                </p>
                <p>
                  Važno je da shvatite da ova aplikacija nije zamjena za
                  učenje, razmišljanje ili vježbu. Ona je pomoćno sredstvo —
                  alat koji vam omogućava da se lakše vratite gradivu, povežete
                  staro znanje s novim i nastavite dalje bez osjećaja
                  frustracije ili gubitka vremena.
                </p>
                <p>
                  Matematika ne traži savršeno pamćenje, već razumijevanje,
                  upornost i spremnost da se znanje stalno obnavlja. Svaki put
                  kada se vratite nekoj formuli ili pojmu, vi jačate svoje
                  razumijevanje i razvijate disciplinu koja će vam koristiti i
                  izvan učionice.
                </p>
                <p>
                  Ohrabrujem vas da iskoristite dostupne alate, da ne bježite
                  od ponavljanja i da budete strpljivi prema sebi. Znanje se ne
                  gradi odjednom, već postepeno. Moj cilj je da vam na tom
                  putu budem podrška.
                </p>
                <p>
                  Većina lekcija je urađena pomoću vještačke inteligencije, 
                  koristeći zapise iz svesaka ili sa školske table. 
                  Trudim se da ne bude grešaka, ali vi možete da pomognete u 
                  pronalasku istih i poboljšanju kvaliteta! Svaka pomoć je dobrodošla!
                </p>
                <p>
                  Hvala vam na pažnji i želim vam mnogo uspjeha u daljem
                  učenju matematike.
                </p>
                <p className="pt-2 font-medium text-gray-900">
                  Vaš profesor Lazar.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <>
            <CardGrid
              lessons={paginatedLessons}
              isLoading={isRefreshingLessons}
              emptyMessage={
                searchQuery.trim()
                  ? 'Tražena lekcija nije pronađena.'
                  : 'Nema lekcija.'
              }
              onCardClick={setSelectedLesson}
              onEdit={(lesson) => {
                setEditingLesson(lesson);
                setShowLessonForm(true);
              }}
              onDelete={setDeletingLesson}
              onTogglePin={handleTogglePin}
              pinningId={pinningId}
              isAdmin={isAdminUser}
            />
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>

      {selectedLesson && (
        <CardModal
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
        />
      )}

      <AdminBar
        onLogin={() => setShowLogin(true)}
        onAddCard={() => {
          setEditingLesson(null);
          setShowLessonForm(true);
        }}
      />

      {showLogin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowLogin(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-semibold">Admin pristup</h2>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                    aria-label={
                      showLoginPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'
                    }
                  >
                    {showLoginPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              {loginError && (
                <p className="mb-4 text-sm text-red-600">{loginError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  className="flex-1 rounded border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Poništi
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                >
                  Prijava
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLessonForm && (
        <LessonForm
          lesson={editingLesson}
          onSave={handleSaveLesson}
          onCancel={() => {
            setShowLessonForm(false);
            setEditingLesson(null);
          }}
        />
      )}

      {deletingLesson && (
        <ConfirmDialog
          title="Brisanje lekcije"
          message="Jeste li sigurni da želite da obrišete lekciju?"
          onConfirm={handleDeleteLesson}
          onCancel={() => setDeletingLesson(null)}
        />
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
