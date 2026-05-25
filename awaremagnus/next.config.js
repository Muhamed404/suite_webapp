/** @type {import('next').NextConfig} */
import WebpackObfuscator from 'webpack-obfuscator';

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
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.plugins.push(
        new WebpackObfuscator({
          rotateStringArray: true,
          stringArray: true,
          stringArrayThreshold: 0.5,
          compact: true,
        }, [])
      );
    }
    return config;
  },
};

export default nextConfig;
