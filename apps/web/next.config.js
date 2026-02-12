const { execSync } = require('child_process');

const buildTime = new Date().toISOString();
const commitHash = process.env.VERCEL_GIT_COMMIT_SHA
  || process.env.GIT_COMMIT_SHA
  || (() => {
    try {
      return execSync('git rev-parse --short HEAD').toString().trim();
    } catch {
      return 'local';
    }
  })();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@cti/shared'],
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  env: {
    NEXT_PUBLIC_BUILD_TIME: buildTime,
    NEXT_PUBLIC_COMMIT_HASH: commitHash,
  },
};

module.exports = nextConfig;
