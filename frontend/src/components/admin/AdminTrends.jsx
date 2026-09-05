import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Upload, Loader2, TrendingUp, Eye, EyeOff, Trash2, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";
import { adminTrends, adminTrendsUpload, adminTrendPatch, adminTrendDelete, adminTrendsBulk } from "@/lib/nbk";

export const AdminTrends = () => {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState("top");
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState(new Set());
  const [editing, setEditing] = useState(null);
  const fileRef = useRef(null);
  const load = () => adminTrends().then(setData).catch(() => toast.error("Failed to load trends"));
  useEffect(() => { load(); }, []);

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try { const r = await adminTrendsUpload(file, kind); toast.success(`Parsed ${r.parsed} queries — ${r.added} new, ${r.updated} updated`); load(); }
    catch (err) { toast.error(err?.response?.data?.detail || "Upload failed"); }
    finally { setBusy(false); }
  };
  const patch = async (t, body) => {
    try { const r = await adminTrendPatch(t.id, body); setData((d) => ({ ...d, items: d.items.map((x) => (x.id === t.id ? { ...x, ...r, category_name: d.categories.find((c) => c.slug === r.category)?.name } : x)) })); }
    catch (err) { toast.error(err?.response?.data?.detail || "Update failed"); }
  };
  const del = async (t) => { if (!window.confirm(`Delete "${t.query}"?`)) return; await adminTrendDelete(t.id); setData((d) => ({ ...d, items: d.items.filter((x) => x.id !== t.id) })); };
  const bulk = async (body) => { if (!sel.size) return; await adminTrendsBulk({ ids: [...sel], ...body }); setSel(new Set()); load(); toast.success("Updated"); };

  const items = (data?.items || []).filter((t) => filter === "all" || (filter === "live" && t.enabled) || (filter === "off" && !t.enabled) || (filter === "unmapped" && !t.category));
  const live = data?.items.filter((t) => t.enabled).length || 0;
  const pct = (v) => (v == null ? "—" : v >= 5000 ? "Breakout" : `${v > 0 ? "+" : ""}${v.toLocaleString()}%`);

  return (
    <div className="space-y-4" data-testid="admin-trends">
      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-bold text-slate-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-orange-500" /> Google Trends → “nearby” SEO pages</h2>
          <p className="text-sm text-slate-500 mt-1">Upload the <b>Top</b> and <b>Rising</b> query CSVs exported from Google Trends (US, “nearby”). Each query becomes a live page at <code>/nearby/&lt;query&gt;</code> mapped to a category, sorted by the visitor’s location. Queries with a clear local intent (“nearby”, “near me”, “open now”) and a matched category go live automatically; review the rest below.</p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="border border-slate-300 rounded-lg px-2.5 py-2 text-sm bg-white" data-testid="trends-kind"><option value="top">Top queries CSV</option><option value="rising">Rising queries CSV</option></select>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} data-testid="trends-file-input" />
            <button onClick={() => fileRef.current?.click()} disabled={busy} data-testid="trends-upload-button" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-60">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload CSV</button>
            <Link to="/nearby" target="_blank" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 ml-auto">View public /nearby hub <ExternalLink className="w-3.5 h-3.5" /></Link>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-3 gap-3 text-center">
          <div><p className="text-2xl font-extrabold text-slate-900" data-testid="trends-total">{data?.items.length || 0}</p><p className="text-[11px] text-slate-500 uppercase font-semibold">Queries</p></div>
          <div><p className="text-2xl font-extrabold text-green-600" data-testid="trends-live">{live}</p><p className="text-[11px] text-slate-500 uppercase font-semibold">Live pages</p></div>
          <div><p className="text-2xl font-extrabold text-amber-600">{data?.items.filter((t) => !t.category).length || 0}</p><p className="text-[11px] text-slate-500 uppercase font-semibold">Unmapped</p></div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {["all", "live", "off", "unmapped"].map((f) => <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize ${filter === f ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>{f}</button>)}
        {sel.size > 0 && <div className="ml-auto flex items-center gap-2 text-sm"><span className="text-slate-500">{sel.size} selected</span><button onClick={() => bulk({ enabled: true })} className="bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold">Enable</button><button onClick={() => bulk({ enabled: false })} className="bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg font-semibold">Disable</button>
          <select onChange={(e) => e.target.value && bulk({ category: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-1.5 bg-white"><option value="">Set category…</option>{data?.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase"><tr><th className="px-3 py-2"><input type="checkbox" onChange={(e) => setSel(e.target.checked ? new Set(items.map((t) => t.id)) : new Set())} checked={items.length > 0 && sel.size === items.length} /></th><th className="text-left px-2 py-2">Query</th><th className="text-right px-2 py-2">Interest</th><th className="text-right px-2 py-2">Rising</th><th className="text-left px-2 py-2">Category (page shows)</th><th className="text-right px-2 py-2">Views</th><th className="text-left px-2 py-2">Status</th><th className="px-3 py-2"></th></tr></thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className={`border-t border-slate-100 ${!t.category ? "bg-amber-50/40" : ""}`} data-testid="trend-row">
                <td className="px-3 py-2"><input type="checkbox" checked={sel.has(t.id)} onChange={(e) => setSel((s) => { const n = new Set(s); e.target.checked ? n.add(t.id) : n.delete(t.id); return n; })} /></td>
                <td className="px-2 py-2"><div className="font-semibold text-slate-900 capitalize">{t.query}</div><div className="text-[11px] text-slate-400">/nearby/{t.slug} {t.kinds?.map((k) => <span key={k} className="ml-1 uppercase bg-slate-100 px-1 rounded">{k}</span>)}</div></td>
                <td className="px-2 py-2 text-right">{t.top_interest ?? "—"}</td>
                <td className="px-2 py-2 text-right text-green-700 font-semibold">{pct(t.rising_change_pct)}</td>
                <td className="px-2 py-2"><select value={t.category || ""} onChange={(e) => patch(t, { category: e.target.value })} className="border border-slate-300 rounded px-1.5 py-1 text-xs bg-white max-w-[180px]" data-testid="trend-category"><option value="">— not mapped —</option>{data.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></td>
                <td className="px-2 py-2 text-right text-xs text-slate-500">{t.views || 0}</td>
                <td className="px-2 py-2"><button onClick={() => patch(t, { enabled: !t.enabled })} disabled={!t.category} data-testid="trend-toggle" className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded ${t.enabled ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"} disabled:opacity-40`}>{t.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} {t.enabled ? "Live" : "Off"}</button></td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  {t.enabled && <Link to={`/nearby/${t.slug}`} target="_blank" className="p-1 text-slate-400 hover:text-blue-600 inline-block" title="Open page"><ExternalLink className="w-4 h-4" /></Link>}
                  <button onClick={() => setEditing(t)} className="p-1 text-slate-400 hover:text-slate-900" title="Custom title / intro"><Save className="w-4 h-4" /></button>
                  <button onClick={() => del(t)} className="p-1 text-slate-400 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {data && !items.length && <tr><td colSpan={8} className="text-center text-slate-400 py-10">{data.items.length ? "Nothing in this filter." : "Upload your Google Trends CSV to get started."}</td></tr>}
          </tbody>
        </table>
      </div>
      {editing && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <form onSubmit={async (e) => { e.preventDefault(); await patch(editing, { title: e.target.title.value, intro: e.target.intro.value }); setEditing(null); toast.success("Saved"); }} className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-slate-900 capitalize">Customize: {editing.query}</h3>
            <label className="block"><span className="text-xs font-semibold text-slate-600">Page H1 / title (blank = auto)</span><input name="title" defaultValue={editing.title || ""} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></label>
            <label className="block"><span className="text-xs font-semibold text-slate-600">Intro paragraph (blank = auto-generated)</span><textarea name="intro" rows={5} defaultValue={editing.intro || ""} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></label>
            <button className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg text-sm">Save</button>
          </form>
        </div>
      )}
    </div>
  );
};
