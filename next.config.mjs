/** @type {import('next').NextConfig} */
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://translate.google.com https://translate.googleapis.com https://*.gstatic.com https://www.gstatic.com https://*.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://translate.googleapis.com https://www.gstatic.com https://*.gstatic.com;
  img-src 'self' blob: data: https:;
  font-src 'self' https://fonts.gstatic.com data:;
  connect-src 'self' https://*.googleapis.com https://accounts.google.com https://translate.googleapis.com https://translate.google.com https://*.gstatic.com https://*.google.com;
  frame-src 'self' https://translate.google.com https://translate.googleapis.com https://*.google.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`;

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false, // Prevents X-Powered-By: Next.js fingerprinting
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\s{2,}/g, ' ').trim(),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
