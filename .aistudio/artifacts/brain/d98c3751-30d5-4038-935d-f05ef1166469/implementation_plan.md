# Piano di Risoluzione: Errore 400 origin_mismatch su Vercel & Configurazione Domini

Questo piano illustra le azioni per risolvere l'errore `400: origin_mismatch` sul dominio Vercel (`https://messe-nine.vercel.app`) e dotare l'applicazione della massima flessibilità per operare su qualsiasi dominio.

---

## 1. Causa dell'Errore `400: origin_mismatch`

Google OAuth (sia tramite Google Identity Services che tramite Firebase Auth) rifiuta le richieste provenienti da origini che non figurano nella lista delle **Origini JavaScript autorizzate** (*Authorized JavaScript origins*) registrate per il Client ID OAuth.
Nel tuo caso:
- **Origine corrente**: `https://messe-nine.vercel.app`
- **Client ID OAuth**: `977769773502-68uttufobitjpqm889a8rum0d7l2coca.apps.googleusercontent.com`
- **Progetto Google Cloud**: `gen-lang-client-0301750648`

---

## 2. Soluzione 1: Autorizzazione Dominio in Google Cloud & Firebase Console

I passaggi che potrai eseguire direttamente nella console Google Cloud e Firebase:

### A. Google Cloud Console (Origini JavaScript autorizzate)
1. Accedi a [Google Cloud Console - Credenziali](https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0301750648).
2. Seleziona il progetto **`gen-lang-client-0301750648`**.
3. Nella sezione **ID client OAuth 2.0**, clicca sul Client ID dell'applicazione web.
4. Sotto la voce **Origini JavaScript autorizzate**, clicca su **+ Aggiungi URI** e inserisci:
   - `https://messe-nine.vercel.app`
5. Sotto **URI di reindirizzamento autorizzati** (se presente), puoi facoltativamente aggiungere:
   - `https://messe-nine.vercel.app`
6. Clicca su **Salva**. *(Nota: Google impiega da 2 a 5 minuti per propagare la modifica a livello globale).*

### B. Firebase Console (Domini autorizzati per Auth Popup)
1. Accedi a [Firebase Console - Authentication Settings](https://console.firebase.google.com/project/gen-lang-client-0301750648/authentication/settings).
2. Vai nella scheda **Impostazioni** > **Domini autorizzati**.
3. Clicca su **Aggiungi dominio** e inserisci:
   - `messe-nine.vercel.app`
4. Clicca su **Salva**.

---

## 3. Soluzione 2: Miglioramenti nell'Applicazione (Massima Flessibilità)

Per evitare che l'utente rimanga bloccato o disorientato in futuro, implementeremo le seguenti modifiche al codice:

### A. Modale di Aiuto e Rilevamento Intelligente di `origin_mismatch`
- Intercettare specificamente l'errore `origin_mismatch` e gli errori di dominio non autorizzato (`auth/unauthorized-domain`) durante il login o rinnovo token.
- Mostrare una finestra dedicata di diagnosi chiara in italiano con:
  - Il dominio attuale rilevato automaticamente (`window.location.origin`).
  - Pulsante con un clic per copiare l'URI esatto da incollare.
  - Link diretto rapido per aprire Google Cloud Console e Firebase Console.
  - Spiegazione dei tempi di propagazione (2-5 min).

### B. Gestione Client ID Google Personalizzato nelle Impostazioni
- Aggiungere nella schermata **Impostazioni** dell'app una sezione avanzata: **Configurazione OAuth & Domini Web**.
- Consentire all'utente di:
  - Visualizzare il Client ID attualmente in uso.
  - Inserire un **Client ID personalizzato** proprio (utile se in futuro si desidera usare un proprio progetto Google Cloud dedicato per Vercel).
  - Ripristinare con un clic il Client ID predefinito del sistema.
  - Verificare se il dominio attuale è un ambiente di sviluppo, anteprima o produzione su Vercel.

### C. Aggiornamento dinamico di Google Identity Services & Auth
- Permettere ad `auth.ts` di leggere il Client ID sia da variabile d'ambiente (`VITE_OAUTH_CLIENT_ID`), sia da `localStorage` (se sovrascritto dall'utente nelle Impostazioni), sia dal file di configurazione predefinito.
- Se il Client ID viene aggiornato nelle Impostazioni, reinizializzare istantaneamente il client GIS senza richiedere il ricaricamento forzato della pagina.

---

## 4. Verifica e Collaudo
1. Verifica compilazione (`compile_applet`) e linting (`lint_applet`).
2. Verifica che il login continui a funzionare senza problemi nell'ambiente corrente.
3. Test della modale di spiegazione e dell'impostazione del Client ID personalizzato.
