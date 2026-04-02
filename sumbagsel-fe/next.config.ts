import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/** Folder `sumbagsel-fe` — stabil untuk `turbopack.root` (hindari inferensi workspace ke parent yang punya `yarn.lock`). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// Fail build if OTP bypass is enabled in production
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_OTP_BYPASS_DEV === 'true') {
  throw new Error(
    '[SECURITY] NEXT_PUBLIC_OTP_BYPASS_DEV must not be true in production. ' +
    'Remove or set to false before building.'
  );
}

const nextConfig: NextConfig = {
  output: 'standalone',
  /** Samakan root tracing dengan app — kurangi salah inferensi saat ada `yarn.lock` di parent `httpdocs`. */
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
};

export default nextConfig;
