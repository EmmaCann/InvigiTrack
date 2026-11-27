import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: process.env.INVIGITRACK_DEV_ORIGINS?.split(",").map((host) => host.trim()).filter(Boolean),
  logging: {
    // Server Function logging can include arguments, including submitted credentials.
    serverFunctions: false,
    incomingRequests: { ignore: [/^\/auth\/login(?:[/?]|$)/] },
  },
  async headers() {
    return [{
      source: "/auth/login",
      headers: [
        { key: "Cache-Control", value: "private, no-store" },
        { key: "Referrer-Policy", value: "no-referrer" },
      ],
    }, {
      source: "/clienti/:path*",
      headers: [
        { key: "Cache-Control", value: "private, no-store, max-age=0" },
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
        { key: "Referrer-Policy", value: "no-referrer" },
      ],
    }]
  },
};

export default nextConfig;
