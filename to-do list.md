```md
# Story Tracker Platform – Development To-Do List

This document tracks planned features and implementation tasks for the Story Tracker platform.

---

## Phase 1 – MVP (Core System)

### Authentication
- [ ] User registration (email/password)
- [ ] Login system
- [ ] Session handling (JWT / cookies)
- [ ] User profile (avatar, bio, goals)

### Story / Project Management
- [x] Create story project
- [ ] Edit story metadata (title, genre, synopsis, status)
- [x] Word count goal per story
- [x] Tags and folders
- [x] Story list dashboard

### Chapters & Scenes
- [x] Create chapters
- [x] Edit chapter content
- [ ] Reorder chapters
- [ ] Scene support (optional nested structure)
- [ ] Draft vs final flag

### Writing Editor
- [x] Rich text / Markdown editor (Basic UI)
- [ ] Autosave
- [x] Word count per chapter and story
- [x] Light/Dark mode writing UI

### Notes & Research Vault
- [ ] General notes system
- [ ] Worldbuilding notes
- [ ] Research links/files storage
- [ ] Scratchpad page

### Export
- [ ] Export story to Markdown
- [ ] Export story to PDF
- [ ] Basic formatting template

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
- [ ] Daily word count tracking
- [ ] Writing streak system
- [ ] Progress charts
- [ ] Contribution heatmap calendar

### Goals & Tasks
- [ ] Daily/weekly/monthly word goals
- [ ] Deadlines
- [ ] To-do/task list per project

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
- [ ] Next.js project setup
- [ ] Tailwind CSS + shadcn/ui setup
- [ ] Editor integration (TipTap / Quill)

### Backend
- [ ] NestJS project setup
- [ ] Prisma schema design
- [ ] PostgreSQL database
- [ ] REST or GraphQL API

### Authentication
- [ ] Integrate better-auth or Auth.js

### Storage
- [ ] S3-compatible storage (MinIO / Cloudflare R2)

---

## Roadmap

### Phase 1 (MVP)
- [ ] Core writing system
- [ ] Basic export

### Phase 2 (v1)
- [ ] Character & worldbuilding databases
- [ ] Analytics & goals

### Phase 3 (v2)
- [ ] Collaboration
- [ ] Knowledge graph & timelines
- [ ] AI writing tools

---

## License

- [ ] Choose license (MIT / Apache / GPL)
```
