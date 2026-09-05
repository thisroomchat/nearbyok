import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { TrendingUp, Navigation } from "lucide-react";
import { getNearbyIndex } from "@/lib/nbk";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";

const iconMap = (name) => Icons[name?.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("")] || Icons.Building2;

export default function NearbyHub() {
  const [data, setData] = useState(null);
  useEffect(() => { getNearbyIndex().then(setData).catch(() => setData({ groups: [], trending: [], total: 0 })); }, []);

  const jsonLd = data ? {
    "@context": "https://schema.org", "@type": "ItemList", name: "Nearby searches",
    itemListElement: data.groups.flatMap((g) => g.queries).slice(0, 50).map((q, i) => ({ "@type": "ListItem", position: i + 1, name: q.query, url: `https://nearbyok.com/nearby/${q.slug}` })),
  } : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Seo title="Nearby — what Americans search for near them | nearbyok.com" description="Coffee nearby, food nearby, gas nearby, pizza nearby and 50+ more of the most searched 'nearby' queries in the US — answered with real local businesses, phone numbers and hours." canonical="https://nearbyok.com/nearby" jsonLd={jsonLd} />
      <Header />
      <section className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <p className="text-orange-400 font-semibold text-sm uppercase tracking-wider flex items-center gap-2"><Navigation className="w-4 h-4" /> Powered by your location</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-2">Everything nearby, answered.</h1>
          <p className="text-slate-300 mt-3 max-w-2xl">The most searched "nearby" queries in the United States — each one a live page with the closest businesses, phone numbers, hours, photos and directions.</p>
          {data && <p className="text-slate-400 text-sm mt-4" data-testid="nearby-total">{data.total} nearby pages · {data.groups.length} categories</p>}
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 w-full py-10 space-y-10">
        {!data ? <p className="text-slate-400">Loading…</p> : (
          <>
            {data.trending.length > 0 && (
              <section data-testid="nearby-trending">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-orange-500" /> Rising right now</h2>
                <div className="flex flex-wrap gap-2">
                  {data.trending.map((t) => (
                    <Link key={t.slug} to={`/nearby/${t.slug}`} className="bg-white border border-slate-200 hover:border-orange-500 rounded-full px-4 py-2 text-sm font-semibold text-slate-800 flex items-center gap-2 transition-colors">
                      {t.query} <span className="text-[11px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded">{t.change_pct >= 5000 ? "Breakout" : `+${t.change_pct.toLocaleString()}%`}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="nearby-groups">
              {data.groups.map((g) => {
                const Icon = iconMap(g.icon);
                return (
                  <div key={g.category} className="bg-white border border-slate-200 rounded-2xl overflow-hidden" data-testid="nearby-group">
                    <div className="h-28 relative">
                      <img src={g.image} alt={g.category_name} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                      <h3 className="absolute bottom-3 left-4 text-white font-bold flex items-center gap-2"><Icon className="w-5 h-5 text-orange-400" /> {g.category_name}</h3>
                    </div>
                    <ul className="p-4 space-y-1.5">
                      {g.queries.map((q) => (
                        <li key={q.slug}>
                          <Link to={`/nearby/${q.slug}`} data-testid="nearby-query-link" className="flex items-center justify-between text-sm text-slate-700 hover:text-blue-600 py-0.5">
                            <span className="capitalize">{q.query}</span>
                            {q.change_pct ? <span className="text-[11px] text-green-700">{q.change_pct >= 5000 ? "Breakout" : `+${q.change_pct.toLocaleString()}%`}</span> : q.interest ? <span className="text-[11px] text-slate-400">{q.interest}</span> : null}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
