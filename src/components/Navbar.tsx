/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BookOpen,
  Calendar,
  BarChart3,
  MapPin,
  PlusCircle,
  Settings,
  HelpCircle,
  LogOut,
  Wifi,
  WifiOff,
  Plus,
} from 'lucide-react';
import { UserProfile, Impostazioni } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

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
  isDemo?: boolean;
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
  isDemo = false,
}) => {
  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-amber-900/40 backdrop-blur-md w-full max-w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left: Sacred Cross Logo & Title */}
            <div className="flex items-center space-x-2.5 sm:space-x-6 min-w-0">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-amber-600 via-amber-700 to-red-800 flex items-center justify-center shadow-md border border-amber-400/40 shrink-0">
                  <span className="text-amber-100 font-serif font-bold text-base sm:text-lg">☩</span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-xs sm:text-base font-serif font-bold tracking-wider text-amber-100 truncate">
                    REGISTRO DELLE MESSE
                  </h1>
                  {user && (
                    <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[140px] sm:max-w-[220px]">
                      {user.displayName || user.email || 'Sacerdote'}
                      {isDemo && <span className="text-amber-400 font-mono ml-1">(Demo)</span>}
                    </p>
                  )}
                </div>
              </div>

              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex space-x-1 lg:space-x-2">
                <button
                  onClick={() => setActiveTab('registro')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'registro'
                      ? 'bg-amber-950/80 text-amber-200 border border-amber-800/60 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Registro</span>
                </button>

                <button
                  onClick={() => setActiveTab('calendario')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'calendario'
                      ? 'bg-amber-950/80 text-amber-200 border border-amber-800/60 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Calendario</span>
                </button>

                <button
                  onClick={() => setActiveTab('statistiche')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'statistiche'
                      ? 'bg-amber-950/80 text-amber-200 border border-amber-800/60 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Statistiche</span>
                </button>

                <button
                  onClick={() => setActiveTab('luoghi')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'luoghi'
                      ? 'bg-amber-950/80 text-amber-200 border border-amber-800/60 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Luoghi</span>
                </button>
              </nav>
            </div>

            {/* Right Action buttons */}
            <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
              {/* Primary Action Button (Desktop only, on mobile it's in bottom bar) */}
              <button
                onClick={onOpenNewMass}
                className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-amber-50 px-3.5 py-2 rounded-lg font-medium text-sm shadow-md transition-all active:scale-95 border border-amber-400/30"
                title="Registra una nuova Messa celebrata"
              >
                <PlusCircle className="w-4 h-4 text-amber-200" />
                <span className="font-semibold tracking-wide">+ NUOVA MESSA</span>
              </button>

              {/* PWA Install Button */}
              <PWAInstallButton variant="compact" />

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
                className="p-1.5 sm:p-2 text-slate-300 hover:text-amber-200 hover:bg-slate-800/60 rounded-lg transition-colors"
                title="Guida e Istruzioni"
              >
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Settings Button */}
              <button
                onClick={onOpenSettings}
                className="p-1.5 sm:p-2 text-slate-300 hover:text-amber-200 hover:bg-slate-800/60 rounded-lg transition-colors relative"
                title="Impostazioni e Backup"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                {settings?.spreadsheetUrl && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                )}
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-red-300 hover:bg-slate-800/60 rounded-lg transition-colors"
                title="Esci dal Registro"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Natural thumb reach, zero horizontal scrolling) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-amber-900/50 backdrop-blur-lg px-2 py-1.5 pb-safe flex items-center justify-around shadow-2xl">
        {/* Tab 1: Registro */}
        <button
          onClick={() => setActiveTab('registro')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all ${
            activeTab === 'registro' ? 'text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Registro</span>
        </button>

        {/* Tab 2: Calendario */}
        <button
          onClick={() => setActiveTab('calendario')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all ${
            activeTab === 'calendario' ? 'text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Calendario</span>
        </button>

        {/* Central Prominent CTA: + Nuova Messa */}
        <button
          onClick={onOpenNewMass}
          className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-red-800 via-red-700 to-amber-600 shadow-xl border-2 border-amber-400/60 flex items-center justify-center text-amber-100 hover:scale-105 active:scale-95 transition-all"
          title="Nuova Messa"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Tab 3: Statistiche */}
        <button
          onClick={() => setActiveTab('statistiche')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all ${
            activeTab === 'statistiche' ? 'text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Statistiche</span>
        </button>

        {/* Tab 4: Luoghi */}
        <button
          onClick={() => setActiveTab('luoghi')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all ${
            activeTab === 'luoghi' ? 'text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Luoghi</span>
        </button>
      </nav>
    </>
  );
};
