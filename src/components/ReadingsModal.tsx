/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, BookOpen, Calendar, Loader2, Copy, Check, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { fetchLettureDelGiorno, LettureDelGiorno } from '../services/readingsService';

interface ReadingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string; // YYYY-MM-DD
}

export const ReadingsModal: React.FC<ReadingsModalProps> = ({
  isOpen,
  onClose,
  initialDate,
}) => {
  const [currentDate, setCurrentDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [data, setData] = useState<LettureDelGiorno | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (initialDate) {
      setCurrentDate(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchLettureDelGiorno(currentDate)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => {
        if (isMounted) setError('Impossibile caricare le letture per la data selezionata.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentDate]);

  if (!isOpen) return null;

  const formatDateLabel = (dStr: string) => {
    try {
      const [y, m, d] = dStr.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleCopy = () => {
    if (!data) return;
    navigator.clipboard.writeText(
      `${data.titoloLiturgico}\n\n` +
        data.letture.map((l) => `${l.titolo}\n${l.riferimento}\n\n${l.testo}`).join('\n\n---\n\n')
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTextClass = () => {
    if (fontSize === 'large') return 'text-base sm:text-lg leading-relaxed';
    if (fontSize === 'xlarge') return 'text-lg sm:text-xl leading-loose';
    return 'text-sm sm:text-base leading-relaxed';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-900/50 rounded-2xl shadow-2xl w-full max-w-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-200 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-serif font-bold text-amber-100 truncate">
                Letture della Messa del Giorno
              </h2>
              <p className="text-xs text-slate-400 capitalize truncate">
                {formatDateLabel(currentDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Font size buttons */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-1 rounded ${fontSize === 'normal' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                title="Carattere Normale"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-1 rounded text-sm ${fontSize === 'large' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                title="Carattere Grande"
              >
                A+
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                className={`px-2 py-1 rounded text-base ${fontSize === 'xlarge' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                title="Carattere Molto Grande (per l'altare)"
              >
                A++
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-amber-200 rounded-lg hover:bg-slate-800 transition-colors"
              title="Copia testi delle letture"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date Selector Navigation Bar */}
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs">
          <button
            onClick={handlePrevDay}
            className="flex items-center space-x-1 text-slate-300 hover:text-amber-200 px-2.5 py-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Giorno prec.</span>
          </button>

          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2.5 py-1 font-mono text-xs focus:ring-1 focus:ring-amber-500"
            />
            <button
              onClick={() => setCurrentDate(new Date().toISOString().split('T')[0])}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded font-medium text-xs transition-colors"
            >
              Oggi
            </button>
          </div>

          <button
            onClick={handleNextDay}
            className="flex items-center space-x-1 text-slate-300 hover:text-amber-200 px-2.5 py-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <span>Giorno succ.</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {isLoading && (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
              <p className="text-sm font-medium">Caricamento delle letture della Messa in corso...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="py-12 text-center text-red-400 space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800 flex items-center justify-center mx-auto text-xl">
                ✕
              </div>
              <p className="text-sm font-semibold">{error}</p>
              <button
                onClick={() => setCurrentDate((prev) => prev)}
                className="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs"
              >
                Riprova
              </button>
            </div>
          )}

          {data && !isLoading && (
            <div className="space-y-6 font-serif">
              {/* Liturgical Title */}
              <div className="text-center pb-4 border-b border-amber-900/30">
                <span className="text-xs uppercase tracking-widest text-amber-400/90 font-sans font-semibold">
                  Liturgia della Parola
                </span>
                <h3 className="text-base sm:text-lg font-bold text-amber-100 mt-1">
                  {data.titoloLiturgico}
                </h3>
              </div>

              {/* Structured readings */}
              {data.letture.length > 0 ? (
                data.letture.map((lettura, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="font-sans font-bold text-xs uppercase tracking-wider text-amber-300">
                        {lettura.titolo}
                      </span>
                      {lettura.tipo === 'vangelo' && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-200 font-sans font-semibold">
                          ✝ Vangelo
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-slate-300 italic font-sans">
                      {lettura.riferimento}
                    </div>

                    <div className={`text-slate-200 font-serif whitespace-pre-line ${getTextClass()}`}>
                      {lettura.testo}
                    </div>
                  </div>
                ))
              ) : (
                /* Fallback if parsing was plain text */
                <div className={`p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 whitespace-pre-line font-serif ${getTextClass()}`}>
                  {data.testoCompleto}
                </div>
              )}

              {/* Sacred Footer formula */}
              <div className="pt-2 text-center text-xs font-sans text-slate-500 italic">
                Fonte: Liturgia della Parola secondo il Calendario Generale CEI
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>{data ? 'Letture caricate' : ''}</span>
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
