/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, LogOut, AlertCircle } from 'lucide-react';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onRenew: () => Promise<void>;
  onLogout: () => void;
  userEmail?: string | null;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen,
  onRenew,
  onLogout,
  userEmail,
}) => {
  const [isRenewing, setIsRenewing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRenewClick = async () => {
    try {
      setIsRenewing(true);
      setErrorMessage(null);
      await onRenew();
    } catch (err: any) {
      console.warn('Errore rinnovo credenziali:', err);
      setErrorMessage(
        err?.message || 'Accesso non completato. Riprova o chiudi e riapri la finestra di Google.'
      );
    } finally {
      setIsRenewing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-600/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center relative overflow-hidden">
        {/* Decorative ambient glow */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-amber-600/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600/30 to-red-800/30 border border-amber-500/50 flex items-center justify-center mx-auto text-amber-300 shadow-md">
          <ShieldAlert className="w-7 h-7" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="text-xl font-serif font-bold text-amber-100 tracking-wide">
            Sessione Google da Rinnovare
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Per proteggere la sicurezza del tuo account, le credenziali temporanee di accesso a Google Drive e Google Calendar scadono dopo un'ora.
          </p>
          {userEmail && (
            <p className="text-xs text-amber-400/90 font-mono bg-slate-950/80 py-1 px-2.5 rounded-lg border border-slate-800 inline-block">
              {userEmail}
            </p>
          )}
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-950/80 border border-red-700/80 rounded-xl text-xs text-red-200 text-left flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleRenewClick}
            disabled={isRenewing}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-lg shadow-amber-900/40 border border-amber-400/40 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isRenewing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-200" />
                <span>Rinnovo in corso...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-amber-200" />
                <span>Rinnova sessione Google con 1 clic</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onLogout}
            disabled={isRenewing}
            className="w-full py-2 px-3 text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnetti o torna alla schermata iniziale</span>
          </button>
        </div>
      </div>
    </div>
  );
};
