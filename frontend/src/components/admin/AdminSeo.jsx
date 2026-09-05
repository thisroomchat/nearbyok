import { useEffect, useRef, useState } from "react";
import { Globe, Save, Loader2, Upload, Trash2, Plus, Image as ImageIcon, FileCode2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { adminGetSettings, adminPutSettings, adminUploadSiteImage, adminSeoList, adminSeoPut, adminSeoDelete, API } from "@/lib/nbk";

const inp = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white";
const F = ({ label, hint, children }) => <label className="block"><span className="text-xs font-semibold text-slate-600">{label}</span>{children}{hint && <span className="block text-[11px] text-slate-400 mt-0.5">{hint}</span>}</label>;

const ImageField = ({ label, value, onChange, hint, enabled, testId }) => {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const up = async (file) => {
    if (!file) return;
    setBusy(true);
    try { onChange(await adminUploadSiteImage(file)); toast.success("Uploaded"); } catch (err) { toast.error(err?.response?.data?.detail || "Upload failed — configure Cloudinary in Settings"); } finally { setBusy(false); }
  };
  return (
    <F label={label} hint={hint}>
      <div className="flex items-center gap-2">
        {value ? <img src={value} alt="" className="w-10 h-10 rounded border border-slate-200 object-contain bg-white" /> : <span className="w-10 h-10 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-300"><ImageIcon className="w-4 h-4" /></span>}
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload" className={inp} data-testid={testId} />
        <input ref={ref} type="file" accept="image/*,.ico" className="hidden" onChange={(e) => { up(e.target.files?.[0]); e.target.value = ""; }} />
        <button type="button" onClick={() => ref.current?.click()} disabled={busy || !enabled} title={enabled ? "Upload" : "Configure Cloudinary first"} className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold inline-flex items-center gap-1 disabled:opacity-40">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}</button>
      </div>
    </F>
  );
};

export const AdminSeo = () => {
  const [s, setS] = useState(null);
  const [site, setSite] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ovs, setOvs] = useState([]);
  const [ov, setOv] = useState({ path: "", title: "", description: "", keywords: "", og_image: "", canonical: "", noindex: false });

  useEffect(() => { adminGetSettings().then((d) => { setS(d); setSite(d.site); }); adminSeoList().then((r) => setOvs(r.items)); }, []);
  const set = (k) => (e) => setSite((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const d = await adminPutSettings({ site }); setS(d); setSite(d.site); toast.success("SEO settings saved — live immediately"); }
    catch (err) { toast.error(err?.response?.data?.detail || "Save failed"); } finally { setBusy(false); }
  };
  const saveOv = async (e) => {
    e.preventDefault();
    try { const r = await adminSeoPut(ov); setOvs((l) => [r, ...l.filter((x) => x.path !== r.path)]); setOv({ path: "", title: "", description: "", keywords: "", og_image: "", canonical: "", noindex: false }); toast.success(`Override saved for ${r.path}`); }
    catch (err) { toast.error(err?.response?.data?.detail?.[0]?.msg || "Save failed"); }
  };
  const delOv = async (path) => { await adminSeoDelete(path); setOvs((l) => l.filter((x) => x.path !== path)); };

  if (!site) return <p className="text-slate-400">Loading…</p>;
  const enabled = !!s?.media_enabled;
  return (
    <div className="space-y-6" data-testid="admin-seo">
      <form onSubmit={save} className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between"><h2 className="font-bold text-slate-900 flex items-center gap-2"><Globe className="w-5 h-5 text-orange-500" /> Global SEO & branding</h2>
          <div className="flex gap-3 text-xs"><a href={`${API}/sitemap.xml`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">sitemap.xml <ExternalLink className="w-3 h-3" /></a><a href={`${API}/robots.txt`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">robots.txt <ExternalLink className="w-3 h-3" /></a></div></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="Site name"><input value={site.name || ""} onChange={set("name")} className={inp} data-testid="seo-site-name" /></F>
          <F label="Canonical base URL" hint="Used in canonical/OG URLs, e.g. https://nearbyok.com"><input value={site.canonical_base || ""} onChange={set("canonical_base")} className={inp} /></F>
          <F label="Default meta description" hint="Fallback when a page has none (≤ 160 chars recommended)"><textarea rows={2} value={site.description || ""} onChange={set("description")} className={inp} data-testid="seo-description" /></F>
          <F label="Default keywords" hint="Comma separated"><textarea rows={2} value={site.keywords || ""} onChange={set("keywords")} className={inp} /></F>
          <ImageField label="Favicon" value={site.favicon_url || ""} onChange={set("favicon_url")} hint="PNG/ICO 32×32 or 180×180 — applied to browser tab & Apple touch icon" enabled={enabled} testId="seo-favicon" />
          <ImageField label="Default social share image (OG)" value={site.og_image_url || ""} onChange={set("og_image_url")} hint="1200×630 recommended" enabled={enabled} testId="seo-og-image" />
          <F label="Twitter / X handle"><input value={site.twitter || ""} onChange={set("twitter")} placeholder="@nearbyok" className={inp} /></F>
          <F label="Google Analytics ID" hint="G-XXXXXXX — gtag.js injected on every page"><input value={site.ga_id || ""} onChange={set("ga_id")} className={inp} data-testid="seo-ga" /></F>
          <F label="Google AdSense client" hint="ca-pub-XXXXXXXXXXXX — loads adsbygoogle.js"><input value={site.adsense_client || ""} onChange={set("adsense_client")} className={inp} /></F>
          <F label="Google Search Console verification" hint="Content of google-site-verification meta"><input value={site.google_verification || ""} onChange={set("google_verification")} className={inp} /></F>
          <F label="Bing verification (msvalidate.01)"><input value={site.bing_verification || ""} onChange={set("bing_verification")} className={inp} /></F>
          <F label="Extra robots.txt rules" hint="Appended to robots.txt, e.g. Disallow: /private"><textarea rows={2} value={site.robots_extra || ""} onChange={set("robots_extra")} className={`${inp} font-mono`} /></F>
        </div>
        <button disabled={busy} data-testid="seo-save-button" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-lg text-sm inline-flex items-center gap-2 disabled:opacity-60">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save SEO settings</button>
      </form>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        <form onSubmit={saveOv} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2"><FileCode2 className="w-5 h-5 text-orange-500" /> Per-page override</h2>
          <p className="text-xs text-slate-500">Override title/description for any URL path, e.g. <code>/</code>, <code>/plumbers/texas/austin</code>, <code>/nearby/coffee-nearby</code>.</p>
          <F label="Path"><input required value={ov.path} onChange={(e) => setOv({ ...ov, path: e.target.value })} placeholder="/plumbers/texas/austin" className={`${inp} font-mono`} data-testid="seo-ov-path" /></F>
          <F label="Title tag"><input value={ov.title} onChange={(e) => setOv({ ...ov, title: e.target.value })} className={inp} data-testid="seo-ov-title" /></F>
          <F label="Meta description"><textarea rows={3} value={ov.description} onChange={(e) => setOv({ ...ov, description: e.target.value })} className={inp} /></F>
          <F label="Keywords"><input value={ov.keywords} onChange={(e) => setOv({ ...ov, keywords: e.target.value })} className={inp} /></F>
          <F label="OG image URL"><input value={ov.og_image} onChange={(e) => setOv({ ...ov, og_image: e.target.value })} className={inp} /></F>
          <F label="Canonical URL"><input value={ov.canonical} onChange={(e) => setOv({ ...ov, canonical: e.target.value })} className={inp} /></F>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ov.noindex} onChange={(e) => setOv({ ...ov, noindex: e.target.checked })} /> noindex this page</label>
          <button data-testid="seo-ov-save" className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg text-sm inline-flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Save override</button>
        </form>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 font-bold text-slate-900">{ovs.length} overrides</div>
          <ul className="divide-y divide-slate-100 text-sm">
            {ovs.map((o) => (
              <li key={o.path} className="px-4 py-3 flex items-start gap-3" data-testid="seo-ov-row">
                <div className="flex-1 min-w-0"><p className="font-mono text-xs text-blue-700">{o.path} {o.noindex && <span className="bg-red-50 text-red-700 px-1 rounded">noindex</span>}</p><p className="font-semibold text-slate-900 truncate">{o.title || <span className="text-slate-400 font-normal">(title unchanged)</span>}</p><p className="text-xs text-slate-500 line-clamp-2">{o.description}</p></div>
                <button onClick={() => setOv({ path: o.path, title: o.title || "", description: o.description || "", keywords: o.keywords || "", og_image: o.og_image || "", canonical: o.canonical || "", noindex: !!o.noindex })} className="text-xs text-slate-500 hover:text-slate-900">Edit</button>
                <button onClick={() => delOv(o.path)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
            {!ovs.length && <li className="px-4 py-10 text-center text-slate-400">No overrides yet — pages use their generated SEO.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};
