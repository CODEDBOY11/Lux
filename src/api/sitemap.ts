import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  // use Vite's import.meta.env to access env vars in the browser/TS environment
  // avoid using `process` which may not be defined in this TS setup
  (import.meta as any).env.VITE_SUPABASE_URL!,
  (import.meta as any).env.VITE_SUPABASE_ANON_KEY!,
);

export default async function handler(_req: any, res: any) {
  const { data: listings } = await supabase
    .from("listings")
    .select("id, updated_at")
    .eq("available", true)
    .eq("verification_status", "verified");

  const baseUrl = "https://lux-d1ok.vercel.app";

  type SitemapPage = {
    url: string;
    priority: string;
    changefreq: string;
    lastmod?: string;
  };

  const staticPages: SitemapPage[] = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/explore", priority: "0.9", changefreq: "hourly" },
    { url: "/login", priority: "0.5", changefreq: "monthly" },
    { url: "/signup", priority: "0.5", changefreq: "monthly" },
  ];

  const listingPages: SitemapPage[] = (listings ?? []).map((l) => ({
    url: `/listing/${l.id}`,
    priority: "0.8",
    changefreq: "weekly",
    lastmod: l.updated_at?.split("T")[0],
  }));

  const allPages = [...staticPages, ...listingPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (p) => `  <url>
    <loc>${baseUrl}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
    ${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ""}
  </url>`,
  )
  .join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "s-maxage=3600");
  res.status(200).send(xml);
}
