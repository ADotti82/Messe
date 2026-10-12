/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Messa, GoogleCalendarEvent } from '../types';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
export const REGISTRO_MESSE_CALENDAR_NAME = 'Registro Messe';

/**
 * Trova o crea il calendario secondario dedicato "Registro Messe" su Google Calendar
 */
export async function getOrCreateRegistroMesseCalendar(accessToken: string): Promise<string> {
  if (accessToken === 'demo-token') {
    return 'demo-registro-messe-calendar-id';
  }

  // 1. Cerca nell'elenco dei calendari dell'utente
  const listRes = await fetch(`${CALENDAR_API_BASE}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listRes.ok) {
    throw new Error(`Errore recupero calendari Google: ${listRes.statusText}`);
  }

  const listData = await listRes.json();
  const existingCal = (listData.items || []).find(
    (c: any) => c.summary && c.summary.trim().toLowerCase() === REGISTRO_MESSE_CALENDAR_NAME.toLowerCase()
  );

  if (existingCal && existingCal.id) {
    return existingCal.id;
  }

  // 2. Se non esiste, crea il calendario secondario dedicato
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome';
  const createRes = await fetch(`${CALENDAR_API_BASE}/calendars`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: REGISTRO_MESSE_CALENDAR_NAME,
      description: 'Calendario delle celebrazioni liturgiche e intenzioni di Messa - Registro delle Messe',
      timeZone: userTimeZone,
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Errore creazione calendario "Registro Messe": ${createRes.statusText}`);
  }

  const newCal = await createRes.json();
  return newCal.id;
}

/**
 * Recupera gli eventi dal calendario personale principale e dal calendario "Registro Messe"
 * per un intervallo temporale (es. mese corrente).
 */
export async function fetchAllCalendarEvents(
  accessToken: string,
  timeMinISO: string,
  timeMaxISO: string,
  registroMesseCalId?: string
): Promise<GoogleCalendarEvent[]> {
  if (accessToken === 'demo-token') {
    return [
      {
        id: 'demo-event-1',
        summary: 'Incontro catechisti parrocchiali',
        description: 'Programmazione anno pastorale in canonica',
        location: 'Canonica Santa Maria',
        start: { dateTime: `${timeMinISO.slice(0, 7)}-10T16:00:00+02:00` },
        end: { dateTime: `${timeMinISO.slice(0, 7)}-10T17:30:00+02:00` },
        isRegistroMesse: false,
      },
      {
        id: 'demo-event-2',
        summary: 'Consiglio Pastorale Parrocchiale',
        description: 'Verifica attività e feste patronali',
        location: 'Salone parrocchiale',
        start: { dateTime: `${timeMinISO.slice(0, 7)}-20T20:45:00+02:00` },
        end: { dateTime: `${timeMinISO.slice(0, 7)}-20T22:15:00+02:00` },
        isRegistroMesse: false,
      },
    ];
  }

  const allEvents: GoogleCalendarEvent[] = [];

  // Helper per caricare eventi da un calendario
  const fetchFromCalendar = async (calId: string, isRegistro: boolean) => {
    try {
      const url = new URL(`${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calId)}/events`);
      url.searchParams.set('timeMin', timeMinISO);
      url.searchParams.set('timeMax', timeMaxISO);
      url.searchParams.set('singleEvents', 'true');
      url.searchParams.set('orderBy', 'startTime');
      url.searchParams.set('maxResults', '250');

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        console.warn(`Errore fetch eventi per calendario ${calId}:`, res.statusText);
        return;
      }

      const data = await res.json();
      for (const item of data.items || []) {
        // Ignora eventi cancellati
        if (item.status === 'cancelled') continue;

        allEvents.push({
          id: item.id,
          summary: item.summary || '(Senza titolo)',
          description: item.description,
          location: item.location,
          start: item.start || {},
          end: item.end || {},
          htmlLink: item.htmlLink,
          colorId: item.colorId,
          isRegistroMesse: isRegistro,
        });
      }
    } catch (err) {
      console.warn(`Fetch eventi fallita per ${calId}:`, err);
    }
  };

  // 1. Carica eventi personali dal calendario 'primary'
  await fetchFromCalendar('primary', false);

  // 2. Se esiste un calendario dedicato "Registro Messe", carica anche quelli
  if (registroMesseCalId && registroMesseCalId !== 'primary') {
    await fetchFromCalendar(registroMesseCalId, true);
  }

  return allEvents;
}

/**
 * Costruisce il payload dell'evento Google Calendar a partire dai dati della Messa
 */
function buildEventPayloadFromMass(massa: Messa) {
  let title = `Messa a ${massa.luogo || 'Chiesa'}`;
  if (massa.tipoIntenzione === 'Per un defunto' && massa.nomeDefunto) {
    title = `Messa a ${massa.luogo} - † ${massa.nomeDefunto}`;
  } else if (massa.intenzione) {
    title = `Messa a ${massa.luogo} - ${massa.intenzione}`;
  }

  const descParts: string[] = [];
  if (massa.celebrazione) {
    descParts.push(`Celebrazione: ${massa.celebrazione} (${massa.grado || 'Feriale'})`);
  }
  if (massa.coloreLiturgico) {
    descParts.push(`Colore liturgico: ${massa.coloreLiturgico}`);
  }
  if (massa.tipoIntenzione && massa.tipoIntenzione !== 'Nessuna') {
    descParts.push(`Intenzione: ${massa.tipoIntenzione}${massa.nomeDefunto ? ` per ${massa.nomeDefunto}` : ''}`);
    if (massa.richiedente) {
      descParts.push(`Richiesta da: ${massa.richiedente}`);
    }
  }
  if (massa.note) {
    descParts.push(`Note: ${massa.note}`);
  }

  // Calcolo data e ora inizio/fine (durata stimata 45 min)
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome';
  const startDateTime = `${massa.data}T${massa.ora || '08:00'}:00`;

  const [hours, minutes] = (massa.ora || '08:00').split(':').map(Number);
  const endTotalMin = hours * 60 + minutes + 45;
  const endHours = Math.floor(endTotalMin / 60) % 24;
  const endMinutes = endTotalMin % 60;
  const endHoursStr = String(endHours).padStart(2, '0');
  const endMinutesStr = String(endMinutes).padStart(2, '0');
  const endDateTime = `${massa.data}T${endHoursStr}:${endMinutesStr}:00`;

  return {
    summary: title,
    description: descParts.join('\n\n'),
    location: massa.indirizzo ? `${massa.luogo}, ${massa.indirizzo}` : massa.luogo,
    start: {
      dateTime: `${startDateTime}`,
      timeZone,
    },
    end: {
      dateTime: `${endDateTime}`,
      timeZone,
    },
  };
}

/**
 * Crea un evento su Google Calendar corrispondente alla Messa
 */
export async function createMassCalendarEvent(
  accessToken: string,
  calendarId: string,
  massa: Messa
): Promise<string> {
  if (accessToken === 'demo-token') {
    return 'demo-event-' + Date.now();
  }

  const eventPayload = buildEventPayloadFromMass(massa);

  const res = await fetch(`${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Errore creazione evento Google Calendar: ${res.statusText} (${errorBody})`);
  }

  const created = await res.json();
  return created.id;
}

/**
 * Aggiorna un evento esistente su Google Calendar
 */
export async function updateMassCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  massa: Messa
): Promise<void> {
  if (accessToken === 'demo-token') return;

  const eventPayload = buildEventPayloadFromMass(massa);

  const res = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    }
  );

  if (!res.ok) {
    console.warn(`Impossibile aggiornare evento Google Calendar ${eventId}:`, res.statusText);
  }
}

/**
 * Rimuove un evento da Google Calendar
 */
export async function deleteMassCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  if (accessToken === 'demo-token') return;

  try {
    await fetch(
      `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
  } catch (err) {
    console.warn(`Impossibile eliminare evento Google Calendar ${eventId}:`, err);
  }
}
