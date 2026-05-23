# DevFlow

DevFlow is a Kanban board and issue tracker designed for software teams.

## Features

- **Workspaces**: Manage separate workspaces with custom slugs.
- **Roles**: Assign roles (OWNER, ADMIN, MEMBER, VIEWER) to control permissions.
- **Projects**: Set up multiple projects with custom keys for issue numbers.
- **Kanban Board**: Drag-and-drop issue cards to update status.
- **Cycles and Epics**: Track sprints and project milestones.
- **Comments and Activity Logs**: Collaborate and audit issue changes automatically.

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **APIs**: tRPC v11 and TanStack React Query v5
- **Auth**: Better Auth (Session-based)
- **UI & Layout**: Tailwind CSS v4, shadcn/ui, Lucide Icons, dnd-kit

## Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Database setup**:
   ```bash
   pnpm postinstall
   pnpm db:push
   ```

3. **Run local server**:
   ```bash
   pnpm dev
   ```

The server runs on port 3000.

## Development Scripts

- **Check User Accounts**: `npx tsx check-user.ts`
- **List All Users**: `npx tsx list-users.ts`
- **Database Diagnostics**: `npx tsx debug-all.ts`

## License

Private and proprietary.
