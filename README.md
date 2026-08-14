# CollabHub

CollabHub is a comprehensive, real-time collaboration platform inspired by Slack, Microsoft Teams, Discord, Notion, and Miro.

CollabHub is feature-complete and production-ready! It supports workspaces, real-time chat, video meetings, collaborative whiteboards, task tracking, and AI-driven insights.

## Architecture

- **Backend:** Node.js, Express, TypeScript, Socket.IO, PostgreSQL, Prisma ORM
- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Zustand, Tldraw
- **Media / Storage:** WebRTC, Cloudinary
- **AI / LLMs:** Gemini API

## Key Features

- **Authentication & RBAC**: JWT Access & Refresh tokens, secure HTTP-only cookies, robust role-based access control.
- **Workspaces & Channels**: Group-based organization, public and private channels, direct messaging.
- **Real-time Chat**: Socket.IO powered instant messaging, emoji reactions, replies, pinned messages, bookmarks, and rich link previews.
- **Meetings & WebRTC**: High-quality video and audio meetings, screen sharing, real-time presence indicators.
- **Collaborative Whiteboards**: Multi-player real-time canvas powered by Tldraw, synced via Socket.IO.
- **Tasks & Productivity**: Drag-and-drop Kanban boards, Calendar integration, webhook and third-party integration support.
- **AI Collaboration Assistant**: Chat with your workspace data, summarize channels, and query documentation in natural language.
- **File Management**: Cloudinary-backed uploads with thumbnails, permissions, and checksums.

## Folder Structure

```
CollabHub/
├── backend/       # Node.js + Express + Prisma backend
├── frontend/      # React + Vite frontend
├── .github/       # CI/CD pipelines
└── docker-compose.yml
```

## Installation & Running (Local Development)

### Prerequisites

- Node.js (v20+)
- Docker (for PostgreSQL)

### Setup

1. Start PostgreSQL using Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Set up Backend:
   ```bash
   cd backend
   npm install
   # Create a .env file based on .env.example
   npx prisma migrate dev
   npm run dev
   ```

3. Set up Frontend:
   ```bash
   cd frontend
   npm install
   # Create a .env file based on .env.example
   npm run dev
   ```

## Production Deployment

Please see [DEPLOYMENT.md](./DEPLOYMENT.md) for full instructions on deploying to Vercel, Render, and Neon.

CollabHub includes a `Dockerfile` in the backend for containerized deployments and is completely SSRF-protected, rate-limited, and strict on CORS policies. 

## Environment Variables

See `.env.example` in both `backend/` and `frontend/` directories for required environment variables.

### Backend Required Keys
- `DATABASE_URL` (Neon or Postgres)
- `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `FRONTEND_URL` (For strict CORS)
- `AI_API_KEY`

### Frontend Required Keys
- `VITE_API_URL`
- `VITE_SOCKET_URL`
- `VITE_CLOUDINARY_CLOUD_NAME`

## API Documentation

Swagger API documentation is available at `/api/v1/docs` when the backend is running.
