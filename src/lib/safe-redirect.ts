/** Only allow same-origin relative paths, to prevent open redirects. */
export function safeRedirectPath(value: string | null | undefined, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
