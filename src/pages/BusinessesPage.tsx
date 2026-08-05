import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import { Layout } from "../Layout";
import { useFilteredPlaces } from "../hooks/useFilteredPlaces";
import { CATEGORIES } from "../constants";

type Status = "loading" | "ok" | "error";

export default function BusinessesPage() {
  const { places, loading, error } = useFilteredPlaces({});
  const [searchParams] = useSearchParams();
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
  const perPage = 20;
  const totalPages = Math.ceil(places.length / perPage);
  const paginatedPlaces = places.slice((currentPage - 1) * perPage, currentPage * perPage);

  const title = "Все заведения Астаны | VIZIT AI";
  const description = `Каталог заведений Астаны: ${places.length} мест — кафе, рестораны, барбершопы, автосервисы и другие. Найдите идеальное место с VIZIT AI.`;
  const canonicalUrl = `https://vizit-ai.vercel.app/businesses`;

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
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Заведения Астаны",
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
            <span className="text-white/60">Все заведения</span>
          </nav>

          <h1 className="mb-2 text-2xl font-semibold text-[#ececec]">Все заведения Астаны</h1>
          <p className="mb-6 text-sm text-white/50">{places.length} мест в каталоге</p>

          {loading && (
            <p className="py-8 text-center text-sm text-white/40">Загрузка...</p>
          )}

          {error && (
            <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
              {error}
            </p>
          )}

          {!loading && !error && places.length === 0 && (
            <p className="py-8 text-center text-sm text-white/40">
              Пока нет заведений в каталоге.
            </p>
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
                        {[place.category, place.district].filter(Boolean).join(" · ")}
                      </p>
                      {place.address && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-white/40">
                          <MapPin size={10} />
                          <span className="truncate">{place.address}</span>
                        </div>
                      )}
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
