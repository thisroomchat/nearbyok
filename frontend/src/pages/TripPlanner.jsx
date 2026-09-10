import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";
import { TripResult } from "@/components/TripResult";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getTripMeta, postTripPlan, saveTrip } from "@/lib/nbk";
import { MapPin, ArrowRight, Sparkles, Users, CalendarDays, Wallet, Loader2, Navigation } from "lucide-react";

const LOADING_MSGS = [
  "Mapping the best route & stops…",
  "Picking food spots, viewpoints & photo moments…",
  "Choosing songs for every stretch of the road…",
  "Balancing everything to your budget…",
  "Almost there — polishing your day-by-day plan…",
];

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function TripPlanner() {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState({
    origin: "", destination: "", transport: "car", country: "IN",
    days: 0, budget: "", travelers: 2, interests: [], pace: "balanced", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [result, setResult] = useState(null); // {id, plan}
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { getTripMeta().then(setMeta).catch(() => {}); }, []);
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING_MSGS.length), 3500);
    return () => clearInterval(t);
  }, [loading]);

  const country = useMemo(() => (meta?.countries || []).find((c) => c.key === form.country) || { symbol: "₹" }, [meta, form.country]);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleInterest = (k) =>
    setForm((f) => ({ ...f, interests: f.interests.includes(k) ? f.interests.filter((x) => x !== k) : [...f.interests, k] }));

  const generate = async (e) => {
    e?.preventDefault?.();
    if (!form.origin.trim() || !form.destination.trim()) {
      toast({ title: "Add a start and destination", variant: "destructive" });
      return;
    }
    setLoading(true); setResult(null); setSaved(false); setMsgIdx(0);
    try {
      const body = { ...form, days: Number(form.days) || 0, travelers: Number(form.travelers) || 1,
        budget: form.budget ? Number(form.budget) : null };
      const data = await postTripPlan(body);
      setResult({ id: data.id, plan: data.plan });
      setTimeout(() => document.getElementById("trip-result-anchor")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      toast({ title: "Could not generate plan", description: err?.response?.data?.detail || "Please try again in a moment.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    if (!user) {
      toast({ title: "Login to save", description: "Sign in with Google to keep your plans." });
      login(window.location.pathname);
      return;
    }
    setSaving(true);
    try { await saveTrip(result.id); setSaved(true); toast({ title: "Plan saved!" }); }
    catch { toast({ title: "Could not save", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const canonical = BACKEND_URL ? `${window.location.origin}/trip-planner` : undefined;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Seo
        title="AI Trip Planner — Full Itinerary with Budget, Stops, Songs & Photo Spots"
        description="Plan any road trip in seconds. Get a full day-by-day itinerary with stops, breakfast/lunch/dinner, budget breakdown, route map, and en-route songs, photo, video & reel spots — personalised to how you travel."
        canonical={canonical}
      />
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* intro */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1">
            <Sparkles className="w-3.5 h-3.5" /> AI Trip Planner
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-3">
            Tell us where — we&apos;ll plan every moment
          </h1>
          <p className="text-slate-500 mt-2 max-w-2xl mx-auto text-sm sm:text-base">
            Stops, meals, budget, route map — plus which <b>song</b> to play and where to shoot your <b>photo, video or reel</b> along the way. Even on non-stop trips.
          </p>
        </div>

        {/* form */}
        <form onSubmit={generate} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5" data-testid="trip-form">
          <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <Field label="From">
              <div className="relative">
                <MapPin className="w-4 h-4 text-green-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input data-testid="trip-origin" value={form.origin} onChange={(e) => set("origin")(e.target.value)}
                  placeholder="e.g. Chandigarh" className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none" />
              </div>
            </Field>
            <div className="hidden sm:flex items-center justify-center pb-2.5"><ArrowRight className="w-5 h-5 text-slate-300" /></div>
            <Field label="To">
              <div className="relative">
                <MapPin className="w-4 h-4 text-red-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input data-testid="trip-destination" value={form.destination} onChange={(e) => set("destination")(e.target.value)}
                  placeholder="e.g. Leh Ladakh" className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none" />
              </div>
            </Field>
          </div>

          {/* transport */}
          <Field label="How are you travelling?">
            <div className="flex flex-wrap gap-2" data-testid="transport-chips">
              {(meta?.transports || []).map((t) => (
                <button type="button" key={t.key} onClick={() => set("transport")(t.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold border transition-colors ${form.transport === t.key ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"}`}>
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
          </Field>

          {/* interests */}
          <Field label="What's your vibe? (pick what you love)">
            <div className="flex flex-wrap gap-2" data-testid="interest-chips">
              {(meta?.interests || []).map((it) => {
                const on = form.interests.includes(it.key);
                return (
                  <button type="button" key={it.key} onClick={() => toggleInterest(it.key)} title={it.hint}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${on ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
                    <span>{it.icon}</span> {it.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Country / audience">
              <select value={form.country} onChange={(e) => set("country")(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-orange-400">
                {(meta?.countries || []).map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Days (0 = auto)" icon={CalendarDays}>
              <input type="number" min="0" max="30" value={form.days} onChange={(e) => set("days")(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
            </Field>
            <Field label={`Budget (${country.symbol})`} icon={Wallet}>
              <input type="number" min="0" value={form.budget} onChange={(e) => set("budget")(e.target.value)}
                placeholder="optional" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
            </Field>
            <Field label="Travelers" icon={Users}>
              <input type="number" min="1" max="30" value={form.travelers} onChange={(e) => set("travelers")(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
            </Field>
          </div>

          <div className="grid sm:grid-cols-[auto_1fr] gap-3 items-end">
            <Field label="Pace">
              <div className="flex gap-2">
                {["relaxed", "balanced", "packed"].map((p) => (
                  <button type="button" key={p} onClick={() => set("pace")(p)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold border capitalize ${form.pace === p ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-600 border-slate-200"}`}>{p}</button>
                ))}
              </div>
            </Field>
            <Field label="Anything specific? (optional)">
              <input value={form.notes} onChange={(e) => set("notes")(e.target.value)}
                placeholder="e.g. only vegetarian food, love waterfalls, avoid night driving"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
            </Field>
          </div>

          <button type="submit" disabled={loading} data-testid="generate-btn"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base py-3.5 disabled:opacity-70 transition-colors">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Planning…</> : <><Sparkles className="w-5 h-5" /> Create my plan</>}
          </button>
        </form>

        {/* loading */}
        {loading && (
          <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
            <p className="text-slate-700 font-semibold mt-4">{LOADING_MSGS[msgIdx]}</p>
            <p className="text-xs text-slate-400 mt-1">This usually takes 20–40 seconds.</p>
          </div>
        )}

        {/* result */}
        <div id="trip-result-anchor" />
        {result && !loading && (
          <div className="mt-6">
            <TripResult plan={result.plan} planId={result.id} onSave={onSave} saving={saving} saved={saved} shareUrl={`${window.location.origin}/trip/p/${result.id}`} />
          </div>
        )}

        {/* popular routes */}
        {!result && !loading && meta?.popular_routes?.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2"><Navigation className="w-5 h-5 text-orange-500" /> Popular routes</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {meta.popular_routes.map((r) => (
                <Link key={r.slug} to={`/trip/${r.slug}`} data-testid={`popular-${r.slug}`}
                  className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <span className="text-green-600">{r.origin}</span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500" />
                    <span className="text-red-600">{r.destination}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 capitalize">{r.transport} · {r.days} day{r.days > 1 ? "s" : ""}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

const Field = ({ label, icon: Icon, children }) => (
  <label className="block">
    <span className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
      {Icon && <Icon className="w-3.5 h-3.5" />} {label}
    </span>
    {children}
  </label>
);
