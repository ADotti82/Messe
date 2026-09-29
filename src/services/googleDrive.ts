/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DriveFileItem {
  id: string;
  name: string;
  webViewLink?: string;
  trashed?: boolean;
}

/**
 * Searches for or creates the 'Registro delle Messe' folder in user's Drive.
 */
export async function getOrCreateAppFolder(accessToken: string): Promise<string | null> {
  try {
    // 1. Search for existing folder created with drive.file scope
    const query = encodeURIComponent("mimeType='application/vnd.google-apps.folder' and name='Registro delle Messe' and trashed=false");
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }

    // 2. Create folder if not found
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Registro delle Messe',
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (createRes.ok) {
      const folder = await createRes.json();
      return folder.id;
    }
    return null;
  } catch (err) {
    console.warn('Impossibile verificare/creare la cartella Registro delle Messe:', err);
    return null;
  }
}

/**
 * Checks if a specific spreadsheet file still exists and is accessible.
 */
export async function checkFileExists(accessToken: string, fileId: string): Promise<DriveFileItem | null> {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,trashed,webViewLink`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = await res.json();
    if (data.trashed) return null;
    return data;
  } catch (err) {
    console.error('Errore durante la verifica del file Drive:', err);
    return null;
  }
}

/**
 * Searches for any existing spreadsheet created for the user.
 */
export async function findUserSpreadsheet(accessToken: string, fullName: string): Promise<DriveFileItem | null> {
  try {
    const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&orderBy=createdTime desc`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data.files || data.files.length === 0) return null;

    // Prefer file matching "Registro Messe"
    const match = data.files.find((f: any) => f.name.includes('Registro Messe')) || data.files[0];
    return match;
  } catch (err) {
    console.error('Errore durante la ricerca dello spreadsheet:', err);
    return null;
  }
}

/**
 * Moves file into a specific parent folder
 */
export async function moveFileToFolder(accessToken: string, fileId: string, folderId: string): Promise<void> {
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${folderId}&enforceSingleParent=true`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (err) {
    console.warn('Non è stato possibile spostare il file nella cartella:', err);
  }
}

/**
 * Deletes the spreadsheet file from user's Drive upon explicit request.
 */
export async function deleteSpreadsheetFile(accessToken: string, fileId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.ok;
  } catch (err) {
    console.error('Errore durante eliminazione file Google Drive:', err);
    return false;
  }
}
