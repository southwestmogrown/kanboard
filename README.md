# KanBoard — Real-time Collaborative Kanban

A full-stack kanban board with **real-time collaboration** via native WebSockets. Built with Next.js, TypeScript, PostgreSQL, and Prisma.

![Tech Stack](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791) ![WebSocket](https://img.shields.io/badge/WebSocket-Native-green)

## Features

- **Real-time sync** — Cards and columns update instantly across all connected clients via native WebSockets
- **Drag & drop** — Move cards between columns with HTML5 drag and drop
- **Authentication** — Email/password (bcrypt) + OAuth (GitHub, Google) via Auth.js v5
- **Authorization** — Role-based permissions: Owner, Editor, Viewer
- **Board sharing** — Invite collaborators by email with role selection
- **Responsive UI** — Clean, modern interface built with Tailwind CSS

## Tech Stack

| Layer     | Technology              |
| --------- | ----------------------- |
| Framework | Next.js 16 (App Router) |
| Language  | TypeScript              |
| Database  | PostgreSQL + Prisma ORM |
| Auth      | Auth.js v5 (NextAuth)   |
| Real-time | Native WebSocket (`ws`) |
| Styling   | Tailwind CSS v4         |

## Architecture

```
┌─────────────────────────────────────────────┐
│                   Client                     │
│  Next.js App Router  ←→  WebSocket Client    │
└──────┬──────────────────────────┬────────────┘
       │ HTTP (REST API)          │ WebSocket
       ▼                          ▼
┌──────────────┐         ┌────────────────┐
│  Next.js API │         │  WS Server     │
│  Routes      │         │  (port 3001)   │
│  (port 3000) │         │  Room-based    │
└──────┬───────┘         │  broadcasting  │
       │                 └────────────────┘
       ▼
┌──────────────┐
│  PostgreSQL  │
│  (Prisma)    │
└──────────────┘
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL running locally (or a remote instance)

### 1. Install dependencies

```bash
cd kanboard
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your database URL and (optionally) OAuth credentials
```

### 3. Set up the database

```bash
npm run db:setup
# This runs: prisma db push → prisma generate → seed
```

### 4. Start development servers

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: WebSocket server
npm run dev:ws

# Or run both at once:
npm run dev:all
```

### 5. Open the app

Visit **http://localhost:3000**

Demo accounts (from seed):

- `alice@example.com` / `password123`
- `bob@example.com` / `password123`

## Testing

### Unit tests (Vitest)

```bash
npm run test:unit
```

Watch mode:

```bash
npm run test:unit:watch
```

Coverage report:

```bash
npm run test:unit:coverage
```

### End-to-end tests (Playwright)

Install browser (first time only):

```bash
npm run test:e2e:install
```

Run E2E suite:

```bash
npm run test:e2e
```

UI mode:

```bash
npm run test:e2e:ui
```

## Project Structure

```
kanboard/
├── prisma/
│   ├── schema.prisma          # Database models
│   └── seed.ts                # Demo data seeder
├── server/
│   └── ws.ts                  # Standalone WebSocket server
├── src/
│   ├── app/
│   │   ├── api/               # REST API routes
│   │   │   ├── auth/          # Auth.js + registration
│   │   │   ├── boards/        # Board CRUD + members + columns
│   │   │   └── cards/         # Card CRUD
│   │   ├── auth/              # Sign in / register pages
│   │   ├── board/[id]/        # Board view (server component)
│   │   └── dashboard/         # Board list
│   ├── components/
│   │   ├── Board.tsx           # Main board with WS integration
│   │   ├── Column.tsx          # Column with drag & drop
│   │   ├── Card.tsx            # Draggable card
│   │   ├── InviteModal.tsx     # Member invitation
│   │   ├── CreateBoardModal.tsx
│   │   ├── Navbar.tsx
│   │   └── Providers.tsx       # Session provider
│   ├── hooks/
│   │   └── useWebSocket.ts    # WebSocket hook with room management
│   ├── lib/
│   │   ├── auth.ts            # Auth.js configuration
│   │   ├── prisma.ts          # Prisma singleton
│   │   └── session.ts         # Session helper
│   ├── types/
│   │   └── index.ts           # Shared TypeScript types
│   └── middleware.ts           # Route protection
├── .env.example
└── package.json
```

## API Reference

| Method | Endpoint                                  | Description        |
| ------ | ----------------------------------------- | ------------------ |
| POST   | `/api/auth/register`                      | Create account     |
| GET    | `/api/boards`                             | List user's boards |
| POST   | `/api/boards`                             | Create board       |
| GET    | `/api/boards/:id`                         | Get full board     |
| PATCH  | `/api/boards/:id`                         | Update board title |
| DELETE | `/api/boards/:id`                         | Delete board       |
| POST   | `/api/boards/:id/members`                 | Invite member      |
| POST   | `/api/boards/:id/columns`                 | Create column      |
| PATCH  | `/api/boards/:id/columns/:columnId`       | Update column      |
| DELETE | `/api/boards/:id/columns/:columnId`       | Delete column      |
| POST   | `/api/boards/:id/columns/:columnId/cards` | Create card        |
| PATCH  | `/api/cards/:cardId`                      | Update/move card   |
| DELETE | `/api/cards/:cardId`                      | Delete card        |

## WebSocket Events

| Event            | Direction       | Description                       |
| ---------------- | --------------- | --------------------------------- |
| `join-board`     | Client → Server | Join a board's room               |
| `leave-board`    | Client → Server | Leave current room                |
| `card-created`   | Broadcast       | New card added                    |
| `card-moved`     | Broadcast       | Card moved between/within columns |
| `card-updated`   | Broadcast       | Card title/description changed    |
| `card-deleted`   | Broadcast       | Card removed                      |
| `column-created` | Broadcast       | New column added                  |
| `column-updated` | Broadcast       | Column title changed              |
| `column-deleted` | Broadcast       | Column removed                    |

## Next Steps

Here are features to build next to strengthen this project:

- [ ] **Drag & drop reordering within columns** (position swap logic)
- [ ] **Card labels / tags** with color coding
- [ ] **Due dates** on cards with visual indicators
- [ ] **Activity log** — track who did what and when
- [ ] **Board settings page** — manage members, delete board
- [ ] **Search / filter** cards across columns
- [ ] **Dark mode** toggle
- [ ] **Testing** — unit tests (Vitest) + E2E tests (Playwright)
- [ ] **Deployment** — Docker Compose config for production
- [ ] **Optimistic UI** with error rollback on API failures

## License

MIT
