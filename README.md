# Arunika Dashboard

Arunika is a fish-farm app for the life of a pond: growth, feed, and the work of the day. A farm runs it for itself. The repository is planned to be open source, so any farm can do the same.

This tree is the application. There is no hosted service and no published usage numbers.

## Problem

Pond history, feed, and the day's work are easy to split across a workbook. Growth and feed then have to be reconstructed by hand. Arunika keeps that record in one app a farm can run on its own.

## Vision

The long-term direction is one system for farm operations: production, inventory, purchasing, sales, and the daily record. Fish farming is the first industry. Poultry, vegetables, and other livestock are later candidates, not models in this codebase. Shared ideas that already exist are a production cycle, daily snapshots, and append-only events. Copying that shape to another industry is a future design. See [docs/architecture.md](docs/architecture.md).

There is one kind of account. Anyone who can sign in can do the same work. Screen copy is Indonesian today. Translations are planned, so the language is not fixed.

## What the app does now

- Sign in with a username and password. Email is stored on the account and is not the login field. Public sign-up is disabled. The first administrator is created by the database seed.
- Beranda shows user and active-session counts, and the jenis pakan list. A feed that is already used cannot be deleted.
- Kolam opens each pond in batch order. Cycle facts sit in an info control. Today's bibis, total kematian, and FCR stay above the tabs. Harian is the paged daily log. Puasa records and ends puasa dadakan. Grafik shows biomass and daily deaths for this pond, for the whole cycle until a range is applied.
- Profil shows the session. Pengaturan stores theme and sidebar in the browser.
- BATCH 1 history is loaded with `pnpm db:import` from the Pakan workbook. That script is not an upload screen.

The daily log, deaths, biomass, and FCR are computed from stored events. Adding and editing that day in the app, including deaths and the rest of the farm's work, is the next recording flow. A farm-specific list of what to record is a later shape of the same flow. Fish purchases and sales belong in this app and are not built yet. Detail is in [docs/product.md](docs/product.md).

## Stack

| Piece                                                                                  | Role                                         |
| -------------------------------------------------------------------------------------- | -------------------------------------------- |
| [TanStack Start](https://tanstack.com/start) and [Router](https://tanstack.com/router) | File routes, server functions, selective SSR |
| [TanStack Query](https://tanstack.com/query)                                           | Server cache                                 |
| [TanStack Form](https://tanstack.com/form)                                             | Login and pakan forms                        |
| [TanStack Table](https://tanstack.com/table) and Virtual                               | Tables                                       |
| [TanStack Charts](https://tanstack.com/charts)                                         | Biomass line                                 |
| [React 19](https://react.dev) and the React Compiler                                   | UI                                           |
| [Tailwind CSS 4](https://tailwindcss.com) and [shadcn/ui](https://ui.shadcn.com)       | Styling and primitives                       |
| [Zustand 5](https://zustand.docs.pmnd.rs)                                              | Theme and sidebar                            |
| [Better Auth](https://www.better-auth.com)                                             | Username and password sessions               |
| [Prisma 7](https://www.prisma.io) and PostgreSQL 18                                    | Database                                     |
| [Storybook 10](https://storybook.js.org) and Vitest                                    | Component stories                            |
| [Nitro](https://nitro.build)                                                           | Production Node server (beta pin)            |
| pnpm 11.4.0 and Node 24                                                                | Package manager and runtime                  |

Pages render in the browser. The server reads the session on the first request and redirects. Private data goes through `authMiddleware` on server functions. Detail is in [docs/architecture.md](docs/architecture.md).

## Quick start

You need Node.js 24, pnpm 11 (`corepack enable && corepack prepare pnpm@11.4.0 --activate`), and Docker Desktop.

```powershell
Copy-Item .env.example .env
```

```bash
cp .env.example .env
```

Generate a secret and put it in `BETTER_AUTH_SECRET`:

```bash
pnpm dlx @better-auth/cli secret
```

Set `SEED_ADMIN_PASSWORD` in `.env`. The seed refuses to run when that value is empty.

```bash
pnpm install
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open http://localhost:3000 and sign in with `SEED_ADMIN_USERNAME` (default `admin`) and the password you set.

Environment variables, every script, deployment, and troubleshooting are in [docs/development.md](docs/development.md). `.env` is gitignored. `.env.example` is the template. Do not commit secrets.

| Script                                            | What it does                                           |
| ------------------------------------------------- | ------------------------------------------------------ |
| `pnpm dev`                                        | Dev server on port 3000                                |
| `pnpm build` / `pnpm start`                       | Production build, then `node .output/server/index.mjs` |
| `pnpm typecheck`                                  | `tsc --noEmit`                                         |
| `pnpm lint` / `pnpm check`                        | ESLint, and Prettier check                             |
| `pnpm test:stories`                               | Stories in a headless browser                          |
| `pnpm storybook`                                  | Storybook on port 6006                                 |
| `pnpm db:up` / `pnpm db:migrate` / `pnpm db:seed` | Postgres, schema, Nila, Biofloc, administrator         |
| `pnpm db:import`                                  | Load BATCH 1. Replaces those cycles                    |
| `pnpm user:create`                                | Add a user who can sign in                             |

## Project layout

```
src/routes/            guards, loaders, titles
src/features/<name>/   api, components, hooks, schemas
src/components/ui/     shadcn primitives
src/components/layout/ app shell
src/components/shared/ used by more than one feature
prisma/                schema, migrations, seed
scripts/               import and user creation
docs/                  product, architecture, roadmap, engineering
```

Imports go one way: routes, then features, then shared folders. A feature does not import another feature or a route. Import with the `#/` alias. `*.server.ts` is server-only. `*.functions.ts` holds `createServerFn` wrappers.

## Roadmap

Statuses are evidence from the repo. There are no dates. The full tables are in [docs/roadmap.md](docs/roadmap.md).

| Phase                       | Now                                                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Foundation               | Sessions, shell, Postgres, and stories are in place. One account type. Open source, translations, and CI are planned                     |
| 2. Fish-farm operations     | Feed names, imported history, biomass, bibis, puasa dadakan, and Harian add and edit work. Stock, treatments, and fish sales are planned |
| 3. Operational intelligence | FCR and biomass are on the pond. Beranda is still user and session counts                                                                |
| 4. Other industries         | Not chosen yet. The code is a fish-farm app                                                                                              |
| Engineering workflow        | Cursor rules, Intent skills, and [docs/ai-engineering.md](docs/ai-engineering.md)                                                        |

## Status and limits

- Any farm is meant to run its own copy. The source is not public yet. There is no farm switcher inside one deployment.
- One account type. Sign-up in the browser is still off. Accounts come from the seed or `pnpm user:create`.
- History for days comes from the workbook import. Harian can add a day and edit that day's weight, FR, deaths, and actual feed. Derived columns are calculated again.
- `pnpm db:import` replaces BATCH 1 cycles. It does not write puasa dadakan.
- Several Prisma models (receipts, stock opname, treatments) have no screen yet.
- Nitro is a beta dependency. There is no CI workflow in the repo.
- Open product questions are listed in [docs/product.md](docs/product.md).

## AI-assisted development

Cursor and Claude Code share one workflow: [docs/ai-engineering.md](docs/ai-engineering.md). Cursor rules live in `.cursor/rules/`. Claude Code starts at [CLAUDE.md](CLAUDE.md). TanStack library skills load through `pnpm exec intent`. This is how the software is written. It is not a feature of the farm product.

## Documentation

| Doc                                                                                            | Purpose                                                |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [docs/product.md](docs/product.md)                                                             | Problem, users, workflows, assumptions, open questions |
| [docs/architecture.md](docs/architecture.md)                                                   | Stack, request path, data, security, limits            |
| [docs/development.md](docs/development.md)                                                     | Setup, scripts, checks, deploy, troubleshooting        |
| [docs/roadmap.md](docs/roadmap.md)                                                             | Phases and status                                      |
| [docs/ai-engineering.md](docs/ai-engineering.md)                                               | Agent workflow, gates, boundaries                      |
| [docs/GLOSSARY.md](docs/GLOSSARY.md)                                                           | Pakan words                                            |
| [docs/pakan-database-design.md](docs/pakan-database-design.md)                                 | Domain model                                           |
| [docs/pakan-xlsx-analysis.md](docs/pakan-xlsx-analysis.md)                                     | Workbook study                                         |
| [docs/adr/0001-kolam-reads-are-offset-pages.md](docs/adr/0001-kolam-reads-are-offset-pages.md) | List contract                                          |

## Contributing

Match the conventions in `.cursor/rules/`. Screen copy is Indonesian until translations exist. Keep a new string in the component. Add a Storybook story next to a component you change. Run `pnpm typecheck` and, for a story change, `pnpm test:stories`. Commit messages follow Conventional Commits. Do not commit `.env` or a password.
