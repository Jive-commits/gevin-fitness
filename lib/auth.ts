// Single-user passcode gate. One APP_PASSCODE -> httpOnly cookie session.
// Token derivation uses Web Crypto so it works identically in the Edge
// middleware and Node route handlers.

export const COOKIE_NAME = 'forge_session';
const TOKEN_SALT = ':forge:v1';

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Deterministic session token derived from the configured passcode.
 * The cookie stores this value; a request is authenticated when its cookie
 * matches the freshly-derived token.
 */
export async function expectedToken(): Promise<string> {
  const passcode = process.env.APP_PASSCODE ?? '';
  const data = new TextEncoder().encode(passcode + TOKEN_SALT);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bufToHex(digest);
}

export async function isValidToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const expected = await expectedToken();
  // Constant-time-ish compare (length first, then char accumulation).
  if (token.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
