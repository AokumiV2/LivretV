/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_HAS_DB: process.env.DATABASE_URL ? "1" : ""
  }
};

export default nextConfig;
