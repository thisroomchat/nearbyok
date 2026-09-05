import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, MessageCircle, Send, Users, Star, Database, Inbox } from "lucide-react";
import { adminStats } from "@/lib/nbk";

const Stat = ({ icon: Icon, label, value, sub, testid }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4" data-testid={testid}>
    <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide"><Icon className="w-4 h-4 text-orange-500" /> {label}</div>
    <p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p>
    {sub && <p className="text-xs text-slate-400">{sub}</p>}
  </div>
);

export const AdminOverview = () => {
  const [s, setS] = useState(null);
  useEffect(() => { adminStats().then(setS); }, []);
  if (!s) return <p className="text-slate-400">Loading stats…</p>;
  const max = Math.max(1, ...s.daily.map((d) => d.n));

  return (
    <div className="space-y-6" data-testid="admin-overview">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Stat icon={Phone} label="Call clicks" value={s.by_type.call || 0} testid="stat-calls" />
        <Stat icon={MessageCircle} label="WhatsApp" value={s.by_type.whatsapp || 0} testid="stat-whatsapp" />
        <Stat icon={Send} label="Enquiries" value={s.by_type.enquiry || 0} testid="stat-enquiries" />
        <Stat icon={Users} label="Users" value={s.users} testid="stat-users" />
        <Stat icon={Star} label="Reviews" value={s.reviews} testid="stat-reviews" />
        <Stat icon={Database} label="Google data" value={`${s.coverage.done}/${s.coverage.total}`} sub={`${s.by_source.google || 0} real · ${s.by_source.seed || 0} seed`} testid="stat-coverage" />
        <Stat icon={Inbox} label="Pending" value={s.pending_submissions} sub="owner submissions" testid="stat-pending" />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Hottest businesses — who to sell to</h2>
            <span className="text-xs text-slate-400">{s.total_leads} total leads</span>
          </div>
          <table className="w-full text-sm" data-testid="top-businesses-table">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="text-left px-5 py-2">#</th><th className="text-left px-2 py-2">Business</th><th className="text-right px-2 py-2">Calls</th><th className="text-right px-2 py-2">WA</th><th className="text-right px-2 py-2">Enq</th><th className="text-right px-5 py-2">Total</th></tr></thead>
            <tbody>
              {s.top.map((b, i) => (
                <tr key={b.business_id} className="border-t border-slate-50 hover:bg-orange-50/40" data-testid="top-business-row">
                  <td className="px-5 py-2.5 text-slate-400">{i + 1}</td>
                  <td className="px-2 py-2.5">
                    <Link to={`/${b.category}/${b.state}/${b.city}/${b.slug}`} className="font-semibold text-slate-900 hover:text-blue-600">{b.name}</Link>
                    <p className="text-xs text-slate-400">{b.category} · {b.city} · {b.phone} · <span className={b.source === "google" ? "text-green-600" : ""}>{b.source}</span></p>
                  </td>
                  <td className="px-2 py-2.5 text-right">{b.calls}</td><td className="px-2 py-2.5 text-right">{b.whatsapp}</td><td className="px-2 py-2.5 text-right">{b.enquiries}</td>
                  <td className="px-5 py-2.5 text-right font-bold text-orange-700">{b.total}</td>
                </tr>
              ))}
              {!s.top.length && <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No leads yet.</td></tr>}
            </tbody>
          </table>
        </section>

        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-bold text-slate-900 mb-3">Leads — last 14 days</h2>
            <div className="flex items-end gap-1 h-28">
              {s.daily.map((d) => (
                <div key={d._id} className="flex-1 flex flex-col items-center gap-1" title={`${d._id}: ${d.n}`}>
                  <div className="w-full bg-orange-500 rounded-t" style={{ height: `${(d.n / max) * 100}%` }} />
                  <span className="text-[9px] text-slate-400">{d._id.slice(5)}</span>
                </div>
              ))}
              {!s.daily.length && <p className="text-xs text-slate-400">No data</p>}
            </div>
          </section>
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-bold text-slate-900 mb-3">Recent activity</h2>
            <ul className="space-y-2 text-xs max-h-72 overflow-auto" data-testid="recent-leads-list">
              {s.recent.map((l) => (
                <li key={l.id} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                  <span className="truncate"><b className="uppercase text-[10px] text-orange-700 mr-1">{l.type}</b>{l.business_name}</span>
                  <span className="text-slate-400 shrink-0">{new Date(l.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
