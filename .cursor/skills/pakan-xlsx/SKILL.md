---
name: pakan-xlsx
description: Skill for working with the Pakan Management workbook and its underlying business/domain model.
---

# Pakan XLSX Domain & Database Skill

## Purpose

This skill defines how to analyze the Pakan Management XLSX workbook and
translate its underlying business/domain model into a well-designed,
normalized relational database using Prisma.

The XLSX is the primary source of truth for the existing:

- data structure
- business entities
- relationships
- configuration
- reference data
- formulas
- calculations
- historical values
- business behavior

Use this skill when working on:

- XLSX analysis
- database design
- Prisma schema
- data import
- domain calculations
- server/API implementation
- data validation
- TanStack Table
- Pakan Management UI

The goal is NOT to reproduce the spreadsheet's physical structure.

The goal is to understand the underlying domain and build a maintainable
application around it.

---

# Source Workbook

The primary reference workbook is:

reference/Copy of Manajement Pakan - BATCH 1.xlsx

Always inspect the actual workbook before making assumptions about:

- fields
- formulas
- relationships
- data types
- reference values
- configuration
- calculated values
- historical data

Do not invent business rules when they can be determined from the workbook.

---

# Core Architecture

The intended transformation is:

XLSX
↓
Analyze workbook
↓
Identify domain
↓
Identify relationships
↓
Identify calculations
↓
Classify data
↓
Normalize domain
↓
Prisma schema
↓
Database
↓
Domain/service layer
↓
Server/API
↓
UI

The database should represent the business domain, not the spreadsheet layout.

---

# 1. Analyze Every Sheet

Inspect every sheet in the workbook.

For each sheet determine:

- sheet name
- purpose
- number of rows
- number of columns
- headers
- data types
- formulas
- input values
- calculated values
- reference values
- configuration values
- historical values
- summary values
- lookup relationships
- relationships to other sheets

The workbook may contain sheets such as:

- Referensi
- Konfigurasi
- Master - Pakan
- Kolam A3
- Kolam B3
- Kolam C3
- Kolam D3 Heru
- Kolam A6
- Kolam B6
- Kolam C6
- Kolam D6
- Sheet8

Do not assume that every sheet should become a database table.

A sheet may represent:

- a domain entity
- a reference table
- configuration
- a report
- a calculation
- a view
- a temporary/helper structure

Determine its actual purpose from the workbook.

---

# 2. Identify the Domain

Identify the actual business entities represented by the workbook.

Potential entities may include:

- Batch
- Pond / Kolam
- Pond Configuration
- Daily Pond Record
- Feed
- Feed Reference
- Feeding Rate
- Mortality
- Population
- Average Weight
- Biomass
- FCR
- Survival Rate
- Floc
- Supplement
- Molasses

These are examples only.

Only create entities supported by the workbook.

Do not invent business concepts.

---

# 3. Batch

The workbook contains a batch such as:

BATCH 1

Do not hardcode "BATCH 1" into application logic.

Batch should be represented as data so the application can support:

- Batch 1
- Batch 2
- Batch 3
- future batches

Conceptually:

Batch
└── Pond
└── Daily Records

The exact fields must be derived from the workbook.

---

# 4. Pond

Ponds are data, not database tables.

Examples may include:

- A3
- B3
- C3
- D3 Heru
- A6
- B6
- C6
- D6

Represent these as records in a Pond model.

Do NOT create:

- pond_a3
- pond_b3
- pond_c3
- pond_d3

unless there is a genuine domain reason.

---

# 5. Daily Pond Records

Daily observations should generally be associated with:

- batch
- pond
- date

Potential values may include:

- DOC
- average weight
- mortality
- population
- biomass
- feeding rate
- feed quantity
- feed type
- feed N
- feed C
- molasses
- CN ratio
- floc
- FCR
- survival rate

Do not automatically make every spreadsheet column a database field.

First determine whether the value is:

- input
- reference
- configuration
- derived
- historical snapshot
- display-only

---

# 6. Field Classification

Every important field should be classified as one of:

INPUT
REFERENCE
CONFIGURATION
DERIVED
HISTORICAL_SNAPSHOT
DISPLAY_ONLY

For example:

mortality
→ INPUT

feed type
→ REFERENCE

pond volume
→ CONFIGURATION

population
→ DERIVED

FCR
→ DERIVED or HISTORICAL_SNAPSHOT

The classification must be based on the workbook.

---

# 7. Analyze Relationships

Determine how the workbook's data relates.

For example:

Batch
│
└── Pond
│
├── Configuration
│
└── Daily Records

Determine relationships such as:

- which pond belongs to which batch
- which daily record belongs to which pond
- which values come from reference tables
- which configuration applies to which pond
- which formulas depend on previous records
- which values are shared across ponds
- which values are batch-specific
- which values are pond-specific

Do not infer relationships solely from sheet names.

Use:

- workbook structure
- repeated values
- formulas
- references
- headers
- data patterns

---

# 8. Analyze Formulas

Formulas are part of the business/domain behavior.

For every important formula identify:

- source sheet
- cell/range
- original formula
- inputs
- output
- meaning
- dependencies
- edge cases

Example:

Sheet:
Kolam A3

Formula:
previous population - mortality

Inputs:

- previous population
- mortality

Output:

- current population

Do not simply copy Excel formulas into TypeScript.

Understand what the formula means and implement the equivalent domain logic.

---

# 9. Formula Dependency Analysis

Pay attention to formulas that depend on:

- previous rows
- previous dates
- reference sheets
- configuration
- lookup tables
- other calculated values
- batch-level information
- pond-level information

Document the dependency chain.

For example:

previous population
↓
current population
↓
biomass
↓
biomass gain
↓
FCR

The database and domain layer must support these dependencies.

---

# 10. Calculated Values

For every calculated value determine whether it should:

1. Be calculated dynamically.
2. Be persisted.
3. Be persisted as a historical snapshot.
4. Only be displayed.

Do not persist every calculated spreadsheet value automatically.

However, do not recompute historical values using current reference data if
doing so would change the historical workbook result.

Historical behavior must be considered.

---

# 11. Database Normalization

After analyzing the XLSX, design a normalized relational database.

Do NOT map spreadsheet sheets directly to database tables.

The database should represent the underlying business domain.

Apply standard relational database best practices:

- normalize master/reference data
- avoid unnecessary duplication
- use foreign keys for relationships
- use appropriate unique constraints
- use appropriate indexes
- use explicit data types
- distinguish nullable values from zero/default values
- separate configuration from transactional/observational data
- separate reference/master data from transactional data
- model one-to-many relationships explicitly
- model many-to-many relationships explicitly where required
- avoid spreadsheet-coordinate-based fields
- avoid one table per pond
- avoid one table per spreadsheet row
- avoid generic EAV designs unless the domain genuinely requires them

Aim for a practical normalized design, generally around 3NF for transactional
and reference data.

Do not over-normalize purely for theoretical purity.

A value may remain denormalized when there is a clear reason, such as:

- historical snapshot requirements
- auditability
- performance
- preserving an actual recorded value
- avoiding recalculation of historical results

Every intentional denormalization should have a documented reason.

---

# 12. Database Modeling Process

Before creating Prisma models, identify:

1. Entities
2. Attributes
3. Primary keys
4. Foreign keys
5. Candidate/unique keys
6. One-to-many relationships
7. Many-to-many relationships
8. Reference/master data
9. Transactional data
10. Configuration data
11. Derived/calculated values
12. Historical snapshot values

Then design the normalized Prisma schema.

---

# 13. Good Database Model

Prefer a structure conceptually similar to:

Batch
│
└── Pond
│
├── PondConfiguration
│
└── PondDailyRecord

Reference data should be modeled separately where appropriate.

For example:

Feed
│
└── PondDailyRecord

Do not create a table for every pond.

Do not create a table for every Excel sheet automatically.

Do not create fields based on Excel coordinates such as:

C13
D13
E13
F13

unless the domain genuinely requires them.

---

# 14. Avoid Spreadsheet-Clone Databases

Bad:

KolamA3
KolamB3
KolamC3
KolamD3

Bad:

PondRow1
PondRow2
PondRow3

Bad:

C13
D13
E13
F13

Bad:

record_id
attribute_name
attribute_value

The last pattern is an EAV model and should only be used if the domain
actually requires arbitrary dynamic attributes.

Prefer strongly typed relational models.

---

# 15. Reference Data

Reference values should generally be modeled as data rather than hardcoded
in application source code.

Examples may include:

- feed types
- feeding rates
- supplements
- conversion/reference values
- other lookup values

Only create reference models supported by the workbook.

---

# 16. Configuration

Configuration values should be separated from observations where appropriate.

Potential configuration values may include:

- pond volume
- stocking configuration
- initial population
- feed configuration
- supplement configuration
- other pond-specific settings

Do not hardcode workbook configuration values into application code.

---

# 17. Historical Snapshots

Be careful with historical calculations.

Suppose FCR depends on:

- feed
- biomass
- reference data

Recalculating an old record using today's reference data may produce a
different result from the original workbook.

If the workbook treats a calculated value as a historical result, consider
persisting it as a snapshot.

Document the reason.

---

# 18. Blank vs Zero

Do not automatically treat these as equivalent:

- blank
- 0
- null
- N/A
- invalid
- not applicable

Preserve the distinction when it matters to workbook behavior.

---

# 19. Spreadsheet Errors

The workbook may contain:

- #N/A
- #VALUE!
- #DIV/0!
- negative calculated values
- blank formulas
- Google Sheets-specific formulas
- __xludf.DUMMYFUNCTION

Do not silently fix these.

Do not automatically convert errors to zero.

Do not change negative values merely because they look unexpected.

If workbook behavior appears incorrect:

1. Preserve the existing behavior for parity.
2. Document the issue.
3. Treat a correction as a separate business decision.

---

# 20. Google Sheets Formulas

The XLSX may contain formulas originating from Google Sheets.

Some formulas may appear as:

__xludf.DUMMYFUNCTION(...)

When this occurs:

1. Identify the intended calculation if possible.
2. Inspect surrounding formulas.
3. Inspect input/reference values.
4. Inspect cached results when useful.
5. Reconstruct the business calculation.
6. Implement the equivalent domain logic.

Do not assume the literal XLSX formula is executable application logic.

---

# 21. Future / Template Rows

The workbook may contain rows prepared for future dates.

Do not automatically interpret every formatted or formula-filled row as an
actual historical observation.

Distinguish between:

- actual records
- planned records
- generated/template rows
- empty rows

This is especially important when importing the workbook into the database.

---

# 22. Prisma

When designing Prisma models:

1. Inspect the existing prisma/schema.prisma.
2. Follow existing project conventions.
3. Model business entities.
4. Normalize repeated data.
5. Preserve relationships.
6. Preserve historical information.
7. Avoid spreadsheet-coordinate-based models.

Follow existing conventions for:

- IDs
- timestamps
- naming
- relations
- indexes
- database types
- nullable fields

Reuse existing models when appropriate.

Do not duplicate existing application models.

Do not modify unrelated models.

---

# 23. Prisma Schema Quality

The resulting Prisma schema should have:

- meaningful model names
- meaningful field names
- correct scalar types
- explicit relationships
- appropriate foreign keys
- appropriate unique constraints
- appropriate indexes
- appropriate nullability
- no unnecessary duplication

Consider query patterns when creating indexes.

Do not add indexes indiscriminately.

---

# 24. Unique Constraints

Identify real business uniqueness from the workbook.

Examples may include combinations such as:

Batch + Pond

or:

Pond + Date

or:

Batch + Pond + Date

Do not assume the exact constraint.

Determine the appropriate uniqueness from the domain.

The database should prevent accidental duplicate domain records where
appropriate.

---

# 25. Domain Calculations

Business calculations should be implemented outside the UI.

Preferred architecture:

Prisma
↓
Domain / Service
↓
Server Function / API
↓
React
↓
UI

Calculations such as:

- population
- biomass
- FCR
- survival rate
- feeding rate

should have one authoritative implementation.

Do not duplicate the same calculation across:

- Prisma queries
- server functions
- React components
- TanStack Table columns

unless there is a deliberate and documented reason.

---

# 26. UI / TanStack Table

This skill can also be used when building UI.

When creating tables with @tanstack/react-table:

- inspect existing table patterns first
- reuse existing abstractions
- use strongly typed column definitions
- use createColumnHelper<T>() where appropriate
- do not use any
- keep business calculations outside column definitions
- provide calculated values from the domain/server layer

For example:

const columnHelper = createColumnHelper<PondDailyRecord>()

export const columns = [
columnHelper.accessor("doc", {
header: "DOC",
}),

columnHelper.accessor("averageWeight", {
header: "Average Weight",
}),

columnHelper.accessor("biomass", {
header: "Biomass",
}),
]

Do not calculate biomass inside the table cell.

---

# 27. XLSX-to-Database Mapping

Maintain a clear mapping between the workbook and the database when
designing or reviewing the schema.

Example:

XLSX:

Kolam A3
Tanggal
Mortality
Feed
Population

Domain:

Pond
PondDailyRecord
Feed

Database:

Pond
PondDailyRecord.date
PondDailyRecord.mortality
PondDailyRecord.feedId
PondDailyRecord.population

The exact mapping must be based on the actual workbook.

---

# 28. Initial Analysis Output

For the initial XLSX analysis, create:

docs/pakan-xlsx-analysis.md

This document should contain:

- workbook overview
- every sheet
- sheet purpose
- important columns
- data types
- formulas
- formula dependencies
- references
- configuration
- relationships
- input fields
- calculated fields
- historical fields
- anomalies
- spreadsheet-specific behavior

This document is optional for later implementation tasks, but should be
created during the initial analysis if requested.

---

# 29. Database Design Documentation

When designing the database, create:

docs/pakan-database-design.md

Document:

- entities
- fields
- relationships
- primary keys
- foreign keys
- unique constraints
- indexes
- XLSX-to-database mapping
- calculation strategy
- historical snapshot strategy
- normalization decisions
- intentional denormalization
- important design decisions

This documentation should explain WHY the database differs from the
spreadsheet structure.

---

# 30. Import

When an XLSX import process is implemented, it should:

- parse the workbook
- identify actual records
- distinguish template rows
- normalize entities
- create/find batches
- create/find ponds
- import configuration
- import reference data
- import daily records
- preserve historical values where necessary
- report errors and warnings

Do not hardcode individual spreadsheet rows.

Prefer idempotent imports where practical.

Use Prisma transactions where appropriate.

---

# 31. Verification

After implementing the database or import process, verify against the
workbook.

Compare:

- entities
- record counts
- dates
- pond identifiers
- important numeric values
- reference values
- calculated values
- historical results

Any discrepancy should be explained.

Do not hide or silently correct discrepancies.

---

# 32. Coding Principles

Follow the existing project's coding conventions.

Prefer:

- TypeScript
- strongly typed interfaces/types
- named exports
- functional React components
- domain functions
- strongly typed Prisma access
- strongly typed TanStack Table definitions

Avoid:

- any
- unnecessary enums
- duplicated business logic
- hardcoded workbook values
- hardcoded pond-specific logic
- spreadsheet-coordinate-based domain models
- duplicated table definitions
- business calculations inside React components

---

# 33. Development Workflow

For database work, follow:

1. Inspect XLSX.
2. Analyze every sheet.
3. Identify domain entities.
4. Identify relationships.
5. Analyze formulas.
6. Classify fields.
7. Identify reference/configuration data.
8. Identify historical values.
9. Normalize the domain model.
10. Inspect existing Prisma schema.
11. Design Prisma models.
12. Review the schema.
13. Implement Prisma schema.
14. Validate the schema.
15. Create migration.
16. Import/seed data.
17. Verify against the XLSX.

Do not skip domain analysis before creating the database model.

---

# 34. Migration

Schema design and migration are separate steps.

First design and review:

prisma/schema.prisma

Then create the migration:

pnpm prisma migrate dev --name <descriptive-name>

Do not create a migration before the schema has been reviewed when working
on a new domain model.

A migration represents an actual database change and should be treated as
a separate step from domain discovery and schema design.

---

# 35. Important Rules

When the workbook and an assumption disagree:

Workbook evidence >
Assumption

When workbook behavior appears incorrect:

Existing behavior +
Documented issue >
Silent correction

When designing the database:

Domain model >
Spreadsheet layout

When deciding whether to normalize:

Practical relational design >
Theoretical normalization for its own sake

When deciding whether to persist calculated values:

Business/historical requirement >
Automatic persistence of every spreadsheet formula

When building UI:

Domain model + workbook workflow >
Literal spreadsheet reproduction

---

# Definition of Done

## XLSX Analysis

- every relevant sheet has been inspected
- sheet purposes are understood
- important fields are identified
- formulas are identified
- formula dependencies are understood
- relationships are identified
- input/reference/configuration/derived fields are classified
- anomalies are documented

## Database Design

- domain entities are identified
- relationships are normalized
- primary keys are defined
- foreign keys are defined
- business uniqueness is considered
- indexes are considered based on query patterns
- reference data is normalized
- configuration is separated appropriately
- transactional data is modeled correctly
- historical snapshot requirements are considered
- calculated values are intentionally modeled
- spreadsheet-specific structure has not been blindly copied
- unnecessary duplication has been avoided
- intentional denormalization is documented

## Prisma

- models represent the domain
- field types are appropriate
- relations are explicit
- constraints are appropriate
- schema follows existing project conventions
- prisma format succeeds
- prisma validate succeeds

## Import

- actual records are distinguished from template rows
- reference data is handled correctly
- configuration is handled correctly
- historical records are preserved
- duplicate records are avoided
- errors and warnings are reported

## UI

When UI work is requested:

- existing application patterns are reused
- workbook information is represented correctly
- columns are strongly typed
- calculated values are not duplicated in UI logic
- table behavior reflects the underlying domain

The XLSX remains the reference for existing business behavior, while the
application uses a normalized, strongly typed, maintainable domain model.
