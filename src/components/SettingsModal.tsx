/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Settings,
  User,
  FileSpreadsheet,
  Download,
  Upload,
  ExternalLink,
  ShieldAlert,
  Save,
  CheckCircle,
  AlertTriangle,
  Loader2,
  HardDrive,
} from 'lucide-react';
import { Impostazioni, Messa, Luogo, UserProfile } from '../types';
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  createBackupPackage,
  validateBackupFile,
  BackupPackage,
} from '../services/exportBackupService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Impostazioni | null;
  user: UserProfile | null;
  messe: Messa[];
  luoghi: Luogo[];
  onSaveDiocese: (diocesi: string) => Promise<void>;
  onRestoreBackup: (backup: BackupPackage) => Promise<void>;
  onResetArchive: () => Promise<void>;
  isDemo: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  user,
  messe,
  luoghi,
  onSaveDiocese,
  onRestoreBackup,
  onResetArchive,
  isDemo,
}) => {
  const [diocesi, setDiocesi] = useState<string>(settings?.diocesi || '');
  const [isSavingDiocese, setIsSavingDiocese] = useState<boolean>(false);
  const [dioceseSavedMsg, setDioceseSavedMsg] = useState<boolean>(false);

  // Restore state
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<BackupPackage | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreSuccess, setRestoreSuccess] = useState<boolean>(false);

  // Danger zone delete archive
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [confirmInput, setConfirmInput] = useState<string>('');
  const [isDeletingArchive, setIsDeletingArchive] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveDiocese = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingDiocese(true);
      await onSaveDiocese(diocesi.trim());
      setDioceseSavedMsg(true);
      setTimeout(() => setDioceseSavedMsg(false), 3000);
    } finally {
      setIsSavingDiocese(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError(null);
    setRestorePreview(null);
    setRestoreSuccess(false);

    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        const validated = validateBackupFile(raw);
        if (!validated.valid || !validated.pkg) {
          setRestoreError(validated.error || 'File di backup non valido.');
        } else {
          setRestorePreview(validated.pkg);
        }
      } catch (err: any) {
        setRestoreError('Il file non è un JSON valido: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!restorePreview) return;
    try {
      setIsRestoring(true);
      setRestoreError(null);
      await onRestoreBackup(restorePreview);
      setRestoreSuccess(true);
      setRestorePreview(null);
      setRestoreFile(null);
    } catch (err: any) {
      setRestoreError(err.message || 'Errore durante il ripristino del backup.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteArchive = async () => {
    if (confirmInput !== 'ELIMINA REGISTRO') return;
    try {
      setIsDeletingArchive(true);
      await onResetArchive();
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: any) {
      alert('Errore eliminazione archivio: ' + err.message);
    } finally {
      setIsDeletingArchive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-900/40 rounded-xl shadow-2xl w-full max-w-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60 rounded-t-xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-amber-900/50 border border-amber-500/40 flex items-center justify-center text-amber-200">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-amber-100 tracking-wide">
                Impostazioni e Backup Personale
              </h2>
              <p className="text-xs text-slate-400">
                Gestione profilo, foglio Google Drive ed esportazione dati
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Account Profile Card */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60 space-y-3">
            <h3 className="font-serif font-semibold text-amber-200 text-sm flex items-center space-x-2">
              <User className="w-4 h-4 text-amber-400" />
              <span>PROFILO SACERDOTE</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Nome e Cognome:</span>
                <span className="font-medium text-slate-100 font-serif">
                  {user?.displayName || settings?.nome ? `${settings?.nome} ${settings?.cognome}` : 'Sacerdote'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">Email Google Account:</span>
                <span className="font-mono text-slate-200 truncate block">
                  {user?.email || settings?.email || 'Non specificata'}
                </span>
              </div>
            </div>

            {/* Diocese form */}
            <form onSubmit={handleSaveDiocese} className="pt-2 border-t border-slate-700/50 flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
              <div className="flex-1">
                <label className="text-xs text-slate-300 block mb-1">Diocesi di appartenenza:</label>
                <input
                  type="text"
                  placeholder="es. Diocesi di Brescia, Diocesi di Milano..."
                  value={diocesi}
                  onChange={(e) => setDiocesi(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingDiocese}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-600/40 flex items-center justify-center space-x-1"
              >
                {isSavingDiocese ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Salva</span>
              </button>
            </form>
            {dioceseSavedMsg && (
              <span className="text-xs text-emerald-400 flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Diocesi aggiornata con successo!</span>
              </span>
            )}
          </div>

          {/* Google Drive Personal Archive Status */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60 space-y-3">
            <h3 className="font-serif font-semibold text-amber-200 text-sm flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>STATO ARCHIVIO PERSONALE</span>
            </h3>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Archivio Personale:</span>
                <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Attivo e configurato</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Posizione Dati:</span>
                <span className="text-slate-200">
                  {isDemo ? 'Memoria Locale (Demo)' : 'Google Drive dell\'Utente'}
                </span>
              </div>

              {settings?.spreadsheetUrl && !isDemo && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 font-mono text-[11px] truncate max-w-[200px]">
                    ID: {settings.spreadsheetId}
                  </span>
                  <a
                    href={settings.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-amber-400 hover:text-amber-300 font-medium underline"
                  >
                    <span>Apri Foglio in Google Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Data Export Section */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60 space-y-3">
            <h3 className="font-serif font-semibold text-amber-200 text-sm flex items-center space-x-2">
              <Download className="w-4 h-4 text-amber-400" />
              <span>ESPORTA I TUOI DATI</span>
            </h3>
            <p className="text-xs text-slate-400">
              Esporta il registro completo delle Messe e dei luoghi nel formato preferito:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => exportToCSV(messe)}
                className="flex items-center justify-center space-x-1.5 p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-semibold text-slate-200 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Esporta CSV (Excel)</span>
              </button>

              <button
                onClick={() => exportToExcel(messe, luoghi, settings)}
                className="flex items-center justify-center space-x-1.5 p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-semibold text-slate-200 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Esporta Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => exportToJSON({ messe, luoghi, settings })}
                className="flex items-center justify-center space-x-1.5 p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-semibold text-slate-200 transition-colors"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Esporta JSON</span>
              </button>
            </div>
          </div>

          {/* Backup & Restore Section */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60 space-y-3">
            <h3 className="font-serif font-semibold text-amber-200 text-sm flex items-center space-x-2">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>BACKUP E RIPRISTINO</span>
            </h3>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => createBackupPackage(messe, luoghi, settings, user?.email || undefined)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-slate-950 hover:bg-slate-900 border border-amber-600/40 text-amber-200 p-2.5 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Crea Backup Completo (.json)</span>
                </button>
              </div>

              {/* Restore selector */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2 text-xs">
                <span className="text-slate-300 font-medium block">Ripristina da file di backup:</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-950 file:text-amber-200 hover:file:bg-amber-900 cursor-pointer"
                />

                {restoreError && (
                  <div className="p-2 bg-red-950/70 border border-red-800 rounded text-red-200 text-xs">
                    {restoreError}
                  </div>
                )}

                {restoreSuccess && (
                  <div className="p-2 bg-emerald-950/70 border border-emerald-800 rounded text-emerald-200 text-xs flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Ripristino completato con successo! Le Messe sono state aggiornate.</span>
                  </div>
                )}

                {restorePreview && (
                  <div className="p-3 bg-slate-900 border border-amber-700/60 rounded space-y-2 mt-2">
                    <div className="text-amber-200 font-medium">Backup riconosciuto:</div>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-300 text-[11px]">
                      <li>Messe da ripristinare: <strong>{restorePreview.messe.length}</strong></li>
                      <li>Luoghi da ripristinare: <strong>{restorePreview.luoghi.length}</strong></li>
                      <li>Data creazione backup: {restorePreview.backupDate.split('T')[0]}</li>
                    </ul>

                    <button
                      onClick={handleExecuteRestore}
                      disabled={isRestoring}
                      className="w-full mt-2 bg-amber-700 hover:bg-amber-600 text-white font-semibold py-1.5 rounded text-xs transition-colors flex items-center justify-center space-x-1"
                    >
                      {isRestoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>Conferma e Ripristina Dati</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Danger Zone: Delete Archive */}
          <div className="bg-red-950/20 rounded-xl p-4 border border-red-900/50 space-y-3">
            <h3 className="font-serif font-semibold text-red-300 text-sm flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>ZONA DI SICUREZZA: ELIMINAZIONE ARCHIVIO</span>
            </h3>

            {!showDeleteConfirm ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <p className="text-slate-400">
                  Rimuove il file del registro personale creato dall'app. Non cancella l'account Google.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
                >
                  Elimina archivio...
                </button>
              </div>
            ) : (
              <div className="space-y-3 p-3 bg-red-950/60 rounded-lg border border-red-700 text-xs">
                <div className="flex items-start space-x-2 text-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Attenzione: operazione irreversibile!</strong>
                    <p className="text-slate-300 mt-0.5">
                      Ti consigliamo di{' '}
                      <button
                        type="button"
                        onClick={() => createBackupPackage(messe, luoghi, settings, user?.email || undefined)}
                        className="text-amber-300 underline font-semibold"
                      >
                        scaricare un backup
                      </button>{' '}
                      prima di procedere. Per confermare, digita: <span className="font-mono bg-black/60 px-1 py-0.5 rounded text-amber-200">ELIMINA REGISTRO</span>
                    </p>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Digita ELIMINA REGISTRO per confermare"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  className="w-full bg-slate-900 border border-red-600 rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                />

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setConfirmInput('');
                    }}
                    className="px-3 py-1 text-xs text-slate-300 hover:text-white"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleDeleteArchive}
                    disabled={confirmInput !== 'ELIMINA REGISTRO' || isDeletingArchive}
                    className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-semibold px-4 py-1 rounded text-xs"
                  >
                    {isDeletingArchive ? 'Eliminazione in corso...' : 'Elimina Definitivamente'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
