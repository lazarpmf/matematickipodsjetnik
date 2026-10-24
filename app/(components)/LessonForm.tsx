'use client';

import { useState, useRef } from 'react';
import type { Lesson } from '@/lib/types';
import { lessonSchema, type LessonFormData } from '@/lib/validators';
import { uploadPDF } from '@/lib/storage';

interface LessonFormProps {
  lesson?: Lesson | null;
  onSave: (data: LessonFormData & { pdf_path: string }) => Promise<void>;
  onCancel: () => void;
}

export default function LessonForm({
  lesson,
  onSave,
  onCancel,
}: LessonFormProps) {
  const [title, setTitle] = useState(lesson?.title || '');
  const [description, setDescription] = useState(lesson?.description || '');
  const [grade, setGrade] = useState<number>(lesson?.grade || 6);
  const [tagsInput, setTagsInput] = useState(
    lesson?.tags?.length ? lesson.tags.join(', ') : ''
  );
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      let pdfPath = lesson?.pdf_path || '';

      if (pdfFile) {
        const fileName = `${Date.now()}_${pdfFile.name}`;
        pdfPath = await uploadPDF(pdfFile, fileName);
      }

      if (!pdfPath) {
        setError('PDF file is required');
        setIsSubmitting(false);
        return;
      }

      const tags = normalizeTags(tagsInput);
      if (tags.length > 10) {
        setError('Možete dodati najviše 10 tagova');
        setIsSubmitting(false);
        return;
      }

      const formData = {
        title: title.trim(),
        description: description.trim(),
        grade,
        pdf_path: pdfPath,
        tags,
      };

      // Validate title word count
      const wordCount = formData.title.split(/\s+/).filter((w) => w.length > 0).length;
      if (wordCount > 50) {
        setError('Title must be 50 words or less');
        setIsSubmitting(false);
        return;
      }

      // Validate other fields
      if (
        !formData.title ||
        !formData.description ||
        !formData.pdf_path ||
        formData.tags.length === 0
      ) {
        setError('All fields are required');
        setIsSubmitting(false);
        return;
      }

      lessonSchema.parse(formData);

      await onSave(formData);
    } catch (err: any) {
      if (err?.errors) {
        setError(err.errors.map((e: any) => e.message).join(', '));
      } else if (typeof err?.message === 'string' && err.message.trim()) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('Greška prilikom čuvanja lekcije');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      setError('Please select a PDF file');
    }
  }

  function normalizeTags(input: string): string[] {
    const raw = input
      .split(/[\s,]+/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));

    const unique = Array.from(new Set(raw));
    return unique.length > 0 ? unique : ['#matematika'];
  }

  const wordCount = title.split(/\s+/).filter((w) => w.length > 0).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onCancel}
    >
      <div
        className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 border-b border-gray-200 bg-white p-4">
          <h2 className="text-xl font-semibold">
            {lesson ? 'Promjena lekcije' : 'Dodati karticu'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-6">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Naslov <span className="text-red-500">*</span>
              <span className="ml-2 text-xs text-gray-500">
                ({wordCount}/50 riječi)
              </span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {wordCount > 50 && (
              <p className="mt-1 text-xs text-red-600">
                Title must be 50 words or less
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Opis <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Razred <span className="text-red-500">*</span>
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={6}>6 razred</option>
              <option value={7}>7 razred</option>
              <option value={8}>8 razred</option>
              <option value={9}>9 razred</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tagovi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="#matematika, #algebra, #razlomci"
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Unesi do 10 tagova, odvojeno zarezom ili razmakom. Ako ne uneseš
              ništa, biće dodan tag #matematika.
            </p>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              PDF fajl <span className="text-red-500">*</span>
              {!lesson && (
                <span className="ml-2 text-xs text-gray-500">(required)</span>
              )}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              required={!lesson}
            />
            {pdfFile && (
              <p className="mt-1 text-xs text-gray-600">
                Selected: {pdfFile.name}
              </p>
            )}
            {lesson && !pdfFile && (
              <p className="mt-1 text-xs text-gray-500">
                Current PDF will be kept if no new file is selected
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Poništi
            </button>
            <button
              type="submit"
              className="flex-1 rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting || wordCount > 50}
            >
              {isSubmitting ? 'Čuvanje...' : 'Sačuvaj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
