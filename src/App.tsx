/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  initAuth,
  googleSignIn,
  signInWithGIS,
  googleSignOut,
  setDemoMode,
  checkIsDemoMode,
  onTokenExpired,
} from './services/auth';
import {
  IDataRepository,
  GoogleSheetsRepository,
  LocalDemoRepository,
} from './services/dataRepository';
import { Messa, Luogo, Impostazioni, UserProfile, GoogleCalendarEvent } from './types';
import {
  getOrCreateRegistroMesseCalendar,
  fetchAllCalendarEvents,
  createMassCalendarEvent,
  updateMassCalendarEvent,
  deleteMassCalendarEvent,
} from './services/googleCalendarService';
import { Navbar } from './components/Navbar';
import { MassList } from './components/MassList';
import { MassFormModal } from './components/MassFormModal';
import { CalendarView } from './components/CalendarView';
import { StatisticsView } from './components/StatisticsView';
import { PlacesManager } from './components/PlacesManager';
import { SettingsModal } from './components/SettingsModal';
import { ArchiveSetupModal } from './components/ArchiveSetupModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { UserGuideModal } from './components/UserGuideModal';
import { UnauthorizedDomainModal } from './components/UnauthorizedDomainModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { SacristyPrintModal } from './components/SacristyPrintModal';
import { AnniversariesModal } from './components/AnniversariesModal';
import { ReadingsModal } from './components/ReadingsModal';
import { SessionExpiredModal } from './components/SessionExpiredModal';
import { useTheme } from './hooks/useTheme';
import { getAnniversariImminenti } from './services/anniversariesService';
import { BackupPackage } from './services/exportBackupService';
import { firebaseConfig } from './services/auth';
import { ShieldCheck, HardDrive, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function App() {
  // Authentication & Repository
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(checkIsDemoMode());
  const [repository, setRepository] = useState<IDataRepository | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Archive check state
  const [hasArchive, setHasArchive] = useState<boolean | null>(null);
  const [isArchiveChecking, setIsArchiveChecking] = useState<boolean>(false);

  // Application Data
  const [messe, setMesse] = useState<Messa[]>([]);
  const [luoghi, setLuoghi] = useState<Luogo[]>([]);
  const [settings, setSettings] = useState<Impostazioni | null>(null);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

  // Navigation
  const [activeTab, setActiveTab] = useState<'registro' | 'calendario' | 'statistiche' | 'luoghi'>('registro');

  // Theme hook
  const { theme, toggleTheme } = useTheme();

  // Modals
  const [isNewMassOpen, setIsNewMassOpen] = useState<boolean>(false);
  const [editingMass, setEditingMass] = useState<Messa | null>(null);
  const [formInitialDate, setFormInitialDate] = useState<string | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isSacristyPrintOpen, setIsSacristyPrintOpen] = useState<boolean>(false);
  const [isAnniversariesOpen, setIsAnniversariesOpen] = useState<boolean>(false);
  const [isReadingsOpen, setIsReadingsOpen] = useState<boolean>(false);
  const [readingsDate, setReadingsDate] = useState<string | undefined>(undefined);

  // Google Calendar integration state
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState<boolean>(false);
  const [googleCalendarId, setGoogleCalendarId] = useState<string | null>(null);

  // Session expired modal state
  const [isSessionExpiredModalOpen, setIsSessionExpiredModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onTokenExpired(() => {
      setIsSessionExpiredModalOpen(true);
    });
    return () => unsubscribe();
  }, []);

  // Delete modal state
  const [massToDelete, setMassToDelete] = useState<Messa | null>(null);
  const [placeToDelete, setPlaceToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Feedback Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Network Online/Offline status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // 1. Initialize Auth on Mount
  useEffect(() => {
    const unsubscribe = initAuth((currentUser, currentToken, currentIsDemo) => {
      setUser(currentUser);
      setToken(currentToken);
      setIsDemo(currentIsDemo);
      setIsAuthLoading(false);

      if (currentUser) {
        if (currentIsDemo) {
          const repo = new LocalDemoRepository();
          setRepository(repo);
        } else if (currentToken) {
          const repo = new GoogleSheetsRepository(currentToken, currentUser);
          setRepository(repo);
        }
      } else {
        setRepository(null);
        setHasArchive(null);
        setMesse([]);
        setLuoghi([]);
        setSettings(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Load Archive and Data when repository is ready
  const loadArchiveAndData = useCallback(async (repo: IDataRepository) => {
    setIsArchiveChecking(true);
    try {
      const initResult = await repo.init();
      setHasArchive(initResult.hasArchive);

      if (initResult.hasArchive) {
        setIsDataLoading(true);
        const [massesData, placesData, settingsData] = await Promise.all([
          repo.getMasses(),
          repo.getPlaces(),
          repo.getSettings(),
        ]);
        setMesse(massesData);
        setLuoghi(placesData);
        setSettings(settingsData);
      }
    } catch (err: any) {
      console.error('Errore inizializzazione archivio:', err);
      if (
        err.message?.includes('AUTH_TOKEN_EXPIRED') ||
        err.message?.includes('invalid authentication credentials') ||
        err.message?.includes('UNAUTHENTICATED') ||
        err.message?.includes('401')
      ) {
        setIsSessionExpiredModalOpen(true);
        return;
      }
      if (err.message === 'ARCHIVE_NOT_FOUND') {
        setHasArchive(false);
      } else {
        showToast('Impossibile verificare l\'archivio: ' + err.message, 'error');
      }
    } finally {
      setIsArchiveChecking(false);
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (repository) {
      loadArchiveAndData(repository);
    }
  }, [repository, loadArchiveAndData]);

  // Load Google Calendar Events
  const loadGoogleEvents = useCallback(
    async (authToken?: string, calId?: string) => {
      const activeToken = authToken || token;
      if (!activeToken) return;

      setIsCalendarLoading(true);
      try {
        let targetCalId = calId || googleCalendarId;
        if (!targetCalId) {
          targetCalId = await getOrCreateRegistroMesseCalendar(activeToken);
          setGoogleCalendarId(targetCalId);
        }

        const now = new Date();
        const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const timeMax = new Date(now.getFullYear(), now.getMonth() + 4, 0).toISOString();

        const events = await fetchAllCalendarEvents(activeToken, timeMin, timeMax, targetCalId);
        setGoogleEvents(events);
      } catch (err: any) {
        console.warn('Errore caricamento eventi Google Calendar:', err);
        if (
          err.message?.includes('AUTH_TOKEN_EXPIRED') ||
          err.message?.includes('invalid authentication credentials') ||
          err.message?.includes('UNAUTHENTICATED')
        ) {
          setIsSessionExpiredModalOpen(true);
        }
      } finally {
        setIsCalendarLoading(false);
      }
    },
    [token, googleCalendarId]
  );

  useEffect(() => {
    if (token) {
      loadGoogleEvents(token);
    }
  }, [token, loadGoogleEvents]);

  const [isDomainModalOpen, setIsDomainModalOpen] = useState<boolean>(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string>(
    typeof window !== 'undefined' ? window.location.hostname : ''
  );

  // Login handler
  const handleGoogleLogin = async () => {
    try {
      setAuthError(null);
      setIsAuthLoading(true);
      const { user: loggedUser, accessToken } = await googleSignIn();
      setUser(loggedUser);
      setToken(accessToken);
      setIsDemo(false);
      const repo = new GoogleSheetsRepository(accessToken, loggedUser);
      setRepository(repo);
    } catch (err: any) {
      const isUnauthorizedDomain =
        err.code === 'auth/unauthorized-domain' ||
        err.message?.includes('unauthorized-domain') ||
        err.message?.includes('auth/unauthorized-domain');

      if (isUnauthorizedDomain) {
        const domain = err.domain || window.location.hostname;
        setUnauthorizedDomain(domain);
        setIsDomainModalOpen(true);
        setAuthError(
          `Il dominio "${domain}" non è autorizzato in Firebase per questo progetto Google.`
        );
      } else {
        setAuthError(
          err.message ||
            'Accesso non riuscito. Verifica la connessione e concedi i permessi per Google Drive e Fogli.'
        );
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Direct Google Identity Services (GIS) Login handler
  const handleGISLogin = async () => {
    try {
      setAuthError(null);
      setIsAuthLoading(true);
      const { user: loggedUser, accessToken } = await signInWithGIS();
      setUser(loggedUser);
      setToken(accessToken);
      setIsDemo(false);
      const repo = new GoogleSheetsRepository(accessToken, loggedUser);
      setRepository(repo);
    } catch (err: any) {
      setAuthError(
        err.message ||
          'Accesso con Google non riuscito. Verifica la connessione e concedi i permessi.'
      );
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Demo Login handler
  const handleDemoLogin = () => {
    setDemoMode(true);
    setIsDemo(true);
    const demoUser: UserProfile = {
      uid: 'demo-sacerdote-local',
      email: 'don.andrea.demo@chiesa.it',
      displayName: 'Don Andrea Dotti',
      photoURL: null,
    };
    setUser(demoUser);
    setToken('demo-token');
    const repo = new LocalDemoRepository();
    setRepository(repo);
  };

  // 1-Click Renew Session Handler when Google OAuth token expires
  const handleRenewSession = async () => {
    try {
      setIsAuthLoading(true);
      const { user: renewedUser, accessToken } = await signInWithGIS();
      setUser(renewedUser);
      setToken(accessToken);
      setIsSessionExpiredModalOpen(false);

      if (repository && typeof (repository as any).updateAccessToken === 'function') {
        (repository as any).updateAccessToken(accessToken);
        await loadArchiveAndData(repository);
      } else {
        const repo = new GoogleSheetsRepository(accessToken, renewedUser);
        setRepository(repo);
      }

      showToast('Sessione Google rinnovata con successo!');
      loadGoogleEvents(accessToken);
    } catch (err: any) {
      console.warn('Errore rinnovo sessione Google:', err);
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await googleSignOut();
      setUser(null);
      setToken(null);
      setRepository(null);
      setHasArchive(null);
      setMesse([]);
      setLuoghi([]);
      setSettings(null);
      setIsDemo(false);
      setIsSessionExpiredModalOpen(false);
      showToast('Sessione chiusa correttamente.');
    } catch (err: any) {
      console.error('Errore disconnessione:', err);
    }
  };

  // Create Archive handler (first access)
  const handleCreateArchive = async (diocesi: string) => {
    if (!repository || !user) return;
    try {
      await repository.createArchive(user, diocesi);
      setHasArchive(true);
      await loadArchiveAndData(repository);
      showToast('Archivio personale creato con successo nel tuo Google Drive!');
    } catch (err: any) {
      showToast('Errore durante la creazione del registro: ' + err.message, 'error');
      throw err;
    }
  };

  // Save Mass handler (create or update with Google Calendar sync)
  const handleSaveMass = async (
    massData: Omit<Messa, 'id' | 'creatoIl' | 'modificatoIl'>,
    editId?: string,
    syncToGoogleCalendar?: boolean
  ) => {
    if (!repository) throw new Error('Archivio non disponibile.');

    let gcalEventId = massData.googleCalendarEventId;

    if (token && syncToGoogleCalendar) {
      try {
        let calId = googleCalendarId;
        if (!calId) {
          calId = await getOrCreateRegistroMesseCalendar(token);
          setGoogleCalendarId(calId);
        }

        if (editId && gcalEventId) {
          const pseudoMass: Messa = { ...massData, id: editId, creatoIl: '', modificatoIl: '' };
          await updateMassCalendarEvent(token, calId, gcalEventId, pseudoMass);
        } else {
          const pseudoMass: Messa = { ...massData, id: editId || 'temp', creatoIl: '', modificatoIl: '' };
          gcalEventId = await createMassCalendarEvent(token, calId, pseudoMass);
        }
      } catch (calErr: any) {
        console.warn('Sincronizzazione evento Google Calendar fallita:', calErr);
      }
    } else if (token && !syncToGoogleCalendar && gcalEventId && googleCalendarId) {
      await deleteMassCalendarEvent(token, googleCalendarId, gcalEventId).catch(() => {});
      gcalEventId = '';
    }

    const dataToSave = {
      ...massData,
      googleCalendarEventId: gcalEventId || '',
    };

    if (editId) {
      const updated = await repository.updateMass(editId, dataToSave);
      setMesse((prev) => prev.map((m) => (m.id === editId ? updated : m)));
      showToast(
        syncToGoogleCalendar
          ? 'Messa e Google Calendar aggiornati correttamente.'
          : 'Messa aggiornata correttamente.'
      );
    } else {
      const created = await repository.createMass(dataToSave);
      setMesse((prev) => [created, ...prev]);
      showToast(
        syncToGoogleCalendar
          ? 'Messa registrata e sincronizzata su Google Calendar!'
          : 'Messa registrata correttamente.'
      );
    }

    if (token) {
      loadGoogleEvents(token);
    }

    // Refresh places list
    const updatedPlaces = await repository.getPlaces();
    setLuoghi(updatedPlaces);
  };

  // Delete Mass handler
  const handleConfirmDeleteMass = async () => {
    if (!repository || !massToDelete) return;
    try {
      setIsDeleting(true);
      if (token && massToDelete.googleCalendarEventId && googleCalendarId) {
        await deleteMassCalendarEvent(token, googleCalendarId, massToDelete.googleCalendarEventId).catch(() => {});
      }
      await repository.deleteMass(massToDelete.id);
      setMesse((prev) => prev.filter((m) => m.id !== massToDelete.id));
      showToast('Messa eliminata dal registro.');
      setMassToDelete(null);
      if (token) {
        loadGoogleEvents(token);
      }
    } catch (err: any) {
      showToast('Errore durante l\'eliminazione: ' + err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle default Google Calendar sync setting
  const handleToggleCalendarSync = async (enabled: boolean) => {
    if (!repository) return;
    try {
      const updated = await repository.saveSettings({ syncGoogleCalendarDefault: enabled });
      setSettings(updated);
      showToast(
        enabled
          ? 'Sincronizzazione Google Calendar attiva di default per le nuove Messe.'
          : 'Sincronizzazione Google Calendar disattivata di default.'
      );
    } catch (err: any) {
      showToast('Errore salvataggio impostazioni: ' + err.message, 'error');
    }
  };

  // Add Place handler
  const handleAddPlace = async (placeData: {
    nome: string;
    indirizzo?: string;
    latitudine?: number | null;
    longitudine?: number | null;
  }) => {
    if (!repository) return;
    await repository.createOrIncrementPlace(placeData);
    const updatedPlaces = await repository.getPlaces();
    setLuoghi(updatedPlaces);
    showToast(`Luogo "${placeData.nome}" aggiunto con successo.`);
  };

  // Delete Place handler
  const handleConfirmDeletePlace = async () => {
    if (!repository || !placeToDelete) return;
    try {
      setIsDeleting(true);
      await repository.deletePlace(placeToDelete.id);
      setLuoghi((prev) => prev.filter((p) => p.id !== placeToDelete.id));
      showToast(`Luogo "${placeToDelete.name}" rimosso dall'elenco.`);
      setPlaceToDelete(null);
    } catch (err: any) {
      showToast('Errore durante la cancellazione del luogo: ' + err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Save Diocese
  const handleSaveDiocese = async (diocesi: string) => {
    if (!repository) return;
    const updated = await repository.saveSettings({ diocesi });
    setSettings(updated);
    showToast('Diocesi aggiornata.');
  };

  // Restore Backup
  const handleRestoreBackup = async (backup: BackupPackage) => {
    if (!repository) return;

    // Add places
    for (const p of backup.luoghi) {
      await repository.createOrIncrementPlace({
        nome: p.nome,
        indirizzo: p.indirizzo,
        latitudine: p.latitudine,
        longitudine: p.longitudine,
      }).catch(() => {});
    }

    // Add masses avoiding duplicates
    const currentMasses = await repository.getMasses();
    const existingIds = new Set(currentMasses.map((m) => m.id));

    for (const m of backup.messe) {
      if (!existingIds.has(m.id)) {
        await repository.createMass({
          data: m.data,
          ora: m.ora,
          dataOra: m.dataOra,
          luogo: m.luogo,
          indirizzo: m.indirizzo,
          latitudine: m.latitudine,
          longitudine: m.longitudine,
          celebrazione: m.celebrazione,
          grado: m.grado,
          tempoLiturgico: m.tempoLiturgico,
          settimanaLiturgica: m.settimanaLiturgica,
          coloreLiturgico: m.coloreLiturgico,
          fonteCalendario: m.fonteCalendario,
          intenzione: m.intenzione,
          tipoIntenzione: m.tipoIntenzione,
          nomeDefunto: m.nomeDefunto,
          note: m.note,
        });
      }
    }

    await loadArchiveAndData(repository);
    showToast('Ripristino completato con successo!');
  };

  // Reset Archive
  const handleResetArchive = async () => {
    if (!repository) return;
    await repository.resetArchive();
    setHasArchive(false);
    setMesse([]);
    setLuoghi([]);
    setSettings(null);
    showToast('Archivio personale eliminato.');
  };

  // Open New Mass Modal helper
  const handleOpenNewMass = () => {
    setEditingMass(null);
    setFormInitialDate(undefined);
    setIsNewMassOpen(true);
  };

  const handleOpenNewMassWithDate = (dateStr: string) => {
    setEditingMass(null);
    setFormInitialDate(dateStr);
    setIsNewMassOpen(true);
  };

  const handleEditMass = (m: Messa) => {
    setEditingMass(m);
    setIsNewMassOpen(true);
  };

  // Anniversaries and Trigesimi calculation
  const anniversariImminenti = useMemo(() => {
    return getAnniversariImminenti(messe);
  }, [messe]);

  const handleScheduleFromAnniversary = (
    defunto: string,
    dataSuggerita: string,
    luogo?: string,
    richiedente?: string
  ) => {
    setFormInitialDate(dataSuggerita);
    setEditingMass({
      id: '',
      data: dataSuggerita,
      ora: '18:30',
      dataOra: `${dataSuggerita}T18:30:00`,
      luogo: luogo || (luoghi[0]?.nome || ''),
      indirizzo: '',
      latitudine: null,
      longitudine: null,
      celebrazione: 'Messa di suffragio',
      grado: 'Feriale',
      tempoLiturgico: '',
      settimanaLiturgica: '',
      coloreLiturgico: 'Viola',
      fonteCalendario: 'CalAPI',
      tipoIntenzione: 'Per un defunto',
      nomeDefunto: defunto,
      richiedente: richiedente || '',
      intenzione: 'Messa di suffragio',
      note: '',
      creatoIl: '',
      modificatoIl: '',
    });
    setIsNewMassOpen(true);
  };

  const handleOpenReadings = (dateStr?: string) => {
    setReadingsDate(dateStr || new Date().toISOString().split('T')[0]);
    setIsReadingsOpen(true);
  };

  // -------------------------------------------------------------
  // RENDER: Loading Initial Auth
  // -------------------------------------------------------------
  if (isAuthLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-red-800 flex items-center justify-center shadow-2xl border border-amber-400/40 mb-4 animate-pulse">
          <span className="text-3xl font-serif text-amber-100 font-bold">☩</span>
        </div>
        <p className="font-serif text-base font-semibold text-amber-100 tracking-wide">
          REGISTRO DELLE MESSE
        </p>
        <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Verifica autenticazione in corso...</span>
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Unauthenticated Landing Screen (Sections 1 & 2)
  // -------------------------------------------------------------
  if (!user || (!token && !isDemo)) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-amber-800 selection:text-white">
        {/* Top bar */}
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between py-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-600 to-red-800 flex items-center justify-center border border-amber-500/40 shadow-sm">
              <span className="font-serif font-bold text-amber-100 text-lg">☩</span>
            </div>
            <span className="font-serif font-bold text-base sm:text-lg tracking-wider text-amber-100">
              REGISTRO DELLE MESSE
            </span>
          </div>

          <button
            onClick={() => setIsGuideOpen(true)}
            className="text-xs text-slate-400 hover:text-amber-200 underline font-medium"
          >
            Guida e Architettura
          </button>
        </div>

        {/* Center Hero Card */}
        <div className="max-w-xl mx-auto w-full my-auto py-8">
          <div className="bg-slate-900 border border-amber-900/40 rounded-2xl shadow-2xl p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-red-800 flex items-center justify-center shadow-lg border border-amber-400/40 mx-auto">
              <span className="text-3xl font-serif text-amber-100 font-bold">☩</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-amber-50 tracking-wide">
                Registro delle Messe
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Archivio personale riservato per sacerdoti per registrare, consultare e analizzare le celebrazioni liturgiche, intenzioni e suffragi.
              </p>
            </div>

            {authError && (
              <div className="p-3.5 bg-red-950/80 border border-red-700 rounded-xl text-xs text-red-200 text-left space-y-2">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{authError}</span>
                </div>
                {authError.includes('non è autorizzato') && (
                  <button
                    type="button"
                    onClick={() => setIsDomainModalOpen(true)}
                    className="w-full bg-amber-700/80 hover:bg-amber-600 text-amber-100 font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                  >
                    <span>Come autorizzare "{unauthorizedDomain}" in 1 minuto</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Architecture guarantee callouts */}
            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 text-left space-y-2 text-xs text-slate-300">
              <div className="flex items-start space-x-2">
                <HardDrive className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-100">Archivio Personale in Google Drive:</strong> Ogni sacerdote ha il proprio Google Sheet personale. Nessun database centrale condiviso.
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-100">Massima Riservatezza:</strong> Nessun invio di nomi di defunti o intenzioni a servizi terzi o modelli AI.
                </p>
              </div>
            </div>

            {/* Sign in with Google Button (Official Google Design standard) */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleGoogleLogin}
                className="w-full bg-white hover:bg-slate-100 text-slate-800 font-semibold px-4 py-3 rounded-xl shadow-md transition-all flex items-center justify-center space-x-3 active:scale-98 border border-slate-200 text-sm sm:text-base cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.26v3.13C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.6H1.26C.46 8.21 0 10.05 0 12s.46 3.79 1.26 5.4l4.02-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.6l4.02 3.13c.95-2.84 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>ACCEDI CON GOOGLE</span>
              </button>

              {/* Direct Google Identity Services button (runs synchronously on click) */}
              <button
                type="button"
                onClick={handleGISLogin}
                className="w-full bg-slate-800/90 hover:bg-slate-700 text-amber-200 hover:text-white font-medium px-4 py-2.5 rounded-xl border border-amber-600/30 transition-all flex items-center justify-center space-x-2 text-xs cursor-pointer"
              >
                <span>⚡ Accesso Diretto Google Identity</span>
              </button>

              {/* Demo Mode Button */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium py-1 transition-colors"
                >
                  Oppure: Prova in modalità locale (Demo di test)
                </button>
              </div>

              {/* Install PWA Prompt */}
              <div className="pt-2">
                <PWAInstallButton variant="banner" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="max-w-4xl mx-auto w-full text-center text-xs text-slate-500 py-2">
          Applicazione per sacerdoti • Calendario Romano Generale CalAPI (general-it) • Google Drive API v3 • Google Sheets API v4
        </div>

        {/* Unauthorized Domain Modal */}
        <UnauthorizedDomainModal
          isOpen={isDomainModalOpen}
          onClose={() => setIsDomainModalOpen(false)}
          domain={unauthorizedDomain}
          projectId={firebaseConfig.projectId}
          onRetry={handleGoogleLogin}
          onDemoLogin={handleDemoLogin}
          onGISLogin={handleGISLogin}
        />

        {/* User Guide Modal */}
        <UserGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: First-time Archive Creation Modal (Section 3)
  // -------------------------------------------------------------
  if (hasArchive === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <ArchiveSetupModal
          user={user}
          onCreateArchive={handleCreateArchive}
          isDemo={isDemo}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Checking Archive Screen
  // -------------------------------------------------------------
  if (isArchiveChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100">
        <div className="w-12 h-12 rounded-xl bg-amber-900/60 border border-amber-500/40 flex items-center justify-center text-amber-200 mb-3 animate-bounce">
          <span className="text-2xl font-serif">☩</span>
        </div>
        <p className="font-serif text-sm font-semibold text-amber-100">
          Verifica del tuo Google Sheet personale in corso...
        </p>
        <p className="text-xs text-slate-400 mt-1">Connessione sicura a Google Drive</p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Authenticated Main Application View
  // -------------------------------------------------------------
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} flex flex-col font-sans selection:bg-amber-800 selection:text-white w-full max-w-full overflow-x-hidden`}>
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewMass={handleOpenNewMass}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onLogout={handleLogout}
        user={user}
        settings={settings}
        isOnline={isOnline}
        isDemo={isDemo}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSacristyPrint={() => setIsSacristyPrintOpen(true)}
        onOpenReadings={handleOpenReadings}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-50 animate-in slide-in-from-bottom-4 duration-200 max-w-[90vw]">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-xl border flex items-center space-x-2 text-xs sm:text-sm font-medium ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/80 backdrop-blur'
                : 'bg-red-950/90 text-red-200 border-red-700/80 backdrop-blur'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-24 md:pb-8 w-full max-w-full overflow-x-hidden">
        {/* Mobile PWA Install Notice */}
        <PWAInstallButton variant="banner" className="mb-4" />

        {activeTab === 'registro' && (
          <MassList
            messe={messe}
            luoghi={luoghi}
            onOpenNewMass={handleOpenNewMass}
            onEditMass={handleEditMass}
            onDeleteMass={(m) => setMassToDelete(m)}
            isLoading={isDataLoading}
            onOpenSacristyPrint={() => setIsSacristyPrintOpen(true)}
            onOpenAnniversaries={() => setIsAnniversariesOpen(true)}
            anniversariCount={anniversariImminenti.length}
            onOpenReadings={handleOpenReadings}
          />
        )}

        {activeTab === 'calendario' && (
          <CalendarView
            messe={messe}
            onOpenNewMassWithDate={handleOpenNewMassWithDate}
            onEditMass={handleEditMass}
            googleEvents={googleEvents}
            isCalendarLoading={isCalendarLoading}
            onRefreshGoogleEvents={() => token && loadGoogleEvents(token)}
            onOpenReadings={handleOpenReadings}
          />
        )}

        {activeTab === 'statistiche' && (
          <StatisticsView messe={messe} luoghi={luoghi} />
        )}

        {activeTab === 'luoghi' && (
          <PlacesManager
            luoghi={luoghi}
            onAddPlace={handleAddPlace}
            onDeletePlace={(id, name) => setPlaceToDelete({ id, name })}
            isLoading={isDataLoading}
          />
        )}
      </main>

      {/* Modals */}
      {/* 1. New / Edit Mass Form Modal */}
      <MassFormModal
        isOpen={isNewMassOpen}
        onClose={() => {
          setIsNewMassOpen(false);
          setEditingMass(null);
          setFormInitialDate(undefined);
        }}
        onSave={handleSaveMass}
        editingMass={editingMass}
        initialDate={formInitialDate}
        frequentPlaces={luoghi}
        onOpenReadings={handleOpenReadings}
        syncCalendarDefault={settings?.syncGoogleCalendarDefault !== false}
      />

      {/* 2. Settings & Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        user={user}
        messe={messe}
        luoghi={luoghi}
        onSaveDiocese={handleSaveDiocese}
        onRestoreBackup={handleRestoreBackup}
        onResetArchive={handleResetArchive}
        isDemo={isDemo}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSacristyPrint={() => setIsSacristyPrintOpen(true)}
        isCalendarSyncEnabled={settings?.syncGoogleCalendarDefault !== false}
        calendarId={googleCalendarId || settings?.googleCalendarId}
        onToggleCalendarSync={handleToggleCalendarSync}
      />

      {/* 3. User Guide & Configuration Instructions Modal (Section 69) */}
      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* 4. Delete Mass Confirmation Modal (Section 29) */}
      <DeleteConfirmModal
        isOpen={!!massToDelete}
        onClose={() => setMassToDelete(null)}
        onConfirm={handleConfirmDeleteMass}
        title="Elimina registrazione Messa"
        message={`Vuoi davvero eliminare la Messa celebrata il ${massToDelete?.data} alle ${massToDelete?.ora} presso "${massToDelete?.luogo}"? L'operazione non potrà essere annullata.`}
        isDeleting={isDeleting}
      />

      {/* 5. Delete Place Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!placeToDelete}
        onClose={() => setPlaceToDelete(null)}
        onConfirm={handleConfirmDeletePlace}
        title="Elimina luogo di celebrazione"
        message={`Vuoi eliminare "${placeToDelete?.name}" dall'elenco dei tuoi luoghi abituali?`}
        isDeleting={isDeleting}
      />

      {/* 6. Sacristy Print / PDF Modal */}
      <SacristyPrintModal
        isOpen={isSacristyPrintOpen}
        onClose={() => setIsSacristyPrintOpen(false)}
        messe={messe}
        luoghi={luoghi}
        settings={settings}
      />

      {/* 7. Anniversaries and Trigesimi Modal */}
      <AnniversariesModal
        isOpen={isAnniversariesOpen}
        onClose={() => setIsAnniversariesOpen(false)}
        anniversari={anniversariImminenti}
        onScheduleMass={handleScheduleFromAnniversary}
      />

      {/* 8. Daily Liturgical Readings Modal */}
      <ReadingsModal
        isOpen={isReadingsOpen}
        onClose={() => setIsReadingsOpen(false)}
        initialDate={readingsDate}
      />

      {/* 9. Session Expired 1-Click Renewal Modal */}
      <SessionExpiredModal
        isOpen={isSessionExpiredModalOpen}
        onRenew={handleRenewSession}
        onLogout={handleLogout}
        userEmail={user?.email}
      />
    </div>
  );
}
