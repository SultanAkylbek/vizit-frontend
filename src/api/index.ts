import { TOKEN_KEY } from "../auth/authApi";
import { mapBackendPlace, mapBackendPlaces } from "./placeMapper";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://vizit-backend-vdt2.onrender.com";
const LOCAL_PLACES_KEY = "vizit_local_places";
const LOCAL_OFFERS_KEY = "vizit_local_offers";

export interface Place {
  id: string;
  name: string;
  slug: string;
  category: string;
  niche?: string;
  city?: string;
  district: string;
  address: string;
  emoji?: string;
  ambient_description?: string;
  tags: string[];
  is_verified: boolean;
  tier: string;
  avg_check_kzt?: number;
  two_gis_url?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  website?: string;
  instagram?: string;
  tiktok?: string;
  working_hours?: string;
  rating?: number;
  payment_methods?: string[];
  usp?: string;
  features?: string[];
  target_audience?: string;
  nearby_landmarks?: string[];
  how_to_get_there?: string;
  faq?: { question: string; answer: string }[];
  tips?: string[];
  local_guides?: string[];
  comparison_sections?: { title: string; content: string }[];
  page_sections?: { title: string; content: string }[];
  ai_context?: string;
  business_knowledge?: string;
  entity_json?: Record<string, unknown>;
  semantic_relations?: string[];
  search_intents?: string[];
  source_snippets?: string[];
  recommendation_snippets?: string[];
  conversational_answers?: { question: string; answer: string }[];
  breadcrumb?: { name: string; url?: string }[];
  canonical_url?: string;
  about?: string;
  offerings?: string[];
  audience?: string[];
}

export interface VendorPlaceInput {
  name: string;
  category: string;
  address: string;
  district: string;
  ambient_description: string;
  tags: string[];
  lat: number | null;
  lng: number | null;
  two_gis_url: string;
  avg_check_kzt: number | null;
  has_outlets: boolean;
  has_wifi: boolean;
  phone?: string;
  website?: string;
  instagram?: string;
  tiktok?: string;
  working_hours?: string;
  payment_methods?: string[];
  usp?: string;
  features?: string[];
  target_audience?: string;
  nearby_landmarks?: string[];
  how_to_get_there?: string;
  faq?: { question: string; answer: string }[];
  tips?: string[];
}

export interface BusinessFacts {
  business_name: string;
  niche: string;
  city: string;
  district?: string;
  address_2gis_url: string;
  phone?: string;
  website?: string;
  instagram?: string;
  tiktok?: string;
  working_hours?: string;
  payment_methods?: string[];
  description?: string;
  usp?: string;
  features?: string[];
}

export interface GeneratedContent {
  about: string;
  usp: string[];
  offerings: string[];
  audience: string[];
  faq: { question: string; answer: string }[];
  tips: string[];
  summary: string;
}

export interface SearchResult {
  matched: boolean;
  rec: string;
  place: Place | null;
  places?: Place[];
  session_id?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = new Headers();

  if (options.headers) {
    const inputHeaders = new Headers(options.headers);
    inputHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", "Bearer " + token.trim());
  }

  const fetchOptions: RequestInit = {
    ...options,
    mode: "cors",
    headers: headers
  };

  const res = await fetch(API_BASE + path, fetchOptions);

  if (!res.ok) {
    let message = "Server error";
    try {
      const body = await res.json();
      message = body.detail || body.message || message;
    } catch (_) {}
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function readLocalPlaces(): unknown[] {
  try {
    const raw = localStorage.getItem(LOCAL_PLACES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeLocalPlaces(arr: unknown[]): void {
  try {
    localStorage.setItem(LOCAL_PLACES_KEY, JSON.stringify(arr));
  } catch {
    /* storage unavailable */
  }
}

// ── Frontend content generation (fallback when backend AI is unavailable) ──

function generateTemplateContent(data: VendorPlaceInput): GeoGenerateResultExtended {
  const categoryNames: Record<string, string> = {
    cafe: "кофейня",
    restaurant: "ресторан",
    barbershop: "барбершоп",
    sto: "автосервис",
    gym: "фитнес-клуб",
    other: "заведение",
  };
  const catName = categoryNames[data.category] || "заведение";

  const about = data.ambient_description
    ? `${data.name} — это ${catName} в районе ${data.district || "Астаны"}. ${data.ambient_description} Мы стремимся создать комфортную атмосферу для каждого гостя.`
    : `${data.name} — уютная ${catName}, расположенная по адресу ${data.address}. Ждём вас в гости!`;

  const usp: string[] = [
    data.ambient_description?.toLowerCase().includes("уют") || data.ambient_description?.toLowerCase().includes("тих") ? "Уютная атмосфера" : "Приятная атмосфера",
    data.tags?.some((t) => t.toLowerCase().includes("wifi")) ? "Бесплатный Wi-Fi" : "Высокий сервис",
    data.tags?.some((t) => t.toLowerCase().includes("розетк")) ? "Рабочие места с розетками" : "Удобное расположение",
    "Качественное обслуживание",
  ].filter(Boolean);

  const offeringsMap: Record<string, string[]> = {
    cafe: ["Кофе и чай", "Десерты и выпечка", "Завтраки", "Напитки на вынос"],
    restaurant: ["Обеденное меню", "Ужин", "Банкеты", "Доставка"],
    barbershop: ["Стрижка", "Бритьё", "Уход за бородой", "Камуфляж седины"],
    sto: ["Диагностика", "ТО", "Ремонт ходовой", "Шиномонтаж"],
    gym: ["Тренажёрный зал", "Групповые занятия", "Персональные тренеры", "Сауна"],
    other: ["Индивидуальный подход", "Широкий ассортимент", "Консультации"],
  };
  const offerings = offeringsMap[data.category] || offeringsMap.other;

  const audienceMap: Record<string, string[]> = {
    cafe: ["Студенты", "Фрилансеры", "Встречи с друзьями", "Удалёнщики"],
    restaurant: ["Семейный отдых", "Деловые встречи", "Романтические ужины", "Компании"],
    barbershop: ["Мужчины", "Подростки", "Те, кто следит за стилем"],
    sto: ["Автовладельцы", "Корпоративные клиенты", "Таксисты"],
    gym: ["Новички", "Продвинутые атлеты", "Те, кто следит за здоровьем"],
    other: ["Все желающие", "Местные жители", "Гости города"],
  };
  const audience = audienceMap[data.category] || audienceMap.other;

  const socialText = [];
  if (data.instagram) socialText.push(`Instagram: ${data.instagram}`);
  if (data.tiktok) socialText.push(`TikTok: ${data.tiktok}`);

  const faq = [
    { question: "Какой адрес?", answer: `Мы находимся по адресу: ${data.address}${data.district ? `, район ${data.district}` : ""}.` },
    { question: "Какие часы работы?", answer: data.working_hours ? `Режим работы: ${data.working_hours}` : "Уточняйте часы работы по телефону." },
    { question: "Есть ли Wi-Fi?", answer: data.tags?.some((t) => t.toLowerCase().includes("wifi")) ? "Да, у нас есть бесплатный Wi-Fi для гостей." : "Уточняйте наличие Wi-Fi на месте." },
    { question: "Какие способы оплаты?", answer: data.payment_methods?.length ? `Принимаем: ${data.payment_methods.join(", ")}.` : "Принимаем наличные и банковские карты." },
    { question: "Есть ли соцсети?", answer: socialText.length > 0 ? `Да, следите за нами: ${socialText.join(", ")}.` : "Соцсети уточняйте на месте." },
  ];

  const tips = [
    "Лучшее время для посещения — будние дни утром",
    data.tags?.some((t) => t.toLowerCase().includes("wifi")) ? "Не забудьте попросить пароль от Wi-Fi" : "Рекомендуем забронировать место заранее",
    socialText.length > 0 ? "Следите за акциями в наших соцсетях" : "Следите за обновлениями",
  ].filter(Boolean);

  const how_to_get_there = `${data.name} расположен по адресу ${data.address}${data.district ? ` в районе ${data.district}` : ""}. Рекомендуем использовать 2GIS или Яндекс.Карты для построения маршрута.`;

  const nearby_landmarks = [
    data.district ? `Центр района ${data.district}` : "Центральная площадь",
    "Торговый центр",
    "Остановка общественного транспорта",
  ];

  return {
    business_name: data.name,
    city: "Астана",
    generated_at: new Date().toISOString(),
    business_id: "",
    canonical_url: "",
    indexnow_submitted: false,
    llm_attraction_pack: { schema_org: {}, gis_point_optimization: "", gis_point_char_count: 0, llm_faq: [] },
    nfc_conversion_pack: { multilink_title: "", multilink_description: "", review_prompts: [] },
    media_proof_pack: { headline: "", press_release_qa: [], target_platforms: [] },
    action_checklist: [],
    generated_content: {
      about,
      usp,
      offerings,
      audience,
      faq,
      tips,
      how_to_get_there,
      nearby_landmarks,
      working_hours: data.working_hours,
      payment_methods: data.payment_methods || ["Наличные", "Банковская карта"],
    },
  };
}

async function generateAIContent(data: VendorPlaceInput, apiKey: string): Promise<GeoGenerateResultExtended | null> {
  const prompt = `Ты — копирайтер для локального бизнеса в Астане, Казахстан. Напиши структурированное описание для "${data.name}" (${data.category}).

Адрес: ${data.address}
Район: ${data.district || "Астана"}
Описание от владельца: ${data.ambient_description}
Теги: ${data.tags?.join(", ") || ""}
${data.instagram ? `Instagram: ${data.instagram}` : ""}
${data.tiktok ? `TikTok: ${data.tiktok}` : ""}

Ответь СТРОГО в формате JSON без markdown:
{
  "about": "2-3 предложения о заведении",
  "usp": ["3-4 уникальных преимущества"],
  "offerings": ["4-5 услуг или товаров"],
  "audience": ["3-4 целевые аудитории"],
  "faq": [{"question": "...", "answer": "..."}, {"question": "...", "answer": "..."}],
  "tips": ["2-3 совета посетителям"],
  "how_to_get_there": "Как добраться (1-2 предложения)",
  "nearby_landmarks": ["2-3 достопримечательности рядом"]
}`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Vizit AI",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
      }),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    const parsed = JSON.parse(jsonStr.trim());

    return {
      business_name: data.name,
      city: "Астана",
      generated_at: new Date().toISOString(),
      business_id: "",
      canonical_url: "",
      indexnow_submitted: false,
      llm_attraction_pack: { schema_org: {}, gis_point_optimization: "", gis_point_char_count: 0, llm_faq: [] },
      nfc_conversion_pack: { multilink_title: "", multilink_description: "", review_prompts: [] },
      media_proof_pack: { headline: "", press_release_qa: [], target_platforms: [] },
      action_checklist: [],
      generated_content: {
        about: parsed.about || "",
        usp: Array.isArray(parsed.usp) ? parsed.usp : [],
        offerings: Array.isArray(parsed.offerings) ? parsed.offerings : [],
        audience: Array.isArray(parsed.audience) ? parsed.audience : [],
        faq: Array.isArray(parsed.faq) ? parsed.faq : [],
        tips: Array.isArray(parsed.tips) ? parsed.tips : [],
        how_to_get_there: parsed.how_to_get_there || "",
        nearby_landmarks: Array.isArray(parsed.nearby_landmarks) ? parsed.nearby_landmarks : [],
        working_hours: data.working_hours,
        payment_methods: data.payment_methods || ["Наличные", "Банковская карта"],
      },
    };
  } catch {
    return null;
  }
}

export const placesApi = {
  list: (): Promise<Place[]> => Promise.resolve(mapBackendPlaces(readLocalPlaces())),

  search: async (
    query: string,
    lang: string,
    session_id: string | null,
    local_places?: Place[]
  ): Promise<SearchResult> => {
    const raw = await req<Record<string, unknown>>("/api/v1/search", {
      method: "POST",
      body: JSON.stringify({ query, lang, session_id, local_places }),
    });
    return {
      matched: Boolean(raw?.matched),
      rec: typeof raw?.rec === "string" ? raw.rec : "",
      place: raw?.place ? mapBackendPlace(raw.place) : null,
      places: Array.isArray(raw?.places) ? mapBackendPlaces(raw.places) : undefined,
      session_id: typeof raw?.session_id === "string" ? raw.session_id : undefined,
    };
  },

  upsertMine: async (data: VendorPlaceInput, idempotencyKey?: string): Promise<{ status: string; place_id: string; slug: string; generated_by: "backend" | "template" | "openrouter" }> => {
    const importPayload: GeoImportInput = {
      business_name: data.name,
      niche: data.category,
      city: "Астана",
      address: data.address,
      address_2gis_url: data.two_gis_url || data.address,
      district: data.district,
      phone: data.phone,
      website: data.website,
      usp: data.usp || data.ambient_description?.slice(0, 300),
      ambient_description: data.ambient_description,
      tags: data.tags,
      payment_methods: data.payment_methods,
      features: data.features,
      target_audience: data.target_audience,
      avg_check_kzt: data.avg_check_kzt ?? undefined,
      latitude: data.lat ?? undefined,
      longitude: data.lng ?? undefined,
      opening_hours: data.working_hours ? [data.working_hours] : undefined,
      lang: "ru",
    };

    const importResult = await geoApi.import(importPayload);
    const placeRecord = importResult.place;
    const businessId = placeRecord.business_id as string;

    if (!businessId) {
      throw new ApiError(502, "Backend вернул ответ без business_id");
    }

    let generateResult: GeoGenerateResultExtended;
    let generatedBy: "backend" | "template" | "openrouter" = "backend";

    try {
      generateResult = await geoApi.generate({
        ...importPayload,
        business_id: businessId,
      });
    } catch {
      const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
      if (openRouterKey) {
        const aiResult = await generateAIContent(data, openRouterKey);
        if (aiResult) {
          generateResult = aiResult;
          generatedBy = "openrouter";
        } else {
          generateResult = generateTemplateContent(data);
          generatedBy = "template";
        }
      } else {
        generateResult = generateTemplateContent(data);
        generatedBy = "template";
      }
    }

    const merged = {
      ...placeRecord,
      ...generateResult,
      id: businessId,
      business_id: businessId,
      instagram: data.instagram,
      tiktok: data.tiktok,
    };
    const place = mapBackendPlace(merged);
    const filtered = readLocalPlaces().filter((p) => (p as { slug?: string })?.slug !== place.slug);
    filtered.unshift(place);
    writeLocalPlaces(filtered);

    return {
      status: "saved_backend",
      place_id: businessId,
      slug: place.slug,
      generated_by: generatedBy,
    };
  },
};

export type TwoGisDraft = Place;

export const importApi = {
  fromTwoGis: (twoGisUrl: string): Promise<TwoGisDraft> =>
    req<{ place?: unknown }>("/api/v1/places/from-2gis", {
      method: "POST",
      body: JSON.stringify({ two_gis_url: twoGisUrl, url: twoGisUrl }),
    }).then((res) => {
      if (!res || !res.place) {
        throw new ApiError(502, "2GIS не вернул данные по этой ссылке");
      }
      return mapBackendPlace(res.place);
    }),
};

export interface GeoGenerateInput {
  business_name: string;
  niche: string;
  city: string;
  usp: string;
  address_2gis_url: string;
  district?: string;
  payment_methods?: string[];
  phone?: string;
  website?: string;
  social_links?: string[];
  lang?: "ru" | "kz" | "en";
  business_id?: string;
  latitude?: number;
  longitude?: number;
  opening_hours?: string[];
  accepts_reservations?: boolean;
}

export interface GeoGenerateResult {
  business_name: string;
  city: string;
  generated_at: string;
  business_id: string;
  canonical_url: string;
  indexnow_submitted: boolean;
  llm_attraction_pack: { schema_org: Record<string, unknown>; gis_point_optimization: string; gis_point_char_count: number; llm_faq: { question: string; answer: string }[] };
  nfc_conversion_pack: { multilink_title: string; multilink_description: string; review_prompts: string[] };
  media_proof_pack: { headline: string; press_release_qa: { question: string; answer: string }[]; target_platforms: string[] };
  action_checklist: string[];
}

export interface GeoGenerateResultExtended extends GeoGenerateResult {
  generated_content?: {
    about: string;
    usp: string[];
    offerings: string[];
    audience: string[];
    faq: { question: string; answer: string }[];
    tips: string[];
    how_to_get_there?: string;
    nearby_landmarks?: string[];
    working_hours?: string;
    payment_methods?: string[];
  };
}

export interface GeoImportInput {
  business_name: string;
  niche: string;
  city: string;
  address_2gis_url: string;
  district?: string;
  phone?: string;
  website?: string;
  social_links?: string[];
  lang?: "ru" | "kz" | "en";
  latitude?: number;
  longitude?: number;
  opening_hours?: string[];
  accepts_reservations?: boolean;
  payment_methods?: string[];
  usp?: string;
  features?: string[];
  target_audience?: string;
  ambient_description?: string;
  tags?: string[];
  avg_check_kzt?: number;
  has_outlets?: boolean;
  has_wifi?: boolean;
}

export interface GeoImportResult {
  place: Record<string, unknown>;
  storage_backend: string;
  indexnow_submitted: boolean;
}

export interface GeoSchemaInput {
  business_name: string;
  niche: string;
  city: string;
  address: string;
  district?: string;
  two_gis_url?: string;
  phone?: string;
  website?: string;
  payment_methods?: string[];
  social_links?: string[];
  latitude?: number;
  longitude?: number;
  opening_hours?: string[];
  accepts_reservations?: boolean;
  business_id?: string;
}

export const geoApi = {
  generate: (input: GeoGenerateInput): Promise<GeoGenerateResultExtended> =>
    req("/api/v1/geo/generate", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  import: (input: GeoImportInput): Promise<GeoImportResult> =>
    req("/api/v1/geo/import", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  schema: (input: GeoSchemaInput): Promise<{ schema_org: Record<string, unknown> }> => {
    const params = new URLSearchParams();
    params.set("business_name", input.business_name);
    params.set("niche", input.niche);
    params.set("city", input.city);
    params.set("address", input.address);
    if (input.district) params.set("district", input.district);
    if (input.two_gis_url) params.set("two_gis_url", input.two_gis_url);
    if (input.phone) params.set("phone", input.phone);
    if (input.website) params.set("website", input.website);
    if (input.payment_methods?.length) params.set("payment_methods", input.payment_methods.join(","));
    if (input.social_links?.length) params.set("social_links", input.social_links.join(","));
    if (input.latitude != null) params.set("latitude", String(input.latitude));
    if (input.longitude != null) params.set("longitude", String(input.longitude));
    if (input.opening_hours?.length) params.set("opening_hours", input.opening_hours.join(","));
    if (input.accepts_reservations != null) params.set("accepts_reservations", String(input.accepts_reservations));
    if (input.business_id) params.set("business_id", input.business_id);
    return req(`/api/v1/geo/schema?${params.toString()}`);
  },

  status: (): Promise<{ available: false; reason: string }> =>
    Promise.resolve({ available: false, reason: "Backend не хранит GEO-статус — эндпоинта не существует" }),

  getById: (business_id: string): Promise<GeoImportResult> =>
    req(`/api/v1/places/${business_id}`),
};

function readLocalOffers(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_OFFERS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeLocalOffers(arr: any[]): void {
  try {
    localStorage.setItem(LOCAL_OFFERS_KEY, JSON.stringify(arr));
  } catch {
    /* storage unavailable */
  }
}

export const offersApi = {
  listMine: (): Promise<any[]> => Promise.resolve(readLocalOffers()),

  create: (data: any): Promise<any> => {
    const id = genId();
    const offer = { id, ...data };
    const arr = [offer, ...readLocalOffers()];
    writeLocalOffers(arr);
    return Promise.resolve({ status: "saved_locally", ...offer });
  },

  upsert: (place_id: string, data: any, idempotencyKey?: string): Promise<any> => {
    const id = idempotencyKey || genId();
    const offer = { id, place_id, ...data };
    const arr = readLocalOffers().filter((o) => o?.id !== id);
    arr.unshift(offer);
    writeLocalOffers(arr);
    return Promise.resolve({ status: "saved_locally", id, place_id });
  },

  delete: (id: string): Promise<any> => {
    writeLocalOffers(readLocalOffers().filter((o) => o?.id !== id));
    return Promise.resolve({ status: "deleted_locally", id });
  },
};
