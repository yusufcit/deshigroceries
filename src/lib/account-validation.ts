/** Shared server-side validation helpers for the customer account APIs. */

export function cleanString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

/** Irish-friendly phone: digits/spaces/dashes/parentheses, optional leading +. */
export function isValidPhone(phone: string): boolean {
  return /^\+?[0-9][0-9\s()-]{6,19}$/.test(phone)
}

export function parseBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1'
}