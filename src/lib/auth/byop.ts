/**
 * BYOP (Bring Your Own Pollen) authorize flow against
 * enter.pollinations.ai. The user approves Cashflower on their own
 * Pollinations account; the issued key comes back in the URL fragment so
 * it never touches any server (this app has no server).
 */

const AUTHORIZE_URL = 'https://enter.pollinations.ai/authorize';

export interface AuthorizeParams {
  clientId: string;
  redirectUri: string;
  state: string;
}

export function buildAuthorizeUrl({ clientId, redirectUri, state }: AuthorizeParams): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });
  return `${AUTHORIZE_URL}?${params}`;
}

export function makeState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface AuthFragment {
  apiKey: string;
  state: string | null;
}

/** Parse `#api_key=...&state=...` (full hash or fragment query). */
export function parseAuthFragment(hash: string): AuthFragment | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  // tolerate hash-router prefixes like `#/connect?api_key=...`
  const queryPart = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : raw;
  const params = new URLSearchParams(queryPart);
  const apiKey = params.get('api_key');
  if (!apiKey || !/^(sk|pk)_[A-Za-z0-9]+$/.test(apiKey)) return null;
  return { apiKey, state: params.get('state') };
}

export function looksLikeKey(value: string): boolean {
  return /^(sk|pk)_[A-Za-z0-9]{8,}$/.test(value.trim());
}
