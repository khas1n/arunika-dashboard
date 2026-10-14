# Roadmap

How the product can grow from this repository. Status is taken from the code, not from a delivery plan. There are no dates and no completion percentages.

| Status      | Meaning                                                          |
| ----------- | ---------------------------------------------------------------- |
| Completed   | An operator or a developer can use it in this repo               |
| In progress | Part of it is in the tree and part is not                        |
| Planned     | Agreed in these docs as the next fish-farm work, still not built |
| Proposed    | Worth discussing. Not a commitment                               |
| Blocked     | Waiting on a decision in [product.md](product.md)                |

The README keeps the short version. This file is the detail.

## Phase 1 — Foundation

| Item                                              | Status    | Evidence                                                                                    |
| ------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------- |
| Username and password sessions, no public sign-up | Completed | Better Auth, seed, `pnpm user:create`                                                       |
| SPA shell, profile, settings                      | Completed | Routes under `src/routes/_authenticated/`                                                   |
| Postgres, Prisma, Docker Compose app image        | Completed | `prisma/`, `docker-compose` used by the db scripts                                          |
| Storybook next to components, editor rules        | Completed | `*.stories.tsx`, `.cursor/rules/`                                                           |
| Product, architecture, and engineering docs       | Completed | This `docs/` set                                                                            |
| One account type                                  | Completed | No roles in the schema or the screens. Decided: every signed-in person can do the same work |
| Open source release                               | Planned   | Decided. The repository is not public yet                                                   |
| Interface translations                            | Planned   | Screen copy is Indonesian. No translation catalog                                           |
| Continuous integration                            | Proposed  | No workflow file under `.github/`                                                           |
| User administration screen                        | Proposed  | Users are created from the CLI. Browser sign-up stays off                                   |

## Phase 2 — Core fish-farm operations

| Item                                                              | Status    | Evidence                                                                                                                                                |
| ----------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feed names on Beranda, delete blocked when the feed is used       | Completed | `src/features/pakan` feed list                                                                                                                          |
| Pond navigation and BATCH 1 history import                        | Completed | Kolam routes, `pnpm db:import`                                                                                                                          |
| Daily log, biomass for the whole cycle, FCR, bibis, puasa dadakan | Completed | Kolam page and domain functions                                                                                                                         |
| Add and edit a day's work, including deaths, in a form            | Completed | Catat harian and inline edit of berat, FR, kematian, and pakan aktual. Derived columns are calculated again. A farm-specific checklist is a later shape |
| Feed receipts, stock opname, and on-hand quantity as screens      | Proposed  | Models exist. The UI does not record them                                                                                                               |
| Treatment records as a screen                                     | Proposed  | `Treatment` and `TreatmentLog` exist. No screen                                                                                                         |
| Fish purchasing and sales, in this app                            | Planned   | Decided. No model and no screen                                                                                                                         |
| Water quality                                                     | Proposed  | No model                                                                                                                                                |

Adding and editing a day's inputs is on the Harian log. A farm-specific list of what to record is still a later shape. Fish purchases and sales follow in this app. Stock counts and treatments stay candidates.

## Phase 3 — Operational intelligence

| Item                                             | Status    | Evidence                                       |
| ------------------------------------------------ | --------- | ---------------------------------------------- |
| FCR and biomass on the pond                      | Completed | Derived on the Kolam header and chart          |
| Beranda beyond user and session counts           | Proposed  | `getDashboardSummary` returns those two counts |
| Harvest, cost, and reminders                     | Proposed  | Not modeled                                    |
| More reports after someone uses the daily record | Proposed  | No feedback channel is set up in the repo      |

## Phase 4 — More than one industry

| Item                                                    | Status   | Evidence                                                                     |
| ------------------------------------------------------- | -------- | ---------------------------------------------------------------------------- |
| A second farming industry                               | Proposed | Not chosen. Features are `auth`, `dashboard`, `pakan`, `profile`, `settings` |
| Each farm runs its own copy                             | Planned  | Decided. There is no farm switcher in one database                           |
| Copy the cycle, snapshot, and event shape where it fits | Proposed | Described in [architecture.md](architecture.md). Not a package               |

## Parallel track — AI-assisted engineering

This track is how the software is built. It is not an AI feature in the farm app.

| Item                                               | Status    | Evidence                                          |
| -------------------------------------------------- | --------- | ------------------------------------------------- |
| Cursor rules and TanStack Intent skills            | Completed | `.cursor/rules/`, `AGENTS.md`, `@tanstack/intent` |
| Claude Code pointer to the same rules              | Completed | `CLAUDE.md`                                       |
| Written feature, bug, review, and handoff workflow | Completed | [ai-engineering.md](ai-engineering.md)            |
| A skill for every recurring task                   | Proposed  | See the skill table in that doc. Not created here |
| CI as a gate agents must pass                      | Proposed  | No workflow file yet                              |
| MCP servers checked into the repo                  | Proposed  | None are configured in the project                |

## What not to treat as a promise

A row in Proposed is a candidate. Planned rows are decided and not built. This file does not assign an owner or a date. The remaining product question is which industry, if any, comes after fish. See [product.md](product.md).
