/** @type {import('next').NextConfig} */
const nextConfig = {
  port: 8001,
  basePath:"/awm",
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
