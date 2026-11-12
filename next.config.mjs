import fs from 'node:fs';
import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
      },
      {
        protocol: 'https',
        hostname: 'mosaic.scdn.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'wrapped-images.spotifycdn.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins.push({
        apply(compiler) {
          compiler.hooks.afterEmit.tap('EnsurePagesManifestAndDirectories', () => {
            try {
              const serverDir = compiler.outputPath;
              const pagesDir = path.resolve(serverDir, 'pages');
              const exportDir = path.resolve(serverDir, '..', 'export');

              if (!fs.existsSync(pagesDir)) {
                fs.mkdirSync(pagesDir, { recursive: true });
              }
              if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir, { recursive: true });
              }

              const manifestPath = path.resolve(serverDir, 'pages-manifest.json');
              if (!fs.existsSync(manifestPath)) {
                fs.writeFileSync(manifestPath, JSON.stringify({}, null, 2), 'utf-8');
              }

              const export500 = path.resolve(exportDir, '500.html');
              if (!fs.existsSync(export500)) {
                fs.writeFileSync(export500, '<!DOCTYPE html><html><body>500 Internal Error</body></html>', 'utf-8');
              }
            } catch {
              // Ignore filesystem race conditions
            }
          });
        },
      });
    }
    return config;
  },
};

export default nextConfig;
