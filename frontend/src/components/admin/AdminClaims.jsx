import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, ShieldOff, Phone, Mail, Globe, BadgeCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { adminClaims, adminDecideClaim } from "@/lib/nbk";
import { MediaThumb, MediaLightbox } from "@/components/MediaUploader";

const cls = { pending: "bg-amber-50 text-amber-700", approved: "bg-green-50 text-green-700", rejected: "bg-red-50 text-red-700", revoked: "bg-slate-100 text-slate-600" };

export const AdminClaims = () => {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [lb, setLb] = useState({ items: [], index: null });
  const load = () => adminClaims().then(setData).catch(() => toast.error("Could not load claims"));
  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    const note = action === "approve" ? "" : (window.prompt(`Reason for ${action} (optional, shown to the claimant)`) ?? "");
    try {
      await adminDecideClaim(id, action, note);
      toast.success(action === "approve" ? "Claim approved — owner can now manage the listing" : `Claim ${action}d`);
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Action failed"); }
  };

  const items = (data?.items || []).filter((c) => filter === "all" || c.status === filter);
  return (
    <div className="space-y-4" data-testid="admin-claims">
      <div className="flex items-center gap-2 flex-wrap">
        {["pending", "approved", "rejected", "revoked", "all"].map((f) => (
          <button key={f} data-testid={`claims-filter-${f}`} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors ${filter === f ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
            {f} {data && f !== "all" && <span className="opacity-60">({data.counts?.[f] || 0})</span>}
          </button>
        ))}
      </div>
      {data === null ? <p className="text-slate-400">Loading…</p> : items.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-400 text-sm">No {filter === "all" ? "" : filter} claims.</div>
      ) : items.map((c) => (
        <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 grid md:grid-cols-[1fr_auto] gap-4" data-testid="claim-card">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/${c.category}/${c.state}/${c.city}/${c.slug}`} target="_blank" className="font-bold text-slate-900 hover:text-blue-600">{c.business_name}</Link>
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${cls[c.status]}`}>{c.status}</span>
              <span className="text-xs text-slate-400">{c.category} · {c.city} · {new Date(c.created_at).toLocaleString()}</span>
            </div>
            <div className="text-sm text-slate-700"><span className="font-semibold">{c.full_name}</span> <span className="text-slate-400">({c.role})</span> — Google account: {c.user_name} &lt;{c.user_email}&gt;</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}
                {c.phone_matches === true && <span className="ml-1 inline-flex items-center gap-0.5 text-green-700 font-semibold"><BadgeCheck className="w-3 h-3" /> matches Google</span>}
                {c.phone_matches === false && <span className="ml-1 inline-flex items-center gap-0.5 text-amber-700 font-semibold"><AlertCircle className="w-3 h-3" /> differs from Google</span>}
              </span>
              {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>}
              {c.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {c.website}</span>}
            </div>
            {c.message && <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-2.5 whitespace-pre-line">{c.message}</p>}
            {c.proof_media?.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {c.proof_media.map((m, i) => <MediaThumb key={i} m={m} className="w-16 h-16" onClick={() => setLb({ items: c.proof_media, index: i })} />)}
              </div>
            )}
            {c.note && <p className="text-xs text-slate-400">Note: {c.note}</p>}
          </div>
          <div className="flex md:flex-col gap-2 shrink-0">
            {c.status === "pending" && <>
              <button data-testid="claim-approve" onClick={() => act(c.id, "approve")} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-2 rounded-lg"><Check className="w-4 h-4" /> Approve</button>
              <button data-testid="claim-reject" onClick={() => act(c.id, "reject")} className="flex items-center gap-1 border border-slate-300 hover:border-red-500 hover:text-red-600 text-sm font-semibold px-3 py-2 rounded-lg"><X className="w-4 h-4" /> Reject</button>
            </>}
            {c.status === "approved" && <button data-testid="claim-revoke" onClick={() => act(c.id, "revoke")} className="flex items-center gap-1 border border-slate-300 hover:border-red-500 hover:text-red-600 text-sm font-semibold px-3 py-2 rounded-lg"><ShieldOff className="w-4 h-4" /> Revoke ownership</button>}
          </div>
        </div>
      ))}
      <MediaLightbox items={lb.items} index={lb.index} onClose={() => setLb({ items: [], index: null })} onIndex={(i) => setLb((s) => ({ ...s, index: i }))} />
    </div>
  );
};
