/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Smartphone, Download, Share2, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'button' | 'banner' | 'compact';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'button',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already running standalone on home screen, hide
  if (isInstalled) {
    if (variant === 'compact') {
      return (
        <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
          <CheckCircle2 className="w-3 h-3" />
          <span>Installata</span>
        </span>
      );
    }
    return null;
  }

  // Handle click
  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Generic instructions modal for other browsers
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {variant === 'banner' ? (
        <div className={`bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-900 border border-amber-600/40 rounded-xl p-3 sm:p-4 text-slate-100 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-900/60 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-200 shadow-inner">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif font-bold text-sm sm:text-base text-amber-100">
                  Installa sul tuo Cellulare
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.2 rounded border border-amber-500/30">
                  App PWA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Accedi con un tocco dalla schermata iniziale del telefono come una vera app nativa.
              </p>
            </div>
          </div>

          <button
            onClick={handleClick}
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-red-800 hover:from-amber-500 hover:to-red-700 text-amber-50 px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-95 border border-amber-400/40 shrink-0 self-stretch sm:self-auto justify-center cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-200" />
            <span>{isIOS ? 'Istruzioni iPhone / iPad' : 'Installa Applicazione'}</span>
          </button>
        </div>
      ) : variant === 'compact' ? (
        <button
          onClick={handleClick}
          className={`flex items-center space-x-1.5 text-xs text-amber-300 bg-amber-950/50 hover:bg-amber-900/60 px-2.5 py-1.5 rounded-lg border border-amber-700/50 transition-colors cursor-pointer ${className}`}
          title="Installa l'app sul tuo telefono"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="font-medium">Installa App</span>
        </button>
      ) : (
        <button
          onClick={handleClick}
          className={`flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-amber-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-600/40 transition-all shadow-sm active:scale-95 cursor-pointer ${className}`}
          title="Installa l'app sul tuo telefono o PC"
        >
          <Smartphone className="w-4 h-4 text-amber-400" />
          <span>{isIOS ? 'Installa su iPhone' : 'Installa App'}</span>
        </button>
      )}

      {/* Guide Modal for iOS Safari / Generic installation */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-amber-900/50 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-900/60 border border-amber-500/40 flex items-center justify-center text-amber-200">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-amber-100 text-base">
                  {isIOS ? 'Come installare su iPhone / iPad' : 'Come installare l\'app'}
                </h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <p className="text-slate-400 text-xs">
                Per avere l'icona del <strong>Registro delle Messe</strong> sulla schermata iniziale del tuo telefono:
              </p>

              {isIOS ? (
                <ol className="space-y-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <li className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-900/70 border border-amber-600/50 text-amber-200 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <span>In Safari, tocca il pulsante </span>
                      <strong className="text-amber-200 inline-flex items-center space-x-1">
                        <Share2 className="w-3.5 h-3.5 inline mx-0.5" />
                        <span>Condividi</span>
                      </strong>
                      <span className="text-slate-400 block text-[11px] mt-0.5">
                        (la freccia che esce dal quadrato in basso o in alto)
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-900/70 border border-amber-600/50 text-amber-200 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <span>Scorri il menu e tocca </span>
                      <strong className="text-amber-200 inline-flex items-center space-x-1">
                        <PlusSquare className="w-3.5 h-3.5 inline mx-0.5" />
                        <span>Aggiungi alla schermata Home</span>
                      </strong>
                    </div>
                  </li>

                  <li className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-900/70 border border-amber-600/50 text-amber-200 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <span>Tocca </span>
                      <strong className="text-emerald-400">Aggiungi</strong>
                      <span> in alto a destra. L'app comparirà tra le tue applicazioni!</span>
                    </div>
                  </li>
                </ol>
              ) : (
                <ol className="space-y-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <li className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-900/70 border border-amber-600/50 text-amber-200 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Apri il menu del browser (i 3 puntini ⋮ in alto a destra in Chrome).</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-900/70 border border-amber-600/50 text-amber-200 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <span>Tocca <strong>"Installa app"</strong> o <strong>"Aggiungi a schermata Home"</strong>.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-900/70 border border-amber-600/50 text-amber-200 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <span>Conferma per installarla direttamente sul telefono.</span>
                  </li>
                </ol>
              )}
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}
    </>
  );
};
