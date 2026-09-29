/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Messa, Luogo, Impostazioni, UserProfile } from '../types';
import {
  checkFileExists,
  findUserSpreadsheet,
  getOrCreateAppFolder,
  moveFileToFolder,
  deleteSpreadsheetFile,
} from './googleDrive';
import {
  createPersonalSpreadsheet,
  readSheetRange,
  appendSheetRow,
  updateSheetRow,
  deleteSheetRow,
  getSheetIdByTitle,
  rowToMessa,
  messaToRow,
  rowToLuogo,
  luogoToRow,
} from './googleSheets';

export interface IDataRepository {
  init(): Promise<{ hasArchive: boolean; spreadsheetId?: string; spreadsheetUrl?: string }>;
  createArchive(user: UserProfile, diocesi?: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string }>;
  getMasses(): Promise<Messa[]>;
  getMass(id: string): Promise<Messa | null>;
  createMass(data: Omit<Messa, 'id' | 'creatoIl' | 'modificatoIl'>): Promise<Messa>;
  updateMass(id: string, data: Partial<Messa>): Promise<Messa>;
  deleteMass(id: string): Promise<boolean>;
  getPlaces(): Promise<Luogo[]>;
  createOrIncrementPlace(placeData: {
    nome: string;
    indirizzo?: string;
    latitudine?: number | null;
    longitudine?: number | null;
  }): Promise<Luogo>;
  deletePlace(id: string): Promise<boolean>;
  getSettings(): Promise<Impostazioni | null>;
  saveSettings(settings: Partial<Impostazioni>): Promise<Impostazioni>;
  resetArchive(): Promise<boolean>;
  isDemo(): boolean;
}

/**
 * Local / Demo Repository Implementation
 */
export class LocalDemoRepository implements IDataRepository {
  private userId = 'demo-sacerdote-local';
  private storageKeyMesse = 'demo_registro_messe_items';
  private storageKeyLuoghi = 'demo_registro_messe_luoghi';
  private storageKeySettings = 'demo_registro_messe_settings';

  isDemo(): boolean {
    return true;
  }

  async init(): Promise<{ hasArchive: boolean; spreadsheetId?: string; spreadsheetUrl?: string }> {
    const hasArch = localStorage.getItem('demo_has_archive') === 'true';
    return {
      hasArchive: hasArch,
      spreadsheetId: hasArch ? 'demo-spreadsheet-id' : undefined,
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/demo',
    };
  }

  async createArchive(user: UserProfile, diocesi: string = 'Diocesi di Roma'): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    localStorage.setItem('demo_has_archive', 'true');
    const now = new Date().toISOString();
    const settings: Impostazioni = {
      userId: user.uid,
      nome: user.displayName?.split(' ')[0] || 'Don Andrea',
      cognome: user.displayName?.split(' ').slice(1).join(' ') || 'Dotti',
      email: user.email || 'don.andrea@chiesa.it',
      diocesi,
      dataCreazioneAccount: now,
      dataUltimaModifica: now,
      versioneApp: '1.0.0',
    };
    localStorage.setItem(this.storageKeySettings, JSON.stringify(settings));

    // Seed default common place
    const defaultPlace: Luogo = {
      id: 'luogo_default_1',
      nome: 'Chiesa Parrocchiale',
      indirizzo: 'Piazza della Chiesa, 1',
      latitudine: 45.4642,
      longitudine: 9.1900,
      numeroUtilizzi: 1,
      ultimaUtilizzazione: now.split('T')[0],
    };
    localStorage.setItem(this.storageKeyLuoghi, JSON.stringify([defaultPlace]));
    if (!localStorage.getItem(this.storageKeyMesse)) {
      localStorage.setItem(this.storageKeyMesse, JSON.stringify([]));
    }

    return {
      spreadsheetId: 'demo-spreadsheet-id',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/demo',
    };
  }

  async getMasses(): Promise<Messa[]> {
    const raw = localStorage.getItem(this.storageKeyMesse);
    return raw ? JSON.parse(raw) : [];
  }

  async getMass(id: string): Promise<Messa | null> {
    const masses = await this.getMasses();
    return masses.find((m) => m.id === id) || null;
  }

  async createMass(data: Omit<Messa, 'id' | 'creatoIl' | 'modificatoIl'>): Promise<Messa> {
    const masses = await this.getMasses();
    const now = new Date().toISOString();
    const newMass: Messa = {
      ...data,
      id: `messa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      creatoIl: now,
      modificatoIl: now,
    };
    masses.unshift(newMass);
    localStorage.setItem(this.storageKeyMesse, JSON.stringify(masses));

    // Increment place usage
    if (newMass.luogo) {
      await this.createOrIncrementPlace({
        nome: newMass.luogo,
        indirizzo: newMass.indirizzo,
        latitudine: newMass.latitudine,
        longitudine: newMass.longitudine,
      });
    }

    return newMass;
  }

  async updateMass(id: string, data: Partial<Messa>): Promise<Messa> {
    const masses = await this.getMasses();
    const index = masses.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Messa non trovata');

    const updated: Messa = {
      ...masses[index],
      ...data,
      id,
      modificatoIl: new Date().toISOString(),
    };
    masses[index] = updated;
    localStorage.setItem(this.storageKeyMesse, JSON.stringify(masses));
    return updated;
  }

  async deleteMass(id: string): Promise<boolean> {
    let masses = await this.getMasses();
    masses = masses.filter((m) => m.id !== id);
    localStorage.setItem(this.storageKeyMesse, JSON.stringify(masses));
    return true;
  }

  async getPlaces(): Promise<Luogo[]> {
    const raw = localStorage.getItem(this.storageKeyLuoghi);
    const places: Luogo[] = raw ? JSON.parse(raw) : [];
    return places.sort((a, b) => b.numeroUtilizzi - a.numeroUtilizzi);
  }

  async createOrIncrementPlace(placeData: {
    nome: string;
    indirizzo?: string;
    latitudine?: number | null;
    longitudine?: number | null;
  }): Promise<Luogo> {
    const places = await this.getPlaces();
    const today = new Date().toISOString().split('T')[0];
    const existing = places.find(
      (p) => p.nome.trim().toLowerCase() === placeData.nome.trim().toLowerCase()
    );

    if (existing) {
      existing.numeroUtilizzi += 1;
      existing.ultimaUtilizzazione = today;
      if (placeData.indirizzo && !existing.indirizzo) existing.indirizzo = placeData.indirizzo;
      if (placeData.latitudine !== undefined) existing.latitudine = placeData.latitudine;
      if (placeData.longitudine !== undefined) existing.longitudine = placeData.longitudine;
      localStorage.setItem(this.storageKeyLuoghi, JSON.stringify(places));
      return existing;
    }

    const newPlace: Luogo = {
      id: `luogo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      nome: placeData.nome.trim(),
      indirizzo: placeData.indirizzo || '',
      latitudine: placeData.latitudine ?? null,
      longitudine: placeData.longitudine ?? null,
      numeroUtilizzi: 1,
      ultimaUtilizzazione: today,
    };
    places.push(newPlace);
    localStorage.setItem(this.storageKeyLuoghi, JSON.stringify(places));
    return newPlace;
  }

  async deletePlace(id: string): Promise<boolean> {
    let places = await this.getPlaces();
    places = places.filter((p) => p.id !== id);
    localStorage.setItem(this.storageKeyLuoghi, JSON.stringify(places));
    return true;
  }

  async getSettings(): Promise<Impostazioni | null> {
    const raw = localStorage.getItem(this.storageKeySettings);
    return raw ? JSON.parse(raw) : null;
  }

  async saveSettings(settings: Partial<Impostazioni>): Promise<Impostazioni> {
    const current = (await this.getSettings()) || {
      userId: this.userId,
      nome: 'Don Andrea',
      cognome: 'Dotti',
      email: 'don.andrea@chiesa.it',
      diocesi: 'Diocesi di Roma',
      dataCreazioneAccount: new Date().toISOString(),
      dataUltimaModifica: new Date().toISOString(),
      versioneApp: '1.0.0',
    };
    const updated = {
      ...current,
      ...settings,
      dataUltimaModifica: new Date().toISOString(),
    };
    localStorage.setItem(this.storageKeySettings, JSON.stringify(updated));
    return updated;
  }

  async resetArchive(): Promise<boolean> {
    localStorage.removeItem('demo_has_archive');
    localStorage.removeItem(this.storageKeyMesse);
    localStorage.removeItem(this.storageKeyLuoghi);
    localStorage.removeItem(this.storageKeySettings);
    return true;
  }
}

/**
 * Google Sheets Data Repository Implementation
 */
export class GoogleSheetsRepository implements IDataRepository {
  private accessToken: string;
  private user: UserProfile;
  private spreadsheetId: string | null = null;
  private spreadsheetUrl: string | null = null;
  private messeSheetId: number | null = null;
  private luoghiSheetId: number | null = null;

  constructor(accessToken: string, user: UserProfile) {
    this.accessToken = accessToken;
    this.user = user;
    this.spreadsheetId = localStorage.getItem(`registro_messe_sheet_${user.uid}`) || null;
  }

  isDemo(): boolean {
    return false;
  }

  getSpreadsheetId(): string | null {
    return this.spreadsheetId;
  }

  getSpreadsheetUrl(): string | null {
    return this.spreadsheetUrl || (this.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit` : null);
  }

  async init(): Promise<{ hasArchive: boolean; spreadsheetId?: string; spreadsheetUrl?: string }> {
    // 1. Check if we have a locally remembered spreadsheetId for this user
    if (this.spreadsheetId) {
      const file = await checkFileExists(this.accessToken, this.spreadsheetId);
      if (file) {
        this.spreadsheetUrl = file.webViewLink || `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`;
        return { hasArchive: true, spreadsheetId: this.spreadsheetId, spreadsheetUrl: this.spreadsheetUrl };
      }
      // If file was deleted in Drive, clear local storage
      localStorage.removeItem(`registro_messe_sheet_${this.user.uid}`);
      this.spreadsheetId = null;
    }

    // 2. Search user's Drive for any spreadsheet created by app matching user's register
    const found = await findUserSpreadsheet(this.accessToken, this.user.displayName || 'Sacerdote');
    if (found) {
      this.spreadsheetId = found.id;
      this.spreadsheetUrl = found.webViewLink || `https://docs.google.com/spreadsheets/d/${found.id}/edit`;
      localStorage.setItem(`registro_messe_sheet_${this.user.uid}`, found.id);
      return { hasArchive: true, spreadsheetId: found.id, spreadsheetUrl: this.spreadsheetUrl };
    }

    return { hasArchive: false };
  }

  async createArchive(user: UserProfile, diocesi: string = 'Diocesi'): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    const fullName = user.displayName || user.email?.split('@')[0] || 'Sacerdote';
    const now = new Date().toISOString();
    const nameParts = (user.displayName || '').split(' ');
    const nome = nameParts[0] || 'Don';
    const cognome = nameParts.slice(1).join(' ') || '';

    const initialSettings: Impostazioni = {
      userId: user.uid,
      nome,
      cognome,
      email: user.email || '',
      diocesi,
      dataCreazioneAccount: now,
      dataUltimaModifica: now,
      versioneApp: '1.0.0',
    };

    // 1. Create spreadsheet in Google Sheets
    const title = `Registro Messe - ${fullName}`;
    const result = await createPersonalSpreadsheet(this.accessToken, title, initialSettings);
    this.spreadsheetId = result.spreadsheetId;
    this.spreadsheetUrl = result.spreadsheetUrl;
    localStorage.setItem(`registro_messe_sheet_${user.uid}`, result.spreadsheetId);

    // 2. Try to move to 'Registro delle Messe' folder in user's Drive
    try {
      const folderId = await getOrCreateAppFolder(this.accessToken);
      if (folderId) {
        await moveFileToFolder(this.accessToken, result.spreadsheetId, folderId);
      }
    } catch (e) {
      console.warn('Folder assignment skipped:', e);
    }

    return result;
  }

  private ensureSpreadsheetId(): string {
    if (!this.spreadsheetId) {
      throw new Error('ARCHIVE_NOT_FOUND');
    }
    return this.spreadsheetId;
  }

  async getMasses(): Promise<Messa[]> {
    const sId = this.ensureSpreadsheetId();
    try {
      const rows = await readSheetRange(this.accessToken, sId, 'Messe!A2:T');
      if (!rows || rows.length === 0) return [];

      return rows
        .filter((r) => r && r[0]) // must have id
        .map(rowToMessa)
        .sort((a, b) => (b.dataOra || b.data).localeCompare(a.dataOra || a.data));
    } catch (err: any) {
      if (err.message === 'ARCHIVE_NOT_FOUND') {
        localStorage.removeItem(`registro_messe_sheet_${this.user.uid}`);
        this.spreadsheetId = null;
      }
      throw err;
    }
  }

  async getMass(id: string): Promise<Messa | null> {
    const masses = await this.getMasses();
    return masses.find((m) => m.id === id) || null;
  }

  async createMass(data: Omit<Messa, 'id' | 'creatoIl' | 'modificatoIl'>): Promise<Messa> {
    const sId = this.ensureSpreadsheetId();
    const now = new Date().toISOString();
    const newMass: Messa = {
      ...data,
      id: `messa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      creatoIl: now,
      modificatoIl: now,
    };

    const row = messaToRow(newMass);
    await appendSheetRow(this.accessToken, sId, 'Messe!A:T', row);

    // Increment place usage automatically
    if (newMass.luogo) {
      await this.createOrIncrementPlace({
        nome: newMass.luogo,
        indirizzo: newMass.indirizzo,
        latitudine: newMass.latitudine,
        longitudine: newMass.longitudine,
      }).catch((e) => console.warn('Could not increment place:', e));
    }

    return newMass;
  }

  async updateMass(id: string, data: Partial<Messa>): Promise<Messa> {
    const sId = this.ensureSpreadsheetId();
    const rows = await readSheetRange(this.accessToken, sId, 'Messe!A1:T');
    // Row 0 is header. Rows start at index 1 -> sheet row 2
    let targetRowIndex = -1;
    let existingMessa: Messa | null = null;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][0] === id) {
        targetRowIndex = i + 1; // 1-based row number for Sheets A1 notation
        existingMessa = rowToMessa(rows[i]);
        break;
      }
    }

    if (targetRowIndex === -1 || !existingMessa) {
      throw new Error(`Messa con ID ${id} non trovata nel registro.`);
    }

    const updatedMessa: Messa = {
      ...existingMessa,
      ...data,
      id,
      modificatoIl: new Date().toISOString(),
    };

    const row = messaToRow(updatedMessa);
    await updateSheetRow(this.accessToken, sId, `Messe!A${targetRowIndex}:T${targetRowIndex}`, row);
    return updatedMessa;
  }

  async deleteMass(id: string): Promise<boolean> {
    const sId = this.ensureSpreadsheetId();
    const rows = await readSheetRange(this.accessToken, sId, 'Messe!A1:T');
    let zeroBasedIndex = -1;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][0] === id) {
        zeroBasedIndex = i;
        break;
      }
    }

    if (zeroBasedIndex === -1) {
      throw new Error(`Messa con ID ${id} non trovata nel registro.`);
    }

    if (this.messeSheetId === null) {
      this.messeSheetId = await getSheetIdByTitle(this.accessToken, sId, 'Messe');
    }
    if (this.messeSheetId === null) {
      throw new Error('Impossibile ottenere l\'ID del foglio Messe.');
    }

    await deleteSheetRow(this.accessToken, sId, this.messeSheetId, zeroBasedIndex);
    return true;
  }

  async getPlaces(): Promise<Luogo[]> {
    const sId = this.ensureSpreadsheetId();
    const rows = await readSheetRange(this.accessToken, sId, 'Luoghi!A2:G');
    if (!rows || rows.length === 0) return [];

    return rows
      .filter((r) => r && r[0])
      .map(rowToLuogo)
      .sort((a, b) => b.numeroUtilizzi - a.numeroUtilizzi);
  }

  async createOrIncrementPlace(placeData: {
    nome: string;
    indirizzo?: string;
    latitudine?: number | null;
    longitudine?: number | null;
  }): Promise<Luogo> {
    const sId = this.ensureSpreadsheetId();
    const rows = await readSheetRange(this.accessToken, sId, 'Luoghi!A1:G');
    const today = new Date().toISOString().split('T')[0];

    const cleanName = placeData.nome.trim();
    let existingRowIndex = -1;
    let existingLuogo: Luogo | null = null;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][1] && rows[i][1].trim().toLowerCase() === cleanName.toLowerCase()) {
        existingRowIndex = i + 1;
        existingLuogo = rowToLuogo(rows[i]);
        break;
      }
    }

    if (existingRowIndex !== -1 && existingLuogo) {
      existingLuogo.numeroUtilizzi = (existingLuogo.numeroUtilizzi || 0) + 1;
      existingLuogo.ultimaUtilizzazione = today;
      if (placeData.indirizzo && !existingLuogo.indirizzo) existingLuogo.indirizzo = placeData.indirizzo;
      if (placeData.latitudine !== undefined && placeData.latitudine !== null) existingLuogo.latitudine = placeData.latitudine;
      if (placeData.longitudine !== undefined && placeData.longitudine !== null) existingLuogo.longitudine = placeData.longitudine;

      const row = luogoToRow(existingLuogo);
      await updateSheetRow(this.accessToken, sId, `Luoghi!A${existingRowIndex}:G${existingRowIndex}`, row);
      return existingLuogo;
    }

    const newLuogo: Luogo = {
      id: `luogo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      nome: cleanName,
      indirizzo: placeData.indirizzo || '',
      latitudine: placeData.latitudine ?? null,
      longitudine: placeData.longitudine ?? null,
      numeroUtilizzi: 1,
      ultimaUtilizzazione: today,
    };

    const row = luogoToRow(newLuogo);
    await appendSheetRow(this.accessToken, sId, 'Luoghi!A:G', row);
    return newLuogo;
  }

  async deletePlace(id: string): Promise<boolean> {
    const sId = this.ensureSpreadsheetId();
    const rows = await readSheetRange(this.accessToken, sId, 'Luoghi!A1:G');
    let zeroBasedIndex = -1;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][0] === id) {
        zeroBasedIndex = i;
        break;
      }
    }

    if (zeroBasedIndex === -1) return false;

    if (this.luoghiSheetId === null) {
      this.luoghiSheetId = await getSheetIdByTitle(this.accessToken, sId, 'Luoghi');
    }
    if (this.luoghiSheetId === null) return false;

    await deleteSheetRow(this.accessToken, sId, this.luoghiSheetId, zeroBasedIndex);
    return true;
  }

  async getSettings(): Promise<Impostazioni | null> {
    const sId = this.ensureSpreadsheetId();
    const rows = await readSheetRange(this.accessToken, sId, 'Impostazioni!A2:H2');
    if (!rows || rows.length === 0 || !rows[0]) return null;

    const r = rows[0];
    return {
      userId: r[0] || this.user.uid,
      nome: r[1] || '',
      cognome: r[2] || '',
      email: r[3] || this.user.email || '',
      diocesi: r[4] || '',
      dataCreazioneAccount: r[5] || '',
      dataUltimaModifica: r[6] || '',
      versioneApp: r[7] || '1.0.0',
      spreadsheetId: sId,
      spreadsheetUrl: this.getSpreadsheetUrl() || undefined,
    };
  }

  async saveSettings(settings: Partial<Impostazioni>): Promise<Impostazioni> {
    const sId = this.ensureSpreadsheetId();
    const current = (await this.getSettings()) || {
      userId: this.user.uid,
      nome: this.user.displayName?.split(' ')[0] || '',
      cognome: this.user.displayName?.split(' ').slice(1).join(' ') || '',
      email: this.user.email || '',
      diocesi: '',
      dataCreazioneAccount: new Date().toISOString(),
      dataUltimaModifica: new Date().toISOString(),
      versioneApp: '1.0.0',
    };

    const updated: Impostazioni = {
      ...current,
      ...settings,
      dataUltimaModifica: new Date().toISOString(),
      spreadsheetId: sId,
      spreadsheetUrl: this.getSpreadsheetUrl() || undefined,
    };

    const row = [
      updated.userId,
      updated.nome,
      updated.cognome,
      updated.email,
      updated.diocesi,
      updated.dataCreazioneAccount,
      updated.dataUltimaModifica,
      updated.versioneApp,
    ];

    await updateSheetRow(this.accessToken, sId, 'Impostazioni!A2:H2', row);
    return updated;
  }

  async resetArchive(): Promise<boolean> {
    if (this.spreadsheetId) {
      await deleteSpreadsheetFile(this.accessToken, this.spreadsheetId).catch((e) =>
        console.warn('Errore eliminazione file Drive:', e)
      );
      localStorage.removeItem(`registro_messe_sheet_${this.user.uid}`);
      this.spreadsheetId = null;
    }
    return true;
  }
}
