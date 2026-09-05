import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as Icons from "lucide-react";
import { ChevronRight, LocateFixed, Loader2, MapPin, TrendingUp } from "lucide-react";
import { getNearbyPage } from "@/lib/nbk";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";
import { MapView } from "@/components/MapView";
import { BusinessCard } from "@/components/BusinessCard";

const iconMap = (name) => Icons[name?.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("")] || Icons.Building2;
const GEO_KEY = "nbk_geo";

export default function NearbyQuery() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [nf, setNf] = useState(false);
  const [geo, setGeo] = useState(() => { try { return JSON.parse(sessionStorage.getItem(GEO_KEY)) || null; } catch { return null; } });
  const [city, setCity] = useState("");
  const [locating, setLocating] = useState(false);
  const [geoErr, setGeoErr] = useState("");
  const [active, setActive] = useState(null);

  useEffect(() => {
    setNf(false);
    const params = city ? { city } : geo ? { lat: geo.lat, lng: geo.lng } : {};
    getNearbyPage(slug, params).then((d) => { setData(d); window.scrollTo(0, 0); }).catch(() => setNf(true));
  }, [slug, geo, city]);

  const locate = () => {
    if (!navigator.geolocation) { setGeoErr("Location not supported on this device"); return; }
    setLocating(true); setGeoErr("");
    navigator.geolocation.getCurrentPosition(
      (p) => { const g = { lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) }; sessionStorage.setItem(GEO_KEY, JSON.stringify(g)); setCity(""); setGeo(g); setLocating(false); },
      () => { setGeoErr("Location access denied — pick a city instead."); setLocating(false); },
      { timeout: 10000, maximumAge: 300000 },
    );
  };

  if (nf) return <div className="min-h-screen bg-slate-50"><Header /><div className="p-16 text-center text-slate-500">This nearby page doesn't exist. <Link to="/nearby" className="text-blue-600 underline">See all nearby pages</Link></div><Footer /></div>;
  if (!data) return <div className="min-h-screen bg-slate-50"><Header /><div className="p-16 text-center text-slate-400">Loading…</div></div>;

  const { category: cat, city: c } = data;
  const Icon = iconMap(cat.icon);
  const canonical = `https://nearbyok.com/nearby/${slug}`;
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "ItemList", name: data.title, numberOfItems: data.count,
      itemListElement: data.businesses.slice(0, 20).map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.name, url: `https://nearbyok.com/${b.category}/${b.state}/${b.city}/${b.slug}` })) },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: data.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://nearbyok.com/" },
      { "@type": "ListItem", position: 2, name: "Nearby", item: "https://nearbyok.com/nearby" },
      { "@type": "ListItem", position: 3, name: data.query, item: canonical } ] },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Seo title={`${data.title} in ${c.name}, ${c.abbr} (${data.count}) | nearbyok.com`} description={data.intro.slice(0, 300)} canonical={canonical} jsonLd={jsonLd} image={cat.image} />
      <Header />
      <nav className="py-3 px-4 sm:px-6 bg-slate-100 text-xs text-slate-600 border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center gap-1">
          <Link to="/" className="hover:text-blue-600">Home</Link><ChevronRight className="w-3 h-3 text-slate-400" />
          <Link to="/nearby" className="hover:text-blue-600">Nearby</Link><ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-800 font-medium capitalize">{data.query}</span>
        </div>
      </nav>

      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-orange-600"><Icon className="w-4 h-4" /> {cat.name}{data.change_pct ? <span className="ml-2 inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded normal-case tracking-normal"><TrendingUp className="w-3 h-3" /> {data.change_pct >= 5000 ? "Breakout search" : `+${data.change_pct.toLocaleString()}% this month`}</span> : null}</div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-2 capitalize" data-testid="nearby-title">{data.query}</h1>
            <p className="text-slate-600 mt-2 text-sm sm:text-base leading-relaxed">{data.intro}</p>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button onClick={locate} disabled={locating} data-testid="nearby-locate-button" className={`inline-flex items-center gap-2 font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors ${data.located ? "bg-green-600 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"}`}>
                {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />} {data.located ? "Using your location" : "Use my location"}
              </button>
              <span className="text-sm text-slate-500 inline-flex items-center gap-1"><MapPin className="w-4 h-4" /> Showing</span>
              <select data-testid="nearby-city-select" value={data.city.slug} onChange={(e) => { setCity(e.target.value); }} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                {data.cities.map((x) => <option key={x.slug} value={x.slug}>{x.name}, {x.abbr}</option>)}
              </select>
              {geoErr && <span className="text-xs text-red-500">{geoErr}</span>}
            </div>
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-200"><MapView center={data.center} markers={data.businesses.slice(0, 30)} height={220} activeId={active} /></div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 w-full py-8 grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-3" data-testid="nearby-results">
          <h2 className="text-lg font-bold text-slate-900">{data.count} {cat.name.toLowerCase()} {data.located ? "closest to you" : `in ${c.name}`}</h2>
          {data.businesses.length === 0 && <p className="text-slate-500 text-sm bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">No listings yet for this city. Try another city above.</p>}
          {data.businesses.map((b) => <BusinessCard key={b.id} b={b} state={b.state} onHover={setActive} />)}
          <Link to={`/${cat.slug}/${c.state}/${c.slug}`} data-testid="nearby-see-all-link" className="block text-center bg-white border border-slate-200 hover:border-slate-900 rounded-xl py-3 text-sm font-semibold text-slate-800">See all {cat.name} in {c.name} →</Link>

          <section className="bg-white border border-slate-200 rounded-xl p-5 mt-6">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Frequently asked questions</h2>
            <div className="divide-y divide-slate-100">
              {data.faqs.map((f, i) => (
                <details key={i} className="py-3 group" data-testid="nearby-faq">
                  <summary className="font-semibold text-sm text-slate-800 cursor-pointer list-none flex justify-between gap-4">{f.q}<ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform shrink-0" /></summary>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          {data.related.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-bold text-slate-900 mb-3">People also search</h3>
              <div className="flex flex-wrap gap-2">{data.related.map((r) => <Link key={r.slug} to={`/nearby/${r.slug}`} className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-800 capitalize">{r.query}</Link>)}</div>
            </div>
          )}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-bold text-slate-900 mb-3">Popular services</h3>
            <ul className="text-sm text-slate-600 space-y-1.5">{cat.services.map((s) => <li key={s} className="flex items-center gap-2"><Icons.CheckCircle2 className="w-4 h-4 text-green-600" /> {s}</li>)}</ul>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-bold text-slate-900 mb-3">Other nearby searches</h3>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-sm">{data.other_queries.map((r) => <Link key={r.slug} to={`/nearby/${r.slug}`} className="text-slate-500 hover:text-blue-600 capitalize">{r.query}</Link>)}</div>
          </div>
          <div className="border-2 border-dashed border-slate-300 bg-slate-100 rounded-xl h-60 flex items-center justify-center text-slate-400 text-sm">Advertisement</div>
        </aside>
      </main>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full pb-10">
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-lg font-bold text-slate-900 mb-3 capitalize">{data.query} in other US cities</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">{data.cities.map((x) => <button key={x.slug} onClick={() => setCity(x.slug)} className="text-slate-500 hover:text-blue-600 capitalize border-r border-slate-200 pr-4 last:border-0">{data.query} in {x.name}</button>)}</div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
