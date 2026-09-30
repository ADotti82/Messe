/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ColoreLiturgico = 'Verde' | 'Bianco' | 'Rosso' | 'Viola' | 'Rosa' | 'Nero';

export type FonteCalendario = 'CalAPI' | 'Archivio locale' | 'Manuale';

export type TipoIntenzione =
  | 'Nessuna'
  | 'Per un defunto'
  | 'Per una persona'
  | 'Per una famiglia'
  | 'Per più persone'
  | 'Ringraziamento'
  | 'Per una necessità'
  | 'Altra';

export interface Messa {
  id: string;
  data: string; // YYYY-MM-DD
  ora: string; // HH:mm
  dataOra: string; // ISO 8601 string
  luogo: string;
  indirizzo: string;
  latitudine: number | null;
  longitudine: number | null;
  celebrazione: string;
  grado: string;
  tempoLiturgico: string;
  settimanaLiturgica: string | number;
  coloreLiturgico: ColoreLiturgico | string;
  fonteCalendario: FonteCalendario;
  intenzione: string;
  tipoIntenzione: TipoIntenzione;
  nomeDefunto: string;
  dataMorte?: string; // YYYY-MM-DD opzionale per anniversari/trigesimi
  richiedente?: string; // es. Famiglia Rossi, i figli, ecc.
  offerta?: number | null; // importo elemosina/offerta in euro
  offertaLibera?: boolean; // true se senza elemosina o offerta libera
  note: string;
  creatoIl: string;
  modificatoIl: string;
}

export type ThemeMode = 'dark' | 'light';

export interface Luogo {
  id: string;
  nome: string;
  indirizzo: string;
  latitudine: number | null;
  longitudine: number | null;
  numeroUtilizzi: number;
  ultimaUtilizzazione: string;
}

export interface Impostazioni {
  userId: string;
  nome: string;
  cognome: string;
  email: string;
  diocesi: string;
  dataCreazioneAccount: string;
  dataUltimaModifica: string;
  versioneApp: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
}

export interface CelebrazioneLiturgica {
  titolo: string;
  grado: string;
  colore: ColoreLiturgico | string;
  tempoLiturgico: string;
  settimanaLiturgica: number | string;
  giornoSettimana?: string;
  fonte: FonteCalendario;
}

export type FiltroTemporale =
  | 'tutto'
  | 'oggi'
  | 'settimana'
  | 'questo_mese'
  | 'mese_precedente'
  | 'anno_corrente'
  | 'personalizzato';

export interface FiltriRegistro {
  ricercaTesto: string;
  periodo: FiltroTemporale;
  dataInizio?: string;
  dataFine?: string;
  luogo?: string;
  soloDefunti: boolean;
  soloConIntenzione: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
