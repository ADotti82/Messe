/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types';

// Initialize Firebase App safely (singleton)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Provider with required Google Workspace Scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.setCustomParameters({
  prompt: 'select_account',
});

// Cache the access token strictly in memory (Never stored in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Guest / Demo user for testing or local usage
let isDemoMode = false;
const DEMO_USER: UserProfile = {
  uid: 'demo-sacerdote-local',
  email: 'don.andrea.demo@chiesa.it',
  displayName: 'Don Andrea Dotti (Modalità Locale)',
  photoURL: null,
};

export const setDemoMode = (enabled: boolean) => {
  isDemoMode = enabled;
  if (!enabled) {
    localStorage.removeItem('registro_messe_demo_active');
  } else {
    localStorage.setItem('registro_messe_demo_active', 'true');
  }
};

export const checkIsDemoMode = (): boolean => {
  return isDemoMode || localStorage.getItem('registro_messe_demo_active') === 'true';
};

/**
 * Initialize Auth State Listener
 */
export const initAuth = (
  callback: (user: UserProfile | null, token: string | null, isDemo: boolean) => void
) => {
  if (checkIsDemoMode()) {
    isDemoMode = true;
    callback(DEMO_USER, 'demo-token', true);
    return () => {};
  }

  return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    if (firebaseUser) {
      const profile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      };

      if (cachedAccessToken) {
        callback(profile, cachedAccessToken, false);
      } else if (!isSigningIn) {
        // If we refreshed page and have firebase user, we might need user interaction to re-acquire OAuth access token
        callback(profile, null, false);
      }
    } else {
      cachedAccessToken = null;
      callback(null, null, false);
    }
  });
};

/**
 * Perform Google Sign In popup with Drive & Sheets scopes
 */
export const googleSignIn = async (): Promise<{ user: UserProfile; accessToken: string }> => {
  try {
    isSigningIn = true;
    setDemoMode(false);

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error(
        'Google non ha restituito il token di accesso. Assicurati di accettare i permessi di Google Drive e Fogli.'
      );
    }

    cachedAccessToken = credential.accessToken;

    const profile: UserProfile = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    };

    return { user: profile, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Errore durante il login con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Re-authenticate or refresh token if expired
 */
export const refreshGoogleToken = async (): Promise<string> => {
  if (checkIsDemoMode()) return 'demo-token';
  const { accessToken } = await googleSignIn();
  return accessToken;
};

/**
 * Sign out
 */
export const googleSignOut = async (): Promise<void> => {
  setDemoMode(false);
  cachedAccessToken = null;
  await signOut(auth);
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};
