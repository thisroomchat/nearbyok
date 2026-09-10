import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";
import { TripResult } from "@/components/TripResult";
import { getTripRoute } from "@/lib/nbk";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";

export default function TripRoute() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [nf, setNf] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setData(null); setNf(false); setLoading(true);
    getTripRoute(slug).then((d) => { setData(d); setLoading(false); })
      .catch(() => { setNf(true); setLoading(false); });
  }, [slug]);

  const plan = data?.plan;
  const route = data?.route;
  const title = plan?.title
    ? `${plan.origin} to ${plan.destination} Trip Plan, Itinerary & Budget`
    : "Trip Plan & Itinerary";
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/trip/${slug}` : undefined;

  const jsonLd = plan ? [
    {
      "@context": "https://schema.org", "@type": "TouristTrip",
      name: title, description: plan.summary,
      touristType: (route ? [route.transport] : undefined),
    },
    ...(plan.faqs?.length ? [{
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: plan.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    }] : []),
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trip Planner", item: `${canonical?.split("/trip/")[0]}/trip-planner` },
        { "@type": "ListItem", position: 2, name: title },
      ],
    },
  ] : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Seo
        title={title}
        description={plan?.summary || `Complete ${slug?.replace(/-/g, " ")} travel plan: day-by-day itinerary, stops, budget, route map, songs and photo spots.`}
        canonical={canonical}
        jsonLd={jsonLd}
      />
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <nav className="text-xs text-slate-500 mb-4 print:hidden">
          <Link to="/trip-planner" className="hover:text-orange-600">Trip Planner</Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-700 font-medium capitalize">{slug?.replace(/-/g, " ")}</span>
        </nav>

        {loading && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
            <p className="text-slate-600 mt-4 font-semibold">Preparing this itinerary…</p>
            <p className="text-xs text-slate-400 mt-1">First load can take up to 40 seconds.</p>
          </div>
        )}
        {nf && <div className="p-16 text-center text-slate-500">Route not found. <Link to="/trip-planner" className="text-orange-600 font-semibold">Plan your own →</Link></div>}

        {plan && !loading && (
          <>
            <TripResult plan={plan} shareUrl={canonical} />
            <div className="mt-8 rounded-2xl bg-slate-900 text-white p-6 text-center print:hidden">
              <Sparkles className="w-6 h-6 text-orange-400 mx-auto" />
              <h3 className="text-xl font-bold mt-2">Want it tailored to you?</h3>
              <p className="text-slate-300 text-sm mt-1">Set your budget, days & interests and get a personalised plan.</p>
              <Link to="/trip-planner" className="inline-flex items-center gap-2 mt-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-5 py-2.5">
                Plan my own trip <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
