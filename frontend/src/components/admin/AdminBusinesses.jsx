import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, BadgeCheck, Star, Trash2, Pencil, ChevronLeft, ChevronRight, Save, X } from "lucide-react";
import { toast } from "sonner";
import { adminBusinesses, adminPatchBusiness, adminDeleteBusiness, getCatalog } from "@/lib/nbk";

const sel = "border border-slate-300 rounded-lg px-2.5 py-2 text-sm bg-white";
const STATUS_CLS = { approved: "bg-green-50 text-green-700", pending: "bg-amber-50 text-amber-700", rejected: "bg-red-50 text-red-700" };

const EditModal = ({ b, onClose, onSaved }) => {
  const [f, setF] = useState({ name: b.name, phone: b.phone || "", website: b.website || "", address: b.address || "", area: b.area || "", description: b.description || "" });
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const r = await adminPatchBusiness(b.id, f); toast.success("Saved"); onSaved(r); onClose(); }
    catch (err) { toast.error(err?.response?.data?.detail?.[0]?.msg || err?.response?.data?.detail || "Save failed"); }
    finally { setBusy(false); }
  };
  const field = (k, label, tag = "input") => (
    <label key={k} className="block"><span className="text-xs font-semibold text-slate-600">{label}</span>
      {tag === "textarea" ? <textarea rows={4} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        : <input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />}
    </label>
  );
  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={save} className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-3" onClick={(e) => e.stopPropagation()} data-testid="biz-edit-modal">
        <div className="flex justify-between items-center"><h3 className="font-bold text-slate-900">Edit business</h3><button type="button" onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button></div>
        {field("name", "Name")}<div className="grid grid-cols-2 gap-3">{field("phone", "Phone")}{field("website", "Website")}</div>
        {field("address", "Address")}{field("area", "Area / neighbourhood")}{field("description", "Description", "textarea")}
        <button disabled={busy} data-testid="biz-edit-save" className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Save</button>
      </form>
    </div>
  );
};

export const AdminBusinesses = () => {
  const [cat, setCat] = useState(null);
  const [p, setP] = useState({ q: "", category: "", city: "", source: "", status: "", flag: "", sort: "recent", page: 1, limit: 25 });
  const [data, setData] = useState(null);
  const [edit, setEdit] = useState(null);
  const [qInput, setQInput] = useState("");

  useEffect(() => { getCatalog().then(setCat); }, []);
  useEffect(() => { setData(null); adminBusinesses(p).then(setData).catch(() => toast.error("Failed to load")); }, [p]);
  useEffect(() => { const t = setTimeout(() => setP((s) => ({ ...s, q: qInput, page: 1 })), 400); return () => clearTimeout(t); }, [qInput]);

  const set = (k) => (e) => setP((s) => ({ ...s, [k]: e.target.value, page: 1 }));
  const patch = async (b, body, msg) => {
    try { const r = await adminPatchBusiness(b.id, body); setData((d) => ({ ...d, items: d.items.map((x) => (x.id === b.id ? { ...x, ...r } : x)) })); toast.success(msg); }
    catch (err) { toast.error(err?.response?.data?.detail || "Failed"); }
  };
  const del = async (b) => {
    if (!window.confirm(`Delete "${b.name}" permanently? Reviews, favorites and claims for it are removed too.`)) return;
    try { await adminDeleteBusiness(b.id); setData((d) => ({ ...d, items: d.items.filter((x) => x.id !== b.id), total: d.total - 1 })); toast.success("Deleted"); }
    catch { toast.error("Delete failed"); }
  };

  return (
    <div className="space-y-4" data-testid="admin-businesses">
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-2.5 flex-1 min-w-[220px]"><Search className="w-4 h-4 text-slate-400" /><input data-testid="biz-search" value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Search name, phone, address, id, owner email…" className="py-2 text-sm outline-none flex-1" /></div>
        <select value={p.category} onChange={set("category")} className={sel} data-testid="biz-filter-category"><option value="">All categories</option>{cat?.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
        <select value={p.city} onChange={set("city")} className={sel} data-testid="biz-filter-city"><option value="">All cities</option>{cat?.cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
        <select value={p.source} onChange={set("source")} className={sel}><option value="">All sources</option><option value="google">Google</option><option value="owner">Owner</option><option value="seed">Seed</option></select>
        <select value={p.status} onChange={set("status")} className={sel}><option value="">Any status</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option></select>
        <select value={p.flag} onChange={set("flag")} className={sel}><option value="">Any flag</option><option value="claimed">Claimed</option><option value="sponsored">Sponsored</option><option value="unverified">Unverified</option></select>
        <select value={p.sort} onChange={set("sort")} className={sel}><option value="recent">Newest</option><option value="rating">Rating</option><option value="reviews">Reviews</option><option value="leads">Most calls</option><option value="name">Name</option></select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span data-testid="biz-total">{data ? `${data.total.toLocaleString()} businesses` : "Loading…"}</span>
          <div className="flex items-center gap-2">
            <button disabled={p.page <= 1} onClick={() => setP((s) => ({ ...s, page: s.page - 1 }))} className="p-1 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
            <span>Page {p.page} / {data?.pages || 1}</span>
            <button disabled={!data || p.page >= data.pages} onClick={() => setP((s) => ({ ...s, page: s.page + 1 }))} className="p-1 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase"><tr><th className="text-left px-4 py-2">Business</th><th className="text-left px-2 py-2">Where</th><th className="text-left px-2 py-2">Source</th><th className="text-right px-2 py-2">Rating</th><th className="text-right px-2 py-2">Calls</th><th className="text-left px-2 py-2">Flags</th><th className="px-4 py-2"></th></tr></thead>
            <tbody>
              {data?.items.map((b) => (
                <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50" data-testid="biz-row">
                  <td className="px-4 py-2"><div className="flex items-center gap-2"><img src={b.images?.[0]} alt="" className="w-9 h-9 rounded object-cover bg-slate-100" /><div className="min-w-0"><Link to={`/${b.category}/${b.state}/${b.city}/${b.slug}`} target="_blank" className="font-semibold text-slate-900 hover:text-blue-600 block truncate max-w-[260px]">{b.name}</Link><p className="text-[11px] text-slate-400 truncate max-w-[260px]">{b.phone} {b.owner_email ? `· ${b.owner_email}` : ""}</p></div></div></td>
                  <td className="px-2 py-2 text-xs text-slate-600">{b.category_name}<br />{b.area}, {b.city_name}</td>
                  <td className="px-2 py-2"><span className="text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{b.source}</span> <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${STATUS_CLS[b.status] || ""}`}>{b.status}</span></td>
                  <td className="px-2 py-2 text-right text-xs">{b.rating} <Star className="w-3 h-3 inline text-amber-400 fill-amber-400" /><br /><span className="text-slate-400">{b.reviews_count}</span></td>
                  <td className="px-2 py-2 text-right text-xs">{b.leads_call}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      <button data-testid="biz-toggle-verified" onClick={() => patch(b, { verified: !b.verified }, b.verified ? "Verified removed" : "Marked verified")} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${b.verified ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 text-slate-500"}`}><BadgeCheck className="w-3 h-3 inline" /> Verified</button>
                      <button data-testid="biz-toggle-sponsored" onClick={() => patch(b, { sponsored: !b.sponsored }, b.sponsored ? "Sponsored off" : "Sponsored on — ranks first")} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${b.sponsored ? "bg-orange-600 text-white border-orange-600" : "border-slate-300 text-slate-500"}`}>Sponsored</button>
                      {b.claimed && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-50 text-green-700">Claimed</span>}
                      <select value={b.status} onChange={(e) => patch(b, { status: e.target.value }, `Status: ${e.target.value}`)} className="text-[10px] border border-slate-300 rounded px-1" data-testid="biz-status-select"><option value="approved">approved</option><option value="pending">pending</option><option value="rejected">rejected (hidden)</option></select>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button onClick={() => setEdit(b)} data-testid="biz-edit" className="p-1.5 text-slate-500 hover:text-slate-900" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => del(b)} data-testid="biz-delete" className="p-1.5 text-slate-400 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {data && !data.items.length && <tr><td colSpan={7} className="text-center text-slate-400 py-10">No businesses match.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {edit && <EditModal b={edit} onClose={() => setEdit(null)} onSaved={(r) => setData((d) => ({ ...d, items: d.items.map((x) => (x.id === r.id ? { ...x, ...r } : x)) }))} />}
    </div>
  );
};
