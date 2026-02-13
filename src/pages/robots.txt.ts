import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ request }) => {
  const origin = new URL(request.url).origin;
  const body = `User-agent: *\nAllow: /\nDisallow: /staff/\nSitemap: ${origin}/sitemap.xml\n`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
