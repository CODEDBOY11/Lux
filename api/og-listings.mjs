import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
);

export default async function handler(req, res) {
  const id = new URL(req.url, "http://localhost").searchParams.get("id");
  if (!id) return res.status(400).send("Missing id");

  const { data: listing, error } = await supabase
    .from("listings")
    .select(
      "name, description, city, country, category, price_per_night, rating, images",
    )
    .eq("id", id)
    .single();

  if (error || !listing) return res.status(404).send("Not found");

  let image = listing.images?.[0] ?? null;

  if (image && image.includes("cloudinary.com")) {
    image = image.replace(
      "/upload/",
      "/upload/w_1200,h_630,c_fill,q_auto,f_auto/",
    );
  }

  if (!image) {
    image =
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=630&fit=crop&q=80";
  }

  const title = `${listing.name} — Luxury ${listing.category} in ${listing.city}, ${listing.country} | LuxStay`;
  const description = `Book ${listing.name} in ${listing.city}, ${listing.country}. Luxury ${listing.category} from ₦${Number(listing.price_per_night).toLocaleString()}/night.${listing.rating > 0 ? ` Rated ${listing.rating}★.` : ""} Verified on LuxStay. Click to view photos and book instantly.`;
  const url = `https://lux-d1ok.vercel.app/listing/${id}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="LuxStay" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:secure_url" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/webp" />
  <meta property="og:url" content="${url}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta http-equiv="refresh" content="0; url=${url}" />
  <script>window.location.href = "${url}";</script>
</head>
<body>
  <p>Redirecting to <a href="${url}">${title}</a>...</p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "s-maxage=3600");
  res.status(200).send(html);
}
