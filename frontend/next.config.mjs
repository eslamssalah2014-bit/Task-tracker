/** @type {import('next').NextConfig} */
const rawApiUrl = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
const isDev = process.env.NODE_ENV === 'development';
const backendTarget = rawApiUrl || (isDev ? 'http://localhost:5000' : '');

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'avatars.githubusercontent.com', 'api.dicebear.com'],
  },
  async rewrites() {
    if (!backendTarget) {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: `${backendTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
