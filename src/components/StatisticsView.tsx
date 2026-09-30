/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  MapPin,
  Heart,
  TrendingUp,
  PieChart,
  Church,
} from 'lucide-react';
import { Messa, Luogo } from '../types';

interface StatisticsViewProps {
  messe: Messa[];
  luoghi: Luogo[];
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ messe, luoghi }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Statistics calculations
  const stats = useMemo(() => {
    let countTotal = messe.length;
    let countThisMonth = 0;
    let countThisYear = 0;
    let countDefunti = 0;
    let countWithIntention = 0;
    let countNoIntention = 0;

    const placesMap = new Map<string, number>();
    const monthDistribution = new Array(12).fill(0); // 0 to 11
    const weekdayDistribution = [0, 0, 0, 0, 0, 0, 0]; // 0=Sun, 1=Mon, ..., 6=Sat
    const colorsMap = new Map<string, number>();

    for (const m of messe) {
      const [y, mo, d] = m.data.split('-').map(Number);
      const dateObj = new Date(y, mo - 1, d);

      if (y === currentYear) {
        countThisYear++;
        if (mo >= 1 && mo <= 12) {
          monthDistribution[mo - 1]++;
        }
      }

      if (y === currentYear && mo === currentMonth) {
        countThisMonth++;
      }

      // Intentions
      if (m.tipoIntenzione === 'Per un defunto') {
        countDefunti++;
        countWithIntention++;
      } else if (m.tipoIntenzione && m.tipoIntenzione !== 'Nessuna') {
        countWithIntention++;
      } else {
        countNoIntention++;
      }

      // Places
      const placeName = m.luogo.trim() || 'Non specificato';
      placesMap.set(placeName, (placesMap.get(placeName) || 0) + 1);

      // Weekday
      const dayIndex = dateObj.getDay(); // 0 is Sun
      weekdayDistribution[dayIndex]++;

      // Colors
      const color = m.coloreLiturgico || 'Verde';
      colorsMap.set(color, (colorsMap.get(color) || 0) + 1);

      // Offerings
    }

    // Top places sorted
    const topPlaces = Array.from(placesMap.entries())
      .map(([nome, count]) => ({ nome, count }))
      .sort((a, b) => b.count - a.count);

    return {
      countTotal,
      countThisMonth,
      countThisYear,
      countDefunti,
      countWithIntention,
      countNoIntention,
      topPlaces,
      monthDistribution,
      weekdayDistribution,
      colorsDistribution: Array.from(colorsMap.entries()).map(([colore, count]) => ({
        colore,
        count,
      })),
    };
  }, [messe, currentYear, currentMonth]);

  const monthNames = [
    'Gen',
    'Feb',
    'Mar',
    'Apr',
    'Mag',
    'Giu',
    'Lug',
    'Ago',
    'Set',
    'Ott',
    'Nov',
    'Dic',
  ];

  const weekdayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

  const maxMonthCount = Math.max(...stats.monthDistribution, 1);
  const maxWeekdayCount = Math.max(...stats.weekdayDistribution, 1);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-serif font-bold text-amber-100 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <span>STATISTICHE PERSONALI</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Riepilogo riservato delle Messe celebrate nel tuo registro
          </p>
        </div>
        <span className="text-xs font-mono text-amber-300 bg-amber-950/60 border border-amber-800/40 px-2.5 py-1 rounded-full">
          Anno {currentYear}
        </span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Masses */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium">TOTALE MESSE</span>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-200">
            {stats.countTotal}
          </div>
          <p className="text-[11px] text-slate-500">dall'inizio del registro</p>
        </div>

        {/* This Year */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium">NEL {currentYear}</span>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-200">
            {stats.countThisYear}
          </div>
          <p className="text-[11px] text-slate-500">Messe nell'anno solare</p>
        </div>

        {/* This Month */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium">QUESTO MESE</span>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-200">
            {stats.countThisMonth}
          </div>
          <p className="text-[11px] text-slate-500">
            nel mese corrente ({monthNames[currentMonth - 1]})
          </p>
        </div>

        {/* Deceased Masses */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-1">
          <span className="text-xs text-slate-400 font-medium">PER DEFUNTI ✝️</span>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-300">
            {stats.countDefunti}
          </div>
          <p className="text-[11px] text-slate-500">
            {stats.countTotal > 0
              ? `${Math.round((stats.countDefunti / stats.countTotal) * 100)}% del totale`
              : '0%'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Trend Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-serif font-bold text-slate-200 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>ANDAMENTO MENSILE ({currentYear})</span>
            </h3>
            <span className="text-xs text-slate-500">Messe per mese</span>
          </div>

          <div className="grid grid-cols-12 gap-1 sm:gap-2 h-40 items-end pt-4 pb-2 border-b border-slate-800">
            {stats.monthDistribution.map((count, idx) => {
              const heightPercent = maxMonthCount > 0 ? (count / maxMonthCount) * 100 : 0;
              const isCurrent = idx === currentMonth - 1;

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end group">
                  <span className="text-[10px] text-amber-200/90 font-mono mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {count}
                  </span>
                  <div className="w-full bg-slate-950 rounded-t h-full flex items-end overflow-hidden p-0.5">
                    <div
                      style={{ height: `${Math.max(heightPercent, count > 0 ? 10 : 0)}%` }}
                      className={`w-full rounded-t transition-all duration-300 ${
                        isCurrent
                          ? 'bg-gradient-to-t from-red-800 to-amber-500'
                          : count > 0
                          ? 'bg-amber-700/80 hover:bg-amber-600'
                          : 'bg-slate-800/40'
                      }`}
                      title={`${monthNames[idx]}: ${count} Messe`}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-mono mt-1 ${
                      isCurrent ? 'text-amber-400 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {monthNames[idx]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekday Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-serif font-bold text-slate-200 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>DISTRIBUZIONE PER GIORNO DELLA SETTIMANA</span>
            </h3>
          </div>

          <div className="space-y-2 pt-1">
            {weekdayNames.map((name, idx) => {
              const count = stats.weekdayDistribution[idx];
              const pct = maxWeekdayCount > 0 ? (count / maxWeekdayCount) * 100 : 0;
              const isSunday = idx === 0;

              return (
                <div key={name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${isSunday ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                      {name}
                    </span>
                    <span className="font-mono text-slate-400">
                      {count} <span className="text-slate-600 text-[10px]">Messe</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isSunday
                          ? 'bg-gradient-to-r from-red-800 to-red-500'
                          : 'bg-gradient-to-r from-amber-800 to-amber-600'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Places Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-serif font-bold text-slate-200 flex items-center space-x-2">
          <Church className="w-4 h-4 text-amber-400" />
          <span>MESSE PER LUOGO DI CELEBRAZIONE</span>
        </h3>

        {stats.topPlaces.length === 0 ? (
          <p className="text-xs text-slate-500">Nessun luogo registrato ancora.</p>
        ) : (
          <div className="space-y-2.5">
            {stats.topPlaces.slice(0, 8).map((p) => {
              const pct = stats.countTotal > 0 ? Math.round((p.count / stats.countTotal) * 100) : 0;

              return (
                <div key={p.nome} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200 flex items-center space-x-1.5 truncate max-w-[70%]">
                      <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate">{p.nome}</span>
                    </span>
                    <span className="font-mono text-amber-200/90 text-right">
                      {p.count} <span className="text-slate-500 text-[10px]">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-amber-700 to-amber-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
