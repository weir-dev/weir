import type { NextConfig } from "next";

// The Coinbase wallet connector (RainbowKit) lazily imports x402 payment packages that are not installed and not used here
const UNUSED_X402 = ['@x402/core/client', '@x402/evm', '@x402/evm/exact/client', '@x402/evm/upto/client', '@x402/svm/exact/client'];

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: Object.fromEntries(UNUSED_X402.map((name) => [name, './src/lib/emptyModule.ts'])),
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL;
    if (!backendUrl) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl.replace(/\/+$/, '')}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/console',
        destination: '/window',
        permanent: true,
      },
      {
        source: '/brain',
        destination: '/ladder',
        permanent: true,
      },
      {
        source: '/epochs',
        destination: '/runs',
        permanent: true,
      },
      {
        source: '/launches',
        destination: '/token',
        permanent: true,
      },
      {
        source: '/x',
        destination: 'https://x.com/weircount',
        permanent: false,
      },
      {
        source: '/twitter',
        destination: 'https://x.com/weircount',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

