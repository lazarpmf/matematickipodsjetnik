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
      {lesson.pinned && (
        <span
          className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[34%]"
          title="Zakačeno"
        >
          <PinIcon />
          <span className="sr-only">Zakačeno</span>
        </span>
      )}
      <div className="mb-2 flex flex-wrap gap-2">
        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
          {lesson.grade} razred
        </span>
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

function PinIcon() {
  return (
    <svg
      width="46"
      height="46"
      viewBox="0 0 120 120"
      aria-hidden="true"
      className="drop-shadow-md"
    >
      <g transform="translate(60 64) rotate(-50)">
        <polygon points="-10,6 0,62 10,6" fill="#d7dbe2" />
        <polygon points="1,8 0,62 10,8" fill="#aeb4be" />
        <ellipse cx="0" cy="0" rx="28" ry="25" fill="#f0443c" />
        <ellipse cx="-7" cy="-7" rx="13" ry="9" fill="#ff8a82" opacity="0.75" />
        <ellipse cx="7" cy="9" rx="15" ry="9" fill="#c81e22" opacity="0.38" />
        <path
          d="M-15,0 L-15,-40 Q-15,-50 0,-50 Q15,-50 15,-40 L15,0 Q15,12 0,8 Q-15,12 -15,0 Z"
          fill="#f23832"
        />
        <path
          d="M1,-2 L1,-42 Q1,-48 10,-46 L15,-40 L15,0 Q10,8 1,6 Z"
          fill="#d21c22"
          opacity="0.42"
        />
        <ellipse cx="0" cy="-46" rx="15" ry="8" fill="#ff6a62" />
        <ellipse cx="-3" cy="-48.5" rx="9" ry="3.2" fill="#ffd0cb" />
        <ellipse cx="2" cy="-43" rx="12" ry="2.4" fill="#e12e28" opacity="0.5" />
      </g>
    </svg>
  );
}
