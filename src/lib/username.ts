export const USERNAME_EMAIL_DOMAIN = 'users.ext-mensa.it'
export const USERNAME_MIN = 3
export const USERNAME_MAX = 30

const USERNAME_PATTERN = /^[a-z0-9._-]+$/

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase()
}

/** Returns an Italian error message, or null when the normalized username is valid. */
export function validateUsername(input: string): string | null {
  const username = normalizeUsername(input)
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX)
    return `Il nome utente deve avere tra ${USERNAME_MIN} e ${USERNAME_MAX} caratteri.`
  if (!USERNAME_PATTERN.test(username))
    return 'Il nome utente può contenere solo lettere minuscole, numeri, punto, trattino e trattino basso.'
  return null
}

export function usernameToEmail(input: string): string {
  return `${normalizeUsername(input)}@${USERNAME_EMAIL_DOMAIN}`
}

export function isLegacyEmail(input: string): boolean {
  return input.includes('@')
}

/** Maps a login identifier to the email Supabase Auth expects; legacy emails pass through unchanged. */
export function loginIdentifierToEmail(input: string): string {
  return isLegacyEmail(input) ? input.trim() : usernameToEmail(input)
}
