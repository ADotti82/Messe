/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, FileSpreadsheet, HardDrive, ShieldCheck, Loader2, Check } from 'lucide-react';
import { UserProfile } from '../types';

interface ArchiveSetupModalProps {
  user: UserProfile;
  onCreateArchive: (diocesi: string) => Promise<void>;
  isDemo: boolean;
}

export const ArchiveSetupModal: React.FC<ArchiveSetupModalProps> = ({
  user,
  onCreateArchive,
  isDemo,
}) => {
  const [diocesi, setDiocesi] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fullName = user.displayName || user.email?.split('@')[0] || 'Sacerdote';

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      setErrorMsg(null);
      await onCreateArchive(diocesi.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore durante la creazione del registro.');
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-900/50 rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 text-slate-100 text-center space-y-6 animate-in zoom-in-95 duration-200">
        {/* Sacred Cross Header */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-red-800 flex items-center justify-center shadow-lg border border-amber-400/40 mx-auto">
          <span className="text-3xl font-serif text-amber-100 font-bold">☩</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-50 tracking-wide">
            Benvenuto nel Registro delle Messe
          </h2>
          <p className="text-slate-300 text-sm">
            Gentile <strong className="text-amber-200 font-serif">{fullName}</strong>, creiamo ora il tuo archivio personale riservato.
          </p>
        </div>

        {/* Feature summary cards */}
        <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 text-left space-y-2.5 text-xs text-slate-300">
          <div className="flex items-start space-x-2">
            <HardDrive className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-100">Archivio Personale in Google Drive:</strong>
              <p className="text-slate-400 mt-0.5">
                Verrà creato il file <span className="font-mono text-amber-300">Registro Messe - {fullName}</span> con i fogli <span className="italic">Messe, Luoghi, Impostazioni</span>.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-100">Privacy e Riservatezza Assoluta:</strong>
              <p className="text-slate-400 mt-0.5">
                I dati rimangono esclusivamente nel tuo spazio Google. Nessun database centrale condiviso e nessun invio a terze parti.
              </p>
            </div>
          </div>
        </div>

        {/* Diocese Input */}
        <div className="text-left space-y-1">
          <label className="text-xs text-amber-300/90 font-medium block">
            Diocesi di appartenenza (opzionale):
          </label>
          <input
            type="text"
            placeholder="es. Diocesi di Brescia, Diocesi di Roma..."
            value={diocesi}
            onChange={(e) => setDiocesi(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-700 rounded-lg text-xs text-red-200 text-left">
            {errorMsg}
          </div>
        )}

        {/* Main CTA */}
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="w-full bg-gradient-to-r from-red-800 via-red-700 to-amber-700 hover:from-red-700 hover:to-amber-600 text-amber-50 font-serif font-bold text-base py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-98 disabled:opacity-50 border border-amber-400/40 flex items-center justify-center space-x-2"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Creazione del tuo Google Sheet in corso...</span>
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-5 h-5 text-amber-200" />
              <span>CREA IL MIO REGISTRO</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
