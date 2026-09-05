import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2, Building2, Phone, Clock, FileText, Image as ImageIcon, ShieldCheck, Zap, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";
import { useAuth } from "@/context/AuthContext";
import { getCatalog, submitBusiness } from "@/lib/nbk";
import { MediaUploader } from "@/components/MediaUploader";

const HOURS = Array.from({ length: 24 }, (_, h) => [h, `${h % 12 || 12}:00 ${h < 12 ? "AM" : "PM"}`]);
const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white";
const Field = ({ label, children, hint }) => (
  <label className="block"><span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</span>{children}{hint && <span className="text-[11px] text-slate-400 block mt-1">{hint}</span>}</label>
);
const Section = ({ icon: Icon, title, children }) => (
  <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Icon className="w-5 h-5 text-orange-500" /> {title}</h2>
    <div className="grid sm:grid-cols-2 gap-4">{children}</div>
  </section>
);

const init = { name: "", category: "", city: "", area: "", address: "", phone: "", website: "", description: "", services: [], open_hour: 9, close_hour: 18, closed_sunday: false, is_24_7: false, images: [], media: [] };

export default function ListBusiness() {
  const { user, loading, login } = useAuth();
  const [cat, setCat] = useState(null);
  const [f, setF] = useState(init);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => { getCatalog().then(setCat); }, []);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e }));
  const selCat = useMemo(() => cat?.categories.find((c) => c.slug === f.category), [cat, f.category]);
  const selCity = useMemo(() => cat?.cities.find((c) => c.slug === f.city), [cat, f.city]);
  const toggleService = (s) => setF((st) => ({ ...st, services: st.services.includes(s) ? st.services.filter((x) => x !== s) : [...st.services, s] }));

  const submit = async (e) => {
    e.preventDefault();
    if (!user) { login("/list-your-business"); return; }
    setBusy(true);
    try {
      const r = await submitBusiness({ ...f, open_hour: +f.open_hour, close_hour: +f.close_hour, images: [], media: f.media });
      setDone(r);
      window.scrollTo(0, 0);
    } catch (err) {
      const d = err?.response?.data?.detail;
      toast.error(Array.isArray(d) ? `${d[0].loc?.slice(-1)[0]}: ${d[0].msg}` : d || "Submission failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Seo title="List Your Business Free — nearbyok.com" description="Add your business to nearbyok.com for free. Get found by local customers, receive calls and enquiries. Live in minutes." canonical="https://nearbyok.com/list-your-business" />
      <Header />
      <section className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid md:grid-cols-[1fr_320px] gap-8 items-center">
          <div>
            <p className="text-orange-400 font-semibold text-sm uppercase tracking-wider">Free forever · Live in minutes</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mt-2">List your business on nearbyok</h1>
            <p className="text-slate-300 mt-3 max-w-xl">Reach customers searching for {selCat ? selCat.name.toLowerCase() : "local services"} in {selCity?.name || "your city"}. Your page goes live instantly with a phone button, map, hours and your own SEO-optimised URL.</p>
          </div>
          <ul className="space-y-3 text-sm">
            {[[Zap, "Instant publish — no waiting"], [Phone, "Direct call, WhatsApp & enquiry buttons"], [ShieldCheck, "Free 'Verified' badge after quick review"], [BadgeCheck, "Own Google-style page with map & hours"]].map(([Icon, t]) => (
              <li key={t} className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-3"><Icon className="w-4 h-4 text-orange-400 shrink-0" /> {t}</li>
            ))}
          </ul>
        </div>
      </section>

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 w-full py-8">
        {done ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-xl mx-auto" data-testid="listing-success">
            <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto" />
            <h2 className="text-2xl font-extrabold text-slate-900 mt-4">Your business is live!</h2>
            <p className="text-sm text-slate-500 mt-2">It's already visible to customers with an "Unverified" tag. Our team verifies new listings within 24–48 hours, after which you get the blue Verified badge.</p>
            <div className="flex flex-wrap gap-3 justify-center mt-6">
              <Link data-testid="listing-success-view-link" to={`/${done.category}/${done.state}/${done.city}/${done.slug}`} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-lg transition-colors">View my page</Link>
              <Link to="/account?tab=listings" className="border border-slate-300 hover:border-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors">My Listings</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-6" data-testid="list-business-form">
            <Section icon={Building2} title="Business details">
              <Field label="Business name"><input data-testid="lb-name" required value={f.name} onChange={set("name")} placeholder="e.g. Joe's Plumbing" className={inputCls} /></Field>
              <Field label="Category">
                <select data-testid="lb-category" required value={f.category} onChange={set("category")} className={inputCls}>
                  <option value="">Select category…</option>
                  {cat?.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="City">
                <select data-testid="lb-city" required value={f.city} onChange={(e) => setF((s) => ({ ...s, city: e.target.value, area: "" }))} className={inputCls}>
                  <option value="">Select city…</option>
                  {cat?.cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}, {c.abbr}</option>)}
                </select>
              </Field>
              <Field label="Area / Neighbourhood">
                <input data-testid="lb-area" required list="areas" value={f.area} onChange={set("area")} placeholder={selCity ? `e.g. ${selCity.areas[0]}` : "Select a city first"} className={inputCls} />
                <datalist id="areas">{selCity?.areas.map((a) => <option key={a} value={a} />)}</datalist>
              </Field>
              <div className="sm:col-span-2"><Field label="Full street address" hint="We geocode this to place your pin on the map accurately."><input data-testid="lb-address" required value={f.address} onChange={set("address")} placeholder="123 Main St, Suite 4" className={inputCls} /></Field></div>
            </Section>

            <Section icon={Phone} title="Contact">
              <Field label="Phone number"><input data-testid="lb-phone" required value={f.phone} onChange={set("phone")} placeholder="+1 (555) 123-4567" className={inputCls} /></Field>
              <Field label="Website (optional)"><input data-testid="lb-website" value={f.website} onChange={set("website")} placeholder="https://" className={inputCls} /></Field>
            </Section>

            <Section icon={Clock} title="Opening hours">
              <Field label="Opens at"><select data-testid="lb-open" disabled={f.is_24_7} value={f.open_hour} onChange={set("open_hour")} className={inputCls}>{HOURS.map(([h, l]) => <option key={h} value={h}>{l}</option>)}</select></Field>
              <Field label="Closes at"><select data-testid="lb-close" disabled={f.is_24_7} value={f.close_hour} onChange={set("close_hour")} className={inputCls}>{HOURS.slice(1).map(([h, l]) => <option key={h} value={h}>{l}</option>)}<option value={24}>Midnight</option></select></Field>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" data-testid="lb-247" checked={f.is_24_7} onChange={set("is_24_7")} className="accent-orange-600 w-4 h-4" /> Open 24 hours</label>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" data-testid="lb-closed-sunday" checked={f.closed_sunday} onChange={set("closed_sunday")} className="accent-orange-600 w-4 h-4" /> Closed on Sunday</label>
            </Section>

            <Section icon={FileText} title="About & services">
              <div className="sm:col-span-2"><Field label="Description" hint="Tell customers what makes you great. This becomes your page's SEO description."><textarea data-testid="lb-description" rows={4} value={f.description} onChange={set("description")} placeholder="Family-owned since 2009, we offer…" className={inputCls} /></Field></div>
              <div className="sm:col-span-2">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Services offered</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(selCat?.services || []).map((s) => (
                    <button type="button" key={s} data-testid="lb-service-chip" onClick={() => toggleService(s)} className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${f.services.includes(s) ? "bg-orange-600 border-orange-600 text-white" : "border-slate-300 text-slate-600 hover:border-slate-900"}`}>{s}</button>
                  ))}
                  {!selCat && <span className="text-xs text-slate-400">Pick a category to see service options.</span>}
                </div>
              </div>
            </Section>

            <Section icon={ImageIcon} title="Photos & videos (optional)">
              <div className="sm:col-span-2">
                {user ? (
                  <MediaUploader value={f.media} onChange={(m) => setF((s) => ({ ...s, media: m }))} purpose="listing" max={12} label="Upload from your phone gallery or camera — first photo becomes the cover" testId="lb-media-uploader" />
                ) : (
                  <p className="text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-lg p-4">Sign in with Google (one click, below) to upload photos & videos from your phone.</p>
                )}
              </div>
            </Section>

            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500">{user ? <>Publishing as <b>{user.name}</b> ({user.email})</> : "You'll sign in with Google in one click before publishing."}</p>
              <button type="submit" disabled={busy || loading} data-testid="lb-submit" className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-3 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-60 shrink-0">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} {user ? "Publish listing" : "Continue with Google & publish"}
              </button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
