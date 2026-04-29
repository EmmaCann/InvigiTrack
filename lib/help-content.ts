/**
 * Contenuto statico dei tutorial / help in-app.
 * Nessuna logica — solo dati. I video vanno in /public/tutorials/[id].mp4
 */

export interface TutorialItem {
  id:          string
  category:    string    // gruppo nella sidebar del dialog
  title:       string
  description: string    // 1-2 frasi — usate anche nello spotlight
  videoSrc?:   string    // es. "/tutorial/sessions.mp4"
  imageSrc?:   string    // es. "/tutorial/dashboard.png"
  body:        string    // testo libero mostrato sotto il video/immagine
}

export const TUTORIAL_ITEMS: TutorialItem[] = [
  // --- Iniziare -----------------------------------------------------------------
  {
    id:          "overview",
    category:    "Iniziare",
    title:       "Panoramica dashboard",
    description: "Come leggere la dashboard e le card principali",
    imageSrc:    "/tutorial/dashboard-panoramica.png",
    body:        "La dashboard è il punto di partenza: mostra le ore lavorate questo mese, il totale guadagnato, gli importi non ancora ricevuti e il numero di sessioni registrate.\n\nNella parte inferiore trovi le sessioni più recenti, il grafico delle ore negli ultimi 6 mesi, gli alert per le sessioni non pagate e gli eventi in attesa di conferma.\n\nDalle Impostazioni → Dashboard puoi scegliere quali card mostrare tra le disponibili e personalizzare i widget della colonna laterale. Ogni elemento è configurabile in base a ciò che ti è più utile vedere ogni giorno.",
  },
  {
    id:          "workspaces",
    category:    "Iniziare",
    title:       "Workspace multipli",
    description: "Come separare attività diverse (es. Invigilation e Tutoring)",
    videoSrc:    "/tutorial/workspace-video.mp4",
    body:        "I workspace ti permettono di tenere separati dati, sessioni e pagamenti di attività diverse.\n\nPer cambiare workspace clicca sul tuo nome in alto a destra e seleziona quello desiderato dal menu a tendina.\n\nPuoi creare nuovi workspace e personalizzarli con nome, emoji e colore dalla pagina Impostazioni → Workspace.",
  },

  // --- Sessioni -----------------------------------------------------------------
  {
    id:          "sessions",
    category:    "Sessioni",
    title:       "Registrare una sessione",
    description: "Come aggiungere una sessione di lavoro completata",
    videoSrc:    "/tutorial/creazione-sessione-video.mp4",
    body:        "Premi il pulsante + in alto a destra nella pagina Sessioni per aprire il dialogo.\n\nInserisci:\n• Data della sessione\n• Orario di inizio e fine (il guadagno viene calcolato automaticamente)\n• Luogo (opzionale)\n• Note (opzionale)\n\nPremi Salva per registrare la sessione.\n\nLe ultime 5 sessioni registrate sono sempre visibili direttamente nella dashboard, senza dover aprire la pagina Sessioni.\n\nNella pagina Sessioni puoi filtrare per stato di pagamento, intervallo di date e sede. Puoi anche esportare tutte le sessioni visibili in formato CSV usando il pulsante di download in alto a destra — utile per rendiconti o archiviazione.",
  },
  {
    id:          "sessions-edit",
    category:    "Sessioni",
    title:       "Modificare o eliminare",
    description: "Come modificare o cancellare una sessione già registrata",
    imageSrc:    "/tutorial/modifica-sessioni.png",
    body:        "Nella lista sessioni, ogni riga ha due pulsanti:\n• Matita → apre il dialogo di modifica\n• Cestino → chiede conferma ed elimina la sessione\n\nAttenzione: eliminare una sessione rimuove anche il suo collegamento a eventuali pagamenti registrati.\n\nPuoi anche cambiare lo stato di pagamento direttamente dalla lista usando il menu a tendina su ogni riga (Non pagato / Pagato). Tieni presente che modificare lo stato in questo modo non crea un pagamento registrato: la sessione risulterà «Pagata» visivamente, ma non comparirà nello storico pagamenti e non sarà associata a nessun bonifico o incasso. Usa questa opzione solo per correzioni manuali; per tracciare i pagamenti in modo completo, usa la sezione Pagamenti.",
  },

  // --- Pagamenti ----------------------------------------------------------------
  {
    id:          "payments",
    category:    "Pagamenti",
    title:       "Registrare un pagamento",
    description: "Come registrare un pagamento ricevuto e collegarlo alle sessioni",
    videoSrc:    "/tutorial/pagamenti-video.mp4",
    body:        "Vai alla pagina Pagamenti. La colonna sinistra mostra le sessioni non ancora pagate.\n\nSeleziona le sessioni incluse nel pagamento, scegli il metodo (bonifico, contanti, altro) e inserisci l'importo e la data. Premi Registra pagamento.\n\nLe sessioni collegate cambieranno stato a «Pagato».\n\nNella pagina Pagamenti puoi filtrare lo storico per periodo e metodo di pagamento. Usa il pulsante di download per esportare i dati in CSV.",
  },

  // --- Calendario ---------------------------------------------------------------
  {
    id:          "calendar",
    category:    "Calendario",
    title:       "Aggiungere un evento",
    description: "Come pianificare un turno futuro nel calendario",
    videoSrc:    "/tutorial/appuntamento-video.mp4",
    body:        "Gli eventi sono turni pianificati, non ancora confermati come sessioni.\n\nClicca su un giorno nel calendario o premi il pulsante + per aggiungere un evento. Puoi specificare titolo, orari di inizio e fine, luogo e note.\n\nGli eventi futuri appaiono anche nella sidebar «Next Shift» (su desktop) e nella dashboard, così puoi vedere a colpo d'occhio i prossimi impegni senza aprire il calendario.",
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
    imageSrc:    "/tutorial/profilo-password.png",
    body:        "Vai in Impostazioni → Profilo per modificare il nome visualizzato.\n\nPer cambiare la password vai in Impostazioni → Password: inserisci la password attuale, la nuova e la conferma.",
  },
  {
    id:          "settings-rate",
    category:    "Impostazioni",
    title:       "Tariffa oraria",
    description: "Come impostare tariffe diverse per workspace diversi",
    imageSrc:    "/tutorial/tariffe.png",
    body:        "Puoi impostare una tariffa oraria specifica per ogni workspace dalla sezione Impostazioni → Workspace.\n\nSe non imposti una tariffa specifica, viene usata la tariffa predefinita del profilo.\n\nLa tariffa viene usata come valore precompilato quando crei una nuova sessione, ma puoi sempre cambiarla manualmente nel dialogo.",
  },
  {
    id:          "settings-customize",
    category:    "Impostazioni",
    title:       "Personalizzare le pagine",
    description: "Come configurare widget e preferenze di ogni sezione dell'app",
    body:        "Dalle Impostazioni puoi personalizzare l'aspetto e il comportamento di ogni sezione:\n\n• Dashboard — scegli le 4 KPI card da mostrare (ore, guadagni, non pagato, sessioni…) e i widget della colonna laterale (grafico ore, grafico guadagni, alert non pagati, prossimi eventi)\n\n• Sessioni — imposta il filtro predefinito all'apertura (tutte, non pagate, pagate) e il tipo di raggruppamento (lista cronologica o per mese)\n\n• Pagamenti — scegli quale tab aprire di default tra «Da ricevere» e «Storico»\n\n• Analytics — seleziona i grafici da visualizzare e imposta obiettivi mensili o annuali\n\nTutte le preferenze vengono salvate per il tuo account e si applicano su qualsiasi dispositivo.",
  },

  // --- Feedback -----------------------------------------------------------------
  {
    id:          "feedback",
    category:    "Feedback",
    title:       "Inviare un feedback",
    description: "Come segnalare un problema o proporre una nuova funzionalità",
    imageSrc:    "/tutorial/feedback.png",
    body:        "Il pulsante «Invia feedback» è sempre disponibile nella barra laterale (o nel menu avatar su mobile).\n\nPuoi usarlo per:\n• Segnalare un bug o un comportamento inaspettato\n• Proporre una nuova funzionalità\n• Lasciare un suggerimento\n\nI feedback arrivano direttamente a me e li leggo tutti.",
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
