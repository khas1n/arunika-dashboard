# Development

Local setup, checks, and the changes that have a fixed shape. The short introduction is the [README](../README.md). Product scope is [product.md](product.md).

## Prerequisites

- Node.js 24
- pnpm 11.4.0 (`corepack enable && corepack prepare pnpm@11.4.0 --activate`)
- Docker Desktop, for Postgres

## First run

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

Set `SEED_ADMIN_PASSWORD` in `.env`. The seed refuses to run when that value is empty. Do not commit `.env` or paste the password into docs or chat.

```bash
pnpm install
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open http://localhost:3000 and sign in with `SEED_ADMIN_USERNAME` (default `admin`) and the password you set. Email stays on the account (`SEED_ADMIN_EMAIL`) and is not the login field.

`pnpm db:migrate` on a fresh database creates the tables. The fish-species migration inserts Nila (`NILA`) and Biofloc (`BIOFLOC`) when those codes are missing, points every existing cycle at them, then makes the foreign keys required. A later schema change uses the same command with a name: `pnpm exec prisma migrate dev --name <change>`.

Add another species or method with a new `code` on `fish_species` or `cultivation_method`. The Kolam header shows the name from that row.

Optional: load BATCH 1 from the Pakan workbook with `pnpm db:import`. Re-running replaces BATCH 1 cycles and sets each one to Nila and Biofloc. It keeps ponds, feed names, species, methods, and the administrator, and it does not write puasa dadakan.

## Environment

| Name                  | Required     | Default                 | Purpose                                                        |
| --------------------- | ------------ | ----------------------- | -------------------------------------------------------------- |
| `POSTGRES_USER`       | no           | `arunika`               | Database user for Docker                                       |
| `POSTGRES_PASSWORD`   | no           | `arunika`               | Database password for Docker. Use a strong value in production |
| `POSTGRES_DB`         | no           | `arunika`               | Database name for Docker                                       |
| `POSTGRES_PORT`       | no           | `5432`                  | Host port for Postgres                                         |
| `APP_PORT`            | no           | `3000`                  | Host port for the production app container                     |
| `DATABASE_URL`        | yes          | local Postgres URL      | Connection string used by Prisma and the app                   |
| `BETTER_AUTH_SECRET`  | yes          | none                    | Session signing secret, at least 32 characters                 |
| `BETTER_AUTH_URL`     | yes          | `http://localhost:3000` | Public origin. Keep this in sync with the dev server port      |
| `SEED_ADMIN_NAME`     | no           | `Administrator`         | Display name of the seeded admin                               |
| `SEED_ADMIN_USERNAME` | no           | `admin`                 | Username used to sign in                                       |
| `SEED_ADMIN_EMAIL`    | no           | `admin@arunika.local`   | Email stored on the seeded admin                               |
| `SEED_ADMIN_PASSWORD` | yes for seed | none                    | Password of the seeded admin                                   |

`.env.example` is the committed template.

## Scripts

| Script                 | What it does                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `pnpm dev`             | Dev server on port 3000                                                                       |
| `pnpm build`           | Production build into `.output`                                                               |
| `pnpm start`           | Run `node .output/server/index.mjs`                                                           |
| `pnpm preview`         | Vite preview                                                                                  |
| `pnpm typecheck`       | `tsc --noEmit`                                                                                |
| `pnpm lint`            | ESLint                                                                                        |
| `pnpm format`          | Prettier, then ESLint fix                                                                     |
| `pnpm check`           | Prettier check                                                                                |
| `pnpm generate-routes` | Regenerate `src/routeTree.gen.ts`                                                             |
| `pnpm storybook`       | Storybook on port 6006                                                                        |
| `pnpm build-storybook` | Static Storybook build                                                                        |
| `pnpm test:stories`    | Run stories in a headless browser                                                             |
| `pnpm test:unit`       | Run domain tests in Node                                                                      |
| `pnpm db:up`           | Start Postgres (`docker compose up -d db`)                                                    |
| `pnpm db:down`         | Stop Compose services                                                                         |
| `pnpm db:generate`     | Generate the Prisma client                                                                    |
| `pnpm db:migrate`      | Create and apply a dev migration                                                              |
| `pnpm db:deploy`       | Apply committed migrations (`migrate deploy`)                                                 |
| `pnpm db:studio`       | Prisma Studio                                                                                 |
| `pnpm db:seed`         | Upsert Nila (`NILA`) and Biofloc (`BIOFLOC`) by code, then create or update the administrator |
| `pnpm db:import`       | Load BATCH 1 from the workbook. Replaces those cycles                                         |
| `pnpm user:create`     | Add a user who can sign in                                                                    |

Husky runs commitlint on `commit-msg`. Messages follow Conventional Commits (`@commitlint/config-conventional`).

## Checks

There is no CI config in the repo. Run the checks that match the change:

| Change                  | Command                                                                         |
| ----------------------- | ------------------------------------------------------------------------------- |
| Types                   | `pnpm typecheck`                                                                |
| Lint and format         | `pnpm lint` and `pnpm check`                                                    |
| A component story       | `pnpm exec playwright install chromium` once, then `pnpm test:stories`          |
| Domain behavior         | `pnpm test:unit`                                                                |
| A page an operator sees | Storybook with `&full=true`, using the `agent-browser` CLI when it is installed |
| Production bundle       | `pnpm build`                                                                    |

Storybook:

```bash
pnpm storybook
```

Stories open at http://localhost:6006. Share a story URL with `&full=true` on the end.

```bash
pnpm exec playwright install chromium
pnpm test:stories
```

Stories are CSF3, colocated with the component, and use `tags: ['autodocs']`. `@storybook/tanstack-react` provides the router and mocks server functions. Reset a Zustand store in `beforeEach` when a story changes it.

## Conventions

Cursor loads `.cursor/rules/` automatically. Claude Code is pointed at the same files from [CLAUDE.md](../CLAUDE.md).

- `project-structure.mdc` — folders and the server file boundary
- `react-components.mdc` — `const Name: FC<Props> =`
- `tailwind-styling.mdc` — Tailwind tokens, no arbitrary values
- `storybook.mdc` — a story for every component
- `performance.mdc` — loaders, skeletons, no default memoization
- `state-management.mdc` — Query, the URL, forms, Zustand
- `tanstack-routing.mdc` — file routes and the SPA rendering policy
- `tanstack-skills.mdc` — load the matching Intent skill before a TanStack edit
- `agent-browser.mdc` — UI checks with the agent-browser CLI
- `documentation.mdc` — update the doc that the change invalidates

Screen copy is Indonesian until translations exist. Keep a new string in the component. Code and docs stay English.

## How-to

### Add a protected page

1. Add `src/routes/_authenticated/<name>.tsx` with `ssr: false`, a loader, and a skeleton `pendingComponent`.
2. Add `src/features/<name>/` for the screen.
3. If the page reads private data, add a `*.server.ts` helper and a `*.functions.ts` wrapper that uses `.middleware([authMiddleware])`.
4. Add `queryOptions` and call `ensureQueryData` from the loader.
5. Add a story next to every new component.
6. Add a link in `src/components/layout/app-sidebar`.

### Add a shadcn component

```bash
pnpm dlx shadcn@latest add button
```

Add a sibling `*.stories.tsx`. Style with Tailwind tokens (`bg-background`, `text-muted-foreground`). Do not add raw CSS or arbitrary values like `bg-[#fff]`.

### Change the database schema

Edit `prisma/schema.prisma`, then:

```bash
pnpm exec prisma migrate dev --name <change>
```

Commit the new folder under `prisma/migrations`. Production applies it with `pnpm db:deploy`.

### Add a user

```bash
pnpm user:create --username sari --email sari@arunika.local --name "Sari Dewi"
```

The command asks for the password twice and does not show it while you type. `--name` defaults to the username. It stops without changing anything if the username or email is already taken.

- Usernames are 3 to 30 letters, numbers, or underscores, stored in lowercase. `Sari` and `sari` are the same login.
- Passwords need 8 to 128 characters.
- Email is required and stored on the account. It is not the login field.

To skip the prompt (for example in a script), add `--password`. The password then stays in your shell history.

In production, run the same command in the migrate container:

```bash
docker compose --profile app run --rm migrate pnpm user:create --username sari --email sari@arunika.local
```

There is no user-management screen. Edit names or emails in `pnpm db:studio`. Do not edit `account.password` there; it holds a hash, not the password.

### Change the administrator

Update `SEED_ADMIN_USERNAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME`, or `SEED_ADMIN_PASSWORD` in `.env` and run `pnpm db:seed`. The seed finds the admin by email and updates the name, username, and password. Use `pnpm user:create` for everyone else.

## Deployment

The production image is a Node server. Postgres stays a separate container. This is the compose path in the repo. It is not a hosted production environment with a public URL checked in here.

First deploy, from a machine with the production `.env` filled in (strong `POSTGRES_PASSWORD`, a real `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` set to the public `https://` origin):

```bash
docker compose --profile app up -d --build
docker compose --profile app run --rm migrate pnpm db:seed
```

`app` waits until Postgres is healthy and `migrate` has applied `prisma migrate deploy`.

Updates: pull the new code and run the same `up -d --build`. The migrate service applies new migrations before the app starts.

Put a reverse proxy in front of `APP_PORT` for TLS. The app container listens on port 3000 inside the network.

Logs:

```bash
docker compose --profile app logs -f app
```

Backup and restore:

```bash
docker compose exec db pg_dump -U arunika arunika > backup.sql
docker compose exec -T db psql -U arunika arunika < backup.sql
```

## Troubleshooting

**Port 3000 or 5432 is already in use.** Stop the other process, or change `APP_PORT` / `POSTGRES_PORT` and the matching URL. If the dev server moves off 3000, set `BETTER_AUTH_URL` to that origin and restart.

**`ERR_PNPM_IGNORED_BUILDS`.** pnpm 11 will not run dependency build scripts until they are allowed. `pnpm-workspace.yaml` lists the ones this repo needs (`esbuild`, `prisma`, `unrs-resolver`, and others). Set a new package to `true` there and run `pnpm install` again.

**Prisma client is missing.** Run `pnpm db:generate`. The client is written to `src/generated/prisma`, which is gitignored.

**Login fails after changing the seed password.** Run `pnpm db:seed` again. An empty `SEED_ADMIN_PASSWORD` makes the seed exit.

**Reset the database.** This deletes every row, including users:

```bash
docker compose down -v
pnpm db:up
pnpm db:migrate
pnpm db:seed
```
