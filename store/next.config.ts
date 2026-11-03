import type { NextConfig } from "next";

if (process.env.STORE_LOCAL_MODE === "1" && process.env.NODE_ENV === "production") {
  throw new Error("STORE_LOCAL_MODE is development-only. Unset it before next build or production start.");
}

const nextConfig: NextConfig = {
  // Next normally rewrites every loopback spelling to localhost, which changes the
  // cookie origin in the local harness and makes 127.0.0.1 Origin checks fail.
  skipMiddlewareUrlNormalize: process.env.STORE_LOCAL_MODE === "1",
  // /app/ must keep its trailing slash: the static shell resolves data/… relative to it.
  // middleware.ts redirects /app -> /app/ and rewrites /app/ -> /app/index.html.
  skipTrailingSlashRedirect: true,
  // The lane root (fb-ai-hackathon/) has its own lockfile; this app is its own root.
  outputFileTracingRoot: process.cwd(),
  // public/app (~350 MB of course data + Utah audio) is served as static files; nothing reads
  // it at runtime, so keep it out of every serverless function trace (Vercel 250 MB limit).
  outputFileTracingExcludes: { "*": ["./public/app/**"] },
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; script-src 'self' 'unsafe-inline' https:" + (process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'") + "; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; media-src 'self' blob:; connect-src 'self' https: wss:; frame-src https:; worker-src 'self' blob:; form-action 'self' https://checkout.stripe.com https://*.clerk.accounts.dev https://*.clerk.com" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(), payment=(self)" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
