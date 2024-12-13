/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['firebasestorage.googleapis.com'], // Add this domain to support Firebase Storage images
    },
  };
  
  export default nextConfig;
  