import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Star, Trash2, Download, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { adminReviews, adminDeleteReview, adminUsers, adminAudit, adminLeadsCsvUrl } from "@/lib/nbk";
import { MediaThumb } from "@/components/MediaUploader";

const SearchBox = ({ value, onChange, placeholder }) => (
  <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-2.5 bg-white max-w-md"><Search className="w-4 h-4 text-slate-400" /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="py-2 text-sm outline-none flex-1" /></div>
);

export const AdminReviews = () => {
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  useEffect(() => { const t = setTimeout(() => adminReviews({ q, limit: 50 }).then(setData), 300); return () => clearTimeout(t); }, [q]);
  const del = async (r) => {
    if (!window.confirm("Delete this review?")) return;
    try { await adminDeleteReview(r.id); setData((d) => ({ ...d, items: d.items.filter((x) => x.id !== r.id), total: d.total - 1 })); toast.success("Review deleted"); } catch { toast.error("Failed"); }
  };
  return (
    <div className="space-y-4" data-testid="admin-reviews">
      <div className="flex items-center justify-between gap-3 flex-wrap"><SearchBox value={q} onChange={setQ} placeholder="Search review text or author…" /><span className="text-xs text-slate-500">{data ? `${data.total} user reviews` : ""}</span></div>
      <div className="space-y-2">
        {data?.items.map((r) => (
          <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3" data-testid="admin-review-row">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap text-sm"><span className="font-semibold text-slate-900">{r.author}</span><span className="flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />)}</span><span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</span>
                {r.business && <Link to={`/${r.business.category}/${r.business.state}/${r.business.city}/${r.business.slug}`} target="_blank" className="text-xs text-blue-600 hover:underline">→ {r.business.name}</Link>}</div>
              <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{r.text}</p>
              {r.media?.length > 0 && <div className="flex gap-2 mt-2">{r.media.map((m, i) => <MediaThumb key={i} m={m} className="w-14 h-14" onClick={() => window.open(m.url, "_blank")} />)}</div>}
            </div>
            <button onClick={() => del(r)} data-testid="admin-review-delete" className="text-slate-400 hover:text-red-600 self-start"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {data && !data.items.length && <p className="text-center text-slate-400 py-10 text-sm">No reviews.</p>}
      </div>
    </div>
  );
};

export const AdminUsers = () => {
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  useEffect(() => { const t = setTimeout(() => adminUsers({ q, limit: 50 }).then(setData), 300); return () => clearTimeout(t); }, [q]);
  return (
    <div className="space-y-4" data-testid="admin-users">
      <div className="flex items-center justify-between gap-3 flex-wrap"><SearchBox value={q} onChange={setQ} placeholder="Search email or name…" /><span className="text-xs text-slate-500 flex items-center gap-1"><UsersIcon className="w-3.5 h-3.5" /> {data ? `${data.total} users` : ""}</span></div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase"><tr><th className="text-left px-4 py-2">User</th><th className="text-left px-2 py-2">Joined</th><th className="text-right px-2 py-2">Listings</th><th className="text-right px-2 py-2">Claims</th><th className="text-right px-2 py-2">Reviews</th><th className="text-right px-4 py-2">Saved</th></tr></thead>
          <tbody>
            {data?.items.map((u) => (
              <tr key={u.user_id} className="border-t border-slate-100" data-testid="admin-user-row">
                <td className="px-4 py-2"><div className="flex items-center gap-2">{u.picture ? <img src={u.picture} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full bg-slate-100" /> : <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold">{(u.name || "?")[0]}</span>}<div><p className="font-semibold text-slate-900">{u.name}</p><p className="text-xs text-slate-400">{u.email}</p></div></div></td>
                <td className="px-2 py-2 text-xs text-slate-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                <td className="px-2 py-2 text-right">{u.listings}</td><td className="px-2 py-2 text-right">{u.claims}</td><td className="px-2 py-2 text-right">{u.reviews}</td><td className="px-4 py-2 text-right">{u.favorites}</td>
              </tr>
            ))}
            {data && !data.items.length && <tr><td colSpan={6} className="text-center text-slate-400 py-10">No users yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AdminAudit = () => {
  const [items, setItems] = useState(null);
  useEffect(() => { adminAudit().then((r) => setItems(r.items)); }, []);
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid="admin-audit">
      <div className="px-4 py-3 border-b border-slate-100 font-bold text-slate-900">Security & activity log</div>
      <ul className="divide-y divide-slate-100 text-sm max-h-[70vh] overflow-y-auto">
        {items?.map((x, i) => (
          <li key={i} className="px-4 py-2 flex items-center gap-3">
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${x.type === "login_failed" ? "bg-red-50 text-red-700" : x.type === "login_ok" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>{x.type}</span>
            <span className="text-slate-600 truncate flex-1">{x.ip ? `IP ${x.ip}` : ""} {x.username ? `user "${x.username}"` : ""} {x.business_id || ""} {x.changes ? x.changes.join(", ") : ""} {x.kind ? `${x.kind} csv: +${x.added} / ~${x.updated}` : ""}</span>
            <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(x.at).toLocaleString()}</span>
          </li>
        ))}
        {items && !items.length && <li className="px-4 py-10 text-center text-slate-400">Nothing logged yet.</li>}
      </ul>
    </div>
  );
};

export const ExportLeadsButton = () => {
  const download = async () => {
    try {
      const res = await fetch(adminLeadsCsvUrl(), { headers: { "X-Admin-Token": sessionStorage.getItem("nbk_admin_token") || "" } });
      if (!res.ok) throw new Error();
      const blob = await res.blob(); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "nearbyok-leads.csv"; a.click(); URL.revokeObjectURL(a.href);
    } catch { toast.error("Export failed"); }
  };
  return <button onClick={download} data-testid="export-leads-button" className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:border-slate-900 text-sm font-semibold px-3 py-2 rounded-lg"><Download className="w-4 h-4" /> Export leads CSV</button>;
};
