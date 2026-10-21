# Contributing

Thanks for looking. A license has not been chosen, so do not copy this source into another project until one exists. Issues and pull requests that fix or explain this repository are still welcome.

## Setup

You need Node.js 24, pnpm 11.4.0, and Docker Desktop. The commands, environment variables, and database steps are in [docs/development.md](docs/development.md). Do not commit `.env` or a password.

`pnpm db:seed` creates Nila, Biofloc, and one administrator. Pond history comes from `pnpm db:import`, which loads this farm's BATCH 1 workbook and replaces those cycles.

## Architecture

Routes in `src/routes/` compose a feature. A feature in `src/features/<name>/` owns its API, components, hooks, and Zod schemas. Shared UI lives under `src/components/`. Imports go routes, then features, then shared. A feature does not import another feature.

The page renders in the browser. Private reads and writes go through a `createServerFn` in `*.functions.ts`, with `authMiddleware`, and the database call stays in `*.server.ts`. Zod schemas in plain `.ts` files are the contract. Derived pond figures are calculated, not stored. List screens use offset pages.

More detail is in [docs/architecture.md](docs/architecture.md). Product scope is in [docs/product.md](docs/product.md). Pakan words are in [docs/GLOSSARY.md](docs/GLOSSARY.md).

## Checks

| Change            | Command                                                                     |
| ----------------- | --------------------------------------------------------------------------- |
| Types             | `pnpm typecheck`                                                            |
| Lint and format   | `pnpm lint` and `pnpm check`                                                |
| Domain behavior   | `pnpm test:unit`                                                            |
| A component       | Add or update the sibling `*.stories.tsx`. Story URL ends with `&full=true` |
| Story suite       | `pnpm exec playwright install chromium` once, then `pnpm test:stories`      |
| Production bundle | `pnpm build`                                                                |

There is no GitHub Actions workflow. Run the checks locally. Story tests need Playwright (`pnpm exec playwright install chromium` once, then `pnpm test:stories`). The treatment server test skips when `DATABASE_URL` is unset.

## Pull requests

- One logical change. Do not mix a drive-by refactor with a feature.
- Screen copy stays Indonesian until a translation catalog exists. Code and docs stay English.
- Conventional Commits (`feat:`, `fix:`, `docs:`). Husky runs commitlint on `commit-msg`.
- Say which commands you ran and which you did not.
- Do not claim a feature the code does not have. Update [docs/product.md](docs/product.md) or [docs/roadmap.md](docs/roadmap.md) when operator-facing behavior changes.

## Bugs and features

Use the GitHub issue templates. A bug report needs the route, what you did, and what you expected. A feature request needs the farm task it would help. Security reports go through [SECURITY.md](SECURITY.md), not a public issue.
