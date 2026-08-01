/** @type {import('next').NextConfig} */
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

if (process.env.NODE_ENV === 'production' && !process.env.BACKEND_API_URL) {
  throw new Error(
    'BACKEND_API_URL is required in production. Set it to your deployed backend URL ' +
      '(e.g. https://your-backend.onrender.com) in the Render dashboard or render.yaml.'
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
