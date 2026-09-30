/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Messa } from '../types';

export interface AnniversarioItem {
  id: string;
  messaOriginaleId: string;
  nomeDefunto: string;
  dataRiferimento: string; // YYYY-MM-DD
  tipoRicorrenza: 'trigesimo' | 'anniversario';
  anniTrascorsi?: number;
  dataRicorrenza: string; // YYYY-MM-DD della ricorrenza quest'anno o nei 30gg
  giorniMancanti: number; // 0 = Oggi, positivo = futuro (es. tra 3gg), negativo = passato da pochi giorni
  luogoAbituale: string;
  intenzioneOriginale?: string;
  richiedente?: string;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calcola i trigesimi e gli anniversari imminenti (da 7 giorni fa a 30 giorni nel futuro)
 */
export function getAnniversariImminenti(messe: Messa[], referenceDateStr?: string): AnniversarioItem[] {
  const today = referenceDateStr ? parseDate(referenceDateStr) : new Date();
  today.setHours(0, 0, 0, 0);

  const results: AnniversarioItem[] = [];

  // Mappa i defunti univoci per evitare duplicati se ci sono state più Messe per la stessa persona
  const defuntiMap = new Map<string, Messa>();

  for (const m of messe) {
    if (m.tipoIntenzione === 'Per un defunto' && m.nomeDefunto?.trim()) {
      const key = m.nomeDefunto.trim().toLowerCase();
      // Teniamo la celebrazione più vecchia (o quella con dataMorte)
      const existing = defuntiMap.get(key);
      if (!existing || (m.dataMorte && !existing.dataMorte) || m.data < existing.data) {
        defuntiMap.set(key, m);
      }
    }
  }

  const msPerDay = 1000 * 60 * 60 * 24;

  for (const [, messa] of defuntiMap.entries()) {
    const baseDateStr = messa.dataMorte || messa.data;
    if (!baseDateStr) continue;

    const baseDate = parseDate(baseDateStr);
    const baseYear = baseDate.getFullYear();
    const currentYear = today.getFullYear();

    // 1. Verifica Trigesimo (30 giorni esatti dalla morte o dalla Messa)
    const trigesimoDate = new Date(baseDate.getTime() + 30 * msPerDay);
    const diffDaysTrigesimo = Math.round((trigesimoDate.getTime() - today.getTime()) / msPerDay);

    // Consideriamo il trigesimo se cade tra -7 giorni e +35 giorni da oggi
    if (diffDaysTrigesimo >= -7 && diffDaysTrigesimo <= 35) {
      results.push({
        id: `trigesimo-${messa.id}`,
        messaOriginaleId: messa.id,
        nomeDefunto: messa.nomeDefunto,
        dataRiferimento: baseDateStr,
        tipoRicorrenza: 'trigesimo',
        dataRicorrenza: formatDateStr(trigesimoDate),
        giorniMancanti: diffDaysTrigesimo,
        luogoAbituale: messa.luogo,
        intenzioneOriginale: messa.intenzione,
        richiedente: messa.richiedente,
      });
    }

    // 2. Verifica Anniversari Annuali (1°, 2°, 3°, ... anno)
    // Se la persona è deceduta o celebrata in un anno precedente
    if (baseYear < currentYear) {
      const yearsElapsed = currentYear - baseYear;
      // Data ricorrenza per l'anno in corso
      const anniversaryDateThisYear = new Date(currentYear, baseDate.getMonth(), baseDate.getDate());
      const diffDaysAnniversary = Math.round(
        (anniversaryDateThisYear.getTime() - today.getTime()) / msPerDay
      );

      // Tra -7 giorni (recente) e +45 giorni (imminente)
      if (diffDaysAnniversary >= -7 && diffDaysAnniversary <= 45) {
        results.push({
          id: `anniversario-${messa.id}-${currentYear}`,
          messaOriginaleId: messa.id,
          nomeDefunto: messa.nomeDefunto,
          dataRiferimento: baseDateStr,
          tipoRicorrenza: 'anniversario',
          anniTrascorsi: yearsElapsed,
          dataRicorrenza: formatDateStr(anniversaryDateThisYear),
          giorniMancanti: diffDaysAnniversary,
          luogoAbituale: messa.luogo,
          intenzioneOriginale: messa.intenzione,
          richiedente: messa.richiedente,
        });
      }
    }
  }

  // Ordina per giorni mancanti (i più vicini prima, con oggi in evidenza)
  return results.sort((a, b) => a.giorniMancanti - b.giorniMancanti);
}
