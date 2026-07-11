import type { APIRoute } from 'astro';
import { siteConfig } from '@/site.config';

export const prerender = true;

export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({
      name: siteConfig.name,
      short_name: siteConfig.name,
      description: siteConfig.description,
      lang: siteConfig.language,
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#f3ede1',
      theme_color: '#202721',
      icons: [
        {
          src: '/favicon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any',
        },
      ],
    }),
    {
      headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
    },
  );
};
