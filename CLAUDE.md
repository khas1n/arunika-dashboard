# Arunika Dashboard

Claude Code should follow the same engineering rules as Cursor.

Read these before changing the project:

- [AGENTS.md](AGENTS.md) for TanStack Intent skill loading. Run `pnpm exec intent list`, then `pnpm exec intent load <package>#<skill>`, when a change uses a TanStack package that ships a skill.
- [docs/ai-engineering.md](docs/ai-engineering.md) for the feature, bug, and review workflows, quality gates, handoff, and agent boundaries.
- [.cursor/rules/](.cursor/rules/) for the coding conventions. They are written for Cursor; apply the same rules here.
- [docs/GLOSSARY.md](docs/GLOSSARY.md) for pakan terms, and [docs/product.md](docs/product.md) for what the product does and does not do yet.

Screen copy is Indonesian until translations exist. Keep a new string in the component. Code, file names, and documentation stay English.

Do not print secrets, `.env` values, or the seeded administrator password. Do not claim a command passed unless it was run in this session.
