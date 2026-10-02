/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Globe,
  ExternalLink,
  Copy,
  Check,
  X,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface UnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: string;
  projectId: string;
  onRetry: () => void;
  onDemoLogin: () => void;
  onGISLogin?: () => void;
}

export const UnauthorizedDomainModal: React.FC<UnauthorizedDomainModalProps> = ({
  isOpen,
  onClose,
  domain,
  projectId,
  onRetry,
  onDemoLogin,
  onGISLogin,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentDomain = domain || window.location.hostname;
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;
  const gcpCredentialsUrl = `https://console.cloud.google.com/apis/credentials?project=${projectId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-800/60 rounded-2xl shadow-2xl max-w-xl w-full text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-600/50 flex items-center justify-center text-amber-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-amber-100">
                Autorizzazione Dominio Richiesta
              </h2>
              <p className="text-xs text-slate-400">
                Configurazione di sicurezza per Vercel / domini personalizzati
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

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
          <p className="text-slate-300 leading-relaxed">
            L'applicazione è stata avviata o pubblicata su{' '}
            <strong className="text-amber-200 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
              {currentDomain}
            </strong>
            . Per motivi di sicurezza, Google e Firebase bloccano l'accesso OAuth fino a quando questo dominio non viene aggiunto ai domini autorizzati del tuo progetto cloud.
          </p>

          {/* Copy domain box */}
          <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Dominio da autorizzare:</span>
              <span className="font-mono text-sm font-semibold text-emerald-400">{currentDomain}</span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copiato!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copia dominio</span>
                </>
              )}
            </button>
          </div>

          {/* Simple 3 steps */}
          <div className="space-y-2.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs">
            <h4 className="font-semibold text-amber-200 uppercase tracking-wider text-[11px]">
              Come autorizzare in 1 minuto (operazione da fare una sola volta):
            </h4>

            <ol className="space-y-2 text-slate-300 list-decimal pl-4">
              <li>
                Clicca sul pulsante in basso per aprire la console Firebase del tuo progetto (
                <span className="font-mono text-amber-300">{projectId}</span>).
              </li>
              <li>
                Nella scheda <strong className="text-white">Authorized domains (Domini autorizzati)</strong>, clicca su{' '}
                <strong className="text-white">Aggiungi dominio</strong> (o <em>Add domain</em>).
              </li>
              <li>
                Incolla <span className="font-mono text-emerald-300">{currentDomain}</span> e clicca su{' '}
                <strong className="text-white">Aggiungi / Salva</strong>.
              </li>
              <li>
                Ritorna su questa pagina e clicca su <strong className="text-white">Riprova Accesso con Google</strong>.
              </li>
            </ol>
          </div>

          {/* Direct CTA links */}
          <div className="pt-1 space-y-2.5">
            {onGISLogin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGISLogin();
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm cursor-pointer"
              >
                <span>⚡ Accedi subito con Google Identity (Senza attendere Firebase)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <a
              href={firebaseSettingsUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 px-4 rounded-xl border border-slate-700 transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm"
            >
              <span>Apri Console Firebase (Aggiungi dominio autorizzato)</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            onClick={() => {
              onClose();
              onDemoLogin();
            }}
            className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
          >
            Nel frattempo, prova in modalità locale (Demo)
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              Chiudi
            </button>
            <button
              onClick={() => {
                onClose();
                onRetry();
              }}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg text-xs transition-colors flex items-center space-x-1"
            >
              <span>2. Riprova Accesso</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
