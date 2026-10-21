# Security

Report a vulnerability through GitHub private vulnerability reporting on this repository. Do not open a public issue for a security problem.

Please include the route or server function, what a signed-in user can do that they should not, and whether the problem needs a secret from `.env`. Do not send passwords, session cookies, or the contents of `.env`.

## What this app already does

- Public sign-up is off. Accounts come from the database seed or `pnpm user:create`.
- Passwords are stored as hashes.
- Server functions that read or write private data use `authMiddleware`.
- There is one account type. Anyone who can sign in can do the same work.
- Secrets stay in `.env`, which is gitignored. `.env.example` has empty secrets and local defaults only.

This file is not a claim that the app has been audited.
