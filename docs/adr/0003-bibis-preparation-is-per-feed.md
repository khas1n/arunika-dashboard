# Bibis preparation is per feed brand

## Status

Accepted

## Context

`BibisRecord` required a pond. The quantity was feed prepared for that pond's feeding day, not a stock balance. The farm prepares one pile per brand (781, Safir, and any later feed), then feeds ponds from it. Summing old per-pond rows into an opening stock would invent a balance the rows do not hold.

## Decision

1. `BibisRecord.batchPondId` is optional. Existing rows keep their pond. New rows from the Pakan page leave it null and name `feedId` plus `feedingOn`.
2. Prepared grams for a brand and a feeding day are the sum of every bibis row for that pair, including old pond rows. Those grams are not stock.
3. Stock stays `sum(FeedReceipt) - sum(FeedApplication) + sum(StockOpname.adjustmentGrams)` for that feed. `FeedApplication.quantityGrams` is the only outflow, and it is the pakan aktual saved on a pond.
4. No migration writes an opening `StockOpname` or rewrites historical feeding rows.
5. `clientRequestId` on receipts, bibis rows, applications, and opnames is a nullable unique key so a retry does not insert a second movement.

## Consequences

- A pond card shows FR, not that pond's bibis grams. The forecast is on Pakan.
- An old bibis row still counts as prepared for its feed and feeding day.
- A feed with no receipts, applications, or opnames has stock 0. That 0 is the sum of nothing, not a counted opening balance.
