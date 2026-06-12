# Storack

**Storack** is a world-building and story management platform for writers. It lets you organize your stories, chapters, characters, locations, and timeline events inside a shared fictional world — all in one place.

---

## Features

- **Story & Chapter Management** — Create stories with genres, synopses, cover images, and tags. Write chapters in a rich text editor with word count tracking.
- **Rich Text Editor** — Tiptap-powered editor with bold, italic, underline, bullet lists, image embedding, paragraph indentation (Tab key), and a **Find & Replace** panel (`Ctrl+F`) with match highlighting and smooth scroll-to-match navigation.
- **Autosave** — Changes are automatically saved every 5 minutes with a live status indicator in the header.
- **Custom Calendars** — Define fully custom calendars (months, weekdays, year suffix, leap rules, hours per day) for your fictional world.
- **Timeline Events** — Plot events on a world timeline linked to your custom calendar, with optional chapter associations.
- **Characters & Versioning** — Track profiles (role, age, gender, species, occupation, personality, backstory, avatar) and narrative state changes using event/chapter-anchored **Character Snapshots** (State History).
- **World Builder** — All content (Locations, Factions, Lore, Systems, Objects) lives inside a *World*, giving you a single namespace to keep stories, lore, and world data together.
- **Authentication** — Simple username/password auth with JWT sessions (via `jose` + `bcryptjs`).
- **Notes & Research Vault** — Create and manage general, research, or scratchpad notes. Link web references, upload documents, and organize resources directly within your projects.
- **Manuscript Exporting** — Export your stories to Markdown, PDF, or document formats with standard styling/formatting template choices.
- **Subscription & Storage Quotas** — Lemon Squeezy integration with Tiered limits (100MB Free vs 5GB Pro plan). All image uploads (cover, character avatars, world location maps/images, editor files) are verified server-side.
- **Secure Webhooks** — An endpoint at `/api/lemon/webhook` with crypto-based HMAC signature verification to automatically process subscription creation, renewals, and cancellations.
- **Media & Storage Manager** — Manage all uploaded files directly from your settings. Reclaim storage space instantly by deleting unwanted assets from Cloudinary.
- **Observatory Analytics** — Interactive charts and stats in `/analysis` detailing your manuscript pulse, completion rates, genre shelf, recent activity logs, and monthly writing rhythm.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix UI) |
| Editor | Tiptap 3 (ProseMirror) |
| ORM | Prisma 7 |
| Database | PostgreSQL (via Neon Serverless Pooler) |
| Auth | JWT (`jose`) + `bcryptjs` |
| Storage | Cloudinary CDN |
| Billing | Lemon Squeezy API & Webhooks |
| Runtime | Bun |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- A PostgreSQL database
- Cloudinary account for file storage
- Lemon Squeezy sandbox/production account for subscription testing

### Setup

1. **Clone the repository and install dependencies:**
   ```bash
   bun install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and configure:
   - `DATABASE_URL` (PostgreSQL connection string)
   - `JWT_SECRET` (Secure key for JWT signing)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `LEMON_SQUEEZY_API_KEY`, `LEMON_SQUEEZY_WEBHOOK_SECRET`, `LEMON_SQUEEZY_STORE_ID`, `LEMON_SQUEEZY_VARIANT_ID`

3. **Run database migrations:**
   ```bash
   bunx prisma db push
   ```

4. **Start the dev server:**
   ```bash
   bun dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database Schema

```
User ── World ── Story   ── Chapter ── TimelineEvent
        │        ├── Calendar ── TimelineEvent
        │        └── Note (Research & Scratchpad with Uploads)
        ├── Character (scoped to World)
        └── Location/Entry (scoped to World; type handles Faction, Lore, System, Object)
```

All world content (stories, calendars, characters, locations, events) is scoped to a single `World` owned by a `User`.

---

## Project Structure

```
app/          # Next.js App Router pages and API routes
components/   # Reusable UI components (world builder, editor, shadcn)
lib/          # Server actions, Prisma client, calendar engine, auth, quota/plans
prisma/       # Database schema definition
public/       # Static assets
```
