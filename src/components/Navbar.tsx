/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BookOpen,
  PlusCircle,
  Calendar,
  BarChart3,
  MapPin,
  Settings,
  LogOut,
  HelpCircle,
  Wifi,
  WifiOff,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile, Impostazioni } from '../types';

interface NavbarProps {
  activeTab: 'registro' | 'calendario' | 'statistiche' | 'luoghi';
  setActiveTab: (tab: 'registro' | 'calendario' | 'statistiche' | 'luoghi') => void;
  onOpenNewMass: () => void;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  onLogout: () => void;
  user: UserProfile | null;
  settings: Impostazioni | null;
  isOnline: boolean;
  isDemo: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewMass,
  onOpenSettings,
  onOpenGuide,
  onLogout,
  user,
  settings,
  isOnline,
  isDemo,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-amber-900/40 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-red-800 flex items-center justify-center shadow-inner border border-amber-500/30">
              <span className="text-xl font-bold font-serif text-amber-100 tracking-wider">☩</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif font-bold text-lg sm:text-xl tracking-wide text-amber-50">
                  REGISTRO DELLE MESSE
                </span>
                {isDemo && (
                  <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded border border-amber-500/40 font-mono">
                    Locale Demo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Archivio personale riservato del Sacerdote
              </p>
            </div>
          </div>

          {/* Center Navigation for Desktop */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setActiveTab('registro')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'registro'
                  ? 'bg-amber-950/80 text-amber-200 border border-amber-800/60 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Registro</span>
            </button>

            <button
              onClick={() => setActiveTab('calendario')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'calendario'
                  ? 'bg-amber-950/80 text-amber-200 border border-amber-800/60 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendario</span>
            </button>

            <button
              onClick={() => setActiveTab('statistiche')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'statistiche'
                  ? 'bg-amber-950/80 text-amber-200 border border-amber-800/60 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistiche</span>
            </button>

            <button
              onClick={() => setActiveTab('luoghi')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'luoghi'
                  ? 'bg-amber-950/80 text-amber-200 border border-amber-800/60 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Luoghi</span>
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Primary Action Button: + NUOVA MESSA */}
            <button
              onClick={onOpenNewMass}
              className="flex items-center space-x-2 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-amber-50 px-3.5 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all active:scale-95 border border-amber-400/30"
              title="Registra una nuova Messa celebrata"
            >
              <PlusCircle className="w-4 h-4 text-amber-200" />
              <span className="font-semibold tracking-wide">+ NUOVA MESSA</span>
            </button>

            {/* Online / Offline status badge */}
            <div
              className={`hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono border ${
                isOnline
                  ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40'
                  : 'bg-red-950/50 text-red-300 border-red-800/40'
              }`}
              title={isOnline ? 'Connessione attiva' : 'Modalità non in linea'}
            >
              {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-red-400" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Guide Button */}
            <button
              onClick={onOpenGuide}
              className="p-2 text-slate-300 hover:text-amber-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="Guida e Istruzioni"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-300 hover:text-amber-200 hover:bg-slate-800 rounded-lg transition-colors relative"
              title="Impostazioni e Backup"
            >
              <Settings className="w-5 h-5" />
              {settings?.spreadsheetUrl && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-colors"
              title="Esci dal Registro"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden flex border-t border-slate-800 bg-slate-900/95 backdrop-blur px-2 py-1 justify-around text-xs">
        <button
          onClick={() => setActiveTab('registro')}
          className={`flex flex-col items-center py-1 px-3 rounded ${
            activeTab === 'registro' ? 'text-amber-300 font-semibold' : 'text-slate-400'
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          <span>Registro</span>
        </button>

        <button
          onClick={() => setActiveTab('calendario')}
          className={`flex flex-col items-center py-1 px-3 rounded ${
            activeTab === 'calendario' ? 'text-amber-300 font-semibold' : 'text-slate-400'
          }`}
        >
          <Calendar className="w-4 h-4 mb-0.5" />
          <span>Calendario</span>
        </button>

        <button
          onClick={() => setActiveTab('statistiche')}
          className={`flex flex-col items-center py-1 px-3 rounded ${
            activeTab === 'statistiche' ? 'text-amber-300 font-semibold' : 'text-slate-400'
          }`}
        >
          <BarChart3 className="w-4 h-4 mb-0.5" />
          <span>Statistiche</span>
        </button>

        <button
          onClick={() => setActiveTab('luoghi')}
          className={`flex flex-col items-center py-1 px-3 rounded ${
            activeTab === 'luoghi' ? 'text-amber-300 font-semibold' : 'text-slate-400'
          }`}
        >
          <MapPin className="w-4 h-4 mb-0.5" />
          <span>Luoghi</span>
        </button>
      </div>
    </header>
  );
};
