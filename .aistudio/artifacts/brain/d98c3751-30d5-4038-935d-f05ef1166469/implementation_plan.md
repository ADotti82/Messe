# Risoluzione Errore Credenziali Google OAuth & Rinnovo Automatico Sessione

Risoluzione definitiva dell'errore `Request had invalid authentication credentials` (HTTP 401) causato dalla scadenza naturale dei token temporanei di Google OAuth 2.0 o dalla presenza di token obsoleti salvati nella cache del browser.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Causa identificata del problema**:
> I token di accesso Google OAuth 2.0 (emessi da Google Identity Services e Firebase) hanno una durata predefinita di 60 minuti. Attualmente il token viene salvato nel `localStorage` del browser ma non viene verificato rispetto alla data di scadenza al momento del riavvio dell'app. Di conseguenza, quando il token scade, le chiamate a Google Drive, Fogli o Google Calendar restituiscono l'errore:
> `Request had invalid authentication credentials. Expected OAuth 2 access token, login cookie or other valid authentication credential.`

- **Rilevamento Scadenza Token in Avvio**: All'apertura dell'applicazione, `getSavedSession()` verificherà se il timestamp `expiresAt` è trascorso. Se il token è scaduto, verrà rimosso prima di inviare richieste non autorizzate a Google.
- **Riconnessione Immediata a 1 Clic**: Nel caso in cui il token scada durante l'utilizzo dell'app o al risveglio del dispositivo, verrà mostrato un messaggio chiaro e rassicurante in italiano ("Sessione Google scaduta per sicurezza") con un pulsante diretto per rinnovare l'autorizzazione con un solo clic senza perdere alcun dato inserito.
- **Aggiornamento Dinamico del Repository**: Al rinnovo del token, il client Fogli e Google Calendar riceveranno immediatamente il nuovo token senza richiedere il ricaricamento forzato della pagina.

---

### 1. Overview & Core Concept

- **Cosa risolve**: Elimina il blocco dell'applicazione dovuto a token scaduti o non validi, garantendo che il sacerdote non rimanga mai bloccato da messaggi di errore tecnici indecifrabili.
- **Esperienza Utente**: Quando la sessione Google scade (tipicamente dopo 1 ora di inattività o alla riapertura dell'app dopo molte ore), l'app gestisce l'evento con grazia: mostra una finestra amichevole che permette di confermare l'account Google con un solo tocco, ripristinando subito la sincronizzazione di Fogli e Calendar.

---

### 2. User Experience & Visual Design

- **Flusso di Recupero Sessione**:
  1. *Riconoscimento Errore 401*: Qualsiasi richiesta verso Google Drive, Fogli o Calendar che riceve un codice 401 attiva l'evento centralizzato `AUTH_TOKEN_EXPIRED`.
  2. *Modale / Banner di Rinnovo*: Compare una finestra modale in stile liturgico (`bg-slate-900 border-amber-600/50`):
     - Titolo: **"Rinnovo Sessione Google Richiesto"**
     - Spiegazione: *"Per la sicurezza del tuo account, l'autorizzazione di accesso a Google Drive e Google Calendar scade periodicamente. Clicca qui sotto per rinnovare la sessione in un istante."*
     - Pulsante d'azione: **"Rinnova Accesso con Google"** (esegue `signInWithGIS()` direttamente sull'evento click dell'utente).
  3. *Ripristino Trasparente*: Non appena il nuovo token viene generato, i dati del foglio e del calendario vengono ricaricati automaticamente, chiudendo la finestra di dialogo.

---

### 3. Key Product Decisions & Trade-Offs

- **Decisione 1: Rimozione Token Scaduti dal LocalStorage**:
  - *Scelta*: Se `Date.now() > session.expiresAt`, scartare il token salvato e reimpostare lo stato di autenticazione.
  - *Perché*: Evita che l'app tenti 3-4 chiamate API destinate a fallire con errore 401 prima di capire che il token non è più valido.
- **Decisione 2: Gestore Centralizzato 401 con Event Listener**:
  - *Scelta*: Aggiunta di un interceptor / dispatcher su `googleDrive.ts`, `googleSheets.ts`, e `googleCalendarService.ts` che notifica `App.tsx` quando un token viene rifiutato con 401.
  - *Perché*: Garantisce che qualsiasi servizio che riscontri una credenziale non valida possa richiedere il rinnovo immediato senza causare crash o eccezioni non gestite.

---

### 4. Technical Architecture & Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                      React Application                      │
│                          (App.tsx)                          │
├──────────────────────────────┬──────────────────────────────┤
│   Interfaccia Utente         │   Gestione Stato Sessione    │
│   • Calendario / Messe       │   • isSessionExpired: boolean│
│   • Modale Rinnovo Sessione  │   • onTokenExpired handler   │
└──────────────┬───────────────┴──────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Servizi Google API      │ │    Servizio Autenticazione  │
│  (Drive / Sheets / Calendar) │ │         (auth.ts)          │
├──────────────────────────────┤ ├────────────────────────────┤
│ • checkFileExists()          │ │ • getSavedSession()        │
│ • readSheetRange()           │ │   (verifica expiresAt)     │
│ • fetchAllCalendarEvents()   │ │ • signInWithGIS()          │
│ • Intercetta 401 e lancia    │ │ • clearSavedSession()      │
│   evento TOKEN_EXPIRED       │ │                            │
└──────────────────────────────┘ └────────────────────────────┘
```

- **Passaggi di Implementazione**:
  1. Aggiornare `src/services/auth.ts`: validazione timestamp in `getSavedSession()`, gestione callback di scadenza token e metodo di rinnovo.
  2. Aggiornare `src/services/googleSheets.ts`, `src/services/googleDrive.ts`, `src/services/googleCalendarService.ts` per intercettare status 401 e segnalare `TOKEN_EXPIRED`.
  3. Aggiungere in `src/App.tsx` lo stato `isSessionExpiredModalOpen` con pulsante dedicato di rinnovo con un clic per ristabilire immediatamente il token e rieseguire le query senza ricaricare la pagina.
  4. Verificare con `compile_applet` e `lint_applet`.
