# Product

What Arunika is for, what the app does today, and what is still a proposal. Status words match [roadmap.md](roadmap.md).

## Problem

A fish farm's daily record is easy to lose when it lives in a workbook. Growth, feed, fasting, and stock then disagree with each other, and a later question ("what was biomass on this pond, and what did we actually feed?") takes a manual reconstruction.

Arunika is that app. A farm runs its own copy. Opening the source, so any farm can use it, is the plan. This repository is not public yet, and it has no customers, revenue, or usage numbers.

## Who it is for

Any fish farm that runs the app. There is one account type: a person who can sign in can do the same work as every other person who can sign in. Browser sign-up is still off. Accounts come from the seed or `pnpm user:create`.

A second industry is not chosen. A shared database for many farms is not the plan. Each farm runs a copy.

## Vision

Help a farming business keep operations, production, inventory, and commercial records in one system.

The first industry is fish farming. Poultry, vegetables, and other livestock are a later direction, not a current data model. Shared ideas that already exist here are inventory-like events (feed received, feed applied, stock counted), a production cycle (`Batch` and `BatchPond`), and a daily snapshot (`PondDailyRecord`). Those names are fish-farm names. Reusing them for chickens or crops would be a new design, not a rename.

## Initial market: fish farming

Candidate workflows. Only the status column is a claim about this repository.

| Workflow                           | What it would mean                                           | Status                                                                                                                                                                                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fish development by pond and cycle | Population, biomass, and daily history for a batch on a pond | In the Kolam daily log. Biomassa and daily deaths are on the Grafik tab, from imported history                                                                                                                                                                                 |
| Daily pond record                  | Add and edit the day's work, including deaths                | Today's weight, deaths, and actual feed are separate. A historical day is its own entry and replaces an existing date only after confirmation. FR is calculated from the weight. Derived columns are calculated again. A farm-specific list of what to record is a later shape |
| Pond treatments                    | Treatments and medication against a pond or cycle            | Models exist (`Treatment`, `TreatmentLog`). No screen                                                                                                                                                                                                                          |
| Feed inventory and stock opname    | Receipts, use, and a physical count against the book         | Models exist (`FeedReceipt`, `FeedApplication`, `StockOpname`). The screen is the feed-name list only                                                                                                                                                                          |
| Fasting                            | Recurring pattern and an exception range                     | Recurring pattern is imported. Puasa dadakan can be recorded and ended in the UI                                                                                                                                                                                               |
| Feed to prepare (bibis)            | What to prepare today for the next feeding day               | Shown on the pond page. Not entered in the UI                                                                                                                                                                                                                                  |
| Fish purchasing and sales          | Quantities, prices, dates, counterparties, in this app       | Planned. Not modeled                                                                                                                                                                                                                                                           |
| Mortality                          | Deaths over time, editable with the day's other work         | The Harian kematian cell sets that date's death total. It replaces the total rather than appending another event                                                                                                                                                               |
| Water quality                      | pH, oxygen, temperature, and similar                         | Not modeled                                                                                                                                                                                                                                                                    |
| Harvest and production planning    | When a cycle is ready and what it yielded                    | Not modeled                                                                                                                                                                                                                                                                    |
| Expenses and financial reporting   | Cost and margin                                              | Not modeled                                                                                                                                                                                                                                                                    |
| Alerts and reminders               | A nudge when a record or stock is late                       | Not modeled                                                                                                                                                                                                                                                                    |
| Multi-farm                         | More than one business in one deployment                     | Not modeled                                                                                                                                                                                                                                                                    |

## What an operator can do today

Screen copy is Indonesian today. Translations are planned.

- Sign in with a username and password. Public sign-up is off. The first account comes from the database seed. Further accounts are created with `pnpm user:create`.
- Beranda: see how many users and unexpired sessions exist, and manage jenis pakan (create, rename, delete only when the feed is unused).
- Kolam: open a pond in batch order (A3, B3, C3, D3, A6, B6, C6, D6). Cycle facts, including jenis ikan and metode budidaya, sit in an info control beside the title. Today's bibis, total kematian for the active cycle, and FCR stay above the tabs. Harian is the paged daily log, newest date first. Catat records today's weight, today's deaths, or today's actual feed, each on its own, and can also add a historical day. Choosing a historical date loads that day's weight, deaths, and actual feed, and those fields stay closed until a date is chosen. An existing historical date is replaced only after confirmation. Each missing report for today is its own toast, and that toast hides when the report is recorded, including a recorded zero. DOC on screen is the calendar day from that cycle's earliest stocking date. FR is looked up from the weight and is not typed. Berat, kematian, and pakan aktual can be edited in the cells. Puasa shows puasa dadakan, including ended rows, and can record or end an active one. Grafik shows biomassa and that day's deaths for this pond. An empty range is the whole active cycle. The historical day and Catat puasa dadakan choose each day on the calendar. The saved value stays `YYYY-MM-DD`, the calendar day that was picked.
- Profil: the signed-in account. Pengaturan: theme and sidebar, stored in the browser.

History for BATCH 1 is loaded by `pnpm db:import` from the Pakan workbook. Re-running that command replaces BATCH 1 cycles. It does not write puasa dadakan. Ponds, feed names, fish species, cultivation methods, and the administrator account stay. BATCH 1 cycles are Nila grown with Biofloc.

## Domain rules already in force

These are implemented, not proposals. Detail is in [GLOSSARY.md](GLOSSARY.md), [pakan-database-design.md](pakan-database-design.md), and [adr/0001-kolam-reads-are-offset-pages.md](adr/0001-kolam-reads-are-offset-pages.md).

- Grams are the mass unit. A blank measurement is not zero.
- Population, biomass, calculated feed, operational feed, and FCR are derived. They are not stored columns.
- Actual feed is the applied quantity, not the workbook's recommended-feed column.
- List screens use offset pages: `pageIndex`, `pageSize`, `sortId`, `sortDesc`, then `rows` and `rowCount`.
- Grafik is the exception to paging. It loads this pond only, and only while that tab is open. An empty range is the whole active cycle. A chosen range is applied after the cycle is walked from its first day.

## Decisions

1. The app is for any fish farm. Each farm runs its own copy. Opening the source is planned. The repository is not public yet.
2. There is one account type. No read-only role and no technician role.
3. The day's work is added and edited in the app, including deaths and the other things the farm does. The first shape is a form. A later shape can be a list of what that farm records that day. The workbook import remains how BATCH 1 history arrived.
4. Fish purchases and sales belong in this app. They are not built.
5. Screen copy is Indonesian until a translation catalog exists.

## Open questions

Which industry comes after fish, if any, is not decided. Poultry and vegetables stay candidates only.
