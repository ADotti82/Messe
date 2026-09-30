/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { X, Printer, Calendar, MapPin, Eye, FileText, Check, ChevronDown } from 'lucide-react';
import { Messa, Luogo, Impostazioni } from '../types';

interface SacristyPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  messe: Messa[];
  luoghi: Luogo[];
  settings: Impostazioni | null;
}

export const SacristyPrintModal: React.FC<SacristyPrintModalProps> = ({
  isOpen,
  onClose,
  messe,
  luoghi,
  settings,
}) => {
  const [periodo, setPeriodo] = useState<'settimana_corrente' | 'settimana_prossima' | 'mese_corrente' | 'personalizzato'>('settimana_corrente');
  const [luogoFiltro, setLuogoFiltro] = useState<string>('');
  const [mostraRichiedente, setMostraRichiedente] = useState<boolean>(true);
  const [mostraNote, setMostraNote] = useState<boolean>(false);
  const [dataInizio, setDataInizio] = useState<string>('');
  const [dataFine, setDataFine] = useState<string>('');

  // Date ranges computation
  const dateRange = useMemo(() => {
    const now = new Date();
    const day = now.getDay() || 7; // Monday = 1, Sunday = 7

    if (periodo === 'settimana_corrente') {
      const start = new Date(now);
      start.setDate(now.getDate() - day + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return {
        startStr: start.toISOString().split('T')[0],
        endStr: end.toISOString().split('T')[0],
      };
    }

    if (periodo === 'settimana_prossima') {
      const start = new Date(now);
      start.setDate(now.getDate() - day + 8);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return {
        startStr: start.toISOString().split('T')[0],
        endStr: end.toISOString().split('T')[0],
      };
    }

    if (periodo === 'mese_corrente') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        startStr: start.toISOString().split('T')[0],
        endStr: end.toISOString().split('T')[0],
      };
    }

    return {
      startStr: dataInizio || now.toISOString().split('T')[0],
      endStr: dataFine || now.toISOString().split('T')[0],
    };
  }, [periodo, dataInizio, dataFine]);

  // Filtered masses for print
  const printMesse = useMemo(() => {
    return messe
      .filter((m) => {
        if (m.data < dateRange.startStr || m.data > dateRange.endStr) return false;
        if (luogoFiltro && m.luogo.toLowerCase() !== luogoFiltro.toLowerCase()) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.data !== b.data) return a.data.localeCompare(b.data);
        return a.ora.localeCompare(b.ora);
      });
  }, [messe, dateRange, luogoFiltro]);

  if (!isOpen) return null;

  const formatDateHeader = (dStr: string) => {
    try {
      const [y, m, d] = dStr.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  const formatDayName = (dStr: string) => {
    try {
      const [y, m, d] = dStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const dayName = date.toLocaleDateString('it-IT', { weekday: 'long' });
      return dayName.charAt(0).toUpperCase() + dayName.slice(1);
    } catch {
      return '';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 print:p-0 print:bg-white print:static print:h-auto print:overflow-visible">
      {/* Container */}
      <div className="bg-slate-900 border border-amber-900/40 rounded-2xl shadow-2xl w-full max-w-4xl text-slate-100 flex flex-col max-h-[94vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Modal Header (hidden on print) */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70 print:hidden rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-900/60 border border-amber-500/40 flex items-center justify-center text-amber-200">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-amber-100">
                Foglio Intenzioni per la Sagrestia (Stampa / PDF)
              </h2>
              <p className="text-xs text-slate-400">
                Impaginazione sobria e chiara pronta per la stampa o l'esposizione sull'altare
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

        {/* Filter controls toolbar (hidden on print) */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 print:hidden flex flex-wrap items-center gap-3 text-xs">
          {/* Period selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Periodo:</span>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5"
            >
              <option value="settimana_corrente">Questa settimana</option>
              <option value="settimana_prossima">Prossima settimana</option>
              <option value="mese_corrente">Questo mese</option>
              <option value="personalizzato">Date personalizzate...</option>
            </select>
          </div>

          {/* Place filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Luogo:</span>
            <select
              value={luogoFiltro}
              onChange={(e) => setLuogoFiltro(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5"
            >
              <option value="">Tutti i luoghi / chiese</option>
              {luoghi.map((l) => (
                <option key={l.id} value={l.nome}>
                  {l.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Toggles */}
          <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={mostraRichiedente}
              onChange={(e) => setMostraRichiedente(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-amber-600 focus:ring-0"
            />
            <span>Mostra richiedente</span>
          </label>

          <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={mostraNote}
              onChange={(e) => setMostraNote(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-amber-600 focus:ring-0"
            />
            <span>Mostra note</span>
          </label>

          <div className="ml-auto">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-amber-50 px-4 py-2 rounded-lg font-semibold text-xs shadow-md transition-all active:scale-95 cursor-pointer border border-amber-400/40"
            >
              <Printer className="w-4 h-4 text-amber-200" />
              <span>STAMPA / SALVA PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Paper Preview (Visible on screen and styled on print) */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-900 print:bg-white print:p-0 print:m-0">
          <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-300 max-w-3xl mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none">
            {/* Church Top Header */}
            <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1">
              <div className="text-xl font-serif font-bold tracking-widest text-amber-900">
                ☩ INTENZIONI DELLE SANTE MESSE ☩
              </div>
              <div className="text-xs font-serif uppercase tracking-wider text-slate-600 font-semibold">
                {settings?.diocesi ? `Diocesi di ${settings.diocesi} • ` : ''}
                {settings?.nome ? `Registro di Don ${settings.nome} ${settings.cognome || ''}` : 'Registro Sacerdotale'}
              </div>
              <div className="text-sm font-serif font-bold text-slate-800 pt-1">
                Periodo: dal {formatDateHeader(dateRange.startStr)} al {formatDateHeader(dateRange.endStr)}
                {luogoFiltro && ` • Presso: ${luogoFiltro}`}
              </div>
            </div>

            {/* Masses List or Table */}
            {printMesse.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-serif italic">
                Nessuna Messa registrata nel periodo selezionato.
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-800 text-slate-700 font-serif uppercase text-[11px]">
                      <th className="py-2 px-1 w-[22%]">Giorno e Ora</th>
                      <th className="py-2 px-1 w-[20%]">Luogo & Liturgia</th>
                      <th className="py-2 px-1 w-[46%]">Intenzione di Suffragio / Preghiera</th>
                      <th className="py-2 px-1 w-[12%] text-center">Spunta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {printMesse.map((m) => (
                      <tr key={m.id} className="align-top hover:bg-slate-50">
                        {/* Date & Time */}
                        <td className="py-2.5 px-1 pr-2">
                          <div className="font-serif font-bold text-slate-900 text-xs">
                            {formatDayName(m.data)}
                          </div>
                          <div className="text-slate-600 text-[11px]">
                            {formatDateHeader(m.data)}
                          </div>
                          <div className="font-mono font-semibold text-amber-900 mt-0.5">
                            Ore {m.ora}
                          </div>
                        </td>

                        {/* Place & Celebration */}
                        <td className="py-2.5 px-1 pr-2">
                          <div className="font-semibold text-slate-800">
                            {m.luogo}
                          </div>
                          <div className="text-[11px] text-slate-600 italic mt-0.5">
                            {m.celebrazione}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            ({m.coloreLiturgico})
                          </div>
                        </td>

                        {/* Intention / Deceased / Requester */}
                        <td className="py-2.5 px-1 pr-2">
                          {m.tipoIntenzione === 'Per un defunto' ? (
                            <div>
                              <span className="font-serif font-bold text-slate-900 text-sm">
                                ✝ {m.nomeDefunto || 'Defunto'}
                              </span>
                              {m.intenzione && (
                                <p className="text-slate-700 italic text-[11px] mt-0.5">
                                  {m.intenzione}
                                </p>
                              )}
                            </div>
                          ) : m.tipoIntenzione && m.tipoIntenzione !== 'Nessuna' ? (
                            <div>
                              <span className="font-semibold text-slate-900">
                                {m.tipoIntenzione}:
                              </span>{' '}
                              <span className="text-slate-800">{m.intenzione || ''}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Messa senza intenzione particolare</span>
                          )}

                          {mostraRichiedente && m.richiedente && (
                            <div className="text-[10px] text-slate-600 font-medium mt-1">
                              Richiesta da: <span className="font-semibold text-slate-800">{m.richiedente}</span>
                            </div>
                          )}

                          {mostraNote && m.note && (
                            <div className="text-[10px] text-slate-500 italic mt-0.5">
                              Nota: {m.note}
                            </div>
                          )}
                        </td>

                        {/* Checkbox box for priest */}
                        <td className="py-2.5 px-1 text-center align-middle">
                          <div className="w-5 h-5 border-2 border-slate-400 rounded mx-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sacred Bottom Note */}
            <div className="mt-8 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500 font-serif italic">
              "Memento, Domine, famulorum famularumque tuarum... Requiem aeternam dona eis, Domine, et lux perpetua luceat eis."
            </div>
          </div>
        </div>

        {/* Modal Footer (hidden on print) */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 print:hidden flex items-center justify-between text-xs text-slate-400 rounded-b-2xl">
          <span>{printMesse.length} celebrazioni trovate</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              Chiudi
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
            >
              Stampa ora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
