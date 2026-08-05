import type { Place, PlaceGeoData } from "./index";

type RawPlace = Record<string, unknown>;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return ["true", "1", "yes", "да"].includes(value.toLowerCase());
  return fallback;
}

function asTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return asTags(parsed);
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9а-яёәғқңөұүһі]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "place";
}

function categoryEmoji(category: string): string {
  return {
    cafe: "☕",
    restaurant: "🍽️",
    barbershop: "💈",
    sto: "🔧",
    gym: "🏋️",
  }[category] || "📍";
}

/**
 * Converts every known backend place shape into the single UI Place contract.
 * Supports both the MVP search API shape (name/slug/lat/lng) and the GEO
 * PlaceRecord shape (business_name/business_id/latitude/longitude).
 */
export function mapBackendPlace(raw: unknown): Place {
  const item = (raw && typeof raw === "object" ? raw : {}) as RawPlace;

  const name = asString(item.name, asString(item.business_name, "Заведение"));
  const slug = asString(item.slug, asString(item.business_id, slugify(name)));
  const category = asString(item.category, asString(item.niche, "other")).toLowerCase();
  const address = asString(item.address, "Адрес уточняется");
  const district = asString(item.district, asString(item.city, ""));
  const description = asString(
    item.ambient_description,
    asString(item.description_for_maps, asString(item.usp, "Описание пока не добавлено."))
  );
  const lat = asNumber(item.lat) ?? asNumber(item.latitude);
  const lng = asNumber(item.lng) ?? asNumber(item.longitude);
  const twoGisUrl = asString(item.two_gis_url, asString(item.source_url, ""));
  const id = asString(item.id, slug);
  const tags = asTags(item.tags);
  const phone = asString(item.phone, "");
  const website = asString(item.website, "");
  const workingHours = asString(item.working_hours, asString(item.opening_hours, ""));
  const paymentMethodsRaw = item.payment_methods;
  const paymentMethods = Array.isArray(paymentMethodsRaw)
    ? paymentMethodsRaw.map((m) => asString(m)).filter(Boolean)
    : typeof paymentMethodsRaw === "string"
      ? paymentMethodsRaw.split(",").map((m) => m.trim()).filter(Boolean)
      : [];
  const instagramLink = asString(item.instagram_link, asString(item.instagram, ""));
  const socialLinksRaw = item.social_links;
  const socialLinks = Array.isArray(socialLinksRaw)
    ? socialLinksRaw.map((s) => asString(s)).filter(Boolean)
    : typeof socialLinksRaw === "string"
      ? socialLinksRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  const city = asString(item.city, district);

  // Try to load GEO data from localStorage if available
  let geoData: PlaceGeoData | undefined;
  try {
    const rawGeo = localStorage.getItem(`vizit_geo_${id}`);
    if (rawGeo) {
      geoData = JSON.parse(rawGeo);
    }
  } catch (_) {}

  return {
    id,
    name,
    slug,
    category,
    district,
    address,
    emoji: asString(item.emoji, categoryEmoji(category)),
    ambient_description: description,
    tags,
    is_verified: asBoolean(item.is_verified),
    tier: asString(item.tier, "free"),
    avg_check_kzt: asNumber(item.avg_check_kzt),
    two_gis_url: twoGisUrl || undefined,
    lat,
    lng,
    phone: phone || undefined,
    website: website || undefined,
    working_hours: workingHours || undefined,
    rating: asNumber(item.rating) ?? asNumber(item.rating_value),
    payment_methods: paymentMethods.length ? paymentMethods : undefined,
    instagram_link: instagramLink || undefined,
    social_links: socialLinks.length ? socialLinks : undefined,
    city,
    geo_data: geoData,
  };
}

export function mapBackendPlaces(raw: unknown): Place[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(mapBackendPlace);
}
