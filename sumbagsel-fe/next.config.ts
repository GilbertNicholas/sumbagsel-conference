import type { NextConfig } from "next";

// Fail build if OTP bypass is enabled in production
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_OTP_BYPASS_DEV === 'true') {
  throw new Error(
    '[SECURITY] NEXT_PUBLIC_OTP_BYPASS_DEV must not be true in production. ' +
    'Remove or set to false before building.'
  );
}

const nextConfig: NextConfig = {
  output: 'standalone',
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
