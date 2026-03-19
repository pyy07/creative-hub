/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3', '@libsql/client'],
};

export default nextConfig;
