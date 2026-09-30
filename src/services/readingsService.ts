/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LetturaItem {
  tipo: 'prima_lettura' | 'salmo' | 'seconda_lettura' | 'vangelo';
  titolo: string;
  riferimento: string;
  testo: string;
}

export interface LettureDelGiorno {
  data: string; // YYYY-MM-DD
  titoloLiturgico: string;
  letture: LetturaItem[];
  testoCompleto: string;
}

const memoryCache = new Map<string, LettureDelGiorno>();

/**
 * Recupera le letture della Messa per la data indicata (formato YYYY-MM-DD)
 */
export async function fetchLettureDelGiorno(dateStr: string): Promise<LettureDelGiorno> {
  const cleanDate = dateStr.replace(/-/g, '').slice(0, 8);

  if (memoryCache.has(cleanDate)) {
    return memoryCache.get(cleanDate)!;
  }

  try {
    const res = await fetch(`/api/letture/${cleanDate}`);
    if (!res.ok) {
      throw new Error(`Errore HTTP ${res.status}`);
    }
    const data: LettureDelGiorno = await res.json();
    memoryCache.set(cleanDate, data);
    return data;
  } catch (err: any) {
    console.warn(`Errore recupero letture per ${dateStr}:`, err);
    throw err;
  }
}
