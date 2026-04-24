/**
 * Contenuto statico dei tutorial / help in-app.
 * Nessuna logica — solo dati. I video vanno in /public/tutorials/[id].mp4
 */

export interface TutorialItem {
  id:          string
  category:    string    // gruppo nella sidebar del dialog
  title:       string
  description: string    // 1-2 frasi — usate anche nello spotlight
  videoSrc?:   string    // es. "/tutorials/sessions.mp4"
  body:        string    // testo libero mostrato sotto il video
}

export const TUTORIAL_ITEMS: TutorialItem[] = [
  // --- Iniziare -----------------------------------------------------------------
  {
    id:          "overview",
    category:    "Iniziare",
    title:       "Panoramica dashboard",
    description: "Come leggere la dashboard e le card principali",
    videoSrc:    "/tutorials/overview.mp4",
    body:        "La dashboard è il punto di partenza: mostra le ore lavorate questo mese, il totale guadagnato, gli importi non ancora ricevuti e il numero di sessioni registrate.\n\nNella parte inferiore trovi le sessioni più recenti, il grafico delle ore negli ultimi 6 mesi, gli alert per le sessioni non pagate e gli eventi in attesa di conferma.",
  },
  {
    id:          "workspaces",
    category:    "Iniziare",
    title:       "Workspace multipli",
    description: "Come separare attività diverse (es. Invigilation e Tutoring)",
    videoSrc:    "/tutorials/workspaces.mp4",
    body:        "I workspace ti permettono di tenere separati dati, sessioni e pagamenti di attività diverse.\n\nPer cambiare workspace clicca sul tuo nome in alto a destra e seleziona quello desiderato dal menu a tendina.\n\nPuoi creare nuovi workspace e personalizzarli con nome, emoji e colore dalla pagina Impostazioni → Workspace.",
  },

  // --- Sessioni -----------------------------------------------------------------
  {
    id:          "sessions",
    category:    "Sessioni",
    title:       "Registrare una sessione",
    description: "Come aggiungere una sessione di lavoro completata",
    videoSrc:    "/tutorials/sessions.mp4",
    body:        "Premi il pulsante + in alto a destra nella pagina Sessioni per aprire il dialogo.\n\nInserisci:\n• Data della sessione\n• Orario di inizio e fine (il guadagno viene calcolato automaticamente)\n• Luogo (opzionale)\n• Note (opzionale)\n\nPremi Salva per registrare la sessione.",
  },
  {
    id:          "sessions-edit",
    category:    "Sessioni",
    title:       "Modificare o eliminare",
    description: "Come modificare o cancellare una sessione già registrata",
    body:        "Nella lista sessioni, ogni riga ha due pulsanti:\n• Matita → apre il dialogo di modifica\n• Cestino → chiede conferma ed elimina la sessione\n\nAttenzione: eliminare una sessione rimuove anche il suo collegamento a eventuali pagamenti registrati.",
  },

  // --- Pagamenti ----------------------------------------------------------------
  {
    id:          "payments",
    category:    "Pagamenti",
    title:       "Registrare un pagamento",
    description: "Come registrare un pagamento ricevuto e collegarlo alle sessioni",
    videoSrc:    "/tutorials/payments.mp4",
    body:        "Vai alla pagina Pagamenti. La colonna sinistra mostra le sessioni non ancora pagate.\n\nSeleziona le sessioni incluse nel pagamento, scegli il metodo (bonifico, contanti, altro) e inserisci l'importo e la data. Premi Registra pagamento.\n\nLe sessioni collegate cambieranno stato a «Pagato».",
  },
  {
    id:          "payments-status",
    category:    "Pagamenti",
    title:       "Stato pagamento sessione",
    description: "I tre stati possibili: Non pagato, In attesa, Pagato",
    body:        "Ogni sessione può avere uno di questi stati:\n\n• Non pagato — il lavoro è stato svolto ma non ancora incassato\n• In attesa — marcata manualmente come «in attesa di bonifico»\n• Pagato — collegata a un pagamento registrato\n\nPuoi cambiare lo stato manualmente dalla lista sessioni oppure registrando un pagamento.",
  },

  // --- Calendario ---------------------------------------------------------------
  {
    id:          "calendar",
    category:    "Calendario",
    title:       "Aggiungere un evento",
    description: "Come pianificare un turno futuro nel calendario",
    videoSrc:    "/tutorials/calendar.mp4",
    body:        "Gli eventi sono turni pianificati, non ancora confermati come sessioni.\n\nClicca su un giorno nel calendario o premi il pulsante + per aggiungere un evento. Puoi specificare titolo, orari di inizio e fine, luogo e note.\n\nGli eventi futuri appaiono anche nella sidebar «Next Shift».",
  },
  {
    id:          "calendar-convert",
    category:    "Calendario",
    title:       "Convertire in sessione",
    description: "Come trasformare un evento completato in sessione registrata",
    body:        "Quando un turno pianificato è stato effettuato, puoi convertirlo in sessione con un click.\n\nApri il pannello dell'evento nel calendario e premi «Converti in sessione». Si aprirà il dialogo di creazione sessione già precompilato con data, orari e luogo dell'evento.\n\nDopo la conversione, l'evento viene marcato come completato e non compare più nei pending.",
  },

  // --- Impostazioni -------------------------------------------------------------
  {
    id:          "settings-profile",
    category:    "Impostazioni",
    title:       "Profilo e password",
    description: "Come aggiornare nome, email e password",
    body:        "Vai in Impostazioni → Profilo per modificare il nome visualizzato.\n\nPer cambiare la password vai in Impostazioni → Password: inserisci la password attuale, la nuova e la conferma.",
  },
  {
    id:          "settings-rate",
    category:    "Impostazioni",
    title:       "Tariffa oraria",
    description: "Come impostare tariffe diverse per workspace diversi",
    body:        "Puoi impostare una tariffa oraria specifica per ogni workspace dalla sezione Impostazioni → Workspace.\n\nSe non imposti una tariffa specifica, viene usata la tariffa predefinita del profilo.\n\nLa tariffa viene usata come valore precompilato quando crei una nuova sessione, ma puoi sempre cambiarla manualmente nel dialogo.",
  },
  {
    id:          "settings-dashboard",
    category:    "Impostazioni",
    title:       "Personalizzare la dashboard",
    description: "Come scegliere quali card mostrare nella dashboard",
    body:        "Vai in Impostazioni → Dashboard per scegliere le 4 card da visualizzare.\n\nLe card disponibili sono: ore questo mese, guadagno totale, non pagato, sessioni totali, guadagnato questo mese, già ricevuto, tariffa media.\n\nLe modifiche si applicano immediatamente alla dashboard.",
  },
]

/**
 * Raggruppa i tutorial per categoria.
 * Restituisce un oggetto { [category]: TutorialItem[] } nell'ordine di inserimento.
 */
export function getTutorialsByCategory(items = TUTORIAL_ITEMS): Record<string, TutorialItem[]> {
  return items.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, TutorialItem[]>,
  )
}
