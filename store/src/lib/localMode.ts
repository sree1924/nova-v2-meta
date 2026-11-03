// This switch is a development-only harness. Never accept it on a public host.
export const localModeRequested = () => process.env.STORE_LOCAL_MODE === "1";

export function isLoopbackHost(host: string | null): boolean {
  if (!host || /[\s,@/\\#?]/.test(host)) return false;
  try {
    const u = new URL("http://" + host);
    return ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname.toLowerCase()) && !u.username && !u.password;
  } catch { return false; }
}

export function localRequestAllowed(headers: Headers): boolean {
  if (!localModeRequested() || process.env.NODE_ENV === "production") return false;
  const host = headers.get("host");
  const forwarded = headers.get("x-forwarded-host");
  return isLoopbackHost(host) && (!forwarded || forwarded.toLowerCase() === host?.toLowerCase());
}

export function localMutationAllowed(headers: Headers): boolean {
  if (!localRequestAllowed(headers)) return false;
  const origin = headers.get("origin");
  if (!origin) return false;
  try {
    const u = new URL(origin);
    return origin === u.origin && ["http:", "https:"].includes(u.protocol) && u.host.toLowerCase() === headers.get("host")?.toLowerCase();
  } catch { return false; }
}

// Next's middleware request URL can normalize 127.0.0.1 to localhost. Redirecting or
// rewriting with that origin changes the cookie host and can trip the forwarded-host
// check on the internal request. Retain the already-validated browser Host exactly.
export function localUrl(req: { headers: Headers; url: string }, path: string): URL {
  if (!localRequestAllowed(req.headers)) throw new Error("local_url_requires_loopback");
  const out = new URL(path, req.url);
  out.host = req.headers.get("host")!;
  return out;
}
