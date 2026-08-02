/** @type {import('next').NextConfig} */
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

const args = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const isProdCommand = args.includes('build') || args.includes('start');
if (isProdCommand && !process.env.BACKEND_API_URL) {
  throw new Error(
    'BACKEND_API_URL is required for production builds. Set it to your deployed ' +
      'backend URL (e.g. https://your-backend.onrender.com) in the Render dashboard ' +
      'or render.yaml.'
  );
}

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_API_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
