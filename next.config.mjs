/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.zantaxiride.com' },
      { protocol: 'https', hostname: '**.zantaxiride.com' },
    ],
  },
};

export default nextConfig;
