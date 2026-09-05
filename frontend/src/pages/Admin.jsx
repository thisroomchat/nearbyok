import { useEffect, useState } from "react";
import { Lock, LayoutDashboard, Building2, ShieldCheck, Inbox, Star, Users, Phone, Download, TrendingUp, Globe, Settings, ScrollText, LogOut, Loader2, Eye, EyeOff, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { Seo } from "@/components/Seo";
import { adminLogin, adminMe } from "@/lib/nbk";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminIngest } from "@/components/admin/AdminIngest";
import { AdminSubmissions } from "@/components/admin/AdminSubmissions";
import { AdminClaims } from "@/components/admin/AdminClaims";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminBusinesses } from "@/components/admin/AdminBusinesses";
import { AdminReviews, AdminUsers, AdminAudit, ExportLeadsButton } from "@/components/admin/AdminPeople";
import { AdminTrends } from "@/components/admin/AdminTrends";
import { AdminSeo } from "@/components/admin/AdminSeo";

const NAV = [
  { group: "Overview", items: [["dashboard", "Dashboard", LayoutDashboard], ["leads", "Leads", Phone]] },
  { group: "Catalog", items: [["businesses", "Businesses", Building2], ["claims", "Claims", ShieldCheck], ["submissions", "Submissions", Inbox], ["reviews", "Reviews", Star], ["ingest", "Google Data", Download]] },
  { group: "Growth", items: [["trends", "Nearby Pages", TrendingUp], ["seo", "SEO", Globe], ["users", "Users", Users]] },
  { group: "System", items: [["settings", "Settings", Settings], ["audit", "Audit Log", ScrollText]] },
];
const TITLES = Object.fromEntries(NAV.flatMap((g) => g.items.map(([k, l]) => [k, l])));

export default function Admin() {
  const [authed, setAuthed] = useState(null);
  const [creds, setCreds] = useState({ username: "", password: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState(sessionStorage.getItem("nbk_admin_tab") || "dashboard");
  const [nav, setNav] = useState(false);

  useEffect(() => { document.title = "Console — nearbyok"; }, []);
  useEffect(() => {
    if (!sessionStorage.getItem("nbk_admin_token")) { setAuthed(false); return; }
    adminMe().then(() => setAuthed(true)).catch(() => { sessionStorage.removeItem("nbk_admin_token"); setAuthed(false); });
    const onLogout = () => setAuthed(false);
    window.addEventListener("nbk-admin-logout", onLogout);
    return () => window.removeEventListener("nbk-admin-logout", onLogout);
  }, []);
  useEffect(() => { sessionStorage.setItem("nbk_admin_tab", TITLES[tab] ? tab : "dashboard"); }, [tab]);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const r = await adminLogin(creds.username, creds.password); sessionStorage.setItem("nbk_admin_token", r.token); setAuthed(true); setCreds({ username: "", password: "" }); }
    catch (err) { toast.error(err?.response?.data?.detail || "Login failed"); }
    finally { setBusy(false); }
  };
  const logout = () => { sessionStorage.removeItem("nbk_admin_token"); setAuthed(false); };

  if (authed === null) return <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-400 gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Checking session…</div>;

  if (!authed) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Seo title="Console — nearbyok" description="Restricted area" noindex />
      <form onSubmit={submit} className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 w-full max-w-sm space-y-4" data-testid="admin-login-form" autoComplete="off">
        <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center"><Lock className="w-6 h-6" /></div>
        <div><h1 className="text-2xl font-extrabold text-slate-900">Restricted console</h1><p className="text-xs text-slate-400 mt-1">Authorized staff only. Attempts are logged.</p></div>
        <input data-testid="admin-username-input" value={creds.username} onChange={(e) => setCreds({ ...creds, username: e.target.value })} placeholder="Username" autoComplete="username" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
        <div className="relative">
          <input data-testid="admin-password-input" type={show ? "text" : "password"} value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} placeholder="Password" autoComplete="current-password" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:border-blue-500" />
          <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label="Toggle password">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
        </div>
        <button disabled={busy} data-testid="admin-login-button" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60">{busy && <Loader2 className="w-4 h-4 animate-spin" />} Sign in</button>
      </form>
    </div>
  );

  const sidebar = (
    <nav className="p-3 space-y-4">
      {NAV.map((g) => (
        <div key={g.group}>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{g.group}</p>
          {g.items.map(([k, label, Icon]) => (
            <button key={k} data-testid={`admin-tab-${k}`} onClick={() => { setTab(k); setNav(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === k ? "bg-orange-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}><Icon className="w-4 h-4" /> {label}</button>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="hidden lg:flex flex-col w-60 bg-slate-900 text-white shrink-0 sticky top-0 h-screen overflow-y-auto">
        <a href="/" className="px-6 h-16 flex items-center font-extrabold tracking-tight border-b border-white/10">nearby<span className="text-orange-500">ok</span> <span className="text-slate-400 font-medium text-xs ml-2">console</span></a>
        {sidebar}
        <button data-testid="admin-logout-button" onClick={logout} className="mt-auto m-3 text-slate-300 hover:text-white text-sm flex items-center gap-2 px-3 py-2"><LogOut className="w-4 h-4" /> Logout</button>
      </aside>
      {nav && <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setNav(false)}><div className="absolute inset-0 bg-black/50" /><aside className="absolute left-0 top-0 h-full w-64 bg-slate-900 text-white overflow-y-auto" onClick={(e) => e.stopPropagation()}><div className="px-4 h-14 flex items-center justify-between border-b border-white/10 font-extrabold">nearby<span className="text-orange-500">ok</span><button onClick={() => setNav(false)}><X className="w-5 h-5" /></button></div>{sidebar}<button onClick={logout} className="m-3 text-slate-300 text-sm flex items-center gap-2 px-3 py-2"><LogOut className="w-4 h-4" /> Logout</button></aside></div>}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 h-14 flex items-center px-4 sm:px-6 gap-3 sticky top-0 z-40">
          <button className="lg:hidden text-slate-700" onClick={() => setNav(true)} aria-label="Menu"><Menu className="w-5 h-5" /></button>
          <h1 className="font-bold text-slate-900" data-testid="admin-page-title">{TITLES[tab] || "Dashboard"}</h1>
          <div className="ml-auto flex items-center gap-2">{tab === "leads" && <ExportLeadsButton />}<a href="/" target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-slate-900 hidden sm:inline">View site ↗</a></div>
        </header>
        <main className="p-4 sm:p-6 max-w-[1400px]">
          {tab === "dashboard" && <AdminDashboard />}
          {tab === "leads" && <AdminOverview />}
          {tab === "businesses" && <AdminBusinesses />}
          {tab === "claims" && <AdminClaims />}
          {tab === "submissions" && <AdminSubmissions />}
          {tab === "reviews" && <AdminReviews />}
          {tab === "ingest" && <AdminIngest />}
          {tab === "trends" && <AdminTrends />}
          {tab === "seo" && <AdminSeo />}
          {tab === "users" && <AdminUsers />}
          {tab === "settings" && <AdminSettings />}
          {tab === "audit" && <AdminAudit />}
          {!TITLES[tab] && <AdminDashboard />}
        </main>
      </div>
    </div>
  );
}
