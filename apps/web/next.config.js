/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@cti/shared'],
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
};

module.exports = nextConfig;
