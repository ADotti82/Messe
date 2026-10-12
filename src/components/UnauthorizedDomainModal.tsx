/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  X,
  ShieldAlert,
  ArrowRight,
  Globe,
  Key,
  HelpCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  getEffectiveOAuthClientId,
  setCustomOAuthClientId,
  getDefaultOAuthClientId,
  isCustomOAuthClientIdConfigured,
} from '../services/auth';

interface UnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain?: string;
  origin?: string;
  projectId?: string;
  onRetry: () => void;
  onDemoLogin: () => void;
  onGISLogin?: () => void;
  defaultTab?: 'gcp' | 'firebase' | 'custom_client';
}

export const UnauthorizedDomainModal: React.FC<UnauthorizedDomainModalProps> = ({
  isOpen,
  onClose,
  domain,
  origin,
  projectId = 'gen-lang-client-0301750648',
  onRetry,
  onDemoLogin,
  onGISLogin,
  defaultTab = 'gcp',
}) => {
  const [activeTab, setActiveTab] = useState<'gcp' | 'firebase' | 'custom_client'>(defaultTab);
  const [copiedOrigin, setCopiedOrigin] = useState<boolean>(false);
  const [copiedDomain, setCopiedDomain] = useState<boolean>(false);

  // Custom OAuth Client ID form
  const [customClientIdInput, setCustomClientIdInput] = useState<string>(getEffectiveOAuthClientId());
  const [customClientSaved, setCustomClientSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://messe-nine.vercel.app');
  const currentDomain = domain || (typeof window !== 'undefined' ? window.location.hostname : 'messe-nine.vercel.app');
  const effectiveClientId = getEffectiveOAuthClientId();
  const defaultClientId = getDefaultOAuthClientId();
  const isCustomized = isCustomOAuthClientIdConfigured();

  const gcpCredentialsUrl = `https://console.cloud.google.com/apis/credentials?project=${projectId}`;
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 3000);
  };

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(currentDomain);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 3000);
  };

  const handleSaveCustomClientId = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomOAuthClientId(customClientIdInput.trim() || null);
    setCustomClientSaved(true);
    setTimeout(() => setCustomClientSaved(false), 3000);
  };

  const handleResetDefaultClientId = () => {
    setCustomOAuthClientId(null);
    setCustomClientIdInput(defaultClientId);
    setCustomClientSaved(true);
    setTimeout(() => setCustomClientSaved(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-800/60 rounded-2xl shadow-2xl max-w-2xl w-full text-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-600/50 flex items-center justify-center text-amber-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-amber-100">
                Autorizzazione Dominio (Errore 400: origin_mismatch)
              </h2>
              <p className="text-xs text-slate-400">
                Guida per abilitare il dominio Vercel / PWA su Google Cloud e Firebase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('gcp')}
            className={`flex-1 py-3 px-3 font-semibold text-center border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'gcp'
                ? 'border-amber-400 text-amber-300 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>1. Google Cloud (Risolve 400 origin_mismatch)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('firebase')}
            className={`flex-1 py-3 px-3 font-semibold text-center border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'firebase'
                ? 'border-amber-400 text-amber-300 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>2. Firebase Console</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom_client')}
            className={`flex-1 py-3 px-3 font-semibold text-center border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'custom_client'
                ? 'border-amber-400 text-amber-300 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>3. Client ID Personalizzato</span>
          </button>
        </div>

        {/* Content body with scrolling */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs sm:text-sm">
          {/* TAB 1: Google Cloud Console */}
          {activeTab === 'gcp' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-amber-950/40 border border-amber-700/50 rounded-xl p-3.5 text-xs text-amber-200 leading-relaxed">
                <strong>Perché accade questo errore?</strong> Google OAuth blocca le richieste provenienti da domini non registrati nell'elenco delle <strong>Origini JavaScript autorizzate</strong> del Client ID. Per sbloccare l'accesso da Vercel, basta aggiungere il tuo URL in Google Cloud Console.
              </div>

              {/* Copy origin box */}
              <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">URI esatto da aggiungere:</span>
                  <span className="font-mono text-xs sm:text-sm font-semibold text-emerald-400 break-all">
                    {currentOrigin}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyOrigin}
                  className="shrink-0 ml-3 flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                >
                  {copiedOrigin ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copiato!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Copia URI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Steps */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                <h4 className="font-semibold text-amber-200 uppercase tracking-wider text-[11px]">
                  Passaggi su Google Cloud Console (tempo stimato: 1 minuto):
                </h4>
                <ol className="space-y-2 text-slate-300 list-decimal pl-4 leading-relaxed">
                  <li>
                    Apri Google Cloud Console cliccando sul pulsante sottostante (progetto: <span className="font-mono text-amber-300 font-semibold">{projectId}</span>).
                  </li>
                  <li>
                    Nella tabella <strong className="text-white">ID client OAuth 2.0</strong>, clicca sul tuo Client ID dell'applicazione web.
                  </li>
                  <li>
                    Scorri fino alla sezione <strong className="text-white">Origini JavaScript autorizzate</strong> (<em>Authorized JavaScript origins</em>).
                  </li>
                  <li>
                    Clicca su <strong className="text-white">+ Aggiungi URI</strong> e incolla: <span className="font-mono text-emerald-400 font-semibold">{currentOrigin}</span>.
                  </li>
                  <li>
                    Facoltativamente, puoi inserire lo stesso URI anche sotto <strong className="text-white">URI di reindirizzamento autorizzati</strong>.
                  </li>
                  <li>
                    Clicca su <strong className="text-white">Salva</strong> in fondo alla pagina.
                  </li>
                </ol>
                <div className="pt-2 text-[11px] text-slate-400 italic">
                  💡 <strong>Nota:</strong> Google impiega normalmente da 2 a 5 minuti per distribuire l'autorizzazione su tutti i propri server globali.
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-1">
                <a
                  href={gcpCredentialsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm cursor-pointer"
                >
                  <span>Apri Google Cloud Console - Credenziali</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                {onGISLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onGISLogin();
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3 rounded-lg border border-slate-700 transition-colors text-xs flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>⚡ Riprova accesso rapido</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Firebase Console */}
          {activeTab === 'firebase' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                Firebase Authentication richiede che il dominio senza protocollo (<span className="font-mono text-emerald-300 font-semibold">{currentDomain}</span>) sia inserito nei <strong>Domini autorizzati</strong> per consentire il login popup di Google.
              </div>

              {/* Copy domain box */}
              <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Nome host da aggiungere:</span>
                  <span className="font-mono text-xs sm:text-sm font-semibold text-emerald-400 break-all">
                    {currentDomain}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="shrink-0 ml-3 flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                >
                  {copiedDomain ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copiato!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Copia Dominio</span>
                    </>
                  )}
                </button>
              </div>

              {/* Steps */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <h4 className="font-semibold text-amber-200 uppercase tracking-wider text-[11px]">
                  Passaggi su Firebase Console:
                </h4>
                <ol className="space-y-2 text-slate-300 list-decimal pl-4 leading-relaxed">
                  <li>
                    Apri Firebase Console cliccando sul pulsante qui sotto.
                  </li>
                  <li>
                    Vai nella sezione <strong className="text-white">Authentication</strong> &gt; scheda <strong className="text-white">Impostazioni (Settings)</strong> &gt; <strong className="text-white">Domini autorizzati</strong>.
                  </li>
                  <li>
                    Clicca su <strong className="text-white">Aggiungi dominio</strong> e incolla: <span className="font-mono text-emerald-300 font-semibold">{currentDomain}</span>.
                  </li>
                  <li>
                    Salva le modifiche.
                  </li>
                </ol>
              </div>

              {/* Direct Link */}
              <div className="pt-1">
                <a
                  href={firebaseSettingsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 px-4 rounded-xl border border-slate-700 transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm cursor-pointer"
                >
                  <span>Apri Firebase Console (Impostazioni Domini)</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: Custom OAuth Client ID */}
          {activeTab === 'custom_client' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                Se hai già configurato un tuo progetto Google Cloud separato o desideri usare un Client ID con i tuoi domini Vercel già approvati, puoi inserirlo qui sotto. L'applicazione lo userà immediatamente per tutte le chiamate Google Workspace e Calendar.
              </div>

              <form onSubmit={handleSaveCustomClientId} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block">
                    ID Client OAuth 2.0 Google:
                  </label>
                  <input
                    type="text"
                    value={customClientIdInput}
                    onChange={(e) => setCustomClientIdInput(e.target.value)}
                    placeholder="es. 123456789-abcdef.apps.googleusercontent.com"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500 block">
                    Attualmente in uso: {isCustomized ? 'Client ID Personalizzato' : 'Client ID Predefinito del Sistema'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleResetDefaultClientId}
                    className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 py-1.5 px-2.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ripristina Client ID Predefinito</span>
                  </button>

                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold px-4 py-1.5 rounded-lg text-xs shadow transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    {customClientSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Salvato!</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5" />
                        <span>Salva e Applica</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDemoLogin();
            }}
            className="text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
          >
            Nel frattempo, prova in modalità locale (Demo)
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Chiudi
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRetry();
              }}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg text-xs transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <span>Riprova Accesso</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
