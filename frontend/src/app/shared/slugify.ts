/** Converts a string to a URL-safe slug: lowercased, non-alphanumeric runs collapsed to `-`, leading/trailing `-` trimmed. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
