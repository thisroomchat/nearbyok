import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { Search, MapPin, ArrowRight, TrendingUp, Phone, Building2 } from "lucide-react";
import { getHome, doSearch } from "@/lib/nbk";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";

const iconMap = (name) => Icons[name?.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("")] || Building2;

export default function Home() {
  const [data, setData] = useState(null);
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const navigate = useNavigate();

  useEffect(() => { getHome().then(setData); }, []);

  const submit = async (e) => {
    e.preventDefault();
    const res = await doSearch(what, where);
    navigate(`/${res.category}/${res.state}/${res.city}`);
  };

  const quickTo = (cat) => navigate(`/${cat}/${data.cities[0].state}/${data.cities[0].slug}`);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Seo
        title="nearbyok.com — Find Local Businesses & Services Near You in US Cities"
        description="Discover top-rated plumbers, electricians, dentists, restaurants, coffee shops and more across US cities. Verified numbers, ratings, reviews, hours and directions."
        canonical="https://nearbyok.com/"
        jsonLd={{
          "@context": "https://schema.org", "@type": "WebSite", name: "nearbyok.com",
          url: "https://nearbyok.com/",
          potentialAction: { "@type": "SearchAction", target: "https://nearbyok.com/search?q={query}", "query-input": "required name=query" },
        }}
      />
      <Header compact />

      {/* Hero */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${data?.cities?.[0]?.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-slate-900/70" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl">
            Find <span className="text-orange-500">local businesses</span> & services near you
          </h1>
          <p className="mt-4 text-slate-300 text-base sm:text-lg max-w-xl">
            {data ? `${data.stats.businesses.toLocaleString()} listings` : "Thousands of listings"} across {data?.stats.cities || 12}+ US cities — verified numbers, real ratings & directions.
          </p>

          <form onSubmit={submit} className="mt-8 flex flex-col sm:flex-row bg-white rounded-xl p-2 shadow-2xl max-w-3xl gap-2">
            <div className="flex items-center flex-1 px-3 sm:border-r border-slate-200">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input data-testid="hero-search-what" value={what} onChange={(e) => setWhat(e.target.value)}
                placeholder="What are you looking for?" className="w-full px-3 py-3 text-slate-900 placeholder:text-slate-400 outline-none" />
            </div>
            <div className="flex items-center flex-1 px-3">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
              <input data-testid="hero-search-where" value={where} onChange={(e) => setWhere(e.target.value)}
                placeholder="City, State or Zip" className="w-full px-3 py-3 text-slate-900 placeholder:text-slate-400 outline-none" />
            </div>
            <button data-testid="hero-search-submit" type="submit"
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <Search className="w-5 h-5" /> Search
            </button>
          </form>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        {/* Categories */}
        <section className="py-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-6">Popular Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {data?.categories.map((c) => {
              const Icon = iconMap(c.icon);
              return (
                <button key={c.slug} data-testid={`home-category-${c.slug}`} onClick={() => quickTo(c.slug)}
                  className="group bg-white border border-slate-200 hover:border-orange-500 rounded-xl p-4 flex flex-col items-center gap-3 text-center shadow-sm hover:shadow-md transition-[box-shadow,border-color]">
                  <div className="w-12 h-12 rounded-full bg-orange-50 group-hover:bg-orange-100 flex items-center justify-center transition-colors">
                    <Icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{c.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Cities */}
        <section className="py-4 pb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-6">Explore Top US Cities</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {data?.cities.map((c) => (
              <Link key={c.slug} data-testid={`home-city-${c.slug}`} to={`/restaurants/${c.state}/${c.slug}`}
                className="group relative rounded-xl overflow-hidden h-36 shadow-sm">
                <img src={c.image} alt={c.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-slate-900/50 group-hover:bg-slate-900/40 transition-colors" />
                <div className="absolute bottom-0 p-4 text-white">
                  <p className="font-bold text-lg">{c.name}</p>
                  <p className="text-xs text-slate-200">{c.state_name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Matrix */}
        <section className="py-4 pb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">Browse the Directory</h2>
          <p className="text-slate-500 mb-6 text-sm">{data?.stats.pages.toLocaleString()} location pages and growing.</p>
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            {data?.categories.slice(0, 6).map((cat) => (
              <div key={cat.slug} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <span className="font-semibold text-slate-800 w-32 shrink-0">{cat.name}</span>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {data.cities.slice(0, 8).map((c) => (
                    <Link key={c.slug} to={`/${cat.slug}/${c.state}/${c.slug}`}
                      className="text-slate-500 hover:text-blue-600 transition-colors">
                      {cat.name} in {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Business owner banner */}
        <section id="free-listing" className="py-4 pb-16">
          <div className="bg-slate-900 rounded-2xl p-8 sm:p-12 text-white grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Own a local business?</h2>
              <p className="mt-3 text-slate-300">Get listed for free in minutes — your own SEO page with call, WhatsApp and enquiry buttons. Real customers, real calls, zero commission.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/list-your-business" data-testid="home-list-business-cta" className="bg-orange-600 hover:bg-orange-700 font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors">
                  List Your Business Free <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[[TrendingUp, `${data?.stats.pages || 0}+`, "SEO pages"], [Phone, "Free", "Direct calls, no commission"], [Building2, `${data?.stats.businesses || 0}`, "Businesses"]].map(([Icon, big, small], i) => (
                <div key={i} className="bg-white/10 rounded-xl p-4 text-center">
                  <Icon className="w-6 h-6 mx-auto text-orange-400" />
                  <p className="font-bold text-xl mt-2">{big}</p>
                  <p className="text-xs text-slate-300">{small}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
