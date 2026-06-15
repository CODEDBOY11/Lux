// src/SEO.tsx
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  listing?: {
    name: string;
    location: string;
    city: string;
    country: string;
    category: string;
    pricePerNight: number;
    rating: number;
    images: string[];
  };
}

const SITE_NAME = "LuxStay";
const SITE_URL = "https://yourdomain.com"; // ← replace with your actual domain
const DEFAULT_IMAGE = "https://yourdomain.com/og-default.jpg"; // ← make a nice 1200x630 image
const DEFAULT_DESCRIPTION =
  "Discover and book luxury villas, apartments, resorts and boutique hotels worldwide. Verified hosts, instant booking, 24/7 concierge.";

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url = SITE_URL,
  type = "website",
  listing,
}: SEOProps) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — Luxury Hotels, Villas & Apartments Worldwide`;

  // If a listing is passed, build rich listing-specific meta
  const listingDescription = listing
    ? `Book ${listing.name} in ${listing.city}, ${listing.country}. Luxury ${listing.category} from $${listing.pricePerNight.toLocaleString()}/night. Rated ${listing.rating}★. Instant booking available on ${SITE_NAME}.`
    : description;

  const listingTitle = listing
    ? `${listing.name} — ${listing.category.charAt(0).toUpperCase() + listing.category.slice(1)} in ${listing.city}, ${listing.country} | ${SITE_NAME}`
    : fullTitle;

  const listingImage = listing?.images?.[0] ?? image;
  const finalTitle = listing ? listingTitle : fullTitle;
  const finalDescription = listing ? listingDescription : description;

  return (
    <Helmet>
      {/* ── Basic ── */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* ── Open Graph (Facebook, WhatsApp, LinkedIn) ── */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={listingImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={url} />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={listingImage} />

      {/* ── Listing structured data for Google (JSON-LD) ── */}
      {listing && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LodgingBusiness",
            name: listing.name,
            description: finalDescription,
            image: listing.images,
            address: {
              "@type": "PostalAddress",
              addressLocality: listing.city,
              addressCountry: listing.country,
            },
            priceRange: `$${listing.pricePerNight}/night`,
            aggregateRating:
              listing.rating > 0
                ? {
                    "@type": "AggregateRating",
                    ratingValue: listing.rating,
                    bestRating: 5,
                  }
                : undefined,
            url,
          })}
        </script>
      )}
    </Helmet>
  );
}
