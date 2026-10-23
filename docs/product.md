# Product

What Arunika is for, what the app does today, and what is still a proposal. Status words match [roadmap.md](roadmap.md).

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Someone on our eight-pond tilapia farm. Two jobs have equal weight: record that pond's day (weight, deaths, feed, fasting, treatment), and review the cycle (history, biomass, deaths, FCR).

There is one account type. A person who can sign in can do the same work as every other person who can sign in. Browser sign-up is off. Accounts come from the seed or `pnpm user:create`.

"Any fish farm runs its own copy" is a later direction, not the audience today. A second industry is not chosen. A shared database for many farms is not the plan.

## Product Purpose

A fish farm's daily record is easy to lose when it lives in a workbook. Growth, feed, fasting, and stock then disagree with each other, and a later question ("what was biomass on this pond, and what did we actually feed?") takes a manual reconstruction.

Arunika replaces that workbook as this farm's pond record. Success is that the day's inputs and the derived history agree. The software has not shown that biofloc, or the app, improves harvest quality. Broader adoption is not established.

The longer direction is one system for operations, production, inventory, and commercial records. Fish farming is the first industry. Poultry, vegetables, and other livestock are a later direction, not a current data model. Shared ideas that already exist here are inventory-like events (feed received, feed applied, stock counted), a production cycle (`Batch` and `BatchPond`), and a daily snapshot (`PondDailyRecord`). Those names are fish-farm names. Reusing them for chickens or crops would be a new design, not a rename.

## Positioning

One deployment is this farm's book of record: events in, derived figures out, one account type. A multi-farm product could not truthfully say that.

## Operating Context

Eight ponds, opened in batch order: A3, B3, C3, D3, A6, B6, C6, D6. The fish are tilapia (nila). Biofloc is a cultivation method we are trying on this farm. It is not a proven result.

The app runs in the browser. Screen copy is Indonesian. `pnpm db:seed` creates Nila, Biofloc, and one administrator. It does not create pond history. History arrives only through `pnpm db:import` of the BATCH 1 workbook. Re-running that command replaces those cycles. It does not write puasa dadakan. Ponds, feed names, fish species, cultivation methods, and the administrator account stay. BATCH 1 cycles are Nila grown with Biofloc.

## Capabilities and Constraints

A license has not been chosen, so reuse is not permitted yet. There are no customers, revenue, or usage numbers.

### Initial market: fish farming

Candidate workflows. Only the status column is a claim about this repository.

| Workflow                           | What it would mean                                           | Status                                                                                                                                                                                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fish development by pond and cycle | Population, biomass, and daily history for a batch on a pond | In the Kolam daily log. Biomassa and daily deaths are on the Grafik tab, from imported history                                                                                                                                                                                 |
| Daily pond record                  | Add and edit the day's work, including deaths                | Today's weight, deaths, and actual feed are separate. A historical day is its own entry and replaces an existing date only after confirmation. FR is calculated from the weight. Derived columns are calculated again. A farm-specific list of what to record is a later shape |
| Pond treatments                    | Treatments and medication against a pond or cycle            | Treatment tab on Kolam: timeline of `TreatmentLog`, add/edit, soft revoke. Planned `BatchPondTreatment` is information only                                                                                                                                                    |
| Feed inventory and stock opname    | Receipts, use, and a physical count against the book         | Pakan page. Stock is receipts minus actual pond grams plus opname adjustments, per feed. No stored balance                                                                                                                                                                     |
| Fasting                            | Recurring pattern and an exception range                     | Recurring pattern is imported. Puasa dadakan can be recorded and ended in the UI                                                                                                                                                                                               |
| Feed to prepare (bibis)            | What to prepare today for the next feeding day               | Pakan page, per feed brand, for today plus `bibisLeadDays` (default 2). Preparation is recorded there and does not change stock. The pond strip shows FR, not bibis                                                                                                            |
| Fish purchasing and sales          | Quantities, prices, dates, counterparties, in this app       | Planned. Not modeled                                                                                                                                                                                                                                                           |
| Mortality                          | Deaths over time, editable with the day's other work         | The Harian kematian cell sets that date's death total. It replaces the total rather than appending another event                                                                                                                                                               |
| Water quality                      | pH, oxygen, temperature, and similar                         | Not modeled                                                                                                                                                                                                                                                                    |
| Harvest and production planning    | When a cycle is ready and what it yielded                    | Not modeled                                                                                                                                                                                                                                                                    |
| Expenses and financial reporting   | Cost and margin                                              | Not modeled                                                                                                                                                                                                                                                                    |
| Alerts and reminders               | A nudge when a record or stock is late                       | Not modeled                                                                                                                                                                                                                                                                    |
| Multi-farm                         | More than one business in one deployment                     | Not modeled                                                                                                                                                                                                                                                                    |

### What an operator can do today

Screen copy is Indonesian today. Translations are planned.

- Sign in with a username and password. Public sign-up is off. The first account comes from the database seed. Further accounts are created with `pnpm user:create`.
- Beranda: see how many users and unexpired sessions exist, and manage jenis pakan (create, rename, delete only when the feed is unused).
- Pakan: two compact sections on one screen. On a wide screen Pakan and Bibis sit side by side. Pakan shows the grams on hand, a short bar of what is left after the feeding day, and Tambah and Opname. Bibis shows the grams left after that day, the same percent, the status, and Tambah. Riwayat is a card under both and scrolls with the page. The sections have no feed filter. Riwayat's page, page size, search, sort, activity, and feed are query params on `/pakan`, and the list is read from the server. The filters are dropdowns, not text you clear, and there is no date filter. Tambah on a pakan row records a receipt. Tambah on a bibis row records preparation and does not reduce stock. Opname records a physical count and keeps the old rows. Those movements, including actual feed and the pond that received it, are in Riwayat. Stock falls only when a pond's pakan aktual is saved. Status is Aman or Perlu tambah bibis. There is no Perlu persiapan threshold and no Data belum lengkap status. A pond with no calculated amount is left out of the bibis total. A missing weight or FR stays blank and is not treated as zero.
- Kolam: open a pond in batch order (A3, B3, C3, D3, A6, B6, C6, D6). Cycle facts, including jenis ikan and metode budidaya, sit in an info control beside the title. FR from the latest recorded weight, total kematian for the active cycle, and FCR stay above the tabs. The active tab is kept in the URL (`?tab=`), so a reload opens the same tab. Harian is the paged daily log, newest date first. Catat records today's weight, today's deaths, or today's actual feed, each on its own, and can also add a historical day. Choosing a historical date loads that day's weight, deaths, and actual feed, and those fields stay closed until a date is chosen. An existing historical date is replaced only after confirmation. Each missing report for today is its own toast, and that toast hides when the report is recorded, including a recorded zero. DOC on screen is the calendar day from that cycle's earliest stocking date. FR is looked up from the weight and is not typed. Berat, kematian, and pakan aktual can be edited in the cells. Puasa shows puasa dadakan, including ended rows, and can record or end an active one. Treatment shows a chronological activity log for the cycle (amount in grams, date and time, who recorded it), with add, edit, soft delete, a date-range filter, and infinite scroll. Planned treatments for the cycle are listed as information only. Grafik shows biomassa and that day's deaths for this pond. An empty range is the whole active cycle. The historical day and Catat puasa dadakan choose each day on the calendar. The saved value stays `YYYY-MM-DD`, the calendar day that was picked.
- Profil: the signed-in account. Pengaturan: theme and sidebar, stored in the browser.

### Domain rules already in force

These are implemented, not proposals. Detail is in [GLOSSARY.md](GLOSSARY.md), [pakan-database-design.md](pakan-database-design.md), and [adr/0001-kolam-reads-are-offset-pages.md](adr/0001-kolam-reads-are-offset-pages.md).

- Grams are the mass unit. A blank measurement is not zero.
- Population, biomass, calculated feed, operational feed, and FCR are derived. They are not stored columns.
- Actual feed is the applied quantity, not the workbook's recommended-feed column.
- List screens use offset pages: `pageIndex`, `pageSize`, `sortId`, `sortDesc`, then `rows` and `rowCount`.
- Grafik is the exception to paging. It loads this pond only, and only while that tab is open. An empty range is the whole active cycle. A chosen range is applied after the cycle is walked from its first day.

### Decisions

1. The current user is our eight-pond tilapia farm. A later direction is that any fish farm runs its own copy. Opening the source is planned. A license has not been chosen, so the source is not open for reuse yet.
2. There is one account type. No read-only role and no technician role.
3. The day's work is added and edited in the app, including deaths and the other things the farm does. The first shape is a form. A later shape can be a list of what that farm records that day. The workbook import remains how BATCH 1 history arrived.
4. Fish purchases and sales belong in this app. They are not built.
5. Screen copy is Indonesian until a translation catalog exists.

### Open questions

Which industry comes after fish, if any, is not decided. Poultry and vegetables stay candidates only.

## Evidence on Hand

Screenshots in [screenshots/README.md](screenshots/README.md) are Storybook fixtures, not an export of the live farm. The BATCH 1 workbook in this repository is this farm's history.

There are no other farms, testimonials, yield numbers, or a license. Future work must not invent them.

## Product Principles

- This farm is the user. Other farms are a later direction.
- Recording the day and reviewing the cycle have equal weight.
- Derived figures are calculated. A blank measurement is not zero.
- Do not claim users, harvest results, or a license the repository does not have.
- Screen copy stays Indonesian until a translation catalog exists.
