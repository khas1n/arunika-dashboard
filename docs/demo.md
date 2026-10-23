# Demo

A walkthrough of what an operator can do in this repository. The screenshots in [screenshots/README.md](screenshots/README.md) are Storybook fixtures. They show the same components the app renders. They are not a dump of the live farm database.

There is no hosted demo. Run the app locally.

## Setup

Follow [development.md](development.md) through `pnpm db:seed` and `pnpm dev`. Sign in at http://localhost:3000 with `SEED_ADMIN_USERNAME` (default `admin`) and the password you set in `.env`.

`pnpm db:seed` creates Nila, Biofloc, and that account. It does not create ponds or daily history. Kolam stays empty until `pnpm db:import`. That command loads BATCH 1 from the workbook in this repo. It is this farm's history, not a synthetic demo, and running it again replaces those cycles. It does not write puasa dadakan.

## Walkthrough

1. Open http://localhost:3000/login. The form asks for a username and a password. Public sign-up is not on the page.
2. After sign-in, Beranda (`/`) shows how many users and unexpired sessions exist, and the jenis pakan list. Create, rename, or delete a feed. Delete stays disabled when the feed is already used.
3. Open Kolam and choose a pond in batch order (A3, B3, C3, D3, A6, B6, C6, D6). This step needs an imported cycle. The seed alone has nothing to open.
4. On the pond page, the strip above the tabs shows FR from the latest recorded weight, total kematian for the cycle, and FCR. Cycle facts, including jenis ikan and metode budidaya, sit in the info control beside the title. The active tab is `?tab=` in the URL. Pakan, in the sidebar, is the farm stock and the bibis forecast.
5. Harian is the paged daily log, newest date first. Catat records today's weight, today's deaths, or today's actual feed, each on its own, and can add a historical day. An existing historical date is replaced only after confirmation. FR is calculated from the weight. It is not typed.
6. Puasa lists puasa dadakan, including ended rows. Record a new range or end an active one. The recurring fasting pattern is not edited here.
7. Treatment is the activity log for the cycle: who recorded it, the treatment, the grams, and when. Add, edit, or soft-revoke a row. Filter with a date range. Scroll to load older rows. The chips beside the title are the cycle's planned treatments. They do not limit what can be logged.
8. Grafik shows biomass and that day's deaths. An empty range is the whole active cycle.

Profil shows the signed-in account. Pengaturan stores theme and sidebar in the browser.

## Not in this walkthrough

These are not screens, so the demo does not include them:

- Feed receipts, feed applications, and stock opname.
- Water quality, harvest, purchasing, sales, cost, and alerts.
- A second role, a second farm, or a language switcher.

## Recording

If you record the screen, use the local app after you understand whether the database holds the workbook import. Do not show `.env`, the admin password, or a browser console. Say on the recording that BATCH 1 is this farm's imported history, and that a license has not been chosen.
