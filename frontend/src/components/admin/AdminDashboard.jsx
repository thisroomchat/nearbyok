import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from "recharts";
import { Phone, Users, Star, Building2, ShieldCheck, Inbox, Database, TrendingUp, Globe } from "lucide-react";
import { adminAnalytics } from "@/lib/nbk";

const Stat = ({ icon: Icon, label, value, sub, tone = "text-orange-500", testid }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4" data-testid={testid}>
    <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold uppercase tracking-wide"><Icon className={`w-4 h-4 ${tone}`} /> {label}</div>
    <p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p>
    {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
  </div>
);
const Panel = ({ title, children, right }) => (
  <section className="bg-white border border-slate-200 rounded-xl p-5">
    <div className="flex items-center justify-between mb-3"><h2 className="font-bold text-slate-900">{title}</h2>{right}</div>
    {children}
  </section>
);
const COLORS = ["#ea580c", "#0f172a", "#2563eb", "#16a34a", "#f59e0b", "#7c3aed"];

const mergeDaily = (a, keyA, b, keyB) => {
  const m = new Map();
  a.forEach((x) => m.set(x.date, { date: x.date, [keyA]: x.n }));
  b.forEach((x) => m.set(x.date, { ...(m.get(x.date) || { date: x.date }), [keyB]: x.n }));
  return [...m.values()].sort((x, y) => x.date.localeCompare(y.date)).map((x) => ({ ...x, date: x.date.slice(5) }));
};

export const AdminDashboard = () => {
  const [d, setD] = useState(null);
  const [days, setDays] = useState(30);
  useEffect(() => { adminAnalytics(days).then(setD); }, [days]);
  if (!d) return <p className="text-slate-400">Loading analytics…</p>;
  const t = d.totals;
  const leadsUsers = mergeDaily(d.leads_daily, "leads", d.users_daily, "users");
  const revClaims = mergeDaily(d.reviews_daily, "reviews", d.claims_daily, "claims");
  const sources = Object.entries(d.sources).map(([name, value]) => ({ name, value }));
  const leadTypes = Object.entries(d.lead_types).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <Stat icon={Phone} label="Leads" value={t.leads} testid="dash-leads" />
        <Stat icon={Building2} label="Real businesses" value={t.real_businesses} sub={`${t.businesses} incl. seed`} tone="text-blue-600" testid="dash-businesses" />
        <Stat icon={ShieldCheck} label="Claimed" value={t.claimed} sub={`${t.pending_claims} pending claims`} tone="text-green-600" testid="dash-claimed" />
        <Stat icon={Inbox} label="Submissions" value={t.pending_submissions} sub="awaiting review" tone="text-amber-500" />
        <Stat icon={Users} label="Users" value={t.users} />
        <Stat icon={Star} label="Reviews" value={t.reviews} />
        <Stat icon={Database} label="Google coverage" value={`${Math.round((t.coverage_done / t.seo_pages) * 100)}%`} sub={`${t.coverage_done}/${t.seo_pages} pages`} tone="text-slate-700" />
        <Stat icon={Globe} label="SEO pages" value={(t.seo_pages + t.trend_pages).toLocaleString()} sub={`${t.categories}×${t.cities} + ${t.trend_pages} nearby`} tone="text-purple-600" />
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">Range:</span>
        {[7, 30, 90].map((n) => <button key={n} onClick={() => setDays(n)} className={`px-3 py-1 rounded-lg font-semibold ${days === n ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>{n}d</button>)}
        {d.last_ingest_at && <span className="ml-auto text-xs text-slate-400">Last Google pull: {new Date(d.last_ingest_at).toLocaleString()}</span>}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Leads & new users per day">
          <div className="h-64"><ResponsiveContainer width="100%" height="100%">
            <AreaChart data={leadsUsers}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} allowDecimals={false} /><Tooltip />
              <Area type="monotone" dataKey="leads" stroke="#ea580c" fill="#fed7aa" /><Area type="monotone" dataKey="users" stroke="#2563eb" fill="#bfdbfe" /></AreaChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="Reviews & claims per day">
          <div className="h-64"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={revClaims}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} allowDecimals={false} /><Tooltip />
              <Bar dataKey="reviews" fill="#f59e0b" radius={3} /><Bar dataKey="claims" fill="#16a34a" radius={3} /></BarChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="Leads by category">
          <div className="h-64"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.leads_by_category} layout="vertical"><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="n" fill="#0f172a" radius={3} /></BarChart>
          </ResponsiveContainer></div>
          {!d.leads_by_category.length && <p className="text-xs text-slate-400 text-center -mt-32">No leads yet</p>}
        </Panel>
        <Panel title="Leads by city">
          <div className="h-64"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.leads_by_city} layout="vertical"><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="n" fill="#ea580c" radius={3} /></BarChart>
          </ResponsiveContainer></div>
          {!d.leads_by_city.length && <p className="text-xs text-slate-400 text-center -mt-32">No leads yet</p>}
        </Panel>
        <Panel title="Business sources">
          <div className="h-56"><ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie data={sources} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>{sources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Legend /><Tooltip /></PieChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="Lead types">
          <div className="h-56"><ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie data={leadTypes} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>{leadTypes.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}</Pie><Legend /><Tooltip /></PieChart>
          </ResponsiveContainer></div>
          {!leadTypes.length && <p className="text-xs text-slate-400 text-center -mt-28">No leads yet</p>}
        </Panel>
      </div>

      <Panel title="Real (Google + owner) businesses per city" right={<span className="text-xs text-slate-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> cities with 0 need a Google pull</span>}>
        <div className="h-72"><ResponsiveContainer width="100%" height="100%">
          <BarChart data={d.businesses_by_city}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={70} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="n" fill="#2563eb" radius={3} /></BarChart>
        </ResponsiveContainer></div>
      </Panel>
    </div>
  );
};
