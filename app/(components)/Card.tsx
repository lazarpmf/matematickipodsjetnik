'use client';

import type { Lesson } from '@/lib/types';

interface CardProps {
  lesson: Lesson;
  onCardClick: (lesson: Lesson) => void;
  onEdit?: (lesson: Lesson) => void;
  onDelete?: (lesson: Lesson) => void;
  onTogglePin?: (lesson: Lesson) => void;
  isPinning?: boolean;
  isAdmin?: boolean;
}

export default function Card({
  lesson,
  onCardClick,
  onEdit,
  onDelete,
  onTogglePin,
  isPinning = false,
  isAdmin = false,
}: CardProps) {
  const tags =
    lesson.tags && lesson.tags.length > 0 ? lesson.tags : ['#matematika'];
  const titleWords = lesson.title.split(/\s+/);
  const displayTitle =
    titleWords.length > 50
      ? titleWords.slice(0, 50).join(' ') + '...'
      : lesson.title;

  return (
    <div
      className={`group relative cursor-pointer rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-lg ${
        lesson.pinned
          ? 'border-amber-300 ring-2 ring-amber-200'
          : 'border-gray-200'
      }`}
      onClick={() => onCardClick(lesson)}
    >
      {isAdmin && (
        <div
          className="mb-3 flex flex-wrap gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {onTogglePin && (
            <button
              type="button"
              onClick={() => onTogglePin(lesson)}
              disabled={isPinning}
              aria-pressed={Boolean(lesson.pinned)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
                lesson.pinned
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-white text-amber-800 ring-1 ring-amber-300 hover:bg-amber-50'
              }`}
            >
              {isPinning ? 'Čuvam…' : lesson.pinned ? 'Otkači' : 'Zakači'}
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit?.(lesson)}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
          >
            Promijeni
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(lesson)}
            className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700"
          >
            Obriši
          </button>
        </div>
      )}
      <div className="mb-2 flex flex-wrap gap-2">
        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
          {lesson.grade} razred
        </span>
        {lesson.pinned && (
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Zakačeno
          </span>
        )}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900 line-clamp-2">
        {displayTitle}
      </h3>
      <div className="mt-3 flex flex-wrap gap-1 text-xs text-gray-500">
        {tags.slice(0, 10).map((tag) => (
          <span key={tag} className="rounded bg-gray-100 px-2 py-0.5">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
