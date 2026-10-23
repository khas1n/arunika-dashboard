<!-- intent-skills:start -->

## Skill Loading

Use the repository’s installed Intent. If it is unavailable, report the missing dependency instead of downloading a replacement.
Before editing files for a substantial task:

- Run `pnpm exec intent list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm exec intent load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->

## Project

Arunika is a fish-farm app any farm will be able to run. Opening the source is planned. There is one account type. Screen copy is Indonesian until translations exist. Code and docs stay English.

Before a substantial change, read [docs/ai-engineering.md](docs/ai-engineering.md). Pakan words are in [docs/GLOSSARY.md](docs/GLOSSARY.md). Product scope and open questions are in [docs/product.md](docs/product.md). Coding conventions that Cursor always applies are in `.cursor/rules/`.

Do not print secrets, `.env` values, or the seeded administrator password.

Avoid unnecessary secondary labels and descriptions. Let the layout do the explaining.
