import type { Place } from "./index";

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

  return {
    id,
    name,
    slug,
    category,
    niche: asString(item.niche, undefined) || undefined,
    city: asString(item.city, undefined) || undefined,
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
    phone: asString(item.phone, undefined) || undefined,
    website: asString(item.website, undefined) || undefined,
    instagram: asString(item.instagram, undefined) || undefined,
    working_hours: asString(item.working_hours, undefined) || undefined,
    rating: asNumber(item.rating),
    payment_methods: Array.isArray(item.payment_methods) ? item.payment_methods.map(String) : undefined,
    usp: asString(item.usp, undefined) || undefined,
    features: Array.isArray(item.features) ? item.features.map(String) : undefined,
    target_audience: asString(item.target_audience, undefined) || undefined,
    nearby_landmarks: Array.isArray(item.nearby_landmarks) ? item.nearby_landmarks.map(String) : undefined,
    how_to_get_there: asString(item.how_to_get_there, undefined) || undefined,
    faq: Array.isArray(item.faq) ? item.faq.map((f: any) => ({ question: String(f.question || ""), answer: String(f.answer || "") })) : undefined,
    tips: Array.isArray(item.tips) ? item.tips.map(String) : undefined,
    local_guides: Array.isArray(item.local_guides) ? item.local_guides.map(String) : undefined,
    comparison_sections: Array.isArray(item.comparison_sections) ? item.comparison_sections.map((c: any) => ({ title: String(c.title || ""), content: String(c.content || "") })) : undefined,
    page_sections: Array.isArray(item.page_sections) ? item.page_sections.map((p: any) => ({ title: String(p.title || ""), content: String(p.content || "") })) : undefined,
    ai_context: asString(item.ai_context, undefined) || undefined,
    business_knowledge: asString(item.business_knowledge, undefined) || undefined,
    entity_json: item.entity_json && typeof item.entity_json === "object" ? item.entity_json as Record<string, unknown> : undefined,
    semantic_relations: Array.isArray(item.semantic_relations) ? item.semantic_relations.map(String) : undefined,
    search_intents: Array.isArray(item.search_intents) ? item.search_intents.map(String) : undefined,
    source_snippets: Array.isArray(item.source_snippets) ? item.source_snippets.map(String) : undefined,
    recommendation_snippets: Array.isArray(item.recommendation_snippets) ? item.recommendation_snippets.map(String) : undefined,
    conversational_answers: Array.isArray(item.conversational_answers) ? item.conversational_answers.map((c: any) => ({ question: String(c.question || ""), answer: String(c.answer || "") })) : undefined,
    breadcrumb: Array.isArray(item.breadcrumb) ? item.breadcrumb.map((b: any) => ({ name: String(b.name || ""), url: b.url ? String(b.url) : undefined })) : undefined,
    canonical_url: asString(item.canonical_url, undefined) || undefined,
  };
}

export function mapBackendPlaces(raw: unknown): Place[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(mapBackendPlace);
}
