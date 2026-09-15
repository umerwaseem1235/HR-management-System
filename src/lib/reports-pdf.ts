/**
 * Compatibility shim — DO NOT ADD CODE HERE.
 *
 * The report library now lives in `./reports-pdf/` (see `./reports-pdf/index.ts`
 * for the public barrel). This file re-exports it so every existing import of
 * `lib/reports-pdf` (e.g. `app/reports/page.tsx`, `components/reports/ExportLibrary.tsx`)
 * keeps working with zero changes and identical runtime behavior.
 */

export * from './reports-pdf/index';
