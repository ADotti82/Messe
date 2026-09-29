/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, BookOpen, CheckCircle, ShieldCheck, MapPin, Sparkles, HardDrive, Lock } from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-900/40 rounded-xl shadow-2xl max-w-3xl w-full text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60 rounded-t-xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-amber-900/60 border border-amber-500/40 flex items-center justify-center text-amber-200">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-amber-100">
                Guida all'Uso e Configurazione
              </h2>
              <p className="text-xs text-slate-400">
                Tutto ciò che c'è da sapere sul Registro delle Messe
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

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm leading-relaxed text-slate-300">
          {/* Section A & B: Architecture & Google Account */}
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-amber-200 text-sm flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>1. Autenticazione e Principio di Riservatezza</span>
            </h3>
            <p>
              L'applicazione non memorizza password né gestisce un database centrale condiviso con altri sacerdoti. L'accesso avviene tramite il tuo account Google ufficiale. Ciascun sacerdote accede esclusivamente al proprio archivio personale. Nessun altro utente può visualizzare le tue celebrazioni o i nomi dei defunti.
            </p>
          </div>

          {/* Section C & D: Google Drive & Google Sheets */}
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-amber-200 text-sm flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>2. Google Drive e Google Sheet Personale</span>
            </h3>
            <p>
              Al primo accesso l'app crea nel tuo Google Drive (nella cartella <span className="font-mono text-amber-200">Registro delle Messe</span>) un file intitolato <span className="font-mono text-amber-200">Registro Messe - [Tuo Nome]</span>.
            </p>
            <p>
              Il foglio è strutturato con tre schede:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
              <li><strong className="text-slate-200">Messe:</strong> tutte le celebrazioni registrate con data, ora, luogo, celebrazione liturgica, grado, colore, intenzione, nome dei defunti e note.</li>
              <li><strong className="text-slate-200">Luoghi:</strong> l'elenco delle chiese, parrocchie o cappelle in cui celebri, con frequenza d'uso per suggerirtele rapidamente.</li>
              <li><strong className="text-slate-200">Impostazioni:</strong> dati anagrafici del profilo e diocesi di appartenenza.</li>
            </ul>
          </div>

          {/* Section E: Liturgical Calendar */}
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-amber-200 text-sm flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>3. Calendario Liturgico (CalAPI e Locale)</span>
            </h3>
            <p>
              L'app interroga automaticamente l'API del Calendario Romano Generale in lingua italiana (<span className="font-mono text-amber-200">general-it</span>). Per ogni giorno propone automaticamente il nome della celebrazione, il grado (Solennità, Festa, Memoria, Feriale), il tempo liturgico e il colore dei paramenti (Verde, Bianco, Rosso, Viola, Rosa).
            </p>
            <p className="text-slate-400 text-xs">
              Se la connessione a CalAPI non è disponibile, l'app include un motore di calcolo liturgico locale di riserva (archivio locale) che determina autonomamente le domeniche, i tempi e le solennità principali. Puoi comunque modificare manualmente qualsiasi celebrazione con un clic su <em>"Modifica manuale"</em>.
            </p>
          </div>

          {/* Section F: GPS */}
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-amber-200 text-sm flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>4. Rilevamento Posizione GPS</span>
            </h3>
            <p>
              Durante la registrazione di una Messa, premendo il pulsante <strong className="text-amber-200">📍 Rileva posizione</strong> l'app interroga il GPS del tuo dispositivo:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
              <li>Se ti trovi in una chiesa già registrata nel tuo archivio (entro circa 150 metri), l'app la riconosce automaticamente.</li>
              <li>Se ti trovi in un nuovo luogo, cerca tramite reverse geocoding l'edificio di culto o l'indirizzo più vicino e te lo propone per la conferma o modifica.</li>
              <li>Se il GPS è disattivato o negato, puoi sempre selezionare un luogo dai <em>Luoghi frequenti</em> o scriverlo liberamente.</li>
            </ul>
          </div>

          {/* Section G: Backup and Export */}
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-amber-200 text-sm flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <span>5. Esportazione, Backup e Multidispositivo</span>
            </h3>
            <p>
              I tuoi dati sono sempre tuoi:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
              <li>Puoi esportare in qualsiasi momento il registro in <strong className="text-slate-200">Excel (.xlsx)</strong>, <strong className="text-slate-200">CSV</strong> (compatibile con Excel in lingua italiana con accenti corretti) o <strong className="text-slate-200">JSON</strong>.</li>
              <li>Puoi creare un <strong className="text-slate-200">backup completo</strong> e ripristinarlo su qualsiasi dispositivo con verifica di integrità e anti-duplicazione.</li>
              <li>Accedendo da smartphone, tablet o computer con il medesimo account Google, ritroverai istantaneamente il tuo registro sincronizzato.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            Ho capito
          </button>
        </div>
      </div>
    </div>
  );
};
