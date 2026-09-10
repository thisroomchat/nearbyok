import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { ChevronRight, SlidersHorizontal, Star, Map as MapIcon, List } from "lucide-react";
import { getListing } from "@/lib/nbk";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";
import { BusinessCard } from "@/components/BusinessCard";
import { MapView } from "@/components/MapView";
import { useCountry } from "@/context/CountryContext";

const Crumb = ({ items }) => (
  <nav className="py-3 px-4 sm:px-6 bg-slate-100 text-xs text-slate-600 border-b border-slate-200 overflow-x-auto whitespace-nowrap">
    <div className="max-w-7xl mx-auto flex items-center gap-1">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3 h-3 text-slate-400" />}
          {it.to ? <Link to={it.to} className="hover:text-blue-600 transition-colors">{it.label}</Link> : <span className="text-slate-800 font-medium">{it.label}</span>}
        </span>
      ))}
    </div>
  </nav>
);

const SeoLinks = ({ title, children, testid }) => (
  <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
    <h2 className="text-lg font-bold text-slate-900 mb-4">{title}</h2>
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm" data-testid={testid}>{children}</div>
  </section>
);

export default function Listing() {
  const { category, state, city } = useParams();
  const { prefix, cfg } = useCountry();
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [mobileMap, setMobileMap] = useState(false);

  const minRating = sp.get("min_rating") || "0";
  const openNow = sp.get("open_now") === "1";
  const sort = sp.get("sort") || "recommended";

  const load = useCallback(() => {
    setLoading(true);
    getListing(category, state, city, {
      min_rating: minRating, open_now: openNow ? true : undefined, sort,
    }).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [category, state, city, minRating, openNow, sort]);

  useEffect(() => { load(); window.scrollTo(0, 0); }, [load]);
  // lazy Google ingest kicked off in background -> pull fresh data once it lands
  useEffect(() => {
    if (!data?.meta?.refreshing) return;
    const t = setTimeout(load, 12000);
    return () => clearTimeout(t);
  }, [data?.meta?.refreshing, load]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v === null || v === "" || v === "0" || v === false) next.delete(k);
    else next.set(k, v);
    setSp(next);
  };

  if (!data && loading) return <div className="min-h-screen bg-slate-50"><Header /><div className="p-10 text-center text-slate-400">Loading listings…</div></div>;
  if (!data) return <div className="min-h-screen bg-slate-50"><Header /><div className="p-10 text-center text-slate-500">Page not found.</div></div>;

  const { meta, businesses, seo, count } = data;
  const canonical = `https://nearbyok.com${prefix}/${category}/${state}/${city}`;

  const jsonLd = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `https://nearbyok.com${prefix}/` },
      { "@type": "ListItem", position: 2, name: meta.state_name, item: `https://nearbyok.com${prefix}/${category}/${state}` },
      { "@type": "ListItem", position: 3, name: meta.city_name, item: canonical },
      { "@type": "ListItem", position: 4, name: meta.category_name, item: canonical },
    ]},
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: seo.faqs.map((f) => ({
      "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    { "@context": "https://schema.org", "@type": "ItemList", itemListElement: businesses.slice(0, 10).map((b, i) => ({
      "@type": "ListItem", position: i + 1, name: b.name })) },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Seo
        title={`Best ${meta.category_name} in ${meta.city_name}, ${meta.abbr} — ${count} Listings | nearbyok.com`}
        description={seo.description.slice(0, 320)}
        canonical={canonical}
        jsonLd={jsonLd}
      />
      <Header />
      <Crumb items={[
        { label: "Home", to: `${prefix}/` },
        { label: meta.state_name },
        { label: meta.city_name },
        { label: meta.category_name },
      ]} />

      {/* Title band */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {meta.category_name} in {meta.city_name}, {meta.abbr}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{count} {meta.category_name.toLowerCase()} found · sorted by {sort}
            {meta.refreshing && <span data-testid="listing-refreshing-badge" className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> Fetching live Google listings…</span>}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700"><SlidersHorizontal className="w-4 h-4" /> Filters</span>
          <select data-testid="filter-rating-select" value={minRating} onChange={(e) => setParam("min_rating", e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500">
            <option value="0">Any Rating</option>
            <option value="3.5">3.5+ ★</option>
            <option value="4">4.0+ ★</option>
            <option value="4.5">4.5+ ★</option>
          </select>
          <label data-testid="filter-open-now-checkbox" className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer select-none">
            <input type="checkbox" checked={openNow} onChange={(e) => setParam("open_now", e.target.checked ? "1" : null)} className="accent-orange-600 w-4 h-4" />
            Open Now
          </label>
          <select data-testid="filter-sort-select" value={sort} onChange={(e) => setParam("sort", e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 ml-auto">
            <option value="recommended">Recommended</option>
            <option value="rating">Highest Rated</option>
            <option value="reviews">Most Reviewed</option>
          </select>
          <button data-testid="mobile-map-toggle" onClick={() => setMobileMap((v) => !v)}
            className="lg:hidden flex items-center gap-1.5 text-sm font-semibold border border-slate-300 rounded-lg px-3 py-1.5">
            {mobileMap ? <><List className="w-4 h-4" /> List</> : <><MapIcon className="w-4 h-4" /> Map</>}
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 w-full py-6">
        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Listings */}
          <div className={`space-y-4 ${mobileMap ? "hidden lg:block" : ""}`} data-testid="listing-feed">
            {businesses.length === 0 && <p className="text-slate-500 py-10 text-center">No businesses match your filters.</p>}
            {businesses.map((b) => <BusinessCard key={b.id} b={b} state={state} onHover={setActive} />)}
          </div>

          {/* Map */}
          <div className={`lg:block ${mobileMap ? "block" : "hidden"}`}>
            <div className="lg:sticky lg:top-36">
              <MapView center={data.center} markers={businesses} activeId={active} height={mobileMap ? 500 : 560} />
            </div>
          </div>
        </div>

        {/* SEO content */}
        <div className="mt-10 space-y-6">
          <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">About {meta.category_name} in {meta.city_name}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{seo.description}</p>
          </section>

          <SeoLinks title={`People search for`} testid="searched-for-list">
            {seo.searched_for.map((t) => (
              <span key={t} data-testid="searched-for-chip-link" className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-800 transition-colors cursor-pointer">{t}</span>
            ))}
          </SeoLinks>

          {/* FAQ */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <FaqAccordion faqs={seo.faqs} />
          </section>

          <SeoLinks title={`Related Searches`} testid="related-searches-list">
            {seo.related_searches.map((t) => (
              <a key={t} data-testid="related-search-link" href="#" className="text-slate-500 hover:text-blue-600 transition-colors border-r border-slate-200 pr-4 last:border-0">{t}</a>
            ))}
          </SeoLinks>

          <SeoLinks title={`${meta.category_name} in nearby areas`}>
            {seo.nearby_areas.map((a) => (
              <span key={a.area} className="text-slate-500 hover:text-blue-600 transition-colors border-r border-slate-200 pr-4 last:border-0 cursor-pointer">{meta.category_name} in {a.area}</span>
            ))}
          </SeoLinks>

          <SeoLinks title={`${meta.category_name} in nearby cities`}>
            {seo.nearby_cities.map((c) => (
              <Link key={c.slug} to={`${prefix}/${category}/${c.state}/${c.slug}`} className="text-slate-500 hover:text-blue-600 transition-colors border-r border-slate-200 pr-4 last:border-0">{meta.category_name} in {c.name}</Link>
            ))}
          </SeoLinks>

          <SeoLinks title={`${meta.category_name} in popular ${cfg.short} cities`} testid="popular-cities-list">
            {seo.popular_cities.map((c) => (
              <Link key={c.slug} data-testid="popular-cities-matrix-link" to={`${prefix}/${category}/${c.state}/${c.slug}`} className="text-slate-500 hover:text-blue-600 transition-colors border-r border-slate-200 pr-4 last:border-0">{meta.category_name} in {c.name}</Link>
            ))}
          </SeoLinks>

          <SeoLinks title="Explore other categories">
            {seo.similar_categories.map((c) => (
              <Link key={c.slug} to={`${prefix}/${c.slug}/${state}/${city}`} className="text-slate-500 hover:text-blue-600 transition-colors border-r border-slate-200 pr-4 last:border-0">{c.name} in {meta.city_name}</Link>
            ))}
          </SeoLinks>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function FaqAccordion({ faqs }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y divide-slate-100">
      {faqs.map((f, i) => (
        <div key={i} data-testid="faq-accordion-item" className="py-3">
          <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between text-left gap-4">
            <span className="font-semibold text-slate-800 text-sm">{i + 1}. {f.q}</span>
            <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open === i ? "rotate-90" : ""}`} />
          </button>
          {open === i && <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.a}</p>}
        </div>
      ))}
    </div>
  );
}
