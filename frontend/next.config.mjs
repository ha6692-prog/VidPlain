/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  devIndicators: {
    buildActivity: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['@radix-ui/react-*'],
  },
  turbopack: {
    root: process.cwd(),
  },
  webpack: (config) => {
    return config
  },
}

export default nextConfig