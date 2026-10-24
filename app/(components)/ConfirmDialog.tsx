'use client';

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mb-4 text-gray-600">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Poništi
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
          >
            Da
          </button>
        </div>
      </div>
    </div>
  );
}
