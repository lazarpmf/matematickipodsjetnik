'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getCurrentUser, signOut, isAdmin } from '@/lib/auth';
import { getVisitCount } from '@/lib/metrics';
import { getStorageUsage } from '@/lib/storage';
import type { User } from '@supabase/supabase-js';

interface AdminBarProps {
  onLogin: () => void;
  onAddCard: () => void;
}

export default function AdminBar({ onLogin, onAddCard }: AdminBarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const [storageUsage, setStorageUsage] = useState<number | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isPanelHidden, setIsPanelHidden] = useState(false);

  useEffect(() => {
    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isUserAdmin) {
      loadMetrics();
    }
  }, [isUserAdmin]);

  async function checkAuth() {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      const admin = await isAdmin(currentUser.id);
      setIsUserAdmin(admin);
    }
  }

  async function loadMetrics() {
    const [visits, storage] = await Promise.all([
      getVisitCount(),
      getStorageUsage(),
    ]);
    setVisitCount(visits);
    setStorageUsage(storage);
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
    setIsUserAdmin(false);
    setVisitCount(null);
    setStorageUsage(null);
    setIsPanelHidden(false);
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  if (!isUserAdmin) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={onLogin}
          className="rounded-full bg-gray-600 px-4 py-2 text-sm font-medium text-white opacity-70 transition-opacity hover:opacity-100"
        >
          Admin pristup
        </button>
      </div>
    );
  }

  if (isPanelHidden) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsPanelHidden(false)}
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-lg hover:bg-gray-50"
        >
          Prikaži
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 space-y-2">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            Admin Panel
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPanelHidden(true)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Sakrij
            </button>
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>
        {visitCount !== null && (
          <div className="mb-2 text-xs text-gray-600">
            Visits: <span className="font-semibold">{visitCount}</span>
          </div>
        )}
        {storageUsage !== null && (
          <div className="mb-3 text-xs text-gray-600">
            Storage: <span className="font-semibold">{formatBytes(storageUsage)}</span>
          </div>
        )}
        <button
          onClick={onAddCard}
          className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          + Dodati karticu
        </button>
        <button
          onClick={() => setShowChangePassword(true)}
          className="mt-2 w-full rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Promjena lozinke
        </button>
      </div>
      {showChangePassword && (
        <ChangePasswordDialog
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => {
            setShowChangePassword(false);
            alert('Password changed successfully');
          }}
        />
      )}
    </div>
  );
}

function ChangePasswordDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    try {
      const { changePassword } = await import('@/lib/auth');
      await changePassword(newPassword);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold">Promjena lozinke</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nova lozinka
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Potvrda lozinke
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
              required
            />
          </div>
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Poništi
            </button>
            <button
              type="submit"
              className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Promjena lozinke
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
