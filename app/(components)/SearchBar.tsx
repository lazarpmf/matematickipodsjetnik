'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onGradeFilter: (grade: number | null) => void;
  selectedGrade: number | null;
}

export default function SearchBar({
  onSearch,
  onGradeFilter,
  selectedGrade,
}: SearchBarProps) {
  const [query, setQuery] = useState('');

  const grades = [6, 7, 8, 9];

  return (
    <div className="w-full bg-white py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onSearch(e.target.value);
            }}
            placeholder="Pretraga po nazivu lekcije"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onSearch('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Očisti pretragu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onGradeFilter(null)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedGrade === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Svi razredi
            </button>
            {grades.map((grade) => (
              <button
                key={grade}
                onClick={() => onGradeFilter(grade)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedGrade === grade
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {grade} razred
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
