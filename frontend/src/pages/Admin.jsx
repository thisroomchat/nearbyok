import { useEffect, useState } from "react";
import { Lock, BarChart3, Download, Inbox, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Seo } from "@/components/Seo";
import { adminLogin } from "@/lib/nbk";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminIngest } from "@/components/admin/AdminIngest";
import { AdminSubmissions } from "@/components/admin/AdminSubmissions";

const TABS = [["overview", "Leads & Stats", BarChart3], ["ingest", "Google Data", Download], ["submissions", "Submissions", Inbox]];

export default function Admin() {
  const [authed, setAuthed] = useState(!!sessionStorage.getItem("nbk_admin_key"));
  const [pw, setPw] = useState("");
  const [tab, setTab] = useState("overview");

  useEffect(() => { document.title = "Admin — nearbyok.com"; }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await adminLogin(pw);
      sessionStorage.setItem("nbk_admin_key", pw);
      setAuthed(true);
    } catch { toast.error("Wrong password"); }
  };
  const logout = () => { sessionStorage.removeItem("nbk_admin_key"); setAuthed(false); };

  if (!authed) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Seo title="Admin — nearbyok.com" description="Admin" canonical="https://nearbyok.com/admin" />
      <form onSubmit={submit} className="bg-white rounded-2xl p-8 w-full max-w-sm space-y-4" data-testid="admin-login-form">
        <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center"><Lock className="w-6 h-6" /></div>
        <h1 className="text-2xl font-extrabold text-slate-900">nearbyok Admin</h1>
        <input data-testid="admin-password-input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Admin password" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
        <button data-testid="admin-login-button" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-colors">Enter dashboard</button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
          <a href="/" className="font-extrabold tracking-tight">nearby<span className="text-orange-500">ok</span> <span className="text-slate-400 font-medium text-sm ml-1">admin</span></a>
          <nav className="flex gap-1 ml-4">
            {TABS.map(([k, label, Icon]) => (
              <button key={k} data-testid={`admin-tab-${k}`} onClick={() => setTab(k)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === k ? "bg-white/15" : "text-slate-300 hover:text-white"}`}><Icon className="w-4 h-4" /> <span className="hidden sm:inline">{label}</span></button>
            ))}
          </nav>
          <button data-testid="admin-logout-button" onClick={logout} className="ml-auto text-slate-300 hover:text-white text-sm flex items-center gap-1"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {tab === "overview" && <AdminOverview />}
        {tab === "ingest" && <AdminIngest />}
        {tab === "submissions" && <AdminSubmissions />}
      </main>
    </div>
  );
}
