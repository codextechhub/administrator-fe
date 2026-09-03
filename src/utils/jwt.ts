/**
 * JWT segments are base64url-encoded (RFC 7515): '-' and '_' instead of '+'
 * and '/', no '=' padding. atob() only accepts standard base64, so decoding a
 * payload directly with atob() throws whenever the encoded bytes contain those
 * characters - which is most real tokens, since the backend embeds UUIDs and
 * names as custom claims. Normalise before decoding.
 */
const base64UrlDecode = (segment: string): string => {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(padded);
};

export function getJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(base64UrlDecode(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

// Unparseable tokens are treated as expired - the caller can't trust them.
export function isJwtExpired(token: string, bufferSeconds = 0): boolean {
  const exp = getJwtExp(token);
  if (!exp) return true;
  return Date.now() / 1000 >= exp - bufferSeconds;
}
