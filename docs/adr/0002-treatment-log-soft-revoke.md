# Treatment log soft revoke and browser-zone wall clock

## Status

Accepted

## Context

Event tables in the pakan design are append-only: written once, never updated or deleted. `TreatmentLog` is one of those events.

Operators need to correct a wrong amount, date, or time, and to remove a mistaken entry from the pond Treatment timeline. A second “correction” row would leave a false dose on the active list. Soft revoke (like `FastingOverride.revokedAt`) keeps the audit trail without a hard delete.

Treatment wall clock is date + time on the device. Operators log while at the farm, so the browser IANA timezone is a practical proxy for local farm time. Harian calendar days stay on Asia/Jakarta helpers for this change.

## Decision

1. `TreatmentLog` may be **updated in place** (amount, treatment, `occurredAt`) while `revokedAt` is null.
2. “Delete” sets `revokedAt` and `revokedById`. The default list **hides** revoked rows. There is no hard delete in the UI.
3. Wire format is `{ date, time, timeZone }` (IANA). The server combines them into a UTC `occurredAt`. The client does not send a bare ISO instant as the source of truth.
4. Dialog defaults and timeline grouping use the viewer’s browser timezone. Storage remains UTC.
5. A later ACL may limit who can revoke. Today every signed-in account can soft-delete, matching the single account type.

## Consequences

- Docs that said every event is never updated now have an exception for `TreatmentLog` (and already soft-revoke for puasa dadakan).
- A wrong device timezone or logging while traveling can skew wall clock. A future farm-timezone pin can override the browser zone without changing UTC storage.
- Imported molase rows (midnight Jakarta) remain valid Instants; the Treatment screen formats them in the viewer zone.
