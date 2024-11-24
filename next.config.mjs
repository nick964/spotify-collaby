/** @type {import('next').NextConfig} */
const nextConfig = {
    productionBrowserSourceMaps: true,
    reactStrictMode: false,
    images: {
        domains: ['scontent-lga3-1.xx.fbcdn.net'],
    },
};

export default nextConfig;
