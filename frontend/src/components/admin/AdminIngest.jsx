import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, RefreshCw, Square, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { adminIngestStatus, adminIngest, adminIngestCity, adminIngestAll, adminLatestJob, adminCancelJob } from "@/lib/nbk";

export const AdminIngest = () => {
  const [city, setCity] = useState("new-york");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState({});
  const [job, setJob] = useState(null);
  const [pages, setPages] = useState(1);

  const load = useCallback(() => adminIngestStatus(city).then(setData), [city]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    adminLatestJob().then(setJob);
    const t = setInterval(() => adminLatestJob().then((j) => { setJob(j); if (j?.status === "running") load(); }), 4000);
    return () => clearInterval(t);
  }, [load]);

  const run = async (key, fn, okMsg) => {
    setBusy((b) => ({ ...b, [key]: true }));
    try { const r = await fn(); toast.success(okMsg(r)); await load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Ingest failed"); }
    finally { setBusy((b) => ({ ...b, [key]: false })); }
  };

  const startAll = async () => {
    const j = await adminIngestAll(pages, true);
    setJob(j);
    toast.success(j.status === "running" ? "A job is already running" : "Started full ingestion in background");
  };

  const running = job?.status === "running" || job?.status === "queued";
  const pct = job?.total ? Math.round((job.done / job.total) * 100) : 0;

  return (
    <div className="space-y-6" data-testid="admin-ingest">
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h2 className="font-bold text-slate-900">Pull real businesses from Google Places</h2>
            <p className="text-xs text-slate-500 mt-0.5">Photos, reviews, exact location, phone & hours. Seed/mock data for that city+category is deleted once real data lands.</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs text-slate-500">Depth
              <select data-testid="ingest-pages-select" value={pages} onChange={(e) => setPages(+e.target.value)} className="ml-1 border border-slate-300 rounded-lg px-2 py-1.5 text-sm">
                <option value={1}>20 places</option><option value={2}>40 places</option><option value={3}>60 places</option>
              </select>
            </label>
            {running ? (
              <button data-testid="ingest-cancel-button" onClick={() => adminCancelJob().then(() => toast("Cancelling…"))} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"><Square className="w-4 h-4" /> Cancel</button>
            ) : (
              <button data-testid="ingest-all-button" onClick={startAll} className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"><Download className="w-4 h-4" /> Ingest ALL (remaining)</button>
            )}
          </div>
        </div>
        {job?.id && (
          <div className="mt-4" data-testid="ingest-job-progress">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span className="flex items-center gap-1">{running ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 text-green-600" />} Job {job.status} · {job.done}/{job.total} combos · {job.inserted} real businesses{job.current ? ` · now: ${job.current}` : ""}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-orange-500 transition-[width]" style={{ width: `${pct}%` }} /></div>
            {job.errors?.length > 0 && <p className="text-[11px] text-red-500 mt-1">{job.errors.length} errors · last: {job.errors[job.errors.length - 1]}</p>}
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <select data-testid="ingest-city-select" value={city} onChange={(e) => setCity(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold">
            {data?.cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}, {c.abbr}</option>)}
          </select>
          <button data-testid="ingest-city-button" disabled={busy.city} onClick={() => run("city", () => adminIngestCity(city, pages), (r) => `Ingested ${Object.values(r.results).filter((v) => typeof v === "number").reduce((a, b) => a + b, 0)} places for ${city}`)}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-60">
            {busy.city ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Ingest whole city
          </button>
          <button onClick={load} className="ml-auto text-slate-500 hover:text-slate-900"><RefreshCw className="w-4 h-4" /></button>
        </div>
        <table className="w-full text-sm" data-testid="ingest-matrix-table">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="text-left px-5 py-2">Category</th><th className="text-right px-2 py-2">Google</th><th className="text-right px-2 py-2">Seed</th><th className="text-right px-2 py-2">Owner</th><th className="text-left px-2 py-2">Last pull</th><th className="px-5 py-2"></th></tr></thead>
          <tbody>
            {data?.rows.map((r) => (
              <tr key={r.category} className="border-t border-slate-50" data-testid="ingest-row">
                <td className="px-5 py-2 font-semibold text-slate-800">{r.name}</td>
                <td className={`px-2 py-2 text-right font-bold ${r.google ? "text-green-600" : "text-slate-300"}`}>{r.google}</td>
                <td className="px-2 py-2 text-right text-slate-500">{r.seed}</td>
                <td className="px-2 py-2 text-right text-slate-500">{r.owner}</td>
                <td className="px-2 py-2 text-xs text-slate-400">{r.last_ingest ? new Date(r.last_ingest).toLocaleString() : "—"}</td>
                <td className="px-5 py-2 text-right">
                  <button data-testid={`ingest-btn-${r.category}`} disabled={busy[r.category]} onClick={() => run(r.category, () => adminIngest(r.category, city, pages), (x) => `Pulled ${x.inserted} ${r.name.toLowerCase()} for ${city}`)}
                    className="inline-flex items-center gap-1 border border-slate-300 hover:border-slate-900 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-60">
                    {busy[r.category] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} {r.google ? "Refresh" : "Ingest"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};
