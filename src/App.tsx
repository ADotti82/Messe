/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  setDemoMode,
  checkIsDemoMode,
} from './services/auth';
import {
  IDataRepository,
  GoogleSheetsRepository,
  LocalDemoRepository,
} from './services/dataRepository';
import { Messa, Luogo, Impostazioni, UserProfile } from './types';
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

  // Modals
  const [isNewMassOpen, setIsNewMassOpen] = useState<boolean>(false);
  const [editingMass, setEditingMass] = useState<Messa | null>(null);
  const [formInitialDate, setFormInitialDate] = useState<string | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

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

  // Save Mass handler (create or update)
  const handleSaveMass = async (
    massData: Omit<Messa, 'id' | 'creatoIl' | 'modificatoIl'>,
    editId?: string
  ) => {
    if (!repository) throw new Error('Archivio non disponibile.');

    if (editId) {
      const updated = await repository.updateMass(editId, massData);
      setMesse((prev) => prev.map((m) => (m.id === editId ? updated : m)));
      showToast('Messa aggiornata correttamente.');
    } else {
      const created = await repository.createMass(massData);
      setMesse((prev) => [created, ...prev]);
      showToast('Messa registrata correttamente.');
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
      await repository.deleteMass(massToDelete.id);
      setMesse((prev) => prev.filter((m) => m.id !== massToDelete.id));
      showToast('Messa eliminata dal registro.');
      setMassToDelete(null);
    } catch (err: any) {
      showToast('Errore durante l\'eliminazione: ' + err.message, 'error');
    } finally {
      setIsDeleting(false);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-800 selection:text-white">
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
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 animate-in slide-in-from-bottom-4 duration-200">
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {activeTab === 'registro' && (
          <MassList
            messe={messe}
            luoghi={luoghi}
            onOpenNewMass={handleOpenNewMass}
            onEditMass={handleEditMass}
            onDeleteMass={(m) => setMassToDelete(m)}
            isLoading={isDataLoading}
          />
        )}

        {activeTab === 'calendario' && (
          <CalendarView
            messe={messe}
            onOpenNewMassWithDate={handleOpenNewMassWithDate}
            onEditMass={handleEditMass}
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
    </div>
  );
}
