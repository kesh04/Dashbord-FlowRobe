'use client';

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

import type { User } from '@/types/user';
import { auth, functions } from '@/lib/firebase';
import { clearAdminCache } from '@/lib/admin-api';



export interface SignUpParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignInWithOAuthParams {
  provider: 'google' | 'discord';
}

export interface SignInWithPasswordParams {
  email: string;
  password: string;
}

export interface ResetPasswordParams {
  email: string;
}

function waitForAuth(): Promise<FirebaseUser | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      unsubscribe();
      resolve(u);
    });
  });
}

/** true / false, or a string with the reason when the check itself failed. */
async function checkAdmin(): Promise<true | false | string> {
  try {
    const fn = httpsCallable<Record<string, never>, { isAdmin: boolean }>(functions, 'adminCheck');
    const res = await fn({});
    return !!res.data?.isAdmin;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error('[adminCheck] failed:', error);
    const code: string = err?.code || '';
    if (code === 'functions/not-found' || code === 'functions/internal') {
      return 'The adminCheck Cloud Function is not deployed in this Firebase project. Run "firebase deploy --only functions".';
    }
    return `Could not check admin access (${code || err?.message || 'unknown error'}).`;
  }
}

async function isAdmin(): Promise<boolean> {
  return (await checkAdmin()) === true;
}

function toUser(u: FirebaseUser): User {
  return {
    id: u.uid,
    name: u.displayName || u.email?.split('@')[0] || 'Admin',
    email: u.email || '',
    avatar: u.photoURL || undefined,
  };
}

const firebaseErrorText = (code?: string): string => {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email': {
      return 'Invalid email or password';
    }
    case 'auth/too-many-requests': {
      return 'Too many attempts. Please try again later.';
    }
    default: {
      return 'Sign in failed. Please try again.';
    }
  }
};

class AuthClient {
  async signUp(_: SignUpParams): Promise<{ error?: string }> {
    return { error: 'Sign up is disabled. Ask an admin to give you access.' };
  }

  async signInWithOAuth(_: SignInWithOAuthParams): Promise<{ error?: string }> {
    return { error: 'Social authentication not implemented' };
  }

  async signInWithPassword(params: SignInWithPasswordParams): Promise<{ error?: string }> {
    try {
      await signInWithEmailAndPassword(auth, params.email.trim(), params.password);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      return { error: firebaseErrorText(err?.code) };
    }
    // refresh token so a newly set `admin` claim is included
    await auth.currentUser?.getIdToken(true);
    const result = await checkAdmin();
    if (result !== true) {
      await firebaseSignOut(auth);
      return {
        error:
          typeof result === 'string'
            ? result
            : `${params.email.trim()} is not an admin. Add it to ADMIN_EMAILS in the functions .env and deploy the functions again.`,
      };
    }
    return {};
  }

  async resetPassword(params: ResetPasswordParams): Promise<{ error?: string }> {
    try {
      // same branded email as the FlowRobe app
      const fn = httpsCallable<{ email: string }, { success: boolean }>(functions, 'sendPasswordReset');
      await fn({ email: params.email.trim() });
      return {};
    } catch {
      return { error: 'Could not send the reset email. Please try again.' };
    }
  }

  async updatePassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Update password not implemented' };
  }

  async getUser(): Promise<{ data?: User | null; error?: string }> {
    const u = auth.currentUser ?? (await waitForAuth());
    if (!u) return { data: null };
    if (!(await isAdmin())) {
      await firebaseSignOut(auth);
      return { data: null };
    }
    return { data: toUser(u) };
  }

  async signOut(): Promise<{ error?: string }> {
    clearAdminCache();
    await firebaseSignOut(auth);
    return {};
  }
}

export const authClient = new AuthClient();
