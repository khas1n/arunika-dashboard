# Glossary

Terms for the pakan dashboard. A word here means one thing. Product language, the roadmap, and open questions are in [product.md](product.md).

## Page

One slice of a list. The response is `rows` (this slice) and `rowCount` (how many rows match, not how many are in the slice).

## Page query

The request for a page: `pageIndex` (zero-based), `pageSize` (1–100), `sortId`, and `sortDesc`. There is no cursor and no `limit` field. `pageSize` is the limit. The Zod factories `pageQuerySchema` and `pageSchema` are the contract; the TypeScript types are inferred from them. Search is not part of a page query. A list that has a search box adds that field itself.

## Kolam list

One paged Kolam read. The pond screen uses a separate list for each of these:

- ponds (the sidebar)
- pond header (asal bibit, volume, puasa, pakan, jenis ikan, metode budidaya, FCR) — a page of one row
- today's bibis for that pond
- puasa dadakan for that pond, including ended rows. Default sort is active first, then ended. Sorting by start date or reason mixes the two. Akhiri is only on an active row.
- daily log for that pond, sortable by every visible column, defaulting to the reporting date, newest first. Equal dates stay in stored order. A refresh keeps the sort the operator picked.

The pond list has one sort: batch order A3, B3, C3, D3, A6, B6, C6, D6.

The pond screen shows one tab at a time. The tabs sit beside the pond title. An info control lists asal bibit, jumlah bibit, volume, puasa, pakan, jenis ikan, and metode budidaya. A strip above the tables shows today's bibis, total kematian for the active cycle, and FCR, and it stays on every tab. Harian is the daily log. Puasa is puasa dadakan. Grafik holds the biomass line and the daily death line. Catat sits in the Harian table and opens today's weight, today's deaths, today's actual feed, or a separate historical day. Catat puasa dadakan sits in the Puasa table. Another workbook sheet can become another tab later.

## Jenis ikan

The fish a cycle grows. One `FishSpecies` row, looked up by `code`. The first row is `NILA`, shown as Nila. Another species is another row, not a schema change. The physical pond does not store this. The next batch on that pond can point at a different row.

## Metode budidaya

How a cycle is grown. One `CultivationMethod` row, looked up by `code`. The first row is `BIOFLOC`, shown as Biofloc. Another method is another row. The spelling in the database and on the screen is Biofloc.

## Harian input

A Harian cell edit sets that day's weight, deaths, or actual feed. The whole cell accepts the click, including an empty cell. Enter or Simpan commits. Escape or Batal restores the previous value. The typed value shows immediately. Populasi, biomassa, pakan hitung, pakan operasional, FR, and FCR stay as they are until the server computes them again. Deaths and actual feed replace that date's total. A failed save puts the previous value back.

Today's weight, deaths, and actual feed are three separate reports. Zero counts as recorded. Each report still missing today is its own toast. Closing a toast hides that report for this visit and this Jakarta date. A recorded value, including zero, removes that toast.

Tambah catatan harian writes weight, deaths, and actual feed for one date. Those fields stay closed until a date is chosen, then that date's saved values are loaded. A date that already has a row is replaced only after the operator confirms. A new date is saved without that confirmation. A date before the cycle's stocking date is rejected.

Creating or ending a puasa dadakan is not a list.

## DOC

Day of culture for one cycle. Day 1 is that cycle's earliest stocking date. A later reporting date is the number of calendar days from that stocking date, plus one. A day with no record is not created, and it does not change any other day's DOC. The number stored on the row is only a unique key. The screen shows the calendar DOC.

## FR

The feeding-rate snapshot for a weight. The band is the one whose minimum weight is the greatest minimum still at or below the weight. Stored values are fractions. The screen shows percents. The form and the cells do not accept FR. Saving a weight stores a new snapshot. Changing the band table later does not change older rows. A weight of 0, or a weight below every band, stores no rate.

## Biomass series

The Grafik tab for one pond. Biomassa is one point per dated day that has biomass. Kematian is that day's death total, including zero, for every dated day in the range, and it is not cumulative. Hovering a day shows that date and its value. Axis numbers use the same grouping as the rest of the page. An empty range is the whole active cycle. A range still walks from the first day of the cycle, then drops days outside it, because a later population depends on earlier days. The series is not a page. It loads only while Grafik is open, and only for this pond. Paging the daily log does not change the lines.

## Status badge

A read-only status. It is a Badge, not a Button. `size` matches Button (`xs`, `sm`, `default`, `lg`). Secondary is the gray surface. Accent is the lime highlight. Success, info, warning, and neutral are the other theme colors, each a color plus a foreground, in light and dark. Destructive already existed. Button variants use the solid color. Colored badges use that color at 50% opacity in light and 80% in dark, with the foreground as the text. Neutral and secondary stay solid so the gray stays visible.

## Interaction fetch

A fetch that starts because the user changed page, sort, or search on one list. Only that list shows a refreshing state. The rest of the screen stays as it is. The route pending screen is not an interaction fetch.
