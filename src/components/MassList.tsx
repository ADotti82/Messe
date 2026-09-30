/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  Heart,
  PlusCircle,
  FileSpreadsheet,
  ChevronDown,
  X,
  FileText,
  Printer,
  User,
  BookOpen,
} from 'lucide-react';
import { Messa, Luogo, FiltriRegistro, FiltroTemporale } from '../types';

interface MassListProps {
  messe: Messa[];
  luoghi: Luogo[];
  onOpenNewMass: () => void;
  onEditMass: (messa: Messa) => void;
  onDeleteMass: (messa: Messa) => void;
  isLoading: boolean;
  onOpenSacristyPrint?: () => void;
  onOpenAnniversaries?: () => void;
  anniversariCount?: number;
  onOpenReadings?: (dateStr?: string) => void;
}

export const MassList: React.FC<MassListProps> = ({
  messe,
  luoghi,
  onOpenNewMass,
  onEditMass,
  onDeleteMass,
  isLoading,
  onOpenSacristyPrint,
  onOpenAnniversaries,
  anniversariCount = 0,
  onOpenReadings,
}) => {
  // Search & Filter state
  const [filtri, setFiltri] = useState<FiltriRegistro>({
    ricercaTesto: '',
    periodo: 'tutto',
    soloDefunti: false,
    soloConIntenzione: false,
    luogo: '',
  });

  const [showFiltersModal, setShowFiltersModal] = useState<boolean>(false);

  // Format date helper in Italian (e.g. "29 settembre 2026")
  const formatDateIt = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Liturgical color ribbon and border helper
  const getColorStyle = (colore: string) => {
    const c = (colore || '').toLowerCase();
    if (c.includes('bianco')) {
      return {
        badge: 'bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-400',
        ribbon: 'bg-amber-300 border-amber-400',
        border: 'border-l-amber-300',
      };
    }
    if (c.includes('rosso')) {
      return {
        badge: 'bg-red-950 text-red-200 border-red-700',
        ribbon: 'bg-red-600',
        border: 'border-l-red-600',
      };
    }
    if (c.includes('viola')) {
      return {
        badge: 'bg-purple-950 text-purple-200 border-purple-700',
        ribbon: 'bg-purple-600',
        border: 'border-l-purple-600',
      };
    }
    if (c.includes('rosa')) {
      return {
        badge: 'bg-pink-950 text-pink-200 border-pink-700',
        ribbon: 'bg-pink-500',
        border: 'border-l-pink-500',
      };
    }
    if (c.includes('nero')) {
      return {
        badge: 'bg-slate-950 text-slate-300 border-slate-700',
        ribbon: 'bg-slate-700',
        border: 'border-l-slate-700',
      };
    }
    return {
      badge: 'bg-emerald-950 text-emerald-200 border-emerald-700',
      ribbon: 'bg-emerald-600',
      border: 'border-l-emerald-600',
    };
  };

  // Filtered Masses
  const filteredMesse = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return messe.filter((m) => {
      // 1. Free-text search
      if (filtri.ricercaTesto.trim()) {
        const query = filtri.ricercaTesto.toLowerCase().trim();
        const matches =
          m.luogo.toLowerCase().includes(query) ||
          m.celebrazione.toLowerCase().includes(query) ||
          m.data.includes(query) ||
          (m.nomeDefunto && m.nomeDefunto.toLowerCase().includes(query)) ||
          (m.intenzione && m.intenzione.toLowerCase().includes(query)) ||
          (m.richiedente && m.richiedente.toLowerCase().includes(query)) ||
          (m.note && m.note.toLowerCase().includes(query)) ||
          (m.indirizzo && m.indirizzo.toLowerCase().includes(query));

        if (!matches) return false;
      }

      // 2. Specific Place Filter
      if (filtri.luogo && m.luogo.toLowerCase() !== filtri.luogo.toLowerCase()) {
        return false;
      }

      // 3. Deceased only
      if (filtri.soloDefunti && m.tipoIntenzione !== 'Per un defunto') {
        return false;
      }

      // 4. Any Intention only
      if (filtri.soloConIntenzione && m.tipoIntenzione === 'Nessuna') {
        return false;
      }

      // 5. Time period filter
      if (filtri.periodo === 'oggi') {
        return m.data === todayStr;
      }

      if (filtri.periodo === 'settimana') {
        const d = new Date(m.data);
        const startOfWeek = new Date(now);
        const day = now.getDay() || 7;
        startOfWeek.setDate(now.getDate() - day + 1); // Monday
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return d >= startOfWeek && d <= endOfWeek;
      }

      if (filtri.periodo === 'questo_mese') {
        const [y, mo] = m.data.split('-').map(Number);
        return y === now.getFullYear() && mo === now.getMonth() + 1;
      }

      if (filtri.periodo === 'mese_precedente') {
        const [y, mo] = m.data.split('-').map(Number);
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return y === prevMonthDate.getFullYear() && mo === prevMonthDate.getMonth() + 1;
      }

      if (filtri.periodo === 'anno_corrente') {
        const [y] = m.data.split('-').map(Number);
        return y === now.getFullYear();
      }

      if (filtri.periodo === 'personalizzato') {
        if (filtri.dataInizio && m.data < filtri.dataInizio) return false;
        if (filtri.dataFine && m.data > filtri.dataFine) return false;
      }

      return true;
    });
  }, [messe, filtri]);

  return (
    <div className="space-y-4">
      {/* Quick Action Tools Bar: Sacristy Print & Anniversaries Promemoria */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2.5 sm:p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {onOpenSacristyPrint && (
            <button
              onClick={onOpenSacristyPrint}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-amber-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-600/30 transition-all shadow-xs cursor-pointer active:scale-95"
              title="Stampa foglio intenzioni per la sagrestia o l'altare"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Foglio Sagrestia (Stampa/PDF)</span>
            </button>
          )}

          {onOpenAnniversaries && (
            <button
              onClick={onOpenAnniversaries}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-purple-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-purple-600/30 transition-all shadow-xs cursor-pointer active:scale-95"
              title="Consulta trigesimi e anniversari dei defunti"
            >
              <span>✝️</span>
              <span>Trigesimi & Anniversari</span>
              {anniversariCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-800 text-white font-mono text-[10px] font-bold">
                  {anniversariCount}
                </span>
              )}
            </button>
          )}

          {onOpenReadings && (
            <button
              onClick={() => onOpenReadings()}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-amber-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-600/30 transition-all shadow-xs cursor-pointer active:scale-95"
              title="Leggi le letture della Messa del giorno (CEI)"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Letture del Giorno</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cerca per data, luogo, celebrazione, defunto, intenzione, note..."
              value={filtri.ricercaTesto}
              onChange={(e) => setFiltri({ ...filtri, ricercaTesto: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {filtri.ricercaTesto && (
              <button
                onClick={() => setFiltri({ ...filtri, ricercaTesto: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center space-x-1.5 w-full sm:w-auto">
            <select
              value={filtri.periodo}
              onChange={(e) => setFiltri({ ...filtri, periodo: e.target.value as FiltroTemporale })}
              className="flex-1 sm:flex-none bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="tutto">Tutto il registro</option>
              <option value="oggi">Oggi</option>
              <option value="settimana">Questa settimana</option>
              <option value="questo_mese">Questo mese</option>
              <option value="mese_precedente">Mese precedente</option>
              <option value="anno_corrente">Anno corrente</option>
              <option value="personalizzato">Intervallo personalizzato...</option>
            </select>

            <button
              onClick={() => setShowFiltersModal(!showFiltersModal)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
                filtri.luogo || filtri.soloDefunti || filtri.soloConIntenzione || filtri.periodo === 'personalizzato'
                  ? 'bg-amber-950/70 border-amber-500/70 text-amber-200'
                  : 'bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtri</span>
              {(filtri.luogo || filtri.soloDefunti || filtri.soloConIntenzione) && (
                <span className="w-2 h-2 rounded-full bg-amber-400 ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Extended Filter Panel (collapsible) */}
        {showFiltersModal && (
          <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150">
            {/* Location selector */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Filtra per Luogo:</label>
              <select
                value={filtri.luogo}
                onChange={(e) => setFiltri({ ...filtri, luogo: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="">Tutti i luoghi</option>
                {luoghi.map((l) => (
                  <option key={l.id} value={l.nome}>
                    {l.nome} ({l.numeroUtilizzi})
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Dates if period is personalizzato */}
            {filtri.periodo === 'personalizzato' && (
              <div className="flex space-x-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Da data:</label>
                  <input
                    type="date"
                    value={filtri.dataInizio || ''}
                    onChange={(e) => setFiltri({ ...filtri, dataInizio: e.target.value })}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">A data:</label>
                  <input
                    type="date"
                    value={filtri.dataFine || ''}
                    onChange={(e) => setFiltri({ ...filtri, dataFine: e.target.value })}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                  />
                </div>
              </div>
            )}

            {/* Checkboxes */}
            <div className="flex flex-col justify-center space-y-1.5 sm:col-span-1">
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtri.soloDefunti}
                  onChange={(e) => setFiltri({ ...filtri, soloDefunti: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-amber-600 focus:ring-amber-500"
                />
                <span>✝️ Solo Messe per defunti</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtri.soloConIntenzione}
                  onChange={(e) => setFiltri({ ...filtri, soloConIntenzione: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-amber-600 focus:ring-amber-500"
                />
                <span>🙏 Solo Messe con intenzione</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Counter summary */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <div>
          <span>Messe registrate: </span>
          <strong className="text-amber-200 font-mono font-semibold">{filteredMesse.length}</strong>
          {filteredMesse.length !== messe.length && (
            <span className="text-slate-500 ml-1">(di {messe.length} totali)</span>
          )}
        </div>

        {(filtri.ricercaTesto || filtri.periodo !== 'tutto' || filtri.luogo || filtri.soloDefunti || filtri.soloConIntenzione) && (
          <button
            onClick={() =>
              setFiltri({
                ricercaTesto: '',
                periodo: 'tutto',
                soloDefunti: false,
                soloConIntenzione: false,
                luogo: '',
              })
            }
            className="text-amber-400 hover:text-amber-300 underline font-medium"
          >
            Azzera filtri
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm">Caricamento delle Messe dal tuo Google Sheet...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredMesse.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-amber-300 text-2xl font-serif">
            ☩
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100">
              {messe.length === 0 ? 'Nessuna Messa registrata' : 'Nessuna Messa trovata con i filtri correnti'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              {messe.length === 0
                ? 'Inizia ora a registrare le tue celebrazioni. I dati rimarranno nel tuo Google Drive personale.'
                : 'Prova a modificare i parametri di ricerca o i filtri temporali.'}
            </p>
          </div>

          <button
            onClick={onOpenNewMass}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-amber-50 px-5 py-2.5 rounded-lg font-semibold text-sm shadow-md transition-all border border-amber-400/30"
          >
            <PlusCircle className="w-4 h-4 text-amber-200" />
            <span>+ REGISTRA LA PRIMA MESSA</span>
          </button>
        </div>
      )}

      {/* Mass Cards List */}
      {!isLoading && filteredMesse.length > 0 && (
        <div className="space-y-3">
          {filteredMesse.map((m) => {
            const colStyle = getColorStyle(m.coloreLiturgico);

            return (
              <div
                key={m.id}
                className={`bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 sm:p-5 transition-all shadow-sm border-l-4 ${colStyle.border} relative group`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left Column: Date, Celebration, Location */}
                  <div className="space-y-2 flex-1">
                    {/* Header: Date & Time in noble church styling */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-serif font-bold text-sm sm:text-base text-amber-100">
                        {formatDateIt(m.data)}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="inline-flex items-center space-x-1 text-xs font-mono font-medium text-amber-300/90 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{m.ora}</span>
                      </span>

                      {/* Liturgical Color badge */}
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${colStyle.badge}`}>
                        {m.coloreLiturgico}
                      </span>
                    </div>

                    {/* Celebration name */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-100 font-serif leading-snug">
                        {m.celebrazione}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        {m.grado && <span className="text-slate-300 font-medium">{m.grado}</span>}
                        {m.tempoLiturgico && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span>{m.tempoLiturgico}</span>
                          </>
                        )}
                        {m.settimanaLiturgica && <span>(sett. {m.settimanaLiturgica})</span>}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start space-x-1.5 text-xs text-amber-200/90">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-200">{m.luogo}</span>
                        {m.indirizzo && <span className="text-slate-400 ml-1">({m.indirizzo})</span>}
                      </div>
                    </div>

                    {/* Intention Card */}
                    {m.tipoIntenzione && m.tipoIntenzione !== 'Nessuna' && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-start space-x-2 text-xs">
                        <span className="text-sm shrink-0">
                          {m.tipoIntenzione === 'Per un defunto' ? '✝️' : '🙏'}
                        </span>
                        <div>
                          {m.tipoIntenzione === 'Per un defunto' ? (
                            <div>
                              <span className="font-semibold text-purple-200">Intenzione per il defunto: </span>
                              <strong className="text-amber-100 font-serif text-sm">
                                {m.nomeDefunto || 'Defunto'}
                              </strong>
                            </div>
                          ) : (
                            <div>
                              <span className="font-semibold text-amber-200">{m.tipoIntenzione}: </span>
                              <span className="text-slate-300">{m.intenzione || ''}</span>
                            </div>
                          )}
                          {m.intenzione && m.tipoIntenzione === 'Per un defunto' && (
                            <p className="text-slate-400 mt-0.5 italic">{m.intenzione}</p>
                          )}

                          {m.richiedente && (
                            <div className="flex items-center space-x-1.5 text-xs text-slate-300 mt-1.5 pt-1.5 border-t border-slate-800">
                              <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span>Richiesta da: <strong className="text-amber-200">{m.richiedente}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes if any */}
                    {m.note && (
                      <div className="text-xs text-slate-400 flex items-start space-x-1.5 mt-1 bg-slate-950/30 p-2 rounded border border-slate-800/40">
                        <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <p className="italic text-slate-300">{m.note}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions (Edit & Delete) */}
                  <div className="flex sm:flex-col items-center justify-end space-x-1.5 sm:space-x-0 sm:space-y-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                    <button
                      onClick={() => onEditMass(m)}
                      className="flex items-center space-x-1 text-xs text-slate-300 hover:text-amber-200 bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1.5 rounded-md transition-colors border border-slate-700/60"
                      title="Modifica Messa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Modifica</span>
                    </button>

                    <button
                      onClick={() => onDeleteMass(m)}
                      className="flex items-center space-x-1 text-xs text-slate-400 hover:text-red-300 bg-slate-800/60 hover:bg-red-950/40 hover:border-red-800/60 px-2.5 py-1.5 rounded-md transition-colors border border-slate-700/60"
                      title="Elimina registrazione"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Elimina</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
