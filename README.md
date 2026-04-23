# aiwebb Dashboard

Kundens gränssnitt för att hantera sin aiwebb-sajt utan att nånsin se wp-admin.

Byggd med Next.js 15, Supabase (auth + Postgres), och shadcn/ui.

## Arkitektur

```
┌─────────────────────────────────────────────────┐
│  app.aiwebb.se (Next.js på Vercel)              │
│  • Kund loggar in                                │
│  • Redigerar brand, kontakt, sektioner           │
│  • Data lagras i Supabase                        │
│  • Klickar "Publicera"                           │
└────────────────────┬────────────────────────────┘
                     │ POST /wp-json/aiwebb/v1/publish
                     ▼
┌─────────────────────────────────────────────────┐
│  kund.aiwebb.se (WordPress multisite)           │
│  • aiwebb-publisher-plugin                       │
│  • aiwebb-classic eller aiwebb-modern tema       │
│  • Kunder ser aldrig denna layer                 │
└─────────────────────────────────────────────────┘
```

## Setup — steg för steg

### 1. Installera Node.js 20

Ladda ner från [nodejs.org](https://nodejs.org) (LTS-versionen). Verifiera:

```bash
node -v   # ska visa v20.x eller v22.x
```

### 2. Installera beroenden

```bash
cd aiwebb-dashboard
npm install
```

### 3. Skapa ett Supabase-projekt

1. Gå till [app.supabase.com](https://app.supabase.com) → New Project
2. Välj region **Stockholm** (bäst latens för svenska kunder)
3. Notera lösenordet — du kommer behöva det om du senare vill köra migrations via CLI

### 4. Kör databasschemat

1. I Supabase Dashboard: **SQL Editor** → **New query**
2. Klistra in hela innehållet från `supabase/schema.sql`
3. Klicka **Run**

Du ska se "Success. No rows returned" — alla tabeller, triggers och RLS-policies är nu skapade.

### 5. Hämta Supabase-nycklar

**Project Settings → API**. Notera:
- Project URL
- `anon` key (publik, säker att exponera till frontend)
- `service_role` key (HEMLIG — aldrig i klientkoden)

### 6. Konfigurera .env.local

```bash
cp .env.local.example .env.local
```

Fyll i:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
AIWEBB_WP_BASE_URL=https://tennisgrus.aiwebb.se
AIWEBB_WP_API_KEY=testkey_tennisgrus_abc123xyz789
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 7. Starta utvecklingsservern

```bash
npm run dev
```

Öppna http://localhost:3000 — du ska se inloggningssidan.

### 8. Skapa testkonto

1. Gå till Supabase Dashboard → Authentication → Users → Add user → Create new user
2. Fyll i e-post + lösenord
3. Bocka i "Auto Confirm User" (vi skippar e-postverifiering för test)
4. Klicka **Create user**

Gå tillbaka till http://localhost:3000/login och logga in. Du ska landa på /hantera.

### 9. Deploy till Vercel (när det är dags)

```bash
npx vercel
```

Första gången väljer du konto, team och projektnamn. Sätt samma environment variables i Vercel dashboard (samma som `.env.local` — men peka `NEXT_PUBLIC_APP_URL` till `https://app.aiwebb.se`).

Koppla domänen i Vercel → Settings → Domains → Add `app.aiwebb.se`. Vercel visar vilken DNS-record du ska lägga hos Loopia.

## Mappstruktur — vad är var

```
app/
  (auth)/login/      Inloggning (parenteser = grupperar, påverkar ej URL)
  hantera/           Allt bakom inloggning
    page.tsx         Startsidans sektioner
    layout.tsx       Sidebar + auth-skydd
    varumarke/       Brand-inställningar
    kontakt/         Kontaktuppgifter
  api/publish/       POST-endpoint som pushar till WP
  layout.tsx         Rot-HTML-skelett
  page.tsx           Redirect till /hantera
  globals.css        Tailwind + shadcn-tokens

components/
  ui/                shadcn-komponenter (Button, Input, Card...)
  layout/            Sidebar, Topbar
  sektioner/         Sektions-editors (utökas i nästa iteration)

lib/
  supabase-server.ts   Server-side Supabase-klient
  supabase-client.ts   Client-side Supabase-klient
  wordpress.ts         publishToWordPress()
  payload.ts           TypeScript-typer för schemat
  utils.ts             cn() för Tailwind

middleware.ts          Auth-guard + session-refresh
supabase/schema.sql    Databastabeller
```

## Utvecklingsregler

**Börja med Server Components.** Lägg till `"use client"` bara när du behöver interaktivitet (onClick, useState, useEffect).

**Server Actions > API Routes** för formulär. Se `app/hantera/varumarke/actions.ts` som exempel. De körs på servern men anropas som funktioner från klienten.

**Validering på servern, alltid.** Även om formuläret har client-side-validering ska server-actionen validera igen. Klienten är aldrig att lita på.

**Följ shadcn-filosofin.** Om du vill ändra en komponent — redigera filen direkt i `components/ui/`. Ingen npm-uppdatering kommer skriva över dina ändringar.

## Vad som kommer härnäst

MVP:n har grundfunktionalitet. För att bli produktionsklar:

- [ ] Sektions-editors (inline-redigering av hero, textblock osv)
- [ ] Drag-and-drop-omordning av sektioner
- [ ] Domän-koppling (CNAME-instruktioner för kundens egen domän)
- [ ] Tema-väljare (classic / modern / tech)
- [ ] Stripe-integration för prenumeration
- [ ] SEO-dashboard (kopplad till Ahrefs eller GSC)
- [ ] AI-assistent ("förbättra denna text")
- [ ] Onboarding-chatt (den vi prototypade i början)
