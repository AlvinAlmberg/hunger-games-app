# Hunger Games Live Event – Fas 1–4: Skelett, admin, deltagarvy & karta

Fas 1: projektstruktur, databasschema och grundläggande API/UI för spel,
deltagare och elimineringsmekaniken.
Fas 2: admin-autentisering, fullständig CRUD-UI för uppdrag/vapen,
och QR-kodsgenerering direkt i adminpanelen.
Fas 3: deltagarvyn — uppdragslista och ett live händelseflöde, allt härlett
från samma händelselogg som admin använder.
Fas 4: **korrigering av en missuppfattning om zoner** (se nedan) + en riktig
GPS-karta (Leaflet/OpenStreetMap) där varje uppdrag är en ikon och samtidigt
en informell frizon.

UI:t är medvetet minimalistiskt (funktionellt, ostylat) — visuell design
tas i en dedikerad UX-fas.

## Snabbstart utan terminal (rekommenderat för icke-tekniska användare)

Hela projektet går att driftsätta utan att någonsin öppna en terminal:

1. **Ladda upp koden till GitHub** — skapa ett nytt repo på github.com och
   dra in hela projektmappen i webbläsaren (stöds numera direkt på github.com).
2. **Importera repot på [vercel.com](https://vercel.com)** (logga in med
   GitHub-kontot).
3. **Skapa en databas direkt i Vercel:** i projektet, gå till fliken
   **Storage → Create Database → Postgres**. Vercel kopplar då automatiskt
   in `DATABASE_URL` som miljövariabel — inget separat konto behövs.
4. Lägg till de två återstående miljövariablerna under
   **Settings → Environment Variables**: `QR_TOKEN_SECRET` och
   `ADMIN_SESSION_SECRET` (valfri lång slumpad text för båda).
5. **Deploya.** Vercel kör automatiskt `prisma generate && prisma db push`
   som en del av bygget (se beslut nedan) — databastabellerna skapas alltså
   utan att du kör något Prisma-kommando själv.
6. Besök **`https://ditt-projekt.vercel.app/setup`** — en engångssida där du
   skapar ditt admin-konto direkt i webbläsaren (ersätter `npm run create-admin`).
7. Logga in på `/login`.

**Beslut:** `package.json`s `build`-script kör `prisma db push
--accept-data-loss` istället för `prisma migrate deploy`, eftersom projektet
inte har någon migrationshistorik än (den skapas normalt lokalt med
`prisma migrate dev`, vilket kräver terminal). `db push` synkar schemat direkt
mot databasen utan migrationsfiler — perfekt för första driftsättningen, men
tänk på att det kan skriva över data vid framtida schemaändringar utan varning.
Om projektet går vidare mot skarp, långvarig drift (fas 8) bör detta bytas ut
mot riktiga migrationer.

**Säkerhet kring `/setup`:** sidan/API:et fungerar bara EN gång — så fort ett
admin-konto finns i databasen stänger routen sig själv permanent (403 på alla
efterföljande försök). Den kan alltså inte missbrukas för att skapa fler
obehöriga admin-konton senare.

## Teknisk stack

- **Next.js 14** (App Router, TypeScript) – frontend + API i samma projekt
- **PostgreSQL + Prisma** – databas och ORM
- **Tailwind CSS** – styling (platshållarteman i `tailwind.config.ts`)
- **jose** – signering/verifiering av deltagarnas QR-tokens (JWT)
- Hosting-förslag: **Vercel** (frontend/API) + **Supabase** eller valfri
  Postgres-leverantör (databas)

## Viktiga arkitekturbeslut (dokumenterade)

1. **Realtid via polling, inte WebSockets.** Beslutat att några sekunders
   fördröjning är acceptabelt. Klienter (deltagarvy + admin-händelselogg)
   pollar `/api/events` var 4:e sekund med en `since`-parameter för att bara
   hämta nya events. Enklare drift/skalning för 200+ samtidiga klienter än
   en WebSocket-lösning. **Om kraven ändras** (t.ex. en gemensam livekarta
   som måste vara exakt synkad) bör detta omvärderas.

2. **`game_events` är källan till sanning.** All statistik, händelselogg och
   `participant.status` härleds från/synkas med denna tabell istället för
   att underhållas som separata räknare. Minskar risk för att data hamnar
   ur synk.

3. **QR-koden kodar en signerad JWT**, inte ett gissbart löpnummer.
   `participantId` verifieras server-side vid varje anrop (`lib/auth.ts`).
   Detta förhindrar att en deltagare kan komma åt/utge sig för en annan
   deltagare genom att gissa en URL.

4. **Elimineringsmekanik stödjer två flöden** (`reportedVia: "self" | "admin"`):
   - **Self:** offret rapporterar själv via sin telefon, väljer mördare +
     vapen från listor. Token verifieras så att bara offret själv kan
     rapportera sin egen död.
   - **Admin:** admin registrerar det åt deltagaren.

   **Designbeslut om tillitsmodellen:** ingen bekräftelse krävs från den
   utpekade mördaren i realtid (skulle sakta ner spelet och kräva
   push-notiser). Istället kan **admin redigera eller ångra** varje
   kill-event i efterhand (`PATCH`/`DELETE /api/events/:id`), med full
   spårbarhet (`editedAt`/`editedBy`). Om detta visar sig otillräckligt i
   praktiken (t.ex. mycket bråk om vem som dödade vem) är nästa steg att
   lägga till en bekräftelse-flow för den utpekade mördaren.

5. **Vapenlista är konfigurerbar per spel** (`Weapon`-modellen), seedas med
   ett standardförslag (`lib/weapons-seed.ts`) när ett nytt spel skapas,
   men admin kan redigera fritt. Motiverat av att olika säsonger kan vilja
   ha olika tema på vapen.

6. **Allt är skopat på `gameId`.** Varje modell (deltagare, zoner, uppdrag,
   vapen, events) har en direkt eller indirekt koppling till `Game`, så
   flera parallella/framtida spel (2026, 2027, …) är fullt isolerade från
   varandra utan extra migrering senare.

## Fas 2 – vad som byggdes och varför

- **Admin-autentisering (session-baserad, cookie + JWT).** `AdminUser`
  (email + bcrypt-hashat lösenord) + `middleware.ts` som skyddar hela
  `/admin/*` samt de rena admin-API:erna (games, participants, zones,
  missions, weapons, `/api/events/:id`). `/api/events` (GET/POST) skyddas
  medvetet INTE av middleware, eftersom deltagare måste kunna polla och
  självrapportera sin egen död utan admin-session — den routen gör istället
  sin egen kontroll internt (participant-token för self, admin-cookie
  verifierad direkt i handlern för admin-flödet).
- **Ingen självregistrering av admins.** Admin-konton skapas via
  `npm run create-admin -- <email> "<lösenord>"`, inte via UI. En publik
  "skapa admin-konto"-yta vore en onödig säkerhetsrisk för ett event där
  admin-panelen styr hela spelet.
- **Inget CSRF-token än.** `sameSite: "lax"` på sessions-cookien ger ett
  grundskydd, men om admin-panelen ska nås från fler kontexter (t.ex.
  inbäddad i en annan app) bör riktiga CSRF-tokens läggas till i fas 7.
- **Full CRUD för zoner/uppdrag/vapen**, samma mönster som deltagare/spel
  (lista, skapa, redigera, ta bort).
- **QR-koder genereras client-side** (`qrcode`-paketet, `components/QrCode.tsx`)
  istället för via en extern QR-bild-tjänst. Motivering: (1) deltagartokens
  ska inte skickas till en tredjepart, (2) ingen extern beroende som kan
  gå ner mitt under eventet.

## Fas 4 – korrigering: zoner var en missuppfattning

Tidigare version (fas 3) tolkade "zoner" som en egen indelning admin kunde
tilldela deltagare till manuellt. **Det var fel.** Rätt modell, bekräftad
av kunden:

- Ett **uppdrag = en ikon på en riktig GPS-karta**. Inget mer.
- Platsen för ett uppdrag är samtidigt en **frizon** — men detta är
  **rent informativt**. Det finns ingen teknisk spärr (t.ex. GPS-kontroll)
  som hindrar någon från att bli rapporterad död där. Beslutat medvetet av
  kunden, för att hålla mekaniken enkel och hederssystem-baserad, i linje
  med hur självrapportering av död redan fungerar.

**Vad som revs ut:** `Zone`-modellen, `zoneId` på `Participant`,
`ZONE_CHANGE`-eventtypen, `/api/zones/*`, zonsidan i admin, och
zon-dropdownen på deltagarsidan. Ingen av dessa matchade den faktiska
speldesignen.

**Vad som byggdes istället:**
- `latitude`/`longitude` lades till direkt på `Mission`.
- **Karta valt: Leaflet + OpenStreetMap-tiles**, inte Google Maps. Ingen
  API-nyckel eller fakturering krävs — viktigt för ett fristående
  event-verktyg som inte ska bero på ett Google Cloud-konto för att
  fungera dagen för eventet.
- **Uppdragsikonen är en emoji (🎯) i en `L.divIcon`**, inte Leaflets
  standardbild-ikoner. Leaflets default-ikoner kräver extra
  webpack-konfiguration i Next.js för att inte visa trasiga bildlänkar —
  en emoji undviker det helt och matchar samtidigt kravet "bara en ikon".
- **Admin sätter uppdragets plats genom att klicka på kartan**, eller via
  en "Använd min nuvarande position"-knapp (bygger på webbläsarens
  Geolocation-API) — praktiskt eftersom admin sannolikt fysiskt står vid
  platsen när uppdraget läggs upp inför eventet.
- **Kartkomponenterna laddas med `next/dynamic` och `ssr: false`**, eftersom
  Leaflet läser `window` vid modul-laddning och kraschar vid
  server-rendering annars.
- Deltagarvyn visar en skrivskyddad karta med alla uppdrag som ikoner;
  tryck på en ikon visar titel, status och texten "Frizon under uppdraget".

## Fas 3 – vad som byggdes och varför

- **Deltagarvyn visar nu uppdragslista och ett live händelseflöde**
  ("Vad har hänt"), utöver den befintliga "jag har blivit dödad"-knappen.
  (Zonöversikten som ursprungligen byggdes här revs ut i fas 4, se ovan.)
- **`GameEvent` utökades med `missionId`** så uppdragshändelser
  (`MISSION_COMPLETED`/`MISSION_FAILED`, samt `SYSTEM` när ett uppdrag blir
  `ACTIVE`) kan kopplas till rätt uppdrag i händelseflödet — samma
  "events är källan till sanning"-princip som för kills.
- **Uppdragsstatusändringar loggas automatiskt som events** när admin sätter
  ett uppdrag till `ACTIVE`/`COMPLETED`/`FAILED` (i `PATCH /api/missions/:id`).
- **Deltagarvyns polling driver allt tillstånd från händelseloggen** (status,
  uppdragsstatus, händelseflöde) — inte separata anrop till `/api/missions`.
  Enklare, och garanterar att deltagarvyn och admin-loggen aldrig kan visa
  olika saker.
- **Självrapport-knappen är fast placerad längst ner** (`position: fixed`)
  i deltagarvyn, eftersom sidan blivit längre och knappen måste gå att nå
  utan att scrolla.

## Vad som INTE är byggt än (medvetet, kommande faser)

- PWA-hårdgörning: service worker, offline-fallback, faktiska app-ikoner
  (`public/icons/` har bara en README just nu).
- Visuell design/UX (temafärger i `tailwind.config.ts` är platshållare).
- CSRF-skydd utöver `sameSite: lax`.
- Utloggning av alla sessioner vid lösenordsbyte (nuvarande JWT:er förblir
  giltiga tills de går ut, max 12h).

## Kom igång lokalt

```bash
npm install
cp .env.example .env   # fyll i DATABASE_URL, QR_TOKEN_SECRET, ADMIN_SESSION_SECRET
npx prisma db push
npm run dev
```

Besök sedan `http://localhost:3000/setup` för att skapa ditt admin-konto i
webbläsaren (eller kör `npm run create-admin -- <email> "<lösenord>"` i
terminalen om du föredrar det).

(Kör du `npm run seed` istället skapas en test-admin automatiskt:
`admin@example.com` / `changeme123` — byt lösenord innan skarp drift.)

Admin: `http://localhost:3000/admin` (kräver inloggning på `/login`)
Deltagarvy: skapas via admin → Deltagare → "Visa QR" (både QR-bild och rå-URL visas).

## Utvecklingsplan – status

- [x] **Fas 1:** Projektskelett, datamodell, grundläggande API + minimal UI
- [x] **Fas 2:** Admin-autentisering, fullständig CRUD-UI (uppdrag/vapen), QR-kodsgenerering
- [x] **Fas 3:** Deltagarvy – uppdrag, händelseflöde
- [x] **Fas 4:** Korrigering (zoner = uppdragsplatser) + riktig GPS-karta
- [ ] **Fas 5:** Spelmekanik-finslipning utifrån speltest
- [ ] **Fas 6:** Statistik & live-dashboard för admin
- [ ] **Fas 7:** PWA-hårdgörning (offline-fallback, installbarhet, prestandatest 200 samtidiga)
- [ ] **Fas 8:** Skarp drift (felhantering, loggning, lasttest)
