const { execSync } = require('child_process');

function getGitValue(command, fallback) {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return fallback;
  }
}

const buildTime = new Date().toISOString();
const commitHash = process.env.VERCEL_GIT_COMMIT_SHA
  || process.env.GIT_COMMIT_SHA
  || getGitValue('git rev-parse --short HEAD', 'local');
const branchName = process.env.VERCEL_GIT_COMMIT_REF
  || process.env.GIT_BRANCH
  || process.env.BRANCH_NAME
  || getGitValue('git rev-parse --abbrev-ref HEAD', 'prd');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@cti/shared'],
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  env: {
    NEXT_PUBLIC_BUILD_TIME: buildTime,
    NEXT_PUBLIC_COMMIT_HASH: commitHash,
    NEXT_PUBLIC_BRANCH_NAME: branchName,
  },
};

module.exports = nextConfig;
