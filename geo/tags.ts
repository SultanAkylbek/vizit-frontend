// src/geo/tags.ts
//
// Extensible GEO tag normalization system — single-file version.
//
// Turns free-form tags (from vendors, 2GIS scraping, or anywhere else) into
// a canonical set, each with: canonical id, RU/EN label, all known
// synonyms/spellings, an icon, and a Schema.org/JSON-LD mapping.
//
// EXTENDING THIS FILE:
// - New tag in an existing category → add one object to that category's
//   array below (e.g. push into FOOD_TAGS).
// - New category → add a new `const MY_CATEGORY_TAGS: TagDefinition[] = [...]`
//   array, add it to `TAG_REGISTRY` at the bottom, and add its metadata to
//   `TAG_CATEGORIES`.
// Nothing in normalizeTag/normalizeTags/buildTagsSchemaFragment ever needs
// to change — they only ever read from TAG_REGISTRY.

import type { ComponentType } from "react";
import {
  Wifi,
  Zap,
  Users,
  Laptop,
  VolumeX,
  Presentation,
  CreditCard,
  Smartphone,
  Wallet,
  Banknote,
  Coffee,
  Cookie,
  Croissant,
  Salad,
  Leaf,
  WheatOff,
  ChefHat,
  CupSoda,
  ParkingCircle,
  Trees,
  Sun,
  Wind,
  Baby,
  Armchair,
  Bath,
  Accessibility,
  Truck,
  ShoppingBag,
  CalendarCheck,
  Globe,
  QrCode,
  Heart,
  HeartHandshake,
  Users2,
  BookOpen,
  PartyPopper,
  Home,
  PawPrint,
  Cigarette,
  CigaretteOff,
  Clock,
  Moon,
  Building2,
  PanelTop,
  Music,
  Disc,
  Gamepad,
  BatteryCharging,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────

export type TagCategory =
  | "internet_work"
  | "payment"
  | "food"
  | "amenities"
  | "service"
  | "atmosphere"
  | "extra";

export interface TagCategoryMeta {
  id: TagCategory;
  label: { ru: string; en: string };
}

export type IconComponent = ComponentType<{ size?: number; className?: string }>;

/**
 * How a tag should be represented in Schema.org / JSON-LD.
 *
 * - "amenityFeature": the standard, general-purpose way to attach an
 *   arbitrary POI attribute to a Place/LocalBusiness — this is what real
 *   GEO/POI data providers use for the vast majority of features (Wi-Fi,
 *   parking, pet friendly, atmosphere descriptors, etc). It's the default.
 * - "paymentAccepted": a genuine, direct Schema.org property on
 *   Place/LocalBusiness (schema.org/paymentAccepted, free-text Text value).
 * - "openingHours": for tags that describe real, verifiable operating
 *   hours (currently only "24/7") — maps to openingHoursSpecification.
 *
 * We deliberately do NOT invent non-standard Schema.org properties (e.g. a
 * fictitious "suitableForSmoking"). Anything without a clean real mapping
 * falls back to "amenityFeature", which is valid for any named
 * characteristic.
 */
export type SchemaMapping =
  | { kind: "amenityFeature"; name: string }
  | { kind: "paymentAccepted"; value: string }
  | { kind: "openingHours" };

export interface TagDefinition {
  /** Canonical, stable machine key. Never shown to users, never localized. */
  id: string;
  category: TagCategory;
  label: { ru: string; en: string };
  /** Every known way this tag shows up: manual input, 2GIS scraping, free
   * text, RU/EN, with/without hyphens, etc. Matching is case- and
   * layout-insensitive, so entries don't need every capitalization. */
  synonyms: string[];
  icon: IconComponent;
  /** One tag can (rarely) map to more than one Schema.org representation. */
  schema: SchemaMapping[];
}

export interface NormalizedTag {
  id: string;
  category: TagCategory;
  label: string;
  icon: IconComponent | null;
  schema: SchemaMapping[];
  /** True if the raw input didn't match anything in the registry. */
  isUnknown: boolean;
  /** The original raw string, preserved so unknown tags aren't lost. */
  raw: string;
}

// ────────────────────────────────────────────────────────────────────────
// Registry — Интернет и работа
// ────────────────────────────────────────────────────────────────────────

const INTERNET_WORK_TAGS: TagDefinition[] = [
  {
    id: "wifi",
    category: "internet_work",
    label: { ru: "Wi-Fi", en: "Wi-Fi" },
    synonyms: ["wifi", "wi-fi", "wi fi", "вайфай", "вай-фай", "вай фай"],
    icon: Wifi,
    schema: [{ kind: "amenityFeature", name: "Wi-Fi" }],
  },
  {
    id: "wifi_free",
    category: "internet_work",
    label: { ru: "Бесплатный Wi-Fi", en: "Free Wi-Fi" },
    synonyms: [
      "бесплатный wifi",
      "бесплатный wi-fi",
      "бесплатный интернет",
      "free wifi",
      "free wi-fi",
      "бесплатный вайфай",
    ],
    icon: Wifi,
    schema: [{ kind: "amenityFeature", name: "Free Wi-Fi" }],
  },
  {
    id: "wifi_fast",
    category: "internet_work",
    label: { ru: "Высокоскоростной Wi-Fi", en: "High-speed Wi-Fi" },
    synonyms: [
      "высокоскоростной wifi",
      "высокоскоростной интернет",
      "быстрый wifi",
      "быстрый интернет",
      "скоростной wifi",
      "fast wifi",
      "high-speed wifi",
      "high speed wifi",
    ],
    icon: Wifi,
    schema: [{ kind: "amenityFeature", name: "High-speed Wi-Fi" }],
  },
  {
    id: "power_outlets",
    category: "internet_work",
    label: { ru: "Розетки", en: "Power outlets" },
    synonyms: ["розетки", "розетка", "power outlets", "power outlet", "outlets", "sockets", "socket"],
    icon: Zap,
    schema: [{ kind: "amenityFeature", name: "Power outlets" }],
  },
  {
    id: "coworking",
    category: "internet_work",
    label: { ru: "Коворкинг", en: "Coworking" },
    synonyms: ["коворкинг", "coworking", "co-working", "co working"],
    icon: Users,
    schema: [{ kind: "amenityFeature", name: "Coworking" }],
  },
  {
    id: "workspaces",
    category: "internet_work",
    label: { ru: "Рабочие места", en: "Workspaces" },
    synonyms: ["рабочие места", "рабочее место", "workspaces", "workspace", "work desks", "work desk"],
    icon: Laptop,
    schema: [{ kind: "amenityFeature", name: "Workspaces" }],
  },
  {
    id: "laptop_friendly",
    category: "internet_work",
    label: { ru: "Ноутбук friendly", en: "Laptop friendly" },
    synonyms: ["ноутбук friendly", "ноутбук-френдли", "можно с ноутбуком", "laptop friendly", "laptop-friendly"],
    icon: Laptop,
    schema: [{ kind: "amenityFeature", name: "Laptop friendly" }],
  },
  {
    id: "quiet_atmosphere",
    category: "internet_work",
    label: { ru: "Тихая атмосфера", en: "Quiet atmosphere (for work)" },
    synonyms: ["тихая атмосфера", "тихая атмосфера для работы", "quiet atmosphere", "quiet environment"],
    icon: VolumeX,
    schema: [{ kind: "amenityFeature", name: "Quiet atmosphere" }],
  },
  {
    id: "meeting_rooms",
    category: "internet_work",
    label: { ru: "Переговорные", en: "Meeting rooms" },
    synonyms: ["переговорные", "переговорная", "переговорная комната", "meeting room", "meeting rooms"],
    icon: Presentation,
    schema: [{ kind: "amenityFeature", name: "Meeting rooms" }],
  },
];

// ────────────────────────────────────────────────────────────────────────
// Registry — Оплата
// ────────────────────────────────────────────────────────────────────────

const PAYMENT_TAGS: TagDefinition[] = [
  {
    id: "kaspi",
    category: "payment",
    label: { ru: "Kaspi", en: "Kaspi" },
    synonyms: ["kaspi", "каспи", "kaspi pay", "каспи пей"],
    icon: Wallet,
    schema: [{ kind: "paymentAccepted", value: "Kaspi" }],
  },
  {
    id: "kaspi_qr",
    category: "payment",
    label: { ru: "Kaspi QR", en: "Kaspi QR" },
    synonyms: ["kaspi qr", "каспи qr", "каспи кюар", "kaspi red", "каспи ред"],
    icon: CreditCard,
    schema: [{ kind: "paymentAccepted", value: "Kaspi QR" }],
  },
  {
    id: "apple_pay",
    category: "payment",
    label: { ru: "Apple Pay", en: "Apple Pay" },
    synonyms: ["apple pay", "applepay", "эпл пей", "эплпей"],
    icon: Smartphone,
    schema: [{ kind: "paymentAccepted", value: "Apple Pay" }],
  },
  {
    id: "google_pay",
    category: "payment",
    label: { ru: "Google Pay", en: "Google Pay" },
    synonyms: ["google pay", "googlepay", "гугл пей"],
    icon: Smartphone,
    schema: [{ kind: "paymentAccepted", value: "Google Pay" }],
  },
  {
    id: "samsung_pay",
    category: "payment",
    label: { ru: "Samsung Pay", en: "Samsung Pay" },
    synonyms: ["samsung pay", "samsungpay", "самсунг пей"],
    icon: Smartphone,
    schema: [{ kind: "paymentAccepted", value: "Samsung Pay" }],
  },
  {
    id: "bank_cards",
    category: "payment",
    label: { ru: "Банковские карты", en: "Bank cards" },
    synonyms: [
      "банковские карты",
      "банковская карта",
      "карты",
      "картой",
      "безнал",
      "безналичный расчет",
      "безналичный расчёт",
      "bank card",
      "bank cards",
      "card payment",
      "visa",
      "mastercard",
    ],
    icon: CreditCard,
    schema: [{ kind: "paymentAccepted", value: "Credit Card" }],
  },
  {
    id: "cash",
    category: "payment",
    label: { ru: "Наличные", en: "Cash" },
    synonyms: ["наличные", "нал", "наличкой", "cash"],
    icon: Banknote,
    schema: [{ kind: "paymentAccepted", value: "Cash" }],
  },
];

// ────────────────────────────────────────────────────────────────────────
// Registry — Еда
// ────────────────────────────────────────────────────────────────────────

const FOOD_TAGS: TagDefinition[] = [
  {
    id: "breakfast",
    category: "food",
    label: { ru: "Завтраки", en: "Breakfasts" },
    synonyms: ["завтраки", "завтрак", "breakfast", "breakfasts"],
    icon: Coffee,
    schema: [{ kind: "amenityFeature", name: "Breakfast" }],
  },
  {
    id: "brunch",
    category: "food",
    label: { ru: "Бранчи", en: "Brunch" },
    synonyms: ["бранчи", "бранч", "brunch"],
    icon: Coffee,
    schema: [{ kind: "amenityFeature", name: "Brunch" }],
  },
  {
    id: "desserts",
    category: "food",
    label: { ru: "Десерты", en: "Desserts" },
    synonyms: ["десерты", "десерт", "desserts", "dessert"],
    icon: Cookie,
    schema: [{ kind: "amenityFeature", name: "Desserts" }],
  },
  {
    id: "bakery",
    category: "food",
    label: { ru: "Выпечка", en: "Bakery" },
    synonyms: ["выпечка", "bakery", "pastries"],
    icon: Croissant,
    schema: [{ kind: "amenityFeature", name: "Bakery" }],
  },
  {
    id: "vegetarian_menu",
    category: "food",
    label: { ru: "Вегетарианское меню", en: "Vegetarian menu" },
    synonyms: ["вегетарианское меню", "вегетарианская еда", "vegetarian menu", "vegetarian"],
    icon: Salad,
    schema: [{ kind: "amenityFeature", name: "Vegetarian menu" }],
  },
  {
    id: "vegan_menu",
    category: "food",
    label: { ru: "Веганское меню", en: "Vegan menu" },
    synonyms: ["веганское меню", "веганская еда", "vegan menu", "vegan"],
    icon: Leaf,
    schema: [{ kind: "amenityFeature", name: "Vegan menu" }],
  },
  {
    id: "gluten_free_menu",
    category: "food",
    label: { ru: "Безглютеновое меню", en: "Gluten-free menu" },
    synonyms: ["безглютеновое меню", "без глютена", "gluten free menu", "gluten-free menu", "gluten free"],
    icon: WheatOff,
    schema: [{ kind: "amenityFeature", name: "Gluten-free menu" }],
  },
  {
    id: "signature_cuisine",
    category: "food",
    label: { ru: "Авторская кухня", en: "Signature cuisine" },
    synonyms: ["авторская кухня", "авторское меню", "signature cuisine", "chef's cuisine"],
    icon: ChefHat,
    schema: [{ kind: "amenityFeature", name: "Signature cuisine" }],
  },
  {
    id: "coffee_to_go",
    category: "food",
    label: { ru: "Кофе с собой", en: "Coffee to go" },
    synonyms: ["кофе с собой", "кофе на вынос", "coffee to go", "coffee to-go", "takeaway coffee"],
    icon: CupSoda,
    schema: [{ kind: "amenityFeature", name: "Coffee to go" }],
  },
];

// ────────────────────────────────────────────────────────────────────────
// Registry — Удобства
// ────────────────────────────────────────────────────────────────────────

const AMENITIES_TAGS: TagDefinition[] = [
  {
    id: "parking",
    category: "amenities",
    label: { ru: "Парковка", en: "Parking" },
    synonyms: ["парковка", "паркинг", "parking"],
    icon: ParkingCircle,
    schema: [{ kind: "amenityFeature", name: "Parking" }],
  },
  {
    id: "terrace",
    category: "amenities",
    label: { ru: "Терраса", en: "Terrace" },
    synonyms: ["терраса", "terrace"],
    icon: Trees,
    schema: [{ kind: "amenityFeature", name: "Terrace" }],
  },
  {
    id: "summer_terrace",
    category: "amenities",
    label: { ru: "Летняя терраса", en: "Summer terrace" },
    synonyms: ["летняя терраса", "summer terrace"],
    icon: Sun,
    schema: [{ kind: "amenityFeature", name: "Summer terrace" }],
  },
  {
    id: "air_conditioning",
    category: "amenities",
    label: { ru: "Кондиционер", en: "Air conditioning" },
    synonyms: ["кондиционер", "кондей", "air conditioning", "air conditioner", "ac"],
    icon: Wind,
    schema: [{ kind: "amenityFeature", name: "Air conditioning" }],
  },
  {
    id: "kids_zone",
    category: "amenities",
    label: { ru: "Детская зона", en: "Kids zone" },
    synonyms: ["детская зона", "детская площадка", "kids zone", "kids area"],
    icon: Baby,
    schema: [{ kind: "amenityFeature", name: "Kids zone" }],
  },
  {
    id: "high_chairs",
    category: "amenities",
    label: { ru: "Детские стульчики", en: "High chairs" },
    synonyms: ["детские стульчики", "детский стульчик", "high chairs", "high chair"],
    icon: Armchair,
    schema: [{ kind: "amenityFeature", name: "High chairs" }],
  },
  {
    id: "restroom",
    category: "amenities",
    label: { ru: "Туалет", en: "Restroom" },
    synonyms: ["туалет", "уборная", "wc", "restroom", "toilet", "bathroom"],
    icon: Bath,
    schema: [{ kind: "amenityFeature", name: "Restroom" }],
  },
  {
    id: "accessible_environment",
    category: "amenities",
    label: { ru: "Доступная среда", en: "Accessible environment" },
    synonyms: ["доступная среда", "безбарьерная среда", "accessible environment", "accessibility"],
    icon: Accessibility,
    schema: [{ kind: "amenityFeature", name: "Accessible environment" }],
  },
  {
    id: "wheelchair_accessible",
    category: "amenities",
    label: { ru: "Для колясок", en: "Wheelchair / stroller accessible" },
    synonyms: ["для колясок", "коляскам вход", "пандус", "wheelchair accessible", "stroller accessible", "wheelchair friendly"],
    icon: Accessibility,
    schema: [{ kind: "amenityFeature", name: "Wheelchair accessible" }],
  },
];

// ────────────────────────────────────────────────────────────────────────
// Registry — Сервис
// ────────────────────────────────────────────────────────────────────────

const SERVICE_TAGS: TagDefinition[] = [
  {
    id: "delivery",
    category: "service",
    label: { ru: "Доставка", en: "Delivery" },
    synonyms: ["доставка", "delivery"],
    icon: Truck,
    schema: [{ kind: "amenityFeature", name: "Delivery" }],
  },
  {
    id: "takeaway",
    category: "service",
    label: { ru: "Самовывоз", en: "Takeaway" },
    synonyms: ["самовывоз", "навынос", "на вынос", "takeaway", "take away", "pickup"],
    icon: ShoppingBag,
    schema: [{ kind: "amenityFeature", name: "Takeaway" }],
  },
  {
    id: "reservation",
    category: "service",
    label: { ru: "Бронирование", en: "Reservation" },
    synonyms: ["бронирование", "бронь столика", "reservation", "booking", "book a table"],
    icon: CalendarCheck,
    schema: [{ kind: "amenityFeature", name: "Reservation" }],
  },
  {
    id: "online_order",
    category: "service",
    label: { ru: "Онлайн-заказ", en: "Online ordering" },
    synonyms: ["онлайн-заказ", "онлайн заказ", "заказ онлайн", "online order", "online ordering"],
    icon: Globe,
    schema: [{ kind: "amenityFeature", name: "Online ordering" }],
  },
  {
    id: "qr_menu",
    category: "service",
    label: { ru: "QR-меню", en: "QR menu" },
    synonyms: ["qr-меню", "qr меню", "меню по qr", "qr menu"],
    icon: QrCode,
    schema: [{ kind: "amenityFeature", name: "QR menu" }],
  },
];

// ────────────────────────────────────────────────────────────────────────
// Registry — Атмосфера
// ────────────────────────────────────────────────────────────────────────

const ATMOSPHERE_TAGS: TagDefinition[] = [
  {
    id: "cozy",
    category: "atmosphere",
    label: { ru: "Уютно", en: "Cozy" },
    synonyms: ["уютно", "уютная атмосфера", "cozy", "cosy"],
    icon: Heart,
    schema: [{ kind: "amenityFeature", name: "Cozy atmosphere" }],
  },
  {
    id: "quiet",
    category: "atmosphere",
    label: { ru: "Тихо", en: "Quiet" },
    synonyms: ["тихо", "тихое место", "quiet", "silent"],
    icon: VolumeX,
    schema: [{ kind: "amenityFeature", name: "Quiet" }],
  },
  {
    id: "romantic",
    category: "atmosphere",
    label: { ru: "Романтическая атмосфера", en: "Romantic atmosphere" },
    synonyms: ["романтическая атмосфера", "романтика", "romantic atmosphere", "romantic"],
    icon: HeartHandshake,
    schema: [{ kind: "amenityFeature", name: "Romantic atmosphere" }],
  },
  {
    id: "for_meetings",
    category: "atmosphere",
    label: { ru: "Для встреч", en: "Good for meetings" },
    synonyms: ["для встреч", "место встреч", "good for meetings", "for meetings"],
    icon: Users2,
    schema: [{ kind: "amenityFeature", name: "Good for meetings" }],
  },
  {
    id: "for_work",
    category: "atmosphere",
    label: { ru: "Для работы", en: "Good for work" },
    synonyms: ["для работы", "good for work", "for work"],
    icon: Laptop,
    schema: [{ kind: "amenityFeature", name: "Good for work" }],
  },
  {
    id: "for_study",
    category: "atmosphere",
    label: { ru: "Для учёбы", en: "Good for studying" },
    synonyms: ["для учебы", "для учёбы", "good for studying", "for study"],
    icon: BookOpen,
    schema: [{ kind: "amenityFeature", name: "Good for studying" }],
  },
  {
    id: "for_groups",
    category: "atmosphere",
    label: { ru: "Для компаний", en: "Good for groups" },
    synonyms: ["для компаний", "для большой компании", "good for groups", "for groups"],
    icon: PartyPopper,
    schema: [{ kind: "amenityFeature", name: "Good for groups" }],
  },
  {
    id: "family_friendly",
    category: "atmosphere",
    label: { ru: "Семейное место", en: "Family friendly" },
    synonyms: ["семейное место", "для всей семьи", "family friendly", "family-friendly"],
    icon: Home,
    schema: [{ kind: "amenityFeature", name: "Family friendly" }],
  },
];

// ────────────────────────────────────────────────────────────────────────
// Registry — Дополнительно
// ────────────────────────────────────────────────────────────────────────

const EXTRA_TAGS: TagDefinition[] = [
  {
    id: "pet_friendly",
    category: "extra",
    label: { ru: "Pet friendly", en: "Pet friendly" },
    synonyms: ["pet friendly", "pet-friendly", "можно с животными", "можно с питомцами", "с животными"],
    icon: PawPrint,
    schema: [{ kind: "amenityFeature", name: "Pet friendly" }],
  },
  {
    id: "smoking_area",
    category: "extra",
    label: { ru: "Smoking area", en: "Smoking area" },
    synonyms: ["smoking area", "зона для курения", "курительная зона", "можно курить"],
    icon: Cigarette,
    schema: [{ kind: "amenityFeature", name: "Smoking area" }],
  },
  {
    id: "non_smoking",
    category: "extra",
    label: { ru: "Non-smoking", en: "Non-smoking" },
    synonyms: ["non-smoking", "non smoking", "для некурящих", "не курить", "без курения"],
    icon: CigaretteOff,
    schema: [{ kind: "amenityFeature", name: "Non-smoking" }],
  },
  {
    id: "hours_24_7",
    category: "extra",
    label: { ru: "24/7", en: "24/7" },
    synonyms: ["24/7", "24 7", "круглосуточно", "24 часа", "24ч"],
    icon: Clock,
    // The only tag with a real, verifiable opening-hours claim.
    schema: [{ kind: "openingHours" }],
  },
  {
    id: "open_late",
    category: "extra",
    label: { ru: "Открыто допоздна", en: "Open late" },
    synonyms: ["открыто допоздна", "работает допоздна", "open late", "late night"],
    icon: Moon,
    schema: [{ kind: "amenityFeature", name: "Open late" }],
  },
  {
    id: "city_view",
    category: "extra",
    label: { ru: "Вид на город", en: "City view" },
    synonyms: ["вид на город", "city view", "view of the city"],
    icon: Building2,
    schema: [{ kind: "amenityFeature", name: "City view" }],
  },
  {
    id: "panoramic_windows",
    category: "extra",
    label: { ru: "Панорамные окна", en: "Panoramic windows" },
    synonyms: ["панорамные окна", "панорамное окно", "panoramic windows", "panoramic window"],
    icon: PanelTop,
    schema: [{ kind: "amenityFeature", name: "Panoramic windows" }],
  },
  {
    id: "live_music",
    category: "extra",
    label: { ru: "Живая музыка", en: "Live music" },
    synonyms: ["живая музыка", "live music", "live band"],
    icon: Music,
    schema: [{ kind: "amenityFeature", name: "Live music" }],
  },
  {
    id: "dj",
    category: "extra",
    label: { ru: "DJ", en: "DJ" },
    synonyms: ["dj", "диджей", "dj set"],
    icon: Disc,
    schema: [{ kind: "amenityFeature", name: "DJ" }],
  },
  {
    id: "board_games",
    category: "extra",
    label: { ru: "Настольные игры", en: "Board games" },
    synonyms: ["настольные игры", "настолки", "board games", "board game", "tabletop games"],
    icon: Gamepad,
    schema: [{ kind: "amenityFeature", name: "Board games" }],
  },
  {
    id: "device_charging",
    category: "extra",
    label: { ru: "Зарядки для устройств", en: "Device charging" },
    synonyms: ["зарядки для устройств", "зарядка для телефона", "device charging", "phone charging", "charging station"],
    icon: BatteryCharging,
    schema: [{ kind: "amenityFeature", name: "Device charging" }],
  },
];

// ────────────────────────────────────────────────────────────────────────
// Registry aggregate — the one place a new category needs to be listed
// ────────────────────────────────────────────────────────────────────────

export const TAG_CATEGORIES: TagCategoryMeta[] = [
  { id: "internet_work", label: { ru: "Интернет и работа", en: "Internet & Work" } },
  { id: "payment", label: { ru: "Оплата", en: "Payment" } },
  { id: "food", label: { ru: "Еда", en: "Food" } },
  { id: "amenities", label: { ru: "Удобства", en: "Amenities" } },
  { id: "service", label: { ru: "Сервис", en: "Service" } },
  { id: "atmosphere", label: { ru: "Атмосфера", en: "Atmosphere" } },
  { id: "extra", label: { ru: "Дополнительно", en: "Extra" } },
];

export const TAG_REGISTRY: TagDefinition[] = [
  ...INTERNET_WORK_TAGS,
  ...PAYMENT_TAGS,
  ...FOOD_TAGS,
  ...AMENITIES_TAGS,
  ...SERVICE_TAGS,
  ...ATMOSPHERE_TAGS,
  ...EXTRA_TAGS,
];

// ────────────────────────────────────────────────────────────────────────
// Matching engine — generic, never needs to change when tags are added
// ────────────────────────────────────────────────────────────────────────

function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s/-]/gu, "") // keep letters, numbers, spaces, "-", "/"
    .replace(/\s+/g, " ")
    .trim();
}

interface LookupEntry {
  normalizedSynonym: string;
  def: TagDefinition;
}

let lookupCache: LookupEntry[] | null = null;
let exactCache: Map<string, TagDefinition> | null = null;

function getLookup(): { exact: Map<string, TagDefinition>; bySize: LookupEntry[] } {
  if (lookupCache && exactCache) {
    return { exact: exactCache, bySize: lookupCache };
  }

  const exact = new Map<string, TagDefinition>();
  const entries: LookupEntry[] = [];

  for (const def of TAG_REGISTRY) {
    const allStrings = [def.id, def.label.ru, def.label.en, ...def.synonyms];
    for (const s of allStrings) {
      const normalized = normalizeText(s);
      if (!normalized) continue;
      if (!exact.has(normalized)) exact.set(normalized, def);
      entries.push({ normalizedSynonym: normalized, def });
    }
  }

  // Longest-first, so "бесплатный wifi" is preferred over the bare "wifi"
  // when a raw tag contains both.
  entries.sort((a, b) => b.normalizedSynonym.length - a.normalizedSynonym.length);

  exactCache = exact;
  lookupCache = entries;
  return { exact, bySize: entries };
}

function toNormalizedTag(def: TagDefinition, raw: string): NormalizedTag {
  return {
    id: def.id,
    category: def.category,
    label: def.label.ru,
    icon: def.icon,
    schema: def.schema,
    isUnknown: false,
    raw,
  };
}

function unknownTag(raw: string): NormalizedTag {
  return {
    id: `unknown:${normalizeText(raw) || raw}`,
    category: "extra",
    label: raw.trim(),
    icon: null,
    schema: [],
    isUnknown: true,
    raw,
  };
}

/**
 * Normalizes a single raw tag (from a vendor form, 2GIS scrape, or anywhere
 * else) into a canonical tag. Unmatched input is never dropped — it comes
 * back as an "unknown" tag so the original text is still visible/editable.
 */
export function normalizeTag(raw: string): NormalizedTag {
  const trimmed = raw.trim();
  if (!trimmed) return unknownTag(raw);

  const { exact, bySize } = getLookup();
  const normalized = normalizeText(trimmed);

  const exactHit = exact.get(normalized);
  if (exactHit) return toNormalizedTag(exactHit, raw);

  // Fallback: substring match, longest synonym first, so compound/free-form
  // input like "бесплатный WiFi 5GHz" still resolves to the right tag.
  for (const entry of bySize) {
    if (normalized.includes(entry.normalizedSynonym)) {
      return toNormalizedTag(entry.def, raw);
    }
  }

  return unknownTag(raw);
}

/**
 * Normalizes a list of raw tags and de-duplicates by canonical id (unknown
 * tags are de-duplicated by their raw text instead, since they have no
 * shared canonical identity).
 */
export function normalizeTags(raw: string[] | undefined | null): NormalizedTag[] {
  const seen = new Set<string>();
  const result: NormalizedTag[] = [];
  for (const r of raw ?? []) {
    const tag = normalizeTag(r);
    if (seen.has(tag.id)) continue;
    seen.add(tag.id);
    result.push(tag);
  }
  return result;
}

/** Exposed for tooling/tests that want to force a lookup rebuild. */
export function __resetTagLookupCache(): void {
  lookupCache = null;
  exactCache = null;
}

// ────────────────────────────────────────────────────────────────────────
// Schema.org / JSON-LD builders
// ────────────────────────────────────────────────────────────────────────

export interface LocationFeatureSpecification {
  "@type": "LocationFeatureSpecification";
  name: string;
  value: true;
}

export interface OpeningHoursSpecification {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string[];
  opens: string;
  closes: string;
}

export interface TagSchemaFragment {
  amenityFeature: LocationFeatureSpecification[];
  paymentAccepted?: string;
  openingHoursSpecification?: OpeningHoursSpecification;
}

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * Builds the Schema.org fragment for a set of normalized tags. This is a
 * *fragment* — merge it into the Place's full JSON-LD object (which also
 * carries @type, name, address, etc, generated elsewhere/server-side).
 * Unknown tags are skipped here (no schema mapping) but are still shown in
 * the UI via normalizeTags — nothing about them is discarded there.
 */
export function buildTagsSchemaFragment(tags: NormalizedTag[]): TagSchemaFragment {
  const amenityFeature: LocationFeatureSpecification[] = [];
  const paymentValues: string[] = [];
  let openingHoursSpecification: OpeningHoursSpecification | undefined;

  for (const tag of tags) {
    for (const mapping of tag.schema) {
      if (mapping.kind === "amenityFeature") {
        amenityFeature.push({ "@type": "LocationFeatureSpecification", name: mapping.name, value: true });
      } else if (mapping.kind === "paymentAccepted") {
        paymentValues.push(mapping.value);
      } else if (mapping.kind === "openingHours") {
        openingHoursSpecification = {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ALL_DAYS,
          opens: "00:00",
          closes: "23:59",
        };
      }
    }
  }

  return {
    amenityFeature,
    ...(paymentValues.length > 0 ? { paymentAccepted: paymentValues.join(", ") } : {}),
    ...(openingHoursSpecification ? { openingHoursSpecification } : {}),
  };
}

/**
 * Convenience helper: merges the tag schema fragment straight into an
 * existing partial JSON-LD object (e.g. one already containing
 * @context/@type/name/address from the rest of the Place).
 */
export function mergeTagsIntoJsonLd(
  base: Record<string, unknown>,
  tags: NormalizedTag[]
): Record<string, unknown> {
  const fragment = buildTagsSchemaFragment(tags);
  return {
    ...base,
    ...(fragment.amenityFeature.length > 0 ? { amenityFeature: fragment.amenityFeature } : {}),
    ...(fragment.paymentAccepted ? { paymentAccepted: fragment.paymentAccepted } : {}),
    ...(fragment.openingHoursSpecification
      ? { openingHoursSpecification: fragment.openingHoursSpecification }
      : {}),
  };
}
