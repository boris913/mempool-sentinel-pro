/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_MEMPOOL_API: 'https://mempool.bitdevsyde.org',
    NEXT_PUBLIC_MEMPOOL_WS: 'wss://mempool.bitdevsyde.org/api/v1/ws',
  },
};

module.exports = nextConfig;
