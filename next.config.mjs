/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'firebasestorage.googleapis.com',
        },
        {
          protocol: 'https',
          hostname: 'oaidalleapiprodscus.blob.core.windows.net',
        },
        {
          protocol: 'https',
          hostname: 'storage.googleapis.com',
        },
      ],
    },
    async redirects() {
      return [
        {
          source: '/favicon.ico',
          destination: '/api/favicon',
          permanent: true,
        },
      ];
    },
  };
  
  export default nextConfig;
  