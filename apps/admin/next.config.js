/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
        NEXT_PUBLIC_STOREFRONT_URL: process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000",
    },
};

module.exports = nextConfig;
