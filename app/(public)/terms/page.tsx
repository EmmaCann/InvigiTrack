export const metadata = { title: "Termini di utilizzo — InvigiTrack" }

export default function TermsPage() {
  return (
    <article className="prose prose-slate max-w-none">

      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Termini di utilizzo</h1>
        <p className="mt-2 text-muted-foreground">
          Leggi tutto. Ci vorranno 2 minuti, promesso. — Ultimo aggiornamento: aprile 2026
        </p>
      </div>

      <Section title="1. Chi siamo (e cosa non siamo)">
        <p>
          InvigiTrack è un&apos;applicazione personale creata e mantenuta da una singola persona fisica, a uso
          proprio e di un ristretto gruppo di amici e conoscenti. <strong>Non è un&apos;azienda, non è una
          startup, non ha investitori, non ha un ufficio legale.</strong> È un progetto nato perché Excel
          stava diventando insopportabile.
        </p>
        <p>
          Se stai leggendo questi termini è perché qualcuno ti ha condiviso il link — bene, vuol dire che
          ci fidiamo abbastanza di te da darti accesso.
        </p>
      </Section>

      <Section title="2. Cosa fa l'app">
        <p>
          InvigiTrack permette di tenere traccia di sessioni di lavoro (invigilation, tutoring e simili),
          registrare pagamenti ricevuti, pianificare turni futuri tramite un calendario, e visualizzare
          statistiche personali sulle proprie attività.
        </p>
        <p>
          Tutto quello che inserisci è tuo. L&apos;app è uno strumento, non un servizio a cui cedi i
          tuoi dati.
        </p>
      </Section>

      <Section title="3. Cosa NON facciamo">
        <ul>
          <li>Non vendiamo i tuoi dati a nessuno. Letteralmente nessuno.</li>
          <li>Non facciamo analisi comportamentali, profilazione o targeting pubblicitario.</li>
          <li>Non condividiamo le tue informazioni con terze parti (a meno che non sia necessario per far
            funzionare l&apos;infrastruttura tecnica — vedi sezione Privacy).</li>
          <li>Non ti mandiamo email di marketing. Non ci interessa.</li>
          <li>Non monetizziamo in nessun modo i dati degli utenti.</li>
        </ul>
      </Section>

      <Section title="4. Accesso ai dati">
        <p>
          Il database è ospitato su Supabase e protetto da row-level security: ogni utente può
          leggere e modificare solo i propri dati. L&apos;unica persona con accesso diretto al
          database sono io, il creatore dell&apos;app.
        </p>
        <p>
          Accedo al database solo se c&apos;è un problema tecnico da risolvere. I tuoi turni di
          invigilation non mi interessano: ho i miei.
        </p>
      </Section>

      <Section title="5. Disponibilità del servizio">
        <p>
          InvigiTrack è offerto gratuitamente e senza alcuna garanzia di continuità. Essendo un
          progetto personale, potrebbe essere messo offline, aggiornato in modo incompatibile o
          semplicemente smettere di funzionare senza preavviso.
        </p>
        <p>
          Non esiste un SLA (Service Level Agreement). Se il sito è giù, ci lavoro appena posso.
          Se viene chiuso definitivamente, cercherò di avvisare in anticipo — ma non posso
          prometterlo.
        </p>
      </Section>

      <Section title="6. Uso accettabile">
        <p>
          Usa l&apos;app per quello per cui è fatta: tenere traccia del tuo lavoro. Non tentare di
          accedere ai dati di altri utenti, non fare stress testing sull&apos;infrastruttura, non
          usarla per attività illegali. È roba ovvia, ma preferivo dirlo.
        </p>
      </Section>

      <Section title="7. Contatti">
        <p>
          Per qualsiasi domanda, segnalazione o richiesta di cancellazione account, scrivi
          a Emma oppure usa il pulsante <strong>Invia feedback</strong> nell&apos;app, che trovi
          nella barra laterale (o nel menu, da mobile).
        </p>
      </Section>

    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-foreground/75">
        {children}
      </div>
    </section>
  )
}
