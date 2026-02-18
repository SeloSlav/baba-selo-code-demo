/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // Reduce layout chunk size; helps avoid ChunkLoadError timeout
        optimizePackageImports: [
            'firebase',
            '@fortawesome/fontawesome-svg-core',
            '@fortawesome/react-fontawesome',
            '@fortawesome/free-solid-svg-icons',
        ],
    },
    async redirects() {
      return [
        { source: '/feed', destination: '/blog', permanent: true },
        { source: '/chat', destination: '/', permanent: true },
      ];
    },
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
  };
  
  export default nextConfig;
  