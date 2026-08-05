import { Helmet } from "react-helmet-async";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import { Layout } from "../Layout";
import { useFilteredPlaces } from "../hooks/useFilteredPlaces";

const CATEGORY_LABELS: Record<string, string> = {
  cafe: "Кофейни",
  restaurant: "Рестораны",
  barbershop: "Барбершопы",
  sto: "Автосервисы",
  gym: "Спортзалы",
  other: "Другое",
};

export default function CityCategoryPage() {
  const { city, category } = useParams<{ city: string; category: string }>();
  const { places, loading, error } = useFilteredPlaces({ 
    city: city || null, 
    category: category || null 
  });
  const [searchParams] = useSearchParams();
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
  const perPage = 20;
  const totalPages = Math.ceil(places.length / perPage);
  const paginatedPlaces = places.slice((currentPage - 1) * perPage, currentPage * perPage);

  const cityDisplay = city ? city.charAt(0).toUpperCase() + city.slice(1) : "Город";
  const categoryLabel = CATEGORY_LABELS[category || ""] || category;
  const title = `${categoryLabel} в ${cityDisplay} | VIZIT AI`;
  const description = `Лучшие ${categoryLabel?.toLowerCase()} ${cityDisplay}: ${places.length} мест. Найдите идеальное место с VIZIT AI.`;
  const canonicalUrl = `https://vizit-ai.vercel.app/${encodeURIComponent(city || "")}/${encodeURIComponent(category || "")}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", url: "https://vizit-ai.vercel.app/" },
      { "@type": "ListItem", position: 2, name: cityDisplay, url: `https://vizit-ai.vercel.app/city/${city}` },
      { "@type": "ListItem", position: 3, name: categoryLabel, url: `${canonicalUrl}` },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbJsonLd)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `${categoryLabel} ${cityDisplay}`,
            numberOfItems: places.length,
            itemListElement: paginatedPlaces.map((place, idx) => ({
              "@type": "ListItem",
              position: (currentPage - 1) * perPage + idx + 1,
              url: `${canonicalUrl}/place/${place.slug}`,
              name: place.name,
            })),
          })}
        </script>
      </Helmet>

      <Layout>
        <div className="mx-auto max-w-3xl px-4 py-8">
          <nav className="mb-6 text-sm text-white/40">
            <Link to="/" className="hover:text-white/70">Главная</Link>
            <span className="mx-2">/</span>
            <Link to={`/city/${city}`} className="hover:text-white/70">{cityDisplay}</Link>
            <span className="mx-2">/</span>
            <span className="text-white/60">{categoryLabel}</span>
          </nav>

          <h1 className="mb-2 text-2xl font-semibold text-[#ececec]">{categoryLabel} в {cityDisplay}</h1>
          <p className="mb-6 text-sm text-white/50">{places.length} мест</p>

          {loading && (
            <p className="py-8 text-center text-sm text-white/40">Загрузка...</p>
          )}

          {error && (
            <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
              {error}
            </p>
          )}

          {!loading && !error && places.length === 0 && (
            <div className="py-8 text-center">
              <p className="mb-4 text-sm text-white/40">
                Пока нет заведений в категории «{categoryLabel}» в городе «{cityDisplay}».
              </p>
              <Link
                to="/vendor"
                className="inline-block rounded-lg border border-white/10 bg-[#2a2a2a] px-4 py-2 text-xs text-white/60 hover:bg-[#303030]"
              >
                Добавить своё заведение
              </Link>
            </div>
          )}

          {!loading && !error && places.length > 0 && (
            <>
              <div className="grid gap-3">
                {paginatedPlaces.map((place) => (
                  <Link
                    key={place.id}
                    to={`/place/${place.slug}`}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#2a2a2a] p-4 transition-colors hover:bg-[#303030]"
                  >
                    <span className="text-xl">{place.emoji || "📍"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-base font-medium text-[#ececec]">
                          {place.name}
                        </h2>
                        {place.is_verified && (
                          <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
                            проверено
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-white/50">
                        {[place.district, place.address].filter(Boolean).join(" · ")}
                      </p>
                      {place.rating && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-yellow-500">
                          <Star size={10} fill="currentColor" />
                          <span>{place.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  {currentPage > 1 && (
                    <Link
                      to={`?page=${currentPage - 1}`}
                      className="rounded-lg border border-white/10 bg-[#2a2a2a] px-3 py-2 text-xs text-white/60 hover:bg-[#303030]"
                    >
                      ← Назад
                    </Link>
                  )}
                  <span className="text-xs text-white/40">
                    Страница {currentPage} из {totalPages}
                  </span>
                  {currentPage < totalPages && (
                    <Link
                      to={`?page=${currentPage + 1}`}
                      className="rounded-lg border border-white/10 bg-[#2a2a2a] px-3 py-2 text-xs text-white/60 hover:bg-[#303030]"
                    >
                      Вперёд →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </>
  );
}
