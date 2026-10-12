# Integrazione Google Calendar: Visualizzazione Eventi e Sincronizzazione Messe

Integrazione bidirezionale con Google Calendar che consente di visualizzare gli impegni personali e parrocchiali integrati nel calendario liturgico mensile e di sincronizzare opzionalmente ogni celebrazione in un calendario Google dedicato ("Registro Messe").

### User Review & Critical Decisions

> [!IMPORTANT]
> Decisioni confermate dall'utente nella fase preliminare di chiarimento:

- **Visualizzazione Unificata**: Gli eventi personali di Google Calendar saranno mostrati direttamente all'interno della vista *Calendario* già esistente, con indicatori grafici distintivi rispetto alle Messe e alle celebrazioni del giorno.
- **Sincronizzazione Intelligente con Selettore**: Il salvataggio della Messa in Google Calendar sarà attivo di default sia nelle *Impostazioni* che nel modulo di registrazione della singola Messa, con un interruttore rapido (toggle) per escludere celebrazioni private o non rilevanti per l'agenda.
- **Calendario Dedicato "Registro Messe"**: L'applicazione verificherà l'esistenza o creerà automaticamente un calendario secondario intitolato **"Registro Messe"** su Google Calendar dell'utente, mantenendo ordinata l'agenda personale senza sovrapporre o confondere gli impegni quotidiani.

---

### 1. Overview & Core Concept

- **Che cosa fa**: Consente al sacerdote di avere un'unica vista d'insieme su celebrazioni liturgiche, Messe celebrate/programmate e appuntamenti personali o pastorali (catechismi, incontri con famiglie, impegni diocesani) recuperati da Google Calendar. Alla registrazione di una nuova Messa (o modifica), l'evento viene sincronizzato con orario, chiesa/luogo, intenzione di suffragio e grado liturgico.
- **Destinatari**: Sacerdoti diocesani, parroci e cappellani che gestiscono un'agenda parrocchiale e desiderano coordinare il registro liturgico con i propri dispositivi mobili sincronizzati con Google Calendar.
- **Valore principale**: Elimina la duplicazione del lavoro: annotare la Messa nel registro aggiorna contemporaneamente l'agenda personale consultabile da smartphone o smartwatch, evitando sovrapposizioni di orari e impegni pastorali.

---

### 2. User Experience & Visual Design

- **Flussi Utente Principali**:
  1. *Consultazione Calendario Unificato*:
     - Aprendo la scheda *Calendario*, ogni casella del mese mostra:
       - Indicatore della celebrazione e colore liturgico del giorno (es. Verde, Bianco, Viola, Rosso).
       - Badge delle Messe celebrate (con luogo e orario).
       - Badge discreti degli eventi Google Calendar personali (con orario e titolo, contrassegnati con un'icona calendario azzurra/indaco distinta dal simbolo sacro ☩).
     - Cliccando su un giorno si apre il dettaglio laterale/cassetto con la suddivisione chiara tra **"Messe del giorno"** e **"Impegni da Google Calendar"**.
  2. *Registrazione Messa con Sincronizzazione*:
     - Nel form `MassFormModal`, compare l'interruttore:
       `[✓] Sincronizza su Google Calendar ("Registro Messe")` (attivo di default).
     - Al salvataggio, l'evento viene creato su Google Calendar con:
       - Titolo: *Messa [Luogo] - [Intenzione / Defunto]*
       - Descrizione: *Celebrazione liturgica: [Nome festa / Grado]. Intenzione: [Dettaglio]. Richiedente: [Famiglia].*
       - Luogo: indirizzo o nome della chiesa.
  3. *Gestione Impostazioni & Disattivazione*:
     - Nel pannello *Impostazioni*, una sezione **"Sincronizzazione Google Calendar"** mostra lo stato di connessione, l'ID del calendario "Registro Messe" collegato, l'opzione per disattivare/riattivare il salvataggio automatico di default, e un pulsante per forzare il refresh degli eventi.

- **Identità Visiva & Gerarchia**:
  - Rispetto rigoroso della linea estetica ecclesiastica: sfondo scuro notte (slate-950/slate-900) con rifiniture in ambra e oro liturgico.
  - Gli eventi liturgici e le Messe mantengono i colori liturgici autentici (Viola per defunti, Bianco, Rosso, Verde).
  - Gli eventi Google Calendar personali utilizzano un tono sobrio blu pastello/indaco (`bg-sky-950/70 border-sky-700/60 text-sky-200`) per una distinzione immediata a colpo d'occhio senza disordine visivo né pillole rumorose.

---

### 3. Key Product Decisions & Trade-Offs

- **Decisione 1: Calendario Dedicato vs. Calendario Principale**:
  - *Scelta*: Creazione e utilizzo del calendario secondario `"Registro Messe"`.
  - *Perché*: Se il sacerdote desidera nascondere o mostrare le Messe sul proprio smartphone (Google Calendar app), può farlo semplicemente attivando/disattivando la spunta del calendario "Registro Messe", senza intasare il proprio calendario primario.
  - *Alternativa scartata*: Salvare tutto nel calendario primario avrebbe reso impossibile filtrare le celebrazioni o cancellarle in blocco.

- **Decisione 2: Sincronizzazione Diretta Client-Side vs Backend**:
  - *Scelta*: Integrazione tramite Google Calendar REST API v3 con il token OAuth già autenticato dell'utente.
  - *Perché*: Rispetta pienamente l'architettura decentralizzata dell'app (nessun dato o credenziale risiede su server centrale; tutti i dati viaggiano tra il browser del sacerdote e i servizi Google di sua proprietà).

- **Decisione 3: Ambito OAuth (Scope Minimization)**:
  - *Scelta*: Aggiunta dello scope `https://www.googleapis.com/auth/calendar` tramite la procedura standard `set_up_oauth`.
  - *Perché*: Consente sia di leggere gli eventi esistenti che di creare il calendario dedicato "Registro Messe" e inserire gli eventi.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                                CLIENT                                  │
│                                                                        │
│   ┌─────────────────────┐             ┌────────────────────────────┐   │
│   │   MassFormModal     │             │       CalendarView         │   │
│   │ [✓] Sync to GCal    │             │  ┌──────────────────────┐  │   │
│   └──────────┬──────────┘             │  │ Liturgia del giorno  │  │   │
│              │                        │  ├──────────────────────┤  │   │
│              ▼                        │  │ Messe celebrate      │  │   │
│   ┌─────────────────────┐             │  ├──────────────────────┤  │   │
│   │  googleCalendar     │             │  │ Impegni GCalendar 📅 │  │   │
│   │  Service            │◄───────────►│  └──────────────────────┘  │   │
│   └──────────┬──────────┘             └────────────────────────────┘   │
│              │                                                         │
└──────────────┼─────────────────────────────────────────────────────────┘
               │ OAuth Bearer Token
               ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        GOOGLE WORKSPACE APIS                           │
│                                                                        │
│   ┌──────────────────────────────────┐                                 │
│   │ Google Calendar API v3           │                                 │
│   │ • GET /users/me/calendarList     │                                 │
│   │ • POST /calendars (create if new)│                                 │
│   │ • GET /calendars/{id}/events     │                                 │
│   │ • POST /calendars/{id}/events    │                                 │
│   │ • PATCH/DELETE events on mass edit                               │
│   └──────────────────────────────────┘                                 │
└────────────────────────────────────────────────────────────────────────┘
```

- **Entità e Struttura Dati**:
  - `GoogleCalendarEvent`: id, summary, start, end, location, description, htmlLink.
  - Estensione modello `Messa`: campo opzionale `googleCalendarEventId?: string` per mantenere il collegamento tra la riga di Google Sheets e l'evento su Google Calendar (permettendo aggiornamenti e cancellazioni sincronizzate).
  - Estensione modello `Impostazioni`: `syncGoogleCalendarDefault: boolean`, `googleCalendarId?: string`.

- **Mappatura Flussi e Componenti**:
  - `googleCalendarService.ts`: Gestisce il recupero dei calendari, la ricerca/creazione di "Registro Messe", il fetch degli eventi del mese corrente e l'inserimento/aggiornamento/cancellazione eventi.
  - `CalendarView.tsx`: Arricchito con il caricamento asincrono degli eventi da Google Calendar, selettore per filtrare la vista ("Tutti gli impegni", "Solo Messe", "Solo Google Calendar") e modale dettaglio evento.
  - `MassFormModal.tsx`: Include l'interruttore visivo sincronizzazione con indicatore dello stato del calendario Google.
  - `SettingsModal.tsx`: Sezione di gestione e preferenze per il calendario Google.
