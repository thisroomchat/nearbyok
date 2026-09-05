import { useEffect, useState } from "react";
import { Lock, BarChart3, Download, Inbox, LogOut, ShieldCheck, Settings, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Seo } from "@/components/Seo";
import { adminLogin, adminMe } from "@/lib/nbk";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminIngest } from "@/components/admin/AdminIngest";
import { AdminSubmissions } from "@/components/admin/AdminSubmissions";
import { AdminClaims } from "@/components/admin/AdminClaims";
import { AdminSettings } from "@/components/admin/AdminSettings";

const TABS = [
  ["overview", "Leads & Stats", BarChart3],
  ["ingest", "Google Data", Download],
  ["submissions", "Submissions", Inbox],
  ["claims", "Claims", ShieldCheck],
  ["settings", "Settings", Settings],
];

export default function Admin() {
  const [authed, setAuthed] = useState(null); // null = checking
  const [creds, setCreds] = useState({ username: "", password: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState(sessionStorage.getItem("nbk_admin_tab") || "overview");

  useEffect(() => { document.title = "Console — nearbyok"; }, []);
  useEffect(() => {
    if (!sessionStorage.getItem("nbk_admin_token")) { setAuthed(false); return; }
    adminMe().then(() => setAuthed(true)).catch(() => { sessionStorage.removeItem("nbk_admin_token"); setAuthed(false); });
    const onLogout = () => setAuthed(false);
    window.addEventListener("nbk-admin-logout", onLogout);
    return () => window.removeEventListener("nbk-admin-logout", onLogout);
  }, []);
  useEffect(() => { sessionStorage.setItem("nbk_admin_tab", tab); }, [tab]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await adminLogin(creds.username, creds.password);
      sessionStorage.setItem("nbk_admin_token", r.token);
      setAuthed(true);
      setCreds({ username: "", password: "" });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally { setBusy(false); }
  };
  const logout = () => { sessionStorage.removeItem("nbk_admin_token"); setAuthed(false); };

  if (authed === null) return <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-400 gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Checking session…</div>;

  if (!authed) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Seo title="Console — nearbyok" description="Restricted area" />
      <form onSubmit={submit} className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 w-full max-w-sm space-y-4" data-testid="admin-login-form" autoComplete="off">
        <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center"><Lock className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Restricted console</h1>
          <p className="text-xs text-slate-400 mt-1">Authorized staff only. Attempts are logged.</p>
        </div>
        <input data-testid="admin-username-input" value={creds.username} onChange={(e) => setCreds({ ...creds, username: e.target.value })} placeholder="Username" autoComplete="username" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
        <div className="relative">
          <input data-testid="admin-password-input" type={show ? "text" : "password"} value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} placeholder="Password" autoComplete="current-password" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:border-blue-500" />
          <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label="Toggle password">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
        </div>
        <button disabled={busy} data-testid="admin-login-button" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60">{busy && <Loader2 className="w-4 h-4 animate-spin" />} Sign in</button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
          <a href="/" className="font-extrabold tracking-tight">nearby<span className="text-orange-500">ok</span> <span className="text-slate-400 font-medium text-sm ml-1">console</span></a>
          <nav className="flex gap-1 ml-4 overflow-x-auto">
            {TABS.map(([k, label, Icon]) => (
              <button key={k} data-testid={`admin-tab-${k}`} onClick={() => setTab(k)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${tab === k ? "bg-white/15" : "text-slate-300 hover:text-white"}`}><Icon className="w-4 h-4" /> <span className="hidden sm:inline">{label}</span></button>
            ))}
          </nav>
          <button data-testid="admin-logout-button" onClick={logout} className="ml-auto text-slate-300 hover:text-white text-sm flex items-center gap-1"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {tab === "overview" && <AdminOverview />}
        {tab === "ingest" && <AdminIngest />}
        {tab === "submissions" && <AdminSubmissions />}
        {tab === "claims" && <AdminClaims />}
        {tab === "settings" && <AdminSettings />}
      </main>
    </div>
  );
}
