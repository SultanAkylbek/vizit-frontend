import { useEffect } from "react";
import type { Place } from "../../api/index";

interface PlaceSEOProps {
  place: Place;
}

/**
 * SEO component for Universal Business Entity Page.
 * Handles:
 * - Dynamic <title> and meta description
 * - OpenGraph / Twitter Card meta tags
 * - Canonical URL
 * - JSON-LD structured data (LocalBusiness + FAQPage)
 */
export function PlaceSEO({ place }: PlaceSEOProps) {
  const canonicalUrl = place.canonical_url || `https://vizit-ai.vercel.app/place/${place.slug}`;
  const fullTitle = `${place.name} — ${place.category} в ${place.district || "Астане"}`;
  const description = place.ambient_description || place.usp || `Узнайте больше о ${place.name} в ${place.district || "Астане"}`;
  
  // Build LocalBusiness JSON-LD
  const localBusinessJson = {
    "@context": "https://schema.org",
    "@type": getSchemaType(place.category),
    name: place.name,
    description: place.ambient_description || place.usp || undefined,
    url: canonicalUrl,
    address: place.address ? {
      "@type": "PostalAddress",
      streetAddress: place.address,
      addressLocality: place.city || "Астана",
      addressCountry: "KZ"
    } : undefined,
    geo: (place.lat && place.lng) ? {
      "@type": "GeoCoordinates",
      latitude: place.lat,
      longitude: place.lng
    } : undefined,
    telephone: place.phone || undefined,
    sameAs: [place.website, place.instagram].filter(Boolean) || undefined,
    openingHours: place.working_hours ? parseOpeningHours(place.working_hours) : undefined,
    priceRange: place.avg_check_kzt ? getPriceRange(place.avg_check_kzt) : undefined,
    servesCuisine: place.category === "cafe" || place.category === "restaurant" ? place.category : undefined,
    amenityFeature: place.features?.map((f: string) => ({
      "@type": "LocationFeatureSpecification",
      name: f,
      value: true
    })) || undefined
  };

  // Build FAQPage JSON-LD if FAQ exists
  const faqJson = place.faq && place.faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: place.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  } : null;

  useEffect(() => {
    // Set document title
    document.title = fullTitle;
    
    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description);
    
    // OpenGraph tags
    updateMetaTag("property", "og:title", fullTitle);
    updateMetaTag("property", "og:description", description);
    updateMetaTag("property", "og:type", "website");
    updateMetaTag("property", "og:url", canonicalUrl);
    updateMetaTag("property", "og:locale", "ru_KZ");
    updateMetaTag("property", "og:site_name", "VIZIT AI");
    
    // Twitter Card tags
    updateMetaTag("name", "twitter:card", "summary");
    updateMetaTag("name", "twitter:title", fullTitle);
    updateMetaTag("name", "twitter:description", description);
    
    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonicalUrl);
    
    // Clean up function to restore original values could be added here
    // For now, we let the next PlaceSEO update override these
  }, [fullTitle, description, canonicalUrl]);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJson) }}
      />
      {faqJson && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJson) }}
        />
      )}
    </>
  );
}

function updateMetaTag(attrName: string, attrValue: string, content: string): void {
  let tag = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function getSchemaType(category: string): string {
  const mapping: Record<string, string> = {
    cafe: "CafeOrCoffeeShop",
    restaurant: "Restaurant",
    barbershop: "HealthAndBeautyBusiness",
    sto: "AutoRepair",
    gym: "SportsActivityLocation",
    shop: "Store",
    hotel: "LodgingBusiness"
  };
  return mapping[category] || "LocalBusiness";
}

function parseOpeningHours(workingHours: string): string | undefined {
  // Simple parsing - backend format may vary
  // Expected: "Mon-Fri: 9:00-18:00" or similar
  if (!workingHours) return undefined;
  // For now, return as-is; proper ISO 8601 parsing can be added later
  return workingHours;
}

function getPriceRange(avgCheck: number): string {
  if (avgCheck < 2000) return "$";
  if (avgCheck < 5000) return "$$";
  if (avgCheck < 10000) return "$$$";
  return "$$$$";
}
