# Kolam reads are offset pages

## Status

Accepted

## Context

The feed list already asks for `pageIndex`, `pageSize`, `sortId`, and `sortDesc`, and returns `rows` plus `rowCount`. A Kolam read returned the whole pond in one payload: header, every day, bibis, and active puasa dadakan. The daily log then paged that array in the browser.

A day row is derived. Population, biomass, operational feed, and FCR need the pond's full history, so the server still walks every day before it slices a page.

## Decision

Every Kolam read is an offset page, including the pond header. The header is page 0 with page size 1, and the client reads `rows[0]`.

Each list is its own React Query: ponds, header, bibis, puasa dadakan, and the daily log. Each query key includes the page query. Sort or search changes go back to page 0, matching the feed table.

The shared request is `pageIndex`, `pageSize`, `sortId`, `sortDesc`. The shared response is `rows` and `rowCount`. No cursor.

The contract is two Zod factories in `src/lib/page.ts`: `pageQuerySchema(sortId)` and `pageSchema(row)`. `PageQuery` and `Page` are inferred from those schemas. Search is not part of the shared query. The feed list extends the page query with `search` and uses the same factories.

## Consequences

- The server computes the full day series, then applies sort and slice. `rowCount` is the number of days, not the page size.
- A header, bibis line, or dadakan list with nothing to show is `rows: []` and `rowCount: 0`. The client does not treat a missing `rows[0]` as a transport error.
- The feed list moves onto the same factories. Its search field stays on the feed query only.
- The pond list has one sort, batch order: A3, B3, C3, D3, A6, B6, C6, D6. Alphabetical code is not a sort.
- The daily log can sort by every visible column. The default is the reporting date, newest first. Equal dates stay in stored order.
- The puasa dadakan page includes ended overrides. The default sort is active rows first, then ended rows, each group by start date. The user can sort by start date or reason instead, and that sort mixes active and ended rows. Ending one keeps the row. Akhiri is only on an active row.
- An unknown pond code is not a page. The route answers not found, as it does now.
- Changing page or sort on one list must not remount the pond screen. Route `pendingComponent` is only for the first open of a pond. After that, each list uses `useQuery` with `keepPreviousData` and shows `isFetching` only on that list while the user is waiting for the new page. Header and bibis keep stable keys and do not refetch on day or dadakan paging.
- Invalidating after a dadakan create or end refreshes only the lists that change: dadakan, days, and bibis. Not the pond header and not the sidebar.
