/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Calendar, PlusCircle, User, Bell, Clock, MapPin, Heart } from 'lucide-react';
import { AnniversarioItem } from '../services/anniversariesService';

interface AnniversariesModalProps {
  isOpen: boolean;
  onClose: () => void;
  anniversari: AnniversarioItem[];
  onScheduleMass: (defunto: string, dataSuggerita: string, luogo?: string, richiedente?: string) => void;
}

export const AnniversariesModal: React.FC<AnniversariesModalProps> = ({
  isOpen,
  onClose,
  anniversari,
  onScheduleMass,
}) => {
  if (!isOpen) return null;

  const formatDateIt = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return dateStr;
    }
  };

  const getBadgeStyle = (item: AnniversarioItem) => {
    if (item.giorniMancanti === 0) {
      return 'bg-red-900/80 text-amber-200 border-red-600 animate-pulse';
    }
    if (item.giorniMancanti > 0 && item.giorniMancanti <= 7) {
      return 'bg-amber-950/80 text-amber-300 border-amber-600';
    }
    if (item.giorniMancanti < 0) {
      return 'bg-slate-800 text-slate-400 border-slate-700';
    }
    return 'bg-purple-950/70 text-purple-300 border-purple-800';
  };

  const getDaysLabel = (giorni: number) => {
    if (giorni === 0) return 'OGGI';
    if (giorni === 1) return 'Domani';
    if (giorni === -1) return 'Ieri';
    if (giorni < 0) return `${Math.abs(giorni)} giorni fa`;
    return `Tra ${giorni} giorni`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-amber-900/50 light:border-slate-300 rounded-2xl shadow-2xl w-full max-w-xl text-slate-100 light:text-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 light:border-slate-200 bg-slate-950/70 light:bg-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-900/60 light:bg-purple-100 border border-purple-500/40 flex items-center justify-center text-purple-300 light:text-purple-700">
              <span className="font-serif font-bold text-lg">✝️</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-amber-100 light:text-slate-900 tracking-wide">
                Trigesimi e Anniversari dei Defunti
              </h2>
              <p className="text-xs text-slate-400 light:text-slate-600">
                Promemoria per la preghiera di suffragio e celebrazioni
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white light:hover:text-slate-900 rounded-lg hover:bg-slate-800 light:hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {anniversari.length === 0 ? (
            <div className="py-12 text-center text-slate-400 light:text-slate-500 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-800 light:bg-slate-200 flex items-center justify-center mx-auto text-xl font-serif">
                ✝
              </div>
              <p className="text-sm font-medium">Nessun trigesimo o anniversario nei prossimi 35 giorni.</p>
              <p className="text-xs text-slate-500 light:text-slate-400">
                Il sistema calcola automaticamente le ricorrenze basandosi sui defunti registrati nelle tue Messe.
              </p>
            </div>
          ) : (
            anniversari.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950/70 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-xl p-3.5 sm:p-4 hover:border-amber-700/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border ${getBadgeStyle(
                        item
                      )}`}
                    >
                      {getDaysLabel(item.giorniMancanti)}
                    </span>

                    <span className="text-xs text-slate-400 light:text-slate-500">
                      Ricorre il: <strong className="text-slate-200 light:text-slate-700">{formatDateIt(item.dataRicorrenza)}</strong>
                    </span>

                    <span className="text-[11px] text-purple-300 light:text-purple-700 font-medium">
                      {item.tipoRicorrenza === 'trigesimo'
                        ? '30° giorno (Trigesimo)'
                        : `${item.anniTrascorsi}° Anniversario`}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-sm sm:text-base text-amber-200 light:text-amber-900 truncate">
                    {item.nomeDefunto}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 light:text-slate-500">
                    {item.luogoAbituale && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        <span className="truncate max-w-[150px]">{item.luogoAbituale}</span>
                      </span>
                    )}

                    {item.richiedente && (
                      <span className="flex items-center space-x-1 text-slate-300 light:text-slate-600">
                        <User className="w-3 h-3 text-blue-400" />
                        <span>Richiesta da: {item.richiedente}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => {
                    onScheduleMass(
                      item.nomeDefunto,
                      item.dataRicorrenza,
                      item.luogoAbituale,
                      item.richiedente
                    );
                    onClose();
                  }}
                  className="flex items-center justify-center space-x-1.5 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-amber-50 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Programma Messa</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 light:border-slate-200 bg-slate-950/60 light:bg-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>{anniversari.length} ricorrenze trovate</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 light:bg-slate-200 light:hover:bg-slate-300 text-slate-200 light:text-slate-800 rounded-lg text-xs font-medium transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
