import type { APIRoute } from 'astro';

import { listApprovedJobProfiles } from '../lib/job-profiles-repository';

export const prerender = false;

const STATIC_PATHS = ['/', '/jobs', '/share', '/about', '/guidelines'] as const;

function toAbsoluteUrl(request: Request, pathname: string): string {
  const origin = new URL(request.url).origin;
  return new URL(pathname, origin).toString();
}

export const GET: APIRoute = async ({ request }) => {
  const jobs = await listApprovedJobProfiles();
  const nowIso = new Date().toISOString();

  const staticUrls = STATIC_PATHS.map(
    (path) =>
      `<url><loc>${toAbsoluteUrl(request, path)}</loc><lastmod>${nowIso}</lastmod><changefreq>weekly</changefreq></url>`,
  );

  const jobUrls = jobs.map((job) => {
    const updatedAt = job.approvedAt ?? job.createdAt;
    return `<url><loc>${toAbsoluteUrl(request, `/jobs/${job.slug}`)}</loc><lastmod>${updatedAt}</lastmod><changefreq>monthly</changefreq></url>`;
  });

  const body = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">${[...staticUrls, ...jobUrls].join('')}</urlset>`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
