# AI-assisted engineering

How Cursor and Claude Code should change this repository. This is the development workflow. The farm app does not include an assistant, a model call, or an automated recommendation.

## Instruction hierarchy

Use the narrowest file that already answers the question. Do not copy a rule into a second file.

| Layer              | Where                                                                                                    | What it decides                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Shared engineering | [ai-engineering.md](ai-engineering.md) (this file), [GLOSSARY.md](GLOSSARY.md), [product.md](product.md) | Workflow, words, what is built                                                                |
| Cursor rules       | `.cursor/rules/*.mdc`                                                                                    | Conventions Cursor injects. Claude Code is told to follow them from [CLAUDE.md](../CLAUDE.md) |
| Intent skills      | `AGENTS.md`, then `pnpm exec intent list`                                                                | TanStack library skills shipped inside dependencies                                           |
| Project skills     | `.agents/skills/`, `.cursor/skills/`                                                                     | Procedures checked into this repo                                                             |
| Task               | The issue or the request in front of the agent                                                           | Acceptance for that change only                                                               |

`AGENTS.md` is regenerated inside the `intent-skills` markers by `pnpm exec intent install`. Put project notes after those markers so the next install keeps them.

Cursor reads `AGENTS.md` and `.cursor/rules/`. Claude Code reads `CLAUDE.md` and does not load `.cursor/rules/` by itself, so `CLAUDE.md` points at them. Neither tool loads the other's private skill folder automatically.

## What is already in the repo

| Kind           | Path                                            | Note                                                                                                              |
| -------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Intent loader  | `AGENTS.md`, `@tanstack/intent`                 | Charts, React Table, table-core, Start, and Router ship skills. React Query, React Form, and React Virtual do not |
| Cursor rules   | `.cursor/rules/`                                | Structure, React, Tailwind, routing, state, stories, performance, TanStack skills, browser checks, docs           |
| Project skills | `.agents/skills/`, `.cursor/skills/pakan-xlsx/` | shadcn, Radix migration, codebase design, pakan workbook, grill stubs                                             |
| Claude entry   | `CLAUDE.md`                                     | Pointer. Not a second copy of the rules                                                                           |
| Hooks          | `.husky/commit-msg`                             | Conventional Commits via commitlint                                                                               |
| MCP in git     | none                                            | Do not assume a personal MCP server is available to every agent                                                   |

`grill-with-docs` and `grill-me` only say to call a `grilling` skill. That skill is not in this repo. When a design is unclear, record the assumption in `docs/product.md` or add an ADR. Do not invent the missing skill.

## Feature workflow

1. Read the request and the code it touches. Use [product.md](product.md) so a schema table is not described as a screen.
2. If a product decision is missing and the repo cannot answer it, ask one focused question. Otherwise write the assumption down and continue.
3. If the change uses a TanStack package that ships an Intent skill, load that skill before editing.
4. Plan the smallest change and the check that would fail if it were wrong.
5. Implement it. Match the existing file style. Do not refactor neighbors.
6. Add or update a story when a component's behavior changes.
7. Run the checks in [Quality gates](#quality-gates).
8. Read the diff for unrelated edits.
9. Update the doc named in `.cursor/rules/documentation.mdc` when behavior, setup, or a domain word changed.
10. Summarize what changed, which commands ran, and what was not verified.

## Bug workflow

1. Reproduce the failure, or say what blocked reproduction.
2. Find the cause before editing.
3. Add a story or a failing check that catches the regression when the project has a place for it.
4. Fix that cause.
5. Re-run the check. Name any path that was not exercised.

## Refactor workflow

1. Read the current behavior and the stories that cover it.
2. State the structural change in a sentence.
3. Keep behavior the same unless the request says otherwise.
4. Keep the diff reviewable. Do not mix a refactor with a feature.
5. Re-run the stories and typecheck that cover the moved code.

## Review workflow

Report findings first, ordered by severity. A finding names the file, the failure, and the correction.

Look for: wrong domain numbers, auth missing on a server function, a feature importing another feature, secrets in the diff, a list that is not an offset page, a derived value stored by mistake, and a story that no longer matches the component.

Separate a defect you can show from a guess. A guess is labeled as a guess.

## Documentation workflow

Update the source of truth instead of pasting the same paragraph into the README and a second file. The README links here. Long setup steps live in [development.md](development.md).

A decision that is hard to undo gets `docs/adr/NNNN-title.md` with status, context, decision, and consequences. The existing example is [adr/0001-kolam-reads-are-offset-pages.md](adr/0001-kolam-reads-are-offset-pages.md).

## Skills

Implemented means a `SKILL.md` is in the repo and agents can be pointed at it. Proposed means it is worth adding later. None of the proposed skills were added in the documentation pass.

| Skill              | Status                                    | When                                          | Done when                                                                    |
| ------------------ | ----------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------- |
| Pakan workbook     | Implemented, `.cursor/skills/pakan-xlsx/` | Import or domain questions about the workbook | The script and [pakan-xlsx-analysis.md](pakan-xlsx-analysis.md) still agree  |
| shadcn             | Implemented, `.agents/skills/shadcn/`     | Adding or restyling a primitive               | The new component has a story and uses tokens                                |
| TanStack Intent    | Implemented via `pnpm exec intent load`   | A change uses a package that ships a skill    | The loaded skill's constraints are followed                                  |
| Feature planning   | Proposed                                  | A change spans routes, schema, and UI         | A short plan with acceptance checks exists before edits                      |
| Bug diagnosis      | Proposed                                  | A failure is not a one-line typo              | Cause, regression check, and unverified paths are stated                     |
| Story and UI check | Proposed                                  | A screen changes                              | Storybook URL with `&full=true`, and agent-browser when the CLI is installed |
| Commit and MR text | Proposed                                  | A human asks for a commit or a merge request  | Conventional Commits, no secrets, no drive-by files                          |
| Documentation pass | Proposed                                  | A feature lands without a doc update          | README links and `docs/` match the code                                      |

A new skill needs a purpose, the trigger, the inputs, the steps, the constraints, the check, and the output. Put Cursor-specific skills in `.cursor/skills/`. Put skills both tools should share in `.agents/skills/` and link them from `CLAUDE.md` if Claude Code will not see that folder on its own.

## Handoff

Small changes do not get a progress file. For a change that will span sessions, write a short note in the issue or in the PR description:

- What is done, and the files touched.
- Decisions and assumptions.
- Commands that passed, and commands not run.
- The next action.

Before resuming, read the repo again. A note is stale if the code disagrees with it. Do not treat a chat transcript as the source of truth.

## Quality gates

Run the narrowest command that can fail the change. Do not claim a pass without running it.

| Situation                                              | Command                                                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Types or a public schema changed                       | `pnpm typecheck`                                                                            |
| Lint or format may fail                                | `pnpm lint` and `pnpm check`                                                                |
| A story changed                                        | `pnpm test:stories` after `pnpm exec playwright install chromium` if the browser is missing |
| An operator screen changed                             | Open the story with `&full=true`. Use `agent-browser` when that CLI is installed            |
| Routes, server entry, or the production bundle changed | `pnpm build`                                                                                |
| Schema changed                                         | `pnpm exec prisma migrate dev --name <change>` locally, and commit the migration            |

Do not weaken a story, a schema, or `authMiddleware` to make a check pass. If a command fails or is skipped, say so in the summary.

There is no unit-test script besides Storybook, and no CI workflow. Those are gaps, not optional extras an agent may ignore when a story is the right check.

## Integrations

| Tool                 | In this repo                                    | Recommendation                                                                                      |
| -------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Git                  | Yes                                             | Commits and branches only when a person asks. Conventional Commits via Husky                        |
| Git hosting CLI      | Not configured here                             | Use the host the remote already uses. Do not add a new host as part of a feature                    |
| Issue tracker        | Not in the repo                                 | Keep handoff notes in the issue if one exists. Do not create a tracker config unasked               |
| agent-browser        | Documented in `.cursor/rules/agent-browser.mdc` | Use it for UI checks when the CLI is installed. It is not an npm dependency                         |
| Storybook            | `pnpm storybook` on port 6006                   | The component check. `@storybook/addon-mcp` is a dev dependency; no MCP server is committed         |
| Intent               | `pnpm exec intent`                              | The TanStack skill source. Do not download a replacement package if Intent is missing               |
| Personal MCP servers | Editor-local                                    | Figma, Atlassian, or similar may exist on one machine. Do not document them as project requirements |

No new integration was installed for this documentation.

## Agent boundaries

- Do not print secrets, tokens, `.env` values, or the seeded password.
- Do not drop `authMiddleware`, disable sign-up, or loosen Zod to make a call succeed.
- Do not run `docker compose down -v`, `pnpm db:import`, or a force push unless the person asked. Import replaces BATCH 1 cycles.
- Do not revert files you did not change.
- Do not edit unrelated files because they look untidy.
- A migration, a dependency upgrade, or a change to auth needs a person to review it.
- Generated code is not done until the relevant gate has been run, or the skip is explained.

## How to tell if this workflow helps

These are measures to start collecting. They are not results.

- Time from request to a green check, for a repeated kind of change.
- Defects found after merge, especially domain numbers and auth.
- Stories added with the change, and stories that only assert the happy path.
- Review comments that are the same rule twice.
- Docs that still describe a removed screen.
- Commands that fail on a clean tree.
- Handoff notes that contradict the code.
- Extra tool calls that do not change the diff.

Record a baseline before claiming the workflow is faster.
