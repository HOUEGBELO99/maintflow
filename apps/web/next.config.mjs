/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile the shared workspace package.
  transpilePackages: ['@maintflow/shared'],
  // Silence the multi-lockfile workspace-root warning in this monorepo.
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  // Re-enable once every nav route exists (typed Link rejects unknown routes).
  // typedRoutes: true,
};

export default nextConfig;
