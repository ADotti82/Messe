/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CelebrazioneLiturgica, ColoreLiturgico } from '../types';

const liturgyMemoryCache = new Map<string, CelebrazioneLiturgica>();

/**
 * Calculates Easter date using Anonymous Gregorian algorithm
 */
function getEasterDate(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

/**
 * Normalizes liturgical color into Italian
 */
export function normalizeLiturgicalColor(c: string): ColoreLiturgico {
  const lower = (c || '').toLowerCase();
  if (lower.includes('white') || lower.includes('bianco')) return 'Bianco';
  if (lower.includes('red') || lower.includes('rosso')) return 'Rosso';
  if (lower.includes('violet') || lower.includes('purple') || lower.includes('viola')) return 'Viola';
  if (lower.includes('rose') || lower.includes('rosa')) return 'Rosa';
  if (lower.includes('black') || lower.includes('nero')) return 'Nero';
  return 'Verde';
}

/**
 * Normalizes rank into Italian
 */
export function normalizeRank(r: string): string {
  const lower = (r || '').toLowerCase();
  if (lower.includes('solemnity') || lower.includes('solennità')) return 'Solennità';
  if (lower.includes('feast') || lower.includes('festa')) return 'Festa';
  if (lower.includes('optional') || lower.includes('facoltativa')) return 'Memoria facoltativa';
  if (lower.includes('memorial') || lower.includes('memoria')) return 'Memoria';
  if (lower.includes('commemoration')) return 'Commemorazione';
  return 'Feriale';
}

/**
 * Normalizes liturgical season into Italian
 */
export function normalizeSeason(s: string): string {
  const lower = (s || '').toLowerCase();
  if (lower.includes('advent') || lower.includes('avvento')) return 'Tempo di Avvento';
  if (lower.includes('christmas') || lower.includes('natale')) return 'Tempo di Natale';
  if (lower.includes('lent') || lower.includes('quaresima')) return 'Tempo di Quaresima';
  if (lower.includes('easter_triduum') || lower.includes('triduo')) return 'Triduo Pasquale';
  if (lower.includes('easter') || lower.includes('pasqua')) return 'Tempo di Pasqua';
  return 'Tempo Ordinario';
}

/**
 * Local Italian General Roman Calendar calculation engine (Fallback)
 */
export function getLocalLiturgicalCelebration(dateStr: string): CelebrazioneLiturgica {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay(); // 0 is Sunday

  const keyMMDD = `${monthStr.padStart(2, '0')}-${dayStr.padStart(2, '0')}`;

  // Fixed major solemnities and feasts of General-IT
  const fixedSolemnities: Record<string, { title: string; rank: string; color: ColoreLiturgico }> = {
    '01-01': { title: 'Maria Santissima Madre di Dio', rank: 'Solennità', color: 'Bianco' },
    '01-06': { title: 'Epifania del Signore', rank: 'Solennità', color: 'Bianco' },
    '02-02': { title: 'Presentazione del Signore al Tempio', rank: 'Festa', color: 'Bianco' },
    '03-19': { title: 'San Giuseppe, sposo della Beata Vergine Maria', rank: 'Solennità', color: 'Bianco' },
    '03-25': { title: 'Annunciazione del Signore', rank: 'Solennità', color: 'Bianco' },
    '04-25': { title: 'San Marco, evangelista', rank: 'Festa', color: 'Rosso' },
    '05-01': { title: 'San Giuseppe lavoratore', rank: 'Memoria facoltativa', color: 'Bianco' },
    '06-24': { title: 'Natività di San Giovanni Battista', rank: 'Solennità', color: 'Bianco' },
    '06-29': { title: 'Santi Pietro e Paolo, apostoli', rank: 'Solennità', color: 'Rosso' },
    '07-25': { title: 'San Giacomo, apostolo', rank: 'Festa', color: 'Rosso' },
    '08-06': { title: 'Trasfigurazione del Signore', rank: 'Festa', color: 'Bianco' },
    '08-10': { title: 'San Lorenzo, diacono e martire', rank: 'Festa', color: 'Rosso' },
    '08-15': { title: 'Assunzione della Beata Vergine Maria', rank: 'Solennità', color: 'Bianco' },
    '09-08': { title: 'Natività della Beata Vergine Maria', rank: 'Festa', color: 'Bianco' },
    '09-14': { title: 'Esaltazione della Santa Croce', rank: 'Festa', color: 'Rosso' },
    '09-29': { title: 'Santi Michele, Gabriele e Raffaele, Arcangeli', rank: 'Festa', color: 'Bianco' },
    '10-04': { title: 'San Francesco d\'Assisi, patrono d\'Italia', rank: 'Festa', color: 'Bianco' },
    '11-01': { title: 'Tutti i Santi', rank: 'Solennità', color: 'Bianco' },
    '11-02': { title: 'Commemorazione di tutti i fedeli defunti', rank: 'Commemorazione', color: 'Viola' },
    '12-08': { title: 'Immacolata Concezione della Beata Vergine Maria', rank: 'Solennità', color: 'Bianco' },
    '12-25': { title: 'Natale del Signore', rank: 'Solennità', color: 'Bianco' },
    '12-26': { title: 'Santo Stefano, primo martire', rank: 'Festa', color: 'Rosso' },
    '12-27': { title: 'San Giovanni, apostolo ed evangelista', rank: 'Festa', color: 'Bianco' },
    '12-28': { title: 'Santi Innocenti, martiri', rank: 'Festa', color: 'Rosso' },
  };

  if (fixedSolemnities[keyMMDD]) {
    const item = fixedSolemnities[keyMMDD];
    return {
      titolo: item.title,
      grado: item.rank,
      colore: item.color,
      tempoLiturgico: month === 12 || month === 1 ? 'Tempo di Natale' : 'Tempo Ordinario',
      settimanaLiturgica: '',
      fonte: 'Archivio locale',
    };
  }

  // Easter calculation
  const easter = getEasterDate(year);
  const easterDate = new Date(year, easter.month - 1, easter.day);
  const diffDaysFromEaster = Math.round((dateObj.getTime() - easterDate.getTime()) / (1000 * 60 * 60 * 24));

  // Easter season offsets
  if (diffDaysFromEaster === 0) {
    return {
      titolo: 'Domenica di Pasqua nella Risurrezione del Signore',
      grado: 'Solennità',
      colore: 'Bianco',
      tempoLiturgico: 'Tempo di Pasqua',
      settimanaLiturgica: 1,
      fonte: 'Archivio locale',
    };
  }
  if (diffDaysFromEaster === -2) {
    return {
      titolo: 'Venerdì Santo - Passione del Signore',
      grado: 'Solennità',
      colore: 'Rosso',
      tempoLiturgico: 'Triduo Pasquale',
      settimanaLiturgica: '',
      fonte: 'Archivio locale',
    };
  }
  if (diffDaysFromEaster === -3) {
    return {
      titolo: 'Giovedì Santo - Messa nella Cena del Signore',
      grado: 'Solennità',
      colore: 'Bianco',
      tempoLiturgico: 'Triduo Pasquale',
      settimanaLiturgica: '',
      fonte: 'Archivio locale',
    };
  }
  if (diffDaysFromEaster === -7) {
    return {
      titolo: 'Domenica delle Palme e della Passione del Signore',
      grado: 'Solennità',
      colore: 'Rosso',
      tempoLiturgico: 'Tempo di Quaresima',
      settimanaLiturgica: 6,
      fonte: 'Archivio locale',
    };
  }
  if (diffDaysFromEaster === -46) {
    return {
      titolo: 'Mercoledì delle Ceneri',
      grado: 'Feriale',
      colore: 'Viola',
      tempoLiturgico: 'Tempo di Quaresima',
      settimanaLiturgica: 1,
      fonte: 'Archivio locale',
    };
  }
  if (diffDaysFromEaster === 49) {
    return {
      titolo: 'Domenica di Pentecoste',
      grado: 'Solennità',
      colore: 'Rosso',
      tempoLiturgico: 'Tempo di Pasqua',
      settimanaLiturgica: 7,
      fonte: 'Archivio locale',
    };
  }

  // Quaresima range
  if (diffDaysFromEaster > -46 && diffDaysFromEaster < 0) {
    const lentWeek = Math.max(1, Math.floor((diffDaysFromEaster + 46) / 7) + 1);
    return {
      titolo: dayOfWeek === 0 ? `${lentWeek}ª Domenica di Quaresima` : `Feria del Tempo di Quaresima`,
      grado: dayOfWeek === 0 ? 'Domenica' : 'Feriale',
      colore: 'Viola',
      tempoLiturgico: 'Tempo di Quaresima',
      settimanaLiturgica: lentWeek,
      fonte: 'Archivio locale',
    };
  }

  // Pasqua range
  if (diffDaysFromEaster > 0 && diffDaysFromEaster <= 49) {
    const easterWeek = Math.floor(diffDaysFromEaster / 7) + 1;
    return {
      titolo: dayOfWeek === 0 ? `${easterWeek}ª Domenica di Pasqua` : `Feria del Tempo di Pasqua`,
      grado: dayOfWeek === 0 ? 'Domenica' : 'Feriale',
      colore: 'Bianco',
      tempoLiturgico: 'Tempo di Pasqua',
      settimanaLiturgica: easterWeek,
      fonte: 'Archivio locale',
    };
  }

  // Avvento range
  const christmasDate = new Date(year, 11, 25);
  const advent1Date = new Date(christmasDate);
  advent1Date.setDate(christmasDate.getDate() - christmasDate.getDay() - 21); // 4th Sunday before Christmas
  if (dateObj >= advent1Date && dateObj < christmasDate) {
    const adventWeek = Math.floor((dateObj.getTime() - advent1Date.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1;
    return {
      titolo: dayOfWeek === 0 ? `${adventWeek}ª Domenica di Avvento` : `Feria del Tempo di Avvento`,
      grado: dayOfWeek === 0 ? 'Domenica' : 'Feriale',
      colore: 'Viola',
      tempoLiturgico: 'Tempo di Avvento',
      settimanaLiturgica: adventWeek,
      fonte: 'Archivio locale',
    };
  }

  // Tempo Ordinario default
  const weekdaysIt = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  return {
    titolo: dayOfWeek === 0 ? 'Domenica del Tempo Ordinario' : `${weekdaysIt[dayOfWeek]} del Tempo Ordinario`,
    grado: dayOfWeek === 0 ? 'Domenica' : 'Feriale',
    colore: 'Verde',
    tempoLiturgico: 'Tempo Ordinario',
    settimanaLiturgica: '',
    fonte: 'Archivio locale',
  };
}

/**
 * Fetches liturgical information for a date, trying CalAPI first, then local engine fallback
 */
export async function fetchLiturgicalCelebration(dateStr: string): Promise<CelebrazioneLiturgica> {
  if (liturgyMemoryCache.has(dateStr)) {
    return liturgyMemoryCache.get(dateStr)!;
  }

  // Check localStorage cache (non-sensitive)
  const stored = localStorage.getItem(`liturgy_cache_${dateStr}`);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      liturgyMemoryCache.set(dateStr, parsed);
      return parsed;
    } catch {
      // Ignore
    }
  }

  const [year, month, day] = dateStr.split('-');

  // 1. Try CalAPI via server proxy
  try {
    const res = await fetch(`/api/calapi/${year}/${month}/${day}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.celebrations && data.celebrations.length > 0) {
        const topCelebration = data.celebrations[0];
        const result: CelebrazioneLiturgica = {
          titolo: topCelebration.title || 'Celebrazione del giorno',
          grado: normalizeRank(topCelebration.rank),
          colore: normalizeLiturgicalColor(topCelebration.colour),
          tempoLiturgico: normalizeSeason(data.season),
          settimanaLiturgica: data.season_week || '',
          giornoSettimana: data.weekday,
          fonte: 'CalAPI',
        };

        liturgyMemoryCache.set(dateStr, result);
        try {
          localStorage.setItem(`liturgy_cache_${dateStr}`, JSON.stringify(result));
        } catch {
          // Ignore storage quota
        }
        return result;
      }
    }
  } catch (err) {
    console.warn(`CalAPI fetch error for date ${dateStr}:`, err);
  }

  // 2. Fallback to Local Liturgical Calendar Engine
  const localResult = getLocalLiturgicalCelebration(dateStr);
  liturgyMemoryCache.set(dateStr, localResult);
  return localResult;
}
