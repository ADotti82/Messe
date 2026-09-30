/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { Messa, Luogo, Impostazioni } from '../types';

export interface BackupPackage {
  app: 'RegistroDelleMesse';
  version: string;
  backupDate: string;
  userEmail?: string;
  messe: Messa[];
  luoghi: Luogo[];
  impostazioni?: Impostazioni | null;
}

/**
 * Downloads a string or blob as a file in the browser
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports masses as CSV with UTF-8 BOM for flawless Excel opening in Italian
 */
export function exportToCSV(messe: Messa[], filename = 'registro_messe.csv') {
  const headers = [
    'ID',
    'Data',
    'Ora',
    'Luogo',
    'Indirizzo',
    'Celebrazione',
    'Grado',
    'Tempo Liturgico',
    'Settimana',
    'Colore',
    'Fonte Calendario',
    'Tipo Intenzione',
    'Intenzione',
    'Defunto/i',
    'Data Decesso',
    'Richiesta Da',
    'Offerta (€)',
    'Note',
    'Creato Il',
    'Modificato Il',
  ];

  const escapeCell = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = messe.map((m) => [
    escapeCell(m.id),
    escapeCell(m.data),
    escapeCell(m.ora),
    escapeCell(m.luogo),
    escapeCell(m.indirizzo),
    escapeCell(m.celebrazione),
    escapeCell(m.grado),
    escapeCell(m.tempoLiturgico),
    escapeCell(m.settimanaLiturgica),
    escapeCell(m.coloreLiturgico),
    escapeCell(m.fonteCalendario),
    escapeCell(m.tipoIntenzione),
    escapeCell(m.intenzione),
    escapeCell(m.nomeDefunto),
    escapeCell(m.dataMorte || ''),
    escapeCell(m.richiedente || ''),
    escapeCell(m.offertaLibera ? 'Offerta libera' : (m.offerta !== null && m.offerta !== undefined ? m.offerta : '')),
    escapeCell(m.note),
    escapeCell(m.creatoIl),
    escapeCell(m.modificatoIl),
  ]);

  // Use semicolon for Italian Excel compatibility
  const csvContent = '\uFEFF' + [headers.map(escapeCell).join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Exports data to JSON
 */
export function exportToJSON(data: any, filename = 'registro_messe.json') {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Exports full data to an Excel .xlsx workbook with multiple tabs
 */
export function exportToExcel(
  messe: Messa[],
  luoghi: Luogo[],
  impostazioni?: Impostazioni | null,
  filename = 'Registro_Messe.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // 1. Messe sheet
  const messeData = messe.map((m) => ({
    Data: m.data,
    Ora: m.ora,
    Luogo: m.luogo,
    Indirizzo: m.indirizzo,
    Celebrazione: m.celebrazione,
    Grado: m.grado,
    TempoLiturgico: m.tempoLiturgico,
    Settimana: m.settimanaLiturgica,
    Colore: m.coloreLiturgico,
    TipoIntenzione: m.tipoIntenzione,
    Intenzione: m.intenzione,
    NomeDefunto: m.nomeDefunto,
    DataDecesso: m.dataMorte || '',
    RichiestaDa: m.richiedente || '',
    OffertaEuro: m.offertaLibera ? 'Offerta libera' : (m.offerta !== null && m.offerta !== undefined ? m.offerta : ''),
    Note: m.note,
    FonteCalendario: m.fonteCalendario,
    ID: m.id,
  }));
  const wsMesse = XLSX.utils.json_to_sheet(messeData);
  XLSX.utils.book_append_sheet(wb, wsMesse, 'Messe');

  // 2. Luoghi sheet
  const luoghiData = luoghi.map((l) => ({
    Nome: l.nome,
    Indirizzo: l.indirizzo,
    NumeroUtilizzi: l.numeroUtilizzi,
    UltimaUtilizzazione: l.ultimaUtilizzazione,
    Latitudine: l.latitudine,
    Longitudine: l.longitudine,
    ID: l.id,
  }));
  const wsLuoghi = XLSX.utils.json_to_sheet(luoghiData);
  XLSX.utils.book_append_sheet(wb, wsLuoghi, 'Luoghi');

  // 3. Impostazioni sheet
  if (impostazioni) {
    const impData = [
      {
        Nome: impostazioni.nome,
        Cognome: impostazioni.cognome,
        Email: impostazioni.email,
        Diocesi: impostazioni.diocesi,
        DataCreazione: impostazioni.dataCreazioneAccount,
        VersioneApp: impostazioni.versioneApp,
      },
    ];
    const wsImp = XLSX.utils.json_to_sheet(impData);
    XLSX.utils.book_append_sheet(wb, wsImp, 'Impostazioni');
  }

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}

/**
 * Creates a complete backup package and initiates download
 */
export function createBackupPackage(
  messe: Messa[],
  luoghi: Luogo[],
  impostazioni?: Impostazioni | null,
  userEmail?: string
) {
  const dateStr = new Date().toISOString().split('T')[0];
  const pkg: BackupPackage = {
    app: 'RegistroDelleMesse',
    version: '1.0.0',
    backupDate: new Date().toISOString(),
    userEmail: userEmail || impostazioni?.email,
    messe,
    luoghi,
    impostazioni: impostazioni || null,
  };
  exportToJSON(pkg, `Backup_Registro_Messe_${dateStr}.json`);
}

/**
 * Validates a parsed backup file
 */
export function validateBackupFile(content: any): { valid: boolean; error?: string; pkg?: BackupPackage } {
  if (!content || typeof content !== 'object') {
    return { valid: false, error: 'Il file non contiene un oggetto JSON valido.' };
  }
  if (content.app !== 'RegistroDelleMesse' && !Array.isArray(content.messe)) {
    return { valid: false, error: 'Il file selezionato non è un backup compatibile del Registro delle Messe.' };
  }
  if (!Array.isArray(content.messe)) {
    return { valid: false, error: 'La sezione Messe del backup non è valida.' };
  }

  // Validate item format
  const messe: Messa[] = content.messe.map((m: any) => ({
    id: m.id || `messa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    data: m.data || new Date().toISOString().split('T')[0],
    ora: m.ora || '08:00',
    dataOra: m.dataOra || `${m.data}T${m.ora}:00`,
    luogo: m.luogo || 'Chiesa',
    indirizzo: m.indirizzo || '',
    latitudine: m.latitudine ? Number(m.latitudine) : null,
    longitudine: m.longitudine ? Number(m.longitudine) : null,
    celebrazione: m.celebrazione || 'Messa',
    grado: m.grado || '',
    tempoLiturgico: m.tempoLiturgico || '',
    settimanaLiturgica: m.settimanaLiturgica || '',
    coloreLiturgico: m.coloreLiturgico || 'Verde',
    fonteCalendario: m.fonteCalendario || 'Manuale',
    intenzione: m.intenzione || '',
    tipoIntenzione: m.tipoIntenzione || 'Nessuna',
    nomeDefunto: m.nomeDefunto || '',
    note: m.note || '',
    creatoIl: m.creatoIl || new Date().toISOString(),
    modificatoIl: m.modificatoIl || new Date().toISOString(),
  }));

  const luoghi: Luogo[] = Array.isArray(content.luoghi)
    ? content.luoghi.map((l: any) => ({
        id: l.id || `luogo_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        nome: l.nome || 'Luogo',
        indirizzo: l.indirizzo || '',
        latitudine: l.latitudine ? Number(l.latitudine) : null,
        longitudine: l.longitudine ? Number(l.longitudine) : null,
        numeroUtilizzi: Number(l.numeroUtilizzi) || 1,
        ultimaUtilizzazione: l.ultimaUtilizzazione || new Date().toISOString().split('T')[0],
      }))
    : [];

  return {
    valid: true,
    pkg: {
      app: 'RegistroDelleMesse',
      version: content.version || '1.0.0',
      backupDate: content.backupDate || new Date().toISOString(),
      userEmail: content.userEmail,
      messe,
      luoghi,
      impostazioni: content.impostazioni,
    },
  };
}
