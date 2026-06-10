# Storack

**Storack** is a world-building and story management platform for writers. It lets you organise your stories, chapters, characters, locations, and timeline events inside a shared fictional world — all in one place.

---

## Features

- **Story & Chapter Management** — Create stories with genres, synopses, cover images, and tags. Write chapters in a rich text editor with word count tracking.
- **Rich Text Editor** — Tiptap-powered editor with bold, italic, underline, bullet lists, image embedding, paragraph indentation (Tab key), and a **Find & Replace** panel (`Ctrl+F`) with match highlighting and smooth scroll-to-match navigation.
- **Autosave** — Changes are automatically saved every 5 minutes with a live status indicator in the header.
- **Custom Calendars** — Define fully custom calendars (months, weekdays, year suffix, hours per day) for your fictional world.
- **Timeline Events** — Plot events on a world timeline linked to your custom calendar, with optional chapter associations.
- **Characters** — Track character profiles (role, age, gender, species, occupation, personality, backstory, avatar).
- **Locations** — Document world locations with type, description, map URLs, and images.
- **World Builder** — All content lives inside a *World*, giving you a single namespace to keep stories, lore, and world data together.
- **Authentication** — Simple username/password auth with JWT sessions (via `jose` + `bcryptjs`).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix UI) |
| Editor | Tiptap 3 (ProseMirror) |
| ORM | Prisma 7 |
| Database | PostgreSQL (via `pg` adapter) |
| Auth | JWT (`jose`) + `bcryptjs` |
| Runtime | Bun |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- A PostgreSQL database

### Setup

```bash
# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET in .env

# Run database migrations
bunx prisma migrate dev

# Start the dev server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database Schema

```
User → World → Story   → Chapter → TimelineEvent
                       ↘ Calendar → TimelineEvent
              World → Character
              World → Location
```

All world content (stories, calendars, characters, locations, events) is scoped to a single `World` owned by a `User`.

---

## Project Structure

```
app/          # Next.js App Router pages and layouts
components/   # Reusable UI components (world, editor, shadcn)
lib/          # Server actions, Prisma client, calendar engine, auth utils
prisma/       # Schema and migrations
public/       # Static assets
```
