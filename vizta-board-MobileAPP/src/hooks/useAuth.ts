/**
 * useAuth — bridge between Clerk session and Vizta Board platform JWT.
 *
 * Flow:
 *  1. Clerk authenticates the user (email/password, Google OAuth, or TOTP MFA).
 *  2. We take the Clerk session token and POST it to /auth/clerk-sync/ to
 *     get a short-lived platform JWT (15-min expiry) and the user profile.
 *  3. The platform JWT is stored in-memory (Zustand) and injected into every
 *     API request via axios default headers.
 *  4. On app foreground or token-expiry, we re-fetch from Clerk and re-sync.
 */

import { useEffect, useCallback } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { create } from 'zustand';
import { AuthAPI, setAuthToken } from '../services/api';
import type { User } from '../types';

// ── Zustand auth store ────────────────────────────────────────────────────────

interface AuthStore {
  user:         User | null;
  platformToken: string | null;
  isLoading:    boolean;
  error:        string | null;
  setUser:      (user: User | null) => void;
  setPlatformToken: (token: string | null) => void;
  setLoading:   (v: boolean) => void;
  setError:     (e: string | null) => void;
  reset:        () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user:          null,
  platformToken: null,
  isLoading:     false,
  error:         null,
  setUser:           (user)          => set({ user }),
  setPlatformToken:  (platformToken) => set({ platformToken }),
  setLoading:        (isLoading)     => set({ isLoading }),
  setError:          (error)         => set({ error }),
  reset: () =>
    set({ user: null, platformToken: null, isLoading: false, error: null }),
}));

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
  const { getToken, signOut, isSignedIn } = useClerkAuth();
  const { user: clerkUser }              = useUser();
  const store                            = useAuthStore();

  /** Exchange Clerk token for a Vizta Board platform JWT */
  const syncWithPlatform = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      store.setLoading(true);
      store.setError(null);

      const clerkToken = await getToken({ template: 'vizta-board' });
      if (!clerkToken) throw new Error('Could not obtain Clerk session token.');

      const { access, user } = await AuthAPI.clerkSync(clerkToken);
      setAuthToken(access);
      store.setPlatformToken(access);
      store.setUser(user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      store.setError(msg);
    } finally {
      store.setLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (isSignedIn) {
      syncWithPlatform();
    } else {
      // Clear state when Clerk signs out
      setAuthToken(null);
      store.reset();
    }
  }, [isSignedIn]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setAuthToken(null);
    store.reset();
  }, [signOut]);

  return {
    user:          store.user,
    platformToken: store.platformToken,
    isLoading:     store.isLoading,
    error:         store.error,
    isSignedIn:    !!store.user,
    role:          store.user?.role ?? null,
    syncWithPlatform,
    signOut:       handleSignOut,
    // Convenience role guards
    isAdvertiser:     store.user?.role === 'advertiser',
    isBillboardOwner: store.user?.role === 'billboard_owner',
    isAdmin:          store.user?.role === 'admin' || store.user?.role === 'super_admin',
  };
}
