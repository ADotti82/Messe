/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Messa, Luogo, Impostazioni } from '../types';

export const MESSE_HEADERS = [
  'id',
  'data',
  'ora',
  'dataOra',
  'luogo',
  'indirizzo',
  'latitudine',
  'longitudine',
  'celebrazione',
  'grado',
  'tempoLiturgico',
  'settimanaLiturgica',
  'coloreLiturgico',
  'fonteCalendario',
  'intenzione',
  'tipoIntenzione',
  'nomeDefunto',
  'note',
  'creatoIl',
  'modificatoIl',
];

export const LUOGHI_HEADERS = [
  'id',
  'nome',
  'indirizzo',
  'latitudine',
  'longitudine',
  'numeroUtilizzi',
  'ultimaUtilizzazione',
];

export const IMPOSTAZIONI_HEADERS = [
  'userId',
  'nome',
  'cognome',
  'email',
  'diocesi',
  'dataCreazioneAccount',
  'dataUltimaModifica',
  'versioneApp',
];

/**
 * Creates the user's personal Google Spreadsheet with 3 tabs and configured headers.
 */
export async function createPersonalSpreadsheet(
  accessToken: string,
  title: string,
  initialSettings: Impostazioni
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';

  const body = {
    properties: {
      title,
      locale: 'it_IT',
      timeZone: 'Europe/Rome',
    },
    sheets: [
      {
        properties: {
          title: 'Messe',
          gridProperties: { rowCount: 100, columnCount: MESSE_HEADERS.length, frozenRowCount: 1 },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: MESSE_HEADERS.map((h) => ({
                  userEnteredValue: { stringValue: h },
                  userEnteredFormat: {
                    textFormat: { bold: true },
                    backgroundColor: { red: 0.93, green: 0.94, blue: 0.96 },
                  },
                })),
              },
            ],
          },
        ],
      },
      {
        properties: {
          title: 'Luoghi',
          gridProperties: { rowCount: 50, columnCount: LUOGHI_HEADERS.length, frozenRowCount: 1 },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: LUOGHI_HEADERS.map((h) => ({
                  userEnteredValue: { stringValue: h },
                  userEnteredFormat: {
                    textFormat: { bold: true },
                    backgroundColor: { red: 0.93, green: 0.94, blue: 0.96 },
                  },
                })),
              },
            ],
          },
        ],
      },
      {
        properties: {
          title: 'Impostazioni',
          gridProperties: { rowCount: 10, columnCount: IMPOSTAZIONI_HEADERS.length, frozenRowCount: 1 },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: IMPOSTAZIONI_HEADERS.map((h) => ({
                  userEnteredValue: { stringValue: h },
                  userEnteredFormat: {
                    textFormat: { bold: true },
                    backgroundColor: { red: 0.93, green: 0.94, blue: 0.96 },
                  },
                })),
              },
              {
                values: [
                  { userEnteredValue: { stringValue: initialSettings.userId } },
                  { userEnteredValue: { stringValue: initialSettings.nome } },
                  { userEnteredValue: { stringValue: initialSettings.cognome } },
                  { userEnteredValue: { stringValue: initialSettings.email } },
                  { userEnteredValue: { stringValue: initialSettings.diocesi } },
                  { userEnteredValue: { stringValue: initialSettings.dataCreazioneAccount } },
                  { userEnteredValue: { stringValue: initialSettings.dataUltimaModifica } },
                  { userEnteredValue: { stringValue: initialSettings.versioneApp } },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Errore ${res.status} durante la creazione del Google Sheet`);
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
  };
}

/**
 * Reads all rows from sheet range
 */
export async function readSheetRange(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<any[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 404) {
    throw new Error('ARCHIVE_NOT_FOUND');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Errore lettura Fogli (${res.status})`);
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Appends row to range
 */
export async function appendSheetRow(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  rowValues: any[]
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Errore inserimento riga (${res.status})`);
  }
}

/**
 * Updates a specific row in range
 */
export async function updateSheetRow(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  rowValues: any[]
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Errore aggiornamento riga (${res.status})`);
  }
}

/**
 * Gets sheet tab ID (sheetId integer) needed for batchUpdate row deletion
 */
export async function getSheetIdByTitle(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string
): Promise<number | null> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return null;
  const data = await res.json();
  const found = data.sheets?.find((s: any) => s.properties?.title === sheetTitle);
  return found?.properties?.sheetId ?? null;
}

/**
 * Deletes a row by zero-indexed row index
 */
export async function deleteSheetRow(
  accessToken: string,
  spreadsheetId: string,
  sheetId: number,
  rowIndex: number
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Errore cancellazione riga (${res.status})`);
  }
}

/**
 * Helper to map Messa row to object
 */
export function rowToMessa(row: any[]): Messa {
  return {
    id: row[0] || '',
    data: row[1] || '',
    ora: row[2] || '',
    dataOra: row[3] || '',
    luogo: row[4] || '',
    indirizzo: row[5] || '',
    latitudine: row[6] ? Number(row[6]) : null,
    longitudine: row[7] ? Number(row[7]) : null,
    celebrazione: row[8] || '',
    grado: row[9] || '',
    tempoLiturgico: row[10] || '',
    settimanaLiturgica: row[11] || '',
    coloreLiturgico: row[12] || 'Verde',
    fonteCalendario: (row[13] as any) || 'CalAPI',
    intenzione: row[14] || '',
    tipoIntenzione: (row[15] as any) || 'Nessuna',
    nomeDefunto: row[16] || '',
    note: row[17] || '',
    creatoIl: row[18] || '',
    modificatoIl: row[19] || '',
  };
}

/**
 * Helper to map Messa object to row
 */
export function messaToRow(m: Messa): any[] {
  return [
    m.id,
    m.data,
    m.ora,
    m.dataOra,
    m.luogo,
    m.indirizzo || '',
    m.latitudine !== null && m.latitudine !== undefined ? m.latitudine : '',
    m.longitudine !== null && m.longitudine !== undefined ? m.longitudine : '',
    m.celebrazione,
    m.grado,
    m.tempoLiturgico,
    m.settimanaLiturgica,
    m.coloreLiturgico,
    m.fonteCalendario,
    m.intenzione || '',
    m.tipoIntenzione,
    m.nomeDefunto || '',
    m.note || '',
    m.creatoIl,
    m.modificatoIl,
  ];
}

/**
 * Helper to map Luogo row to object
 */
export function rowToLuogo(row: any[]): Luogo {
  return {
    id: row[0] || '',
    nome: row[1] || '',
    indirizzo: row[2] || '',
    latitudine: row[3] ? Number(row[3]) : null,
    longitudine: row[4] ? Number(row[4]) : null,
    numeroUtilizzi: Number(row[5]) || 0,
    ultimaUtilizzazione: row[6] || '',
  };
}

/**
 * Helper to map Luogo object to row
 */
export function luogoToRow(l: Luogo): any[] {
  return [
    l.id,
    l.nome,
    l.indirizzo || '',
    l.latitudine !== null && l.latitudine !== undefined ? l.latitudine : '',
    l.longitudine !== null && l.longitudine !== undefined ? l.longitudine : '',
    l.numeroUtilizzi,
    l.ultimaUtilizzazione,
  ];
}
