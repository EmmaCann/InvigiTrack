This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Area clienti

Le migrazioni in `supabase/migrations` estendono lo schema Supabase già usato da InvigiTrack. Prima di applicarle a un ambiente condiviso, verifica sullo schema reale i tipi, le policy RLS e l’assenza di più riepiloghi per lo stesso proprietario, workspace e anno. Verifica il ripristino del database e la copia degli oggetti Storage in un ambiente separato. Applica le migrazioni nell’ordine dei file prima di avviare questa versione dell’app.

Il portale usa `SUPABASE_SERVICE_ROLE_KEY` sul server e il bucket privato `client-files`. Il cron `/api/cron/client-uploads`, protetto da `CRON_SECRET`, elimina i caricamenti incompleti dopo la scadenza dell’autorizzazione firmata. Gli upload firmati seguono il flusso di [Supabase Storage](https://supabase.com/docs/reference/javascript/file-buckets-createsigneduploadurl).

Per il pilota, seleziona il workspace di tutorato e apri **Impostazioni → Workspace → Area clienti del workspace attivo**. Dopo l’attivazione, crea una scheda in **Clienti**, associa le voci desiderate e controlla l’anteprima. Genera il link dalla scheda dopo la revisione. La disattivazione del workspace revoca i link e mantiene attiva la conservazione delle sessioni archiviate. I CSV generali includono le sessioni conservate. I dati delle vecchie archiviazioni richiedono un CSV o un backup per il recupero.
