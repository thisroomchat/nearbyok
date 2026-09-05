import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, RotateCcw, MapPin } from "lucide-react";
import { toast } from "sonner";
import { adminSubmissions, adminReviewSubmission } from "@/lib/nbk";

const cls = { pending: "bg-amber-50 text-amber-700", approved: "bg-green-50 text-green-700", rejected: "bg-red-50 text-red-700" };

export const AdminSubmissions = () => {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState("pending");
  const load = () => adminSubmissions().then((r) => setItems(r.items));
  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    await adminReviewSubmission(id, action);
    toast.success(`Listing ${action === "approve" ? "verified & approved" : action === "reject" ? "rejected (hidden)" : "moved to pending"}`);
    load();
  };

  const shown = (items || []).filter((b) => filter === "all" || b.status === filter);
  return (
    <div className="space-y-4" data-testid="admin-submissions">
      <div className="flex items-center gap-2">
        {["pending", "approved", "rejected", "all"].map((f) => (
          <button key={f} data-testid={`submissions-filter-${f}`} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors ${filter === f ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>{f} {items && f !== "all" && <span className="opacity-60">({items.filter((b) => b.status === f).length})</span>}</button>
        ))}
      </div>
      {items === null ? <p className="text-slate-400">Loading…</p> : shown.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-400 text-sm">No {filter === "all" ? "" : filter} submissions.</div>
      ) : shown.map((b) => (
        <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-4" data-testid="submission-card">
          <img src={b.images?.[0]} alt="" className="w-full md:w-32 h-32 object-cover rounded-lg bg-slate-100" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/${b.category}/${b.state}/${b.city}/${b.slug}`} className="font-bold text-slate-900 hover:text-blue-600">{b.name}</Link>
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${cls[b.status]}`}>{b.status}</span>
              {b.geocoded ? <span className="text-[10px] text-green-600 flex items-center gap-0.5"><MapPin className="w-3 h-3" /> geocoded</span> : <span className="text-[10px] text-amber-600">approx. pin</span>}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{b.category_name} · {b.area}, {b.city_name} · {b.phone}{b.website ? ` · ${b.website}` : ""}</p>
            <p className="text-xs text-slate-400">{b.address}</p>
            <p className="text-xs text-slate-400">Owner: {b.owner_email} · {new Date(b.created_at).toLocaleString()}</p>
            {b.description && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{b.description}</p>}
            {b.own_services && <p className="text-xs text-slate-500 mt-1">{b.own_services.join(" · ")}</p>}
          </div>
          <div className="flex md:flex-col gap-2 shrink-0">
            {b.status !== "approved" && <button data-testid="submission-approve-button" onClick={() => act(b.id, "approve")} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-2 rounded-lg text-xs transition-colors"><Check className="w-3.5 h-3.5" /> Approve & Verify</button>}
            {b.status !== "rejected" && <button data-testid="submission-reject-button" onClick={() => act(b.id, "reject")} className="flex items-center gap-1 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-semibold px-3 py-2 rounded-lg text-xs transition-colors"><X className="w-3.5 h-3.5" /> Reject</button>}
            {b.status !== "pending" && <button data-testid="submission-pending-button" onClick={() => act(b.id, "pending")} className="flex items-center gap-1 bg-white border border-slate-300 text-slate-600 hover:border-slate-900 font-semibold px-3 py-2 rounded-lg text-xs transition-colors"><RotateCcw className="w-3.5 h-3.5" /> Pending</button>}
          </div>
        </div>
      ))}
    </div>
  );
};
