/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile the shared workspace package.
  transpilePackages: ['@maintflow/shared'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
