# Story Tracker Platform – Development To-Do List

This document tracks planned features and implementation tasks for the Story Tracker platform.

---

## Phase 1 – MVP (Core System)

### Authentication
- [x] User registration (email/password)
- [x] Login system
- [x] Session handling (JWT / cookies)
- [x] User profile (avatar, username, password updates)

### Story / Project Management
- [x] Create story project
- [x] Edit story metadata (title, genre, synopsis, status)
- [x] Word count goal per story
- [x] Tags and folders
- [x] Story list dashboard

### Chapters & Scenes
- [x] Create chapters
- [x] Edit chapter content
- [x] Reorder chapters
- [x] Draft vs final flag

### Writing Editor
- [x] Rich text / Markdown editor (Basic UI)
- [x] Autosave (debounced/timed at 5 minutes)
- [x] Word count per chapter and story
- [x] Light/Dark mode writing UI
- [x] Find & Replace panel (`Ctrl+F` with match highlighting and smooth scroll)

### Notes & Research Vault
- [x] General notes system
- [x] Worldbuilding entries (Locations, Factions, Lore, Systems, Objects)
- [x] Research links/files storage
- [x] Scratchpad page

### Export
- [x] Export story to Markdown
- [x] Export story to PDF
- [x] Basic formatting template

---

## Phase 2 – Writer Tools (v1)

### Character Database
- [x] Character profile CRUD (UI View)
- [ ] Relationship mapping between characters
- [ ] Track chapter appearances
- [ ] Custom character fields

### Worldbuilding Database
- [x] Locations database (UI View)
- [x] Factions database (UI View)
- [x] Lore entries system (UI View)
- [x] Custom Calendars (Months, Weekdays, Year Suffix, Leap Years, Hours/Minutes)
- [x] Timeline Events (Start/End dates, duration, optional chapter link)
- [ ] Historical timeline entries

### Plot & Timeline Tracking
- [ ] Story arcs and acts system
- [ ] Beat/plot point tracking
- [ ] In-universe chronological timeline
- [ ] Foreshadowing tracker

### Writing Version Control
- [ ] Draft snapshots
- [ ] Diff comparison UI
- [ ] Restore previous versions

### Analytics & Productivity
- [x] Manuscript Pulse (completion rates & draft depth)
- [x] Ink on the page (word count tracking observer)
- [x] Genre shelf analysis
- [x] Writing rhythm (monthly word count logs)
- [x] Writing log (recently touched chapters)
- [ ] Daily word count tracking (streak system)
- [ ] Writing streak system
- [ ] Progress charts
- [ ] Contribution heatmap calendar

### Goals & Tasks
- [ ] Daily/weekly/monthly word goals
- [ ] Deadlines
- [ ] To-do/task list per project

### Subscription & Storage Quota
- [x] Lemon Squeezy subscription integration (Pro tier upgrades)
- [x] Storage limit enforcement (100MB Free tier vs. 5GB Pro tier)
- [x] Webhook synchronization route with HMAC-SHA256 signature verification
- [x] Server-side file upload verification (Cloudinary CDN integration)
- [x] Settings Billing UI visualizer and file manager (delete files to reclaim storage)

---

## Phase 3 – Advanced Features (v2)

### Collaboration
- [ ] Share projects with other users
- [ ] Permission system (view/comment/edit)
- [ ] Inline commenting system
- [ ] Beta reader feedback threads

### Knowledge Graph
- [ ] Entity linking (characters, locations, events)
- [ ] Graph visualization UI

### Timeline Visualizer
- [ ] Writing order vs in-universe order view
- [ ] Multi-POV timeline lanes

### Lore Consistency Checker
- [ ] Canon vs non-canon flagging
- [ ] Contradiction detection logic

### AI Assistance (Optional)
- [ ] Grammar suggestions
- [ ] Character voice consistency analysis
- [ ] Plot inconsistency detection
- [ ] Idea generator

---

## Platform & Infrastructure

### Cloud & Sync
- [ ] Real-time sync
- [ ] Offline mode with local storage
- [ ] Sync conflict resolution

### Backup System
- [ ] Automatic backups
- [ ] Manual export backups

### Security
- [ ] Private projects
- [ ] Role-based access control
- [ ] Optional encrypted drafts

### API & Integrations
- [ ] Public API endpoints
- [ ] Webhooks
- [ ] Discord reminder bot

---

## Community (Optional Public Mode)

### Public Profiles
- [ ] Public author profiles
- [ ] Showcase published works
- [ ] Follow system

### Writing Challenges
- [ ] Prompt system
- [ ] Contest mode
- [ ] Leaderboards

---

## Tech Stack Tasks

### Frontend
- [x] Next.js project setup
- [x] Tailwind CSS + shadcn/ui setup
- [x] Editor integration (TipTap / Quill)

### Backend
- [x] Next.js Server Actions & Webhooks
- [x] Prisma schema design
- [x] PostgreSQL database
- [ ] REST or GraphQL API

### Authentication
- [x] JWT sessions with Jose & Bcrypt

### Storage
- [x] Cloudinary CDN Integration with transactional tracking

---

## Roadmap

### Phase 1 (MVP)
- [x] Core writing system
- [x] Basic export

### Phase 2 (v1)
- [x] Character & worldbuilding databases
- [x] Analytics & goals
- [x] Subscription, limits & storage manager

### Phase 3 (v2)
- [ ] Collaboration
- [ ] Knowledge graph & timelines
- [ ] AI writing tools

---

## License

- [ ] Choose license (MIT / Apache / GPL)
