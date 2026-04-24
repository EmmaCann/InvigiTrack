export const metadata = { title: "Privacy Policy — InvigiTrack" }

export default function PrivacyPage() {
  return (
    <article className="prose prose-slate max-w-none">

      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Informativa sulla Privacy</h1>
        <p className="mt-2 text-muted-foreground">
          La versione onesta. — Ultimo aggiornamento: aprile 2026
        </p>
      </div>

      <Section title="1. Dati che raccogliamo">
        <p>Raccogliamo solo quello che è strettamente necessario per far funzionare l&apos;app:</p>
        <ul>
          <li><strong>Email</strong> — usata per l&apos;autenticazione (tramite Supabase Auth).</li>
          <li><strong>Nome visualizzato</strong> — quello che inserisci durante la registrazione.</li>
          <li><strong>Dati di lavoro</strong> — sessioni, pagamenti, eventi del calendario, preferenze
            dell&apos;interfaccia. Sono tutti dati che tu inserisci volontariamente.</li>
        </ul>
        <p>
          Non raccogliamo dati di navigazione, non installiamo tracker, non usiamo analytics di
          terze parti.
        </p>
      </Section>

      <Section title="2. Come vengono usati">
        <p>
          I tuoi dati vengono usati esclusivamente per farti funzionare l&apos;app: mostrare le
          tue sessioni, calcolare i guadagni, ricordarti i turni. Punto.
        </p>
        <p>
          Non vengono analizzati in forma aggregata, non vengono usati per addestrare modelli di
          intelligenza artificiale, non vengono venduti né ceduti.
        </p>
      </Section>

      <Section title="3. Dove sono conservati">
        <p>
          I dati sono ospitati su <strong>Supabase</strong>, una piattaforma BaaS (Backend as a
          Service) con server in Europa. Il database è protetto da row-level security (RLS):
          ogni utente può accedere solo ai propri record.
        </p>
        <p>
          Supabase applica le proprie politiche di sicurezza e privacy — puoi
          trovarle sul loro sito. In sintesi: sono una piattaforma seria con certificazioni
          SOC 2 e conformità GDPR.
        </p>
      </Section>

      <Section title="4. Chi li vede">
        <p>
          <strong>Solo tu</strong> puoi vedere i tuoi dati tramite l&apos;interfaccia. Il creatore
          dell&apos;app ha accesso diretto al database per motivi di manutenzione tecnica —
          ma non ha né l&apos;interesse né l&apos;intenzione di leggere i tuoi dati personali.
        </p>
        <p>
          Non ci sono dipendenti, non ci sono team di supporto, non ci sono addetti al marketing.
          È solo una persona che gestisce un server.
        </p>
      </Section>

      <Section title="5. Cookie e tracciamento">
        <p>
          L&apos;app usa un singolo cookie di sessione per mantenere il tuo accesso attivo —
          senza di esso dovresti fare login ogni volta. Non ci sono cookie di tracciamento,
          cookie pubblicitari o script di terze parti.
        </p>
        <p>
          Se usi un browser con blocco cookie aggressivo potrebbe capitare che vieni
          disconnesso più spesso del solito. Pazienza.
        </p>
      </Section>

      <Section title="6. Cancellazione dei dati">
        <p>
          Puoi richiedere la cancellazione completa del tuo account e di tutti i dati associati
          in qualsiasi momento. Scrivi a Emma oppure usa il pulsante <strong>Invia feedback</strong>{" "}
          nell&apos;app, e provvederò manualmente entro qualche giorno.
        </p>
        <p>
          Non esiste (ancora) un flusso self-service per la cancellazione — è un progetto
          personale, ci vuole un po&apos; di manualità.
        </p>
      </Section>

      <Section title="7. Modifiche a questa informativa">
        <p>
          Se dovessero cambiare in modo significativo le modalità di trattamento dei dati,
          cercherò di avvisare gli utenti attivi. Per ora questa pagina si aggiorna di rado
          perché non c&apos;è molto da cambiare — non facciamo niente di complicato con i dati.
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
