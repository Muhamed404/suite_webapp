/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/awm",
  assetPrefix: "/awm",
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    middlewareClientMaxBodySize: 500 * 1024 * 1024, // 500MB
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
};

export default nextConfig;
