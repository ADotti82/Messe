/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Clock,
  MapPin,
  Sparkles,
  Calendar as CalendarIcon,
  X,
} from 'lucide-react';
import { Messa, CelebrazioneLiturgica, ColoreLiturgico } from '../types';
import { fetchLiturgicalCelebration } from '../services/liturgyService';

interface CalendarViewProps {
  messe: Messa[];
  onOpenNewMassWithDate: (dateStr: string) => void;
  onEditMass: (messa: Messa) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  messe,
  onOpenNewMassWithDate,
  onEditMass,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dayLiturgy, setDayLiturgy] = useState<CelebrazioneLiturgica | null>(null);
  const [isLiturgyLoading, setIsLiturgyLoading] = useState<boolean>(false);
  const [monthLiturgyCache, setMonthLiturgyCache] = useState<Record<string, CelebrazioneLiturgica>>({});

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDayStr(today.toISOString().split('T')[0]);
  };

  // Group masses by date string (YYYY-MM-DD)
  const massesByDate = useMemo(() => {
    const map = new Map<string, Messa[]>();
    for (const m of messe) {
      const list = map.get(m.data) || [];
      list.push(m);
      map.set(m.data, list);
    }
    return map;
  }, [messe]);

  // Compute calendar grid days
  const daysInMonth = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Monday as start of week: 0 is Sun -> 6, 1 is Mon -> 0
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const totalDays = lastDayOfMonth.getDate();
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Preceding padding days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(currentYear, currentMonth - 1, d);
      const str = prevDate.toISOString().split('T')[0];
      days.push({ dateStr: str, dayNum: d, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const curDate = new Date(currentYear, currentMonth, d);
      const str = curDate.toISOString().split('T')[0];
      days.push({ dateStr: str, dayNum: d, isCurrentMonth: true });
    }

    // Trailing padding days to complete full 7-day rows
    const remaining = 42 - days.length; // 6 rows of 7
    if (remaining > 0 && remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextDate = new Date(currentYear, currentMonth + 1, d);
        const str = nextDate.toISOString().split('T')[0];
        days.push({ dateStr: str, dayNum: d, isCurrentMonth: false });
      }
    }

    return days;
  }, [currentYear, currentMonth]);

  // Load liturgy for selected day
  useEffect(() => {
    let isCancelled = false;
    async function load() {
      setIsLiturgyLoading(true);
      try {
        const lit = await fetchLiturgicalCelebration(selectedDayStr);
        if (!isCancelled) {
          setDayLiturgy(lit);
        }
      } catch (err) {
        console.warn('Error loading day liturgy:', err);
      } finally {
        if (!isCancelled) setIsLiturgyLoading(false);
      }
    }
    load();
    return () => {
      isCancelled = true;
    };
  }, [selectedDayStr]);

  // Pre-fetch some liturgy colors for current month in background
  useEffect(() => {
    let isMounted = true;
    async function fetchMonthPreview() {
      const targetDays = daysInMonth.filter((d) => d.isCurrentMonth && d.dayNum % 2 === 1);
      for (const d of targetDays.slice(0, 10)) {
        if (!monthLiturgyCache[d.dateStr]) {
          try {
            const lit = await fetchLiturgicalCelebration(d.dateStr);
            if (isMounted) {
              setMonthLiturgyCache((prev) => ({ ...prev, [d.dateStr]: lit }));
            }
          } catch {
            // ignore
          }
        }
      }
    }
    fetchMonthPreview();
    return () => {
      isMounted = false;
    };
  }, [daysInMonth]);

  const monthName = currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  const selectedMasses = massesByDate.get(selectedDayStr) || [];
  const todayStr = new Date().toISOString().split('T')[0];

  const getColorDot = (color?: string) => {
    const c = (color || '').toLowerCase();
    if (c.includes('bianco')) return 'bg-amber-100 border border-amber-400';
    if (c.includes('rosso')) return 'bg-red-600';
    if (c.includes('viola')) return 'bg-purple-600';
    if (c.includes('rosa')) return 'bg-pink-500';
    if (c.includes('nero')) return 'bg-slate-700';
    return 'bg-emerald-600';
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-amber-400" />
          <h2 className="text-base sm:text-lg font-serif font-bold text-amber-100 capitalize">
            {monthName}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleToday}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 font-medium transition-colors"
          >
            Oggi
          </button>
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Mese precedente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Mese successivo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Grid (2 Cols on lg) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-serif text-xs font-semibold text-amber-300/80 mb-2">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mer</div>
            <div>Gio</div>
            <div>Ven</div>
            <div>Sab</div>
            <div className="text-red-400">Dom</div>
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {daysInMonth.map((day) => {
              const dayMasses = massesByDate.get(day.dateStr) || [];
              const isSelected = selectedDayStr === day.dateStr;
              const isToday = todayStr === day.dateStr;
              const cachedLit = monthLiturgyCache[day.dateStr];

              return (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedDayStr(day.dateStr)}
                  className={`min-h-[48px] sm:min-h-[72px] p-1 sm:p-1.5 rounded-lg border flex flex-col justify-between text-left transition-all relative overflow-hidden ${
                    isSelected
                      ? 'bg-amber-950/70 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                      : day.isCurrentMonth
                      ? 'bg-slate-950/70 border-slate-800/80 hover:border-slate-600 text-slate-200'
                      : 'bg-slate-950/20 border-slate-900 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-[11px] sm:text-xs font-mono font-medium rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shrink-0 ${
                        isToday
                          ? 'bg-red-700 text-white font-bold'
                          : isSelected
                          ? 'text-amber-200 font-bold'
                          : 'text-slate-300'
                      }`}
                    >
                      {day.dayNum}
                    </span>

                    {/* Liturgical color small dot if cached */}
                    {cachedLit && (
                      <span
                        className={`w-2 h-2 rounded-full ${getColorDot(cachedLit.colore)}`}
                        title={`${cachedLit.titolo} (${cachedLit.colore})`}
                      />
                    )}
                  </div>

                  {/* Mass count badge on this day */}
                  <div className="mt-1 flex items-center justify-between">
                    {dayMasses.length > 0 ? (
                      <span className="text-[10px] bg-red-900/80 border border-red-700/80 text-amber-100 font-semibold px-1.5 py-0.5 rounded-full flex items-center space-x-0.5">
                        <span className="font-serif">☩</span>
                        <span>{dayMasses.length}</span>
                      </span>
                    ) : (
                      <span />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Inspector Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Day Title */}
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-amber-400 font-mono">
                  Giorno Selezionato
                </span>
                <h3 className="text-base font-serif font-bold text-slate-100 capitalize">
                  {new Date(selectedDayStr + 'T12:00:00').toLocaleDateString('it-IT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
              </div>
            </div>

            {/* Liturgical celebration of selected day */}
            <div className="bg-slate-950/80 rounded-lg p-3.5 border border-slate-800/80 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs text-amber-300/90 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>CELEBRAZIONE LITURGICA</span>
              </div>

              {isLiturgyLoading ? (
                <div className="py-2 text-xs text-slate-400 animate-pulse">
                  Caricamento celebrazione liturgica...
                </div>
              ) : dayLiturgy ? (
                <div className="space-y-1.5">
                  <div className="font-serif font-semibold text-amber-100 text-sm leading-snug">
                    {dayLiturgy.titolo}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                    {dayLiturgy.grado && (
                      <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px]">
                        {dayLiturgy.grado}
                      </span>
                    )}
                    <span className="text-slate-300 font-medium flex items-center space-x-1">
                      <span className={`w-2.5 h-2.5 rounded-full inline-block ${getColorDot(dayLiturgy.colore)}`} />
                      <span>{dayLiturgy.colore}</span>
                    </span>
                    {dayLiturgy.tempoLiturgico && (
                      <span className="text-[11px] text-slate-400">• {dayLiturgy.tempoLiturgico}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400">Celebrazione non disponibile.</div>
              )}
            </div>

            {/* Masses celebrated on selected day */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>MESSE CELEBRATE ({selectedMasses.length})</span>
              </div>

              {selectedMasses.length === 0 ? (
                <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800/60 text-center text-xs text-slate-400">
                  Nessuna Messa registrata per questa data.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedMasses.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => onEditMass(m)}
                      className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 hover:border-amber-700/60 transition-colors cursor-pointer text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-amber-200 font-mono flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{m.ora}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-serif truncate max-w-[150px]">
                          {m.luogo}
                        </span>
                      </div>
                      {m.tipoIntenzione && m.tipoIntenzione !== 'Nessuna' && (
                        <div className="text-[11px] text-purple-200 flex items-center space-x-1">
                          <span>{m.tipoIntenzione === 'Per un defunto' ? '✝️' : '🙏'}</span>
                          <span className="truncate">
                            {m.nomeDefunto || m.intenzione || m.tipoIntenzione}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Add Mass for this Day */}
          <button
            onClick={() => onOpenNewMassWithDate(selectedDayStr)}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-amber-50 px-4 py-2.5 rounded-lg font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-95 border border-amber-400/30"
          >
            <PlusCircle className="w-4 h-4 text-amber-200" />
            <span>+ Registra Messa per questo giorno</span>
          </button>
        </div>
      </div>
    </div>
  );
};
