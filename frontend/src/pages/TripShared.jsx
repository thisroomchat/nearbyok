import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";
import { TripResult } from "@/components/TripResult";
import { getTripPlanById } from "@/lib/nbk";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";

/** Public shareable page for a generated plan: /trip/p/:id */
export default function TripShared() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [nf, setNf] = useState(false);

  useEffect(() => {
    setData(null); setNf(false);
    getTripPlanById(id).then(setData).catch(() => setNf(true));
  }, [id]);

  const plan = data?.plan;
  const shareUrl = `${window.location.origin}/trip/p/${id}`;
  const title = plan ? `${plan.origin} to ${plan.destination} — Shared Trip Plan` : "Shared Trip Plan";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Seo title={title} description={plan?.summary} canonical={shareUrl} noindex />
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8" data-testid="trip-shared-page">
        <nav className="text-xs text-slate-500 mb-4 print:hidden">
          <Link to="/trip-planner" className="hover:text-orange-600">Trip Planner</Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-700 font-medium">Shared plan</span>
        </nav>
        {!data && !nf && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
            <p className="text-slate-600 mt-4 font-semibold">Loading plan…</p>
          </div>
        )}
        {nf && <div data-testid="trip-shared-notfound" className="p-16 text-center text-slate-500">This plan link is invalid or expired. <Link to="/trip-planner" className="text-orange-600 font-semibold">Plan your own →</Link></div>}
        {plan && (
          <>
            <TripResult plan={plan} shareUrl={shareUrl} />
            <div className="mt-8 rounded-2xl bg-slate-900 text-white p-6 text-center print:hidden">
              <Sparkles className="w-6 h-6 text-orange-400 mx-auto" />
              <h3 className="text-xl font-bold mt-2">Plan your own trip like this</h3>
              <p className="text-slate-300 text-sm mt-1">Stops, meals, budget, songs & photo spots — personalised in seconds.</p>
              <Link to="/trip-planner" data-testid="trip-shared-cta" className="inline-flex items-center gap-2 mt-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-5 py-2.5">
                Open Trip Planner <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
