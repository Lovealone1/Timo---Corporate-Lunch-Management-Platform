/**
 * Colombian-timezone (America/Bogota, UTC-5) helpers.
 *
 * All date/time logic in the application should use these helpers
 * instead of raw `new Date()` to ensure consistency regardless of
 * the server's system timezone.
 *
 * IMPORTANT: Colombia does NOT observe daylight saving time,
 * so UTC-5 is always correct.
 */

const COLOMBIA_OFFSET_MS = -5 * 60 * 60 * 1000; // UTC-5

/**
 * Returns a Date whose UTC representation equals the current
 * Colombian local time. When Prisma serializes this Date and
 * sends it to PostgreSQL, the stored value will show Colombian time.
 *
 * Example: if real UTC is 07:00:00Z → returns Date whose
 * toISOString() = "...T02:00:00.000Z" (Colombian time).
 */
export function nowColombia(): Date {
    return new Date(Date.now() + COLOMBIA_OFFSET_MS);
}

/**
 * Returns today's date in Colombia as a `YYYY-MM-DD` string.
 */
export function todayColombia(): string {
    const now = nowColombia();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Checks whether a given `YYYY-MM-DD` date string is in the past
 * relative to the current Colombian date.
 */
export function isDateInPastColombia(dateStr: string): boolean {
    return dateStr < todayColombia();
}

/**
 * Shorthand: returns `{ createdAt, updatedAt }` both set to nowColombia().
 * Use in Prisma `create` data.
 */
export function colombiaTimestamps() {
    const now = nowColombia();
    return { createdAt: now, updatedAt: now };
}

/**
 * Shorthand: returns `{ updatedAt }` set to nowColombia().
 * Use in Prisma `update` data.
 */
export function colombiaUpdatedAt() {
    return { updatedAt: nowColombia() };
}
