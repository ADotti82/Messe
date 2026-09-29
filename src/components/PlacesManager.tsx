/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Calendar,
  Layers,
  X,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Luogo } from '../types';

interface PlacesManagerProps {
  luoghi: Luogo[];
  onAddPlace: (data: { nome: string; indirizzo?: string; latitudine?: number | null; longitudine?: number | null }) => Promise<void>;
  onDeletePlace: (id: string, name: string) => void;
  isLoading: boolean;
}

export const PlacesManager: React.FC<PlacesManagerProps> = ({
  luoghi,
  onAddPlace,
  onDeletePlace,
  isLoading,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [nome, setNome] = useState<string>('');
  const [indirizzo, setIndirizzo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreatePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg('Il nome del luogo o della chiesa è obbligatorio.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onAddPlace({
        nome: nome.trim(),
        indirizzo: indirizzo.trim() || undefined,
      });
      setNome('');
      setIndirizzo('');
      setShowAddModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore durante la creazione del luogo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-serif font-bold text-amber-100 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-amber-400" />
            <span>I TUOI LUOGHI DI CELEBRAZIONE</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Chiese, parrocchie e cappelle del tuo archivio personale
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-amber-50 px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-md transition-all self-start sm:self-auto border border-amber-400/30"
        >
          <Plus className="w-4 h-4 text-amber-200" />
          <span>Aggiungi Luogo</span>
        </button>
      </div>

      {/* Places List */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Caricamento luoghi...</p>
        </div>
      ) : luoghi.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center space-y-3">
          <MapPin className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-300 font-medium">Nessun luogo memorizzato ancora.</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            I luoghi vengono aggiunti automaticamente ogni volta che registri una Messa, oppure puoi inserirli manualmente adesso.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {luoghi.map((l) => (
            <div
              key={l.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all shadow-sm flex items-start justify-between gap-3"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <h3 className="font-serif font-bold text-sm text-slate-100 truncate">
                    {l.nome}
                  </h3>
                </div>

                {l.indirizzo && (
                  <p className="text-xs text-slate-400 truncate pl-4">{l.indirizzo}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pl-4 font-mono">
                  <span className="text-amber-300/80 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    Utilizzato: {l.numeroUtilizzi} {l.numeroUtilizzi === 1 ? 'volta' : 'volte'}
                  </span>
                  {l.ultimaUtilizzazione && (
                    <span>Ultima: {l.ultimaUtilizzazione}</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDeletePlace(l.id, l.nome)}
                className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                title="Elimina luogo dall'elenco"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Place Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-amber-900/40 rounded-xl shadow-2xl w-full max-w-md p-5 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-amber-100 text-base">
                Nuovo Luogo di Celebrazione
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/80 border border-red-700 rounded-lg text-xs text-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreatePlace} className="space-y-3">
              <div>
                <label className="text-xs text-amber-300 block mb-1">Nome Luogo / Chiesa:</label>
                <input
                  type="text"
                  placeholder="es. Sant'Afra, Santuario di San Giorgio, Duomo..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Indirizzo (opzionale):</label>
                <input
                  type="text"
                  placeholder="es. Piazza della Vittoria 1, Brescia"
                  value={indirizzo}
                  onChange={(e) => setIndirizzo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-700 hover:bg-amber-600 text-white font-semibold px-4 py-1.5 rounded-lg text-xs"
                >
                  {isSubmitting ? 'Salvataggio...' : 'Aggiungi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
