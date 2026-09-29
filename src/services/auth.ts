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
  setPersistence,
  browserLocalPersistence,
  User,
} from 'firebase/auth';
import rawFirebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types';

export const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || rawFirebaseConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawFirebaseConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || rawFirebaseConfig.authDomain,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawFirebaseConfig.messagingSenderId,
  oAuthClientId: import.meta.env.VITE_OAUTH_CLIENT_ID || rawFirebaseConfig.oAuthClientId,
};

// Initialize Firebase App safely (singleton)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Ensure local persistence across browser sessions and PWA restarts
try {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Firebase setPersistence warning:', err);
  });
} catch (e) {
  console.warn('Could not set persistence:', e);
}

// Configure Google Provider with required Google Workspace Scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.setCustomParameters({
  prompt: 'select_account',
});

export interface StoredSession {
  user: UserProfile;
  accessToken: string;
  expiresAt: number;
  authMethod: 'firebase' | 'gis';
  savedAt: number;
}

const STORAGE_SESSION_KEY = 'registro_messe_saved_session';

export const getSavedSession = (): StoredSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as StoredSession;
    if (session && session.user && session.accessToken) {
      return session;
    }
  } catch (e) {
    console.warn('Error reading saved session:', e);
  }
  return null;
};

export const saveSession = (
  user: UserProfile,
  accessToken: string,
  expiresInSeconds: number = 3600,
  authMethod: 'firebase' | 'gis' = 'firebase'
) => {
  try {
    const session: StoredSession = {
      user,
      accessToken,
      expiresAt: Date.now() + Math.max(expiresInSeconds - 120, 600) * 1000,
      authMethod,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
    cachedAccessToken = accessToken;
  } catch (e) {
    console.warn('Error saving session:', e);
  }
};

export const clearSavedSession = () => {
  try {
    localStorage.removeItem(STORAGE_SESSION_KEY);
    cachedAccessToken = null;
  } catch (e) {}
};

// Cache the access token in memory for fast synchronous access
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
    clearSavedSession();
  }
};

export const checkIsDemoMode = (): boolean => {
  return isDemoMode || localStorage.getItem('registro_messe_demo_active') === 'true';
};

/**
 * Initialize Auth State Listener with automatic persistent session recovery
 */
export const initAuth = (
  callback: (user: UserProfile | null, token: string | null, isDemo: boolean) => void
) => {
  if (checkIsDemoMode()) {
    isDemoMode = true;
    callback(DEMO_USER, 'demo-token', true);
    return () => {};
  }

  // 1. Immediately check for a saved persistent session in localStorage
  const saved = getSavedSession();
  if (saved) {
    cachedAccessToken = saved.accessToken;
    // Notify application immediately so priest does not have to login again
    callback(saved.user, saved.accessToken, false);

    // If token is expired or close to expiring, attempt silent refresh in background
    if (Date.now() > saved.expiresAt) {
      silentRefreshToken().then((freshToken) => {
        if (freshToken) {
          saveSession(saved.user, freshToken, 3600, saved.authMethod);
          callback(saved.user, freshToken, false);
        }
      }).catch(() => {
        console.warn('Background token refresh was silent.');
      });
    }
  }

  // 2. Listen to Firebase auth state
  return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    if (firebaseUser) {
      const profile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      };

      const currentSaved = getSavedSession();
      const effectiveToken = cachedAccessToken || currentSaved?.accessToken || null;

      if (effectiveToken) {
        callback(profile, effectiveToken, false);
      } else if (!isSigningIn && !saved) {
        callback(profile, null, false);
      }
    } else {
      // If Firebase state is logged out AND there is no saved GIS session
      const currentSaved = getSavedSession();
      if (!currentSaved) {
        cachedAccessToken = null;
        callback(null, null, false);
      }
    }
  });
};

/**
 * Attempt silent background refresh of Google OAuth token using GIS
 */
export const silentRefreshToken = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    // @ts-ignore
    const google = window.google;
    if (!google?.accounts?.oauth2) {
      return resolve(null);
    }

    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: firebaseConfig.oAuthClientId,
        scope:
          'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: (tokenResponse: any) => {
          if (tokenResponse?.access_token) {
            resolve(tokenResponse.access_token);
          } else {
            resolve(null);
          }
        },
      });

      // Request without prompt for silent refresh
      tokenClient.requestAccessToken({ prompt: '' });
    } catch {
      resolve(null);
    }
  });
};

/**
 * Direct Google Identity Services (GIS) Token Client fallback
 * Bypasses Firebase domain whitelist if GIS is allowed
 */
export const signInWithGIS = async (): Promise<{ user: UserProfile; accessToken: string }> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    const google = window.google;
    if (!google?.accounts?.oauth2) {
      return reject(new Error('GIS_NOT_LOADED'));
    }

    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: firebaseConfig.oAuthClientId,
        scope:
          'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            return reject(new Error(tokenResponse.error_description || tokenResponse.error));
          }
          if (!tokenResponse.access_token) {
            return reject(new Error('Nessun token di accesso ricevuto da Google.'));
          }

          const accessToken = tokenResponse.access_token;
          const expiresIn = tokenResponse.expires_in ? Number(tokenResponse.expires_in) : 3600;

          try {
            // Fetch priest profile from Google OAuth userinfo endpoint
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (res.ok) {
              const data = await res.json();
              const profile: UserProfile = {
                uid: data.sub || data.id,
                email: data.email,
                displayName: data.name || `${data.given_name || ''} ${data.family_name || ''}`.trim() || 'Sacerdote',
                photoURL: data.picture,
              };

              saveSession(profile, accessToken, expiresIn, 'gis');
              resolve({ user: profile, accessToken });
            } else {
              const fallbackProfile: UserProfile = {
                uid: 'google-user-' + Date.now(),
                email: null,
                displayName: 'Sacerdote',
                photoURL: null,
              };
              saveSession(fallbackProfile, accessToken, expiresIn, 'gis');
              resolve({ user: fallbackProfile, accessToken });
            }
          } catch (e) {
            const fallbackProfile: UserProfile = {
              uid: 'google-user-' + Date.now(),
              email: null,
              displayName: 'Sacerdote',
              photoURL: null,
            };
            saveSession(fallbackProfile, accessToken, expiresIn, 'gis');
            resolve({ user: fallbackProfile, accessToken });
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Perform Google Sign In with Firebase Popup, with automatic fallback to GIS
 */
export const googleSignIn = async (): Promise<{ user: UserProfile; accessToken: string }> => {
  try {
    isSigningIn = true;
    setDemoMode(false);

    // 1. Try Firebase signInWithPopup
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential?.accessToken) {
        throw new Error(
          'Google non ha restituito il token di accesso. Assicurati di accettare i permessi di Google Drive e Fogli.'
        );
      }

      const profile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      };

      saveSession(profile, credential.accessToken, 3600, 'firebase');
      return { user: profile, accessToken: credential.accessToken };
    } catch (firebaseErr: any) {
      // If error is unauthorized-domain, try Google Identity Services as fallback
      if (
        firebaseErr.code === 'auth/unauthorized-domain' ||
        firebaseErr.message?.includes('unauthorized-domain')
      ) {
        console.warn('Firebase unauthorized-domain detected. Attempting GIS fallback...');
        try {
          return await signInWithGIS();
        } catch (gisErr: any) {
          console.warn('GIS fallback also threw:', gisErr);
          const err = new Error(
            `Il dominio corrente (${window.location.hostname}) non è autorizzato in Firebase.`
          );
          (err as any).code = 'auth/unauthorized-domain';
          (err as any).domain = window.location.hostname;
          (err as any).projectId = firebaseConfig.projectId;
          throw err;
        }
      }
      throw firebaseErr;
    }
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
 * Sign out and clear stored session
 */
export const googleSignOut = async (): Promise<void> => {
  setDemoMode(false);
  clearSavedSession();
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Sign out warning:', e);
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken || getSavedSession()?.accessToken || null;
};
