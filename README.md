# Taxi De Polder

Next.js 16 (App Router) website voor Taxi De Polder, gehost op Vercel met
productiedomein **taxidepolder.nl**.

## Stack

| Onderdeel | Keuze |
| --- | --- |
| Database | TiDB Cloud Starter (MySQL-compatibel) via `mysql2` |
| Beheerderslogin | Eigen server-side sessies (scrypt + HttpOnly cookie) |
| E-mail | Resend |
| Route- en adresdata | Google Maps Platform (Routes API, Places API New) |

De vorige Supabase-backend (database én auth) is volledig verwijderd.

## Lokaal draaien

```bash
npm install
cp .env.example .env.local   # vul de waarden in
npm run db:migrate           # schema + productiedata naar MySQL
npm run admin:user create beheerder@taxidepolder.nl '<sterk-wachtwoord>'
npm run dev
```

## Database

Het schema staat versiebeheerd in `db/migrations/` en wordt in bestandsvolgorde
toegepast. De runner houdt in de tabel `schema_migrations` bij wat al gedraaid
heeft, dus migreren is idempotent.

```bash
npm run db:status    # welke migraties open staan
npm run db:migrate   # openstaande migraties toepassen
```

Tabellen: `pricing_settings`, `special_rates`, `reservations`, `admin_users`,
`admin_sessions`.

Alle databasetoegang loopt server-side via `src/lib/db/mysql.ts` (één pool per
Node-proces) en de repositories in `src/features/*/repository.ts`. De browser
praat nooit rechtstreeks met de database.

### TiDB Cloud

Het publieke endpoint vereist TLS; `DB_SSL=true` valideert de certificaatketen
tegen de CA-store van Node en controleert de hostnaam. Een eigen CA-bestand is
niet nodig. De gebruikersnaam bevat altijd het clusterprefix (`<prefix>.root`).

```bash
npm run db:check   # TLS, versie, rechten, tijdzone, tabellen en rijaantallen
```

## Beheerders

```bash
npm run admin:user list
npm run admin:user create <email> <wachtwoord>
npm run admin:user set-password <email> <wachtwoord>   # trekt sessies in
npm run admin:user delete <email>
```

Wachtwoorden worden gehasht met scrypt (`N=2^15, r=8, p=1`). Sessies leven
server-side in `admin_sessions`; de cookie bevat alleen een willekeurig token
en de database uitsluitend de SHA-256 hash daarvan.

## Controles

```bash
npm run lint
npm run typecheck
npm run build
```
