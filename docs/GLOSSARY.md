# Glossary

Terms for the pakan dashboard. A word here means one thing. Product language, the roadmap, and open questions are in [product.md](product.md).

## Page

One slice of a list. The response is `rows` (this slice) and `rowCount` (how many rows match, not how many are in the slice).

## Page query

The request for a page: `pageIndex` (zero-based), `pageSize` (1–100), `sortId`, and `sortDesc`. There is no cursor and no `limit` field. `pageSize` is the limit. The Zod factories `pageQuerySchema` and `pageSchema` are the contract; the TypeScript types are inferred from them. Search is not part of a page query. A list that has a search box adds that field itself.

## Kolam list

One paged Kolam read. The pond screen uses a separate list for each of these:

- ponds (the sidebar)
- pond header (asal bibit, volume, puasa, pakan, FCR) — a page of one row
- today's bibis for that pond
- puasa dadakan for that pond, including ended rows. Default sort is active first, then ended. Sorting by start date or reason mixes the two. Akhiri is only on an active row.
- daily log for that pond, sortable by every visible column, defaulting to date ascending

The pond list has one sort: batch order A3, B3, C3, D3, A6, B6, C6, D6.

The pond screen shows one tab at a time. The title is on the left, and Harian and Puasa sit under it. Bibis stays visible on both tabs. Harian is the pond facts, the biomass series, and the daily log. Catat harian sits on the right when Harian is selected. Puasa is puasa dadakan, and Catat puasa dadakan sits on the right. Another workbook sheet can become another tab later.

## Harian input

A Harian cell edit sets that day's inputs, and the derived columns are computed again. Deaths and actual feed replace that date's total.

Creating or ending a puasa dadakan is not a list.

## Biomass series

The biomass line for one pond. One point per day that has a date and a biomass, in date order, for the whole cycle. It is not a page: there is no `pageIndex`, `pageSize`, or `rowCount`. The daily log stays a page. Paging that log does not change the line.

## Status badge

A read-only status. It is a Badge, not a Button. `size` matches Button (`xs`, `sm`, `default`, `lg`). Secondary is the gray surface. Accent is the lime highlight. Success, info, warning, and neutral are the other theme colors, each a color plus a foreground, in light and dark. Destructive already existed. Button variants use the solid color. Colored badges use that color at 50% opacity in light and 80% in dark, with the foreground as the text. Neutral and secondary stay solid so the gray stays visible.

## Interaction fetch

A fetch that starts because the user changed page, sort, or search on one list. Only that list shows a refreshing state. The rest of the screen stays as it is. The route pending screen is not an interaction fetch.
