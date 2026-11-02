import type { NextConfig } from "next";

// Provisório sem domínio próprio: a Vercel repassa /api e /media ao backend (API_PROXY_URL, ex.:
// https://203-0-113-10.sslip.io). Tudo fica no mesmo endereço .vercel.app, então a sessão do painel e o
// acompanhamento do pedido funcionam. Com domínio próprio, use NEXT_PUBLIC_API_BASE_URL (ver DEPLOY.md do backend).
const API_PROXY_URL = (process.env.API_PROXY_URL ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!API_PROXY_URL) return [];
    // beforeFiles: tem prioridade sobre a API de teste em memória (app/api)
    return {
      beforeFiles: [
        { source: "/api/:path*", destination: `${API_PROXY_URL}/api/:path*` },
        { source: "/media/:path*", destination: `${API_PROXY_URL}/media/:path*` },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
