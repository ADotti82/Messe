/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Clock,
  Calendar,
  Sparkles,
  Edit2,
  Check,
  User,
  Heart,
  FileText,
  AlertCircle,
  Loader2,
  BookmarkCheck,
  BookOpen,
} from 'lucide-react';
import {
  Messa,
  Luogo,
  CelebrazioneLiturgica,
  TipoIntenzione,
  FonteCalendario,
  ColoreLiturgico,
} from '../types';
import { fetchLiturgicalCelebration } from '../services/liturgyService';
import { detectLocationAndResolvePlace } from '../services/gpsService';

interface MassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (massData: Omit<Messa, 'id' | 'creatoIl' | 'modificatoIl'>, editId?: string) => Promise<void>;
  editingMass?: Messa | null;
  initialDate?: string;
  frequentPlaces: Luogo[];
  onOpenReadings?: (dateStr: string) => void;
}

const INTENTIONS_LIST: { id: TipoIntenzione; label: string; icon: string }[] = [
  { id: 'Nessuna', label: 'Nessuna intenzione', icon: '🕊️' },
  { id: 'Per un defunto', label: 'Per un defunto', icon: '✝️' },
  { id: 'Per una persona', label: 'Per una persona', icon: '👤' },
  { id: 'Per una famiglia', label: 'Per una famiglia', icon: '👨‍👩‍👧‍👦' },
  { id: 'Per più persone', label: 'Per più persone', icon: '👥' },
  { id: 'Ringraziamento', label: 'Ringraziamento', icon: '🙏' },
  { id: 'Per una necessità', label: 'Per una necessità', icon: '🕯️' },
  { id: 'Altra', label: 'Altra intenzione', icon: '✨' },
];

export const MassFormModal: React.FC<MassFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMass,
  initialDate,
  frequentPlaces,
  onOpenReadings,
}) => {
  // Format helpers
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getCurrentTimeStr = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Form states
  const [data, setData] = useState<string>(getTodayStr());
  const [ora, setOra] = useState<string>(getCurrentTimeStr());
  const [luogo, setLuogo] = useState<string>('');
  const [indirizzo, setIndirizzo] = useState<string>('');
  const [latitudine, setLatitudine] = useState<number | null>(null);
  const [longitudine, setLongitudine] = useState<number | null>(null);

  // Liturgy states
  const [celebrazione, setCelebrazione] = useState<string>('');
  const [grado, setGrado] = useState<string>('');
  const [tempoLiturgico, setTempoLiturgico] = useState<string>('');
  const [settimanaLiturgica, setSettimanaLiturgica] = useState<string | number>('');
  const [coloreLiturgico, setColoreLiturgico] = useState<ColoreLiturgico | string>('Verde');
  const [fonteCalendario, setFonteCalendario] = useState<FonteCalendario>('CalAPI');
  const [isEditingLiturgy, setIsEditingLiturgy] = useState<boolean>(false);
  const [isLoadingLiturgy, setIsLoadingLiturgy] = useState<boolean>(false);

  // Intention states
  const [tipoIntenzione, setTipoIntenzione] = useState<TipoIntenzione>('Nessuna');
  const [intenzione, setIntenzione] = useState<string>('');
  const [nomeDefunto, setNomeDefunto] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [richiedente, setRichiedente] = useState<string>('');
  const [dataMorte, setDataMorte] = useState<string>('');
  const [offerta, setOfferta] = useState<string>('');
  const [offertaLibera, setOffertaLibera] = useState<boolean>(false);
  const [showStipendDetails, setShowStipendDetails] = useState<boolean>(false);

  // UI status
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form when opened or editing
  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage(null);
    setGpsMessage(null);
    setIsEditingLiturgy(false);

    if (editingMass) {
      setData(editingMass.data);
      setOra(editingMass.ora);
      setLuogo(editingMass.luogo);
      setIndirizzo(editingMass.indirizzo || '');
      setLatitudine(editingMass.latitudine);
      setLongitudine(editingMass.longitudine);
      setCelebrazione(editingMass.celebrazione);
      setGrado(editingMass.grado);
      setTempoLiturgico(editingMass.tempoLiturgico);
      setSettimanaLiturgica(editingMass.settimanaLiturgica);
      setColoreLiturgico(editingMass.coloreLiturgico);
      setFonteCalendario(editingMass.fonteCalendario);
      setTipoIntenzione(editingMass.tipoIntenzione);
      setIntenzione(editingMass.intenzione || '');
      setNomeDefunto(editingMass.nomeDefunto || '');
      setNote(editingMass.note || '');
      setRichiedente(editingMass.richiedente || '');
      setDataMorte(editingMass.dataMorte || '');
      setOfferta(editingMass.offerta !== undefined && editingMass.offerta !== null ? String(editingMass.offerta) : '');
      setOffertaLibera(Boolean(editingMass.offertaLibera));
      setShowStipendDetails(Boolean((editingMass.offerta !== undefined && editingMass.offerta !== null && editingMass.offerta !== 0) || editingMass.offertaLibera));
    } else {
      const targetDate = initialDate || getTodayStr();
      setData(targetDate);
      setOra(getCurrentTimeStr());
      // Prefill with top frequent place if available and no place is typed
      if (frequentPlaces && frequentPlaces.length > 0) {
        setLuogo(frequentPlaces[0].nome);
        setIndirizzo(frequentPlaces[0].indirizzo || '');
        setLatitudine(frequentPlaces[0].latitudine);
        setLongitudine(frequentPlaces[0].longitudine);
      } else {
        setLuogo('');
        setIndirizzo('');
        setLatitudine(null);
        setLongitudine(null);
      }
      setTipoIntenzione('Nessuna');
      setIntenzione('');
      setNomeDefunto('');
      setNote('');
      setRichiedente('');
      setDataMorte('');
      setOfferta('');
      setOffertaLibera(false);
      setShowStipendDetails(false);

      // Load liturgical day for the selected date
      loadLiturgyForDate(targetDate);
    }
  }, [isOpen, editingMass, initialDate]);

  // Load liturgy when date changes (if not editing an existing record that already has manual celebration)
  const loadLiturgyForDate = async (dateStr: string) => {
    setIsLoadingLiturgy(true);
    try {
      const lit = await fetchLiturgicalCelebration(dateStr);
      setCelebrazione(lit.titolo);
      setGrado(lit.grado);
      setTempoLiturgico(lit.tempoLiturgico);
      setSettimanaLiturgica(lit.settimanaLiturgica);
      setColoreLiturgico(lit.colore);
      setFonteCalendario(lit.fonte);
    } catch (e) {
      console.warn('Liturgy fetch failed:', e);
      setFonteCalendario('Archivio locale');
    } finally {
      setIsLoadingLiturgy(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    setData(newDate);
    if (!editingMass || editingMass.fonteCalendario !== 'Manuale') {
      loadLiturgyForDate(newDate);
    }
  };

  const handleSetCurrentTime = () => {
    setOra(getCurrentTimeStr());
  };

  // GPS detection handler
  const handleDetectGPS = async () => {
    setIsGpsLoading(true);
    setGpsMessage(null);
    try {
      const result = await detectLocationAndResolvePlace(frequentPlaces);
      setLatitudine(result.latitude);
      setLongitudine(result.longitude);

      if (result.matchedExistingPlace) {
        setLuogo(result.matchedExistingPlace.nome);
        setIndirizzo(result.matchedExistingPlace.indirizzo);
        setGpsMessage(`Rilevato luogo abituale: ${result.matchedExistingPlace.nome}`);
      } else if (result.proposedName) {
        setLuogo(result.proposedName);
        setIndirizzo(result.proposedAddress);
        setGpsMessage(`Rilevato: ${result.proposedName}`);
      } else {
        setIndirizzo(result.proposedAddress);
        setGpsMessage('Coordinate GPS acquisite. Inserisci il nome della chiesa.');
      }
    } catch (err: any) {
      setGpsMessage(err.message || 'Impossibile rilevare la posizione GPS.');
    } finally {
      setIsGpsLoading(false);
    }
  };

  // Frequent place select
  const handleSelectFrequentPlace = (place: Luogo) => {
    setLuogo(place.nome);
    setIndirizzo(place.indirizzo || '');
    setLatitudine(place.latitudine);
    setLongitudine(place.longitudine);
  };

  // Submit handler with debounce / double click guard
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!data) {
      setErrorMessage('La data della celebrazione è obbligatoria.');
      return;
    }
    if (!ora) {
      setErrorMessage('L\'ora della celebrazione è obbligatoria.');
      return;
    }
    if (!luogo.trim()) {
      setErrorMessage('Indicare il luogo della Messa (es. Parrocchia, Cattedrale, Cappella).');
      return;
    }
    if (tipoIntenzione === 'Per un defunto' && !nomeDefunto.trim()) {
      setErrorMessage('Indicare il nome del defunto per cui viene celebrata la Messa.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const dataOra = `${data}T${ora}:00`;

      await onSave(
        {
          data,
          ora,
          dataOra,
          luogo: luogo.trim(),
          indirizzo: indirizzo.trim(),
          latitudine,
          longitudine,
          celebrazione: celebrazione.trim() || 'Celebrazione del giorno',
          grado: grado || 'Feriale',
          tempoLiturgico: tempoLiturgico || 'Tempo Ordinario',
          settimanaLiturgica: settimanaLiturgica || '',
          coloreLiturgico,
          fonteCalendario,
          tipoIntenzione,
          intenzione: intenzione.trim(),
          nomeDefunto: nomeDefunto.trim(),
          richiedente: richiedente.trim() || '',
          dataMorte: tipoIntenzione === 'Per un defunto' && dataMorte ? dataMorte : '',
          offerta: offertaLibera ? null : (offerta ? Number(offerta) : null),
          offertaLibera,
          note: note.trim(),
        },
        editingMass?.id
      );

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Si è verificato un errore durante il salvataggio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Liturgical color CSS helper
  const getColorBadge = (colore: string) => {
    const c = (colore || '').toLowerCase();
    if (c.includes('bianco'))
      return 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-400/50';
    if (c.includes('rosso')) return 'bg-red-950 text-red-100 border-red-700';
    if (c.includes('viola')) return 'bg-purple-950 text-purple-100 border-purple-700';
    if (c.includes('rosa')) return 'bg-pink-950 text-pink-100 border-pink-700';
    if (c.includes('nero')) return 'bg-slate-950 text-slate-100 border-slate-700';
    return 'bg-emerald-950 text-emerald-100 border-emerald-700';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-900/40 rounded-xl shadow-2xl w-full max-w-2xl text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60 rounded-t-xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-amber-900/60 border border-amber-500/40 flex items-center justify-center text-amber-200">
              <span className="font-serif font-bold">☩</span>
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-amber-100 tracking-wide">
                {editingMass ? 'Modifica Messa Celebrata' : 'Registra Nuova Messa'}
              </h2>
              <p className="text-xs text-slate-400">
                Inserimento veloce nel tuo registro personale
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-700/80 rounded-lg flex items-start space-x-2 text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section: Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/40 p-3.5 rounded-lg border border-slate-700/50">
            <div>
              <label className="block text-xs font-medium text-amber-300/90 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>DATA DELLA MESSA</span>
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-amber-300/90 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>ORA</span>
                </label>
                <button
                  type="button"
                  onClick={handleSetCurrentTime}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
                >
                  Ora attuale
                </button>
              </div>
              <input
                type="time"
                value={ora}
                onChange={(e) => setOra(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Section: Location */}
          <div className="bg-slate-800/40 p-3.5 rounded-lg border border-slate-700/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-amber-300/90 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>LUOGO DELLA CELEBRAZIONE</span>
              </label>

              {/* GPS Button */}
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isGpsLoading}
                className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs px-2.5 py-1 rounded border border-amber-500/40 transition-colors"
                title="Rileva posizione attuale tramite GPS del dispositivo"
              >
                {isGpsLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>📍</span>
                )}
                <span>{isGpsLoading ? 'Rilevamento in corso...' : 'Rileva posizione GPS'}</span>
              </button>
            </div>

            {gpsMessage && (
              <div className="text-xs text-amber-200/90 bg-amber-950/40 px-2.5 py-1.5 rounded border border-amber-800/40">
                {gpsMessage}
              </div>
            )}

            <div>
              <input
                type="text"
                placeholder="es. Chiesa di Sant'Afra, Duomo, Parrocchia, Cappella..."
                value={luogo}
                onChange={(e) => setLuogo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                required
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Indirizzo (opzionale, es. Via Roma 10, Milano)"
                value={indirizzo}
                onChange={(e) => setIndirizzo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-md px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Quick Frequent Places Pills */}
            {frequentPlaces && frequentPlaces.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-1.5">Luoghi frequenti:</p>
                <div className="flex flex-wrap gap-1.5">
                  {frequentPlaces.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectFrequentPlace(p)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        luogo.toLowerCase() === p.nome.toLowerCase()
                          ? 'bg-amber-900/60 text-amber-200 border-amber-500'
                          : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {p.nome}
                      {p.numeroUtilizzi > 1 && (
                        <span className="ml-1 text-[10px] text-amber-400 font-mono">
                          ({p.numeroUtilizzi})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section: Liturgical Celebration Card */}
          <div className="bg-slate-800/40 p-3.5 rounded-lg border border-slate-700/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-amber-300/90 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CELEBRAZIONE LITURGICA</span>
                {isLoadingLiturgy && <Loader2 className="w-3 h-3 animate-spin text-amber-400 ml-1" />}
              </label>

              <button
                type="button"
                onClick={() => setIsEditingLiturgy(!isEditingLiturgy)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1"
              >
                {isEditingLiturgy ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Fine modifica</span>
                  </>
                ) : (
                  <>
                    <Edit2 className="w-3 h-3" />
                    <span>Modifica manuale</span>
                  </>
                )}
              </button>
            </div>

            {/* Liturgical Card Display */}
            {!isEditingLiturgy ? (
              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 flex flex-col space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-serif font-semibold text-amber-100 text-sm">
                    {celebrazione || 'Celebrazione del giorno'}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 border ${getColorBadge(
                      coloreLiturgico
                    )}`}
                  >
                    {coloreLiturgico}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  {grado && (
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      {grado}
                    </span>
                  )}
                  {tempoLiturgico && (
                    <span>
                      {tempoLiturgico}
                      {settimanaLiturgica ? ` (sett. ${settimanaLiturgica})` : ''}
                    </span>
                  )}
                  <span className="ml-auto text-[11px] text-slate-500 font-mono">
                    Fonte: {fonteCalendario}
                  </span>
                </div>

                {onOpenReadings && (
                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenReadings(data)}
                      className="flex items-center space-x-1.5 text-xs text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-700/50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>📖 Leggi le letture della Messa</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Editable Liturgy Fields */
              <div className="space-y-2 p-3 bg-slate-950/90 rounded-lg border border-amber-900/50">
                <div>
                  <label className="text-xs text-slate-400 block mb-0.5">Nome Celebrazione:</label>
                  <input
                    type="text"
                    value={celebrazione}
                    onChange={(e) => {
                      setCelebrazione(e.target.value);
                      setFonteCalendario('Manuale');
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 block mb-0.5">Grado:</label>
                    <select
                      value={grado}
                      onChange={(e) => {
                        setGrado(e.target.value);
                        setFonteCalendario('Manuale');
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100"
                    >
                      <option value="Solennità">Solennità</option>
                      <option value="Festa">Festa</option>
                      <option value="Memoria">Memoria</option>
                      <option value="Memoria facoltativa">Memoria facoltativa</option>
                      <option value="Feriale">Feriale</option>
                      <option value="Domenica">Domenica</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-0.5">Colore Liturgico:</label>
                    <select
                      value={coloreLiturgico}
                      onChange={(e) => {
                        setColoreLiturgico(e.target.value as ColoreLiturgico);
                        setFonteCalendario('Manuale');
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-100"
                    >
                      <option value="Verde">Verde</option>
                      <option value="Bianco">Bianco</option>
                      <option value="Rosso">Rosso</option>
                      <option value="Viola">Viola</option>
                      <option value="Rosa">Rosa</option>
                      <option value="Nero">Nero</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section: Mass Intention */}
          <div className="bg-slate-800/40 p-3.5 rounded-lg border border-slate-700/50 space-y-3">
            <label className="text-xs font-medium text-amber-300/90 flex items-center space-x-1">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>INTENZIONE DELLA MESSA</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {INTENTIONS_LIST.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTipoIntenzione(item.id)}
                  className={`flex items-center space-x-1.5 p-2 rounded-lg text-xs font-medium border text-left transition-all ${
                    tipoIntenzione === item.id
                      ? 'bg-amber-900/60 border-amber-500 text-amber-100 shadow-sm'
                      : 'bg-slate-900/60 border-slate-700/70 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>

            {/* If "Per un defunto": Deceased Name input */}
            {tipoIntenzione === 'Per un defunto' && (
              <div className="p-3 bg-purple-950/30 border border-purple-800/50 rounded-lg space-y-2">
                <div>
                  <label className="text-xs font-semibold text-purple-200 flex items-center space-x-1">
                    <span>✝️ NOME DEL DEFUNTO (O DEI DEFUNTI):</span>
                  </label>
                  <input
                    type="text"
                    placeholder="es. Mario Rossi, Luigi Bianchi (anche più nomi)"
                    value={nomeDefunto}
                    onChange={(e) => setNomeDefunto(e.target.value)}
                    className="w-full bg-slate-900 border border-purple-700/60 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-400"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[11px] text-purple-300 block mb-0.5">
                    Data del decesso (opzionale, per calcolo trigesimi e anniversari):
                  </label>
                  <input
                    type="date"
                    value={dataMorte}
                    onChange={(e) => setDataMorte(e.target.value)}
                    className="bg-slate-900 border border-purple-700/60 rounded px-2.5 py-1.5 text-xs text-slate-100"
                  />
                </div>
              </div>
            )}

            {/* If other intention: Intention description */}
            {tipoIntenzione !== 'Nessuna' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Dettaglio o intenzione specifica (opzionale):
                </label>
                <input
                  type="text"
                  placeholder="es. Per la guarigione di Anna, Per i giovani della parrocchia..."
                  value={intenzione}
                  onChange={(e) => setIntenzione(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}

            {/* Requester of the intention */}
            <div>
              <label className="text-xs text-slate-300 block mb-1">
                Richiesta da (famiglia o persona):
              </label>
              <input
                type="text"
                placeholder="es. Famiglia Rossi, i figli, la vedova, la comunità..."
                value={richiedente}
                onChange={(e) => setRichiedente(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Section: Mass Offering / Stipend (Discreet & Collapsible) */}
          {!showStipendDetails ? (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowStipendDetails(true)}
                className="text-xs text-slate-400 hover:text-amber-300 py-1 flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <span>🪙</span>
                <span className="underline decoration-dotted">Opzione riservata: registra offerta o elemosina...</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-800/40 p-3.5 rounded-lg border border-slate-700/50 space-y-2.5 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-medium text-amber-300/90 flex items-center space-x-1.5">
                  <span className="text-sm">🪙</span>
                  <span>OFFERTA / ELEMOSINA DELLA MESSA</span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">Riservato</span>
                </label>

                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={offertaLibera}
                      onChange={(e) => {
                        setOffertaLibera(e.target.checked);
                        if (e.target.checked) setOfferta('');
                      }}
                      className="rounded bg-slate-900 border-slate-700 text-amber-600 focus:ring-0"
                    />
                    <span>Offerta libera / Senza</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (!offerta && !offertaLibera) {
                        setShowStipendDetails(false);
                      } else {
                        setShowStipendDetails(false);
                      }
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                  >
                    Riduci
                  </button>
                </div>
              </div>

              {!offertaLibera && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-36">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs sm:text-sm font-semibold">€</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="es. 10 o 15"
                      value={offerta}
                      onChange={(e) => setOfferta(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded pl-7 pr-2 py-1.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 italic">
                    Dato privato personale per la rendicontazione
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Section: Notes */}
          <div className="bg-slate-800/40 p-3.5 rounded-lg border border-slate-700/50 space-y-1">
            <label className="text-xs font-medium text-amber-300/90 flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5" />
              <span>NOTE AGGIUNTIVE (OPZIONALE)</span>
            </label>
            <textarea
              rows={2}
              placeholder="es. Concelebrazione con Don Marco, Prima Comunione, Nozze d'oro..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/80 rounded-b-xl flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Annulla
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center space-x-2 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-amber-50 px-5 py-2.5 rounded-lg font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 border border-amber-400/40"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvataggio...</span>
              </>
            ) : (
              <>
                <BookmarkCheck className="w-4 h-4" />
                <span>{editingMass ? 'AGGIORNA MESSA' : 'SALVA MESSA'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
