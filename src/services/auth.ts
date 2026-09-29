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
        callback(profile, null, false);
      }
    } else {
      cachedAccessToken = null;
      callback(null, null, false);
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
          cachedAccessToken = accessToken;

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
              resolve({ user: profile, accessToken });
            } else {
              resolve({
                user: {
                  uid: 'google-user-' + Date.now(),
                  email: null,
                  displayName: 'Sacerdote',
                  photoURL: null,
                },
                accessToken,
              });
            }
          } catch (e) {
            resolve({
              user: {
                uid: 'google-user-' + Date.now(),
                email: null,
                displayName: 'Sacerdote',
                photoURL: null,
              },
              accessToken,
            });
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

      cachedAccessToken = credential.accessToken;

      const profile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      };

      return { user: profile, accessToken: cachedAccessToken };
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
          // Re-throw original unauthorized domain error with enriched properties
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
