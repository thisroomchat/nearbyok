import { useEffect, useState } from "react";
import { Cloud, Save, Loader2, CheckCircle2, XCircle, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { adminGetSettings, adminPutSettings, adminTestCloudinary } from "@/lib/nbk";

const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white font-mono";

export const AdminSettings = () => {
  const [s, setS] = useState(null);
  const [cl, setCl] = useState({ cloud_name: "", api_key: "", api_secret: "" });
  const [busy, setBusy] = useState(false);
  const [test, setTest] = useState(null);

  const load = () => adminGetSettings().then((d) => { setS(d); setCl({ cloud_name: d.cloudinary.cloud_name || "", api_key: d.cloudinary.api_key || "", api_secret: "" }); });
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await adminPutSettings({ cloudinary: cl });
      setS(d); setCl((c) => ({ ...c, api_secret: "" })); setTest(null);
      toast.success(d.media_enabled ? "Cloudinary saved — uploads are live for everyone now" : "Saved. Fill all three fields to enable uploads.");
    } catch (err) { toast.error(err?.response?.data?.detail || "Save failed"); }
    finally { setBusy(false); }
  };

  const runTest = async () => {
    setTest("running");
    try { await adminTestCloudinary(); setTest("ok"); toast.success("Cloudinary connection OK"); }
    catch (err) { setTest("fail"); toast.error(err?.response?.data?.detail || "Test failed"); }
  };

  if (!s) return <p className="text-slate-400">Loading settings…</p>;
  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6" data-testid="admin-settings">
      <form onSubmit={save} className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-bold text-slate-900 flex items-center gap-2"><Cloud className="w-5 h-5 text-orange-500" /> Cloudinary — photo & video storage</h2>
          <span data-testid="media-status-pill" className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.media_enabled ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{s.media_enabled ? "Uploads enabled" : "Uploads disabled — not configured"}</span>
        </div>
        <p className="text-sm text-slate-500">Get these from <a href="https://console.cloudinary.com/" target="_blank" rel="noreferrer" className="text-blue-600 underline">console.cloudinary.com</a> → Dashboard → Product Environment Credentials. Changes apply instantly — no redeploy needed. The API secret is stored server-side only and never sent to browsers.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block"><span className="text-xs font-semibold text-slate-600">Cloud name</span><input data-testid="cld-cloud-name" value={cl.cloud_name} onChange={(e) => setCl({ ...cl, cloud_name: e.target.value })} placeholder="dxxxxxxxx" className={inputCls} /></label>
          <label className="block"><span className="text-xs font-semibold text-slate-600">API key</span><input data-testid="cld-api-key" value={cl.api_key} onChange={(e) => setCl({ ...cl, api_key: e.target.value })} placeholder="123456789012345" className={inputCls} /></label>
          <label className="block sm:col-span-2"><span className="text-xs font-semibold text-slate-600">API secret {s.cloudinary.has_secret && <span className="text-slate-400 font-normal">(saved: {s.cloudinary.secret_hint} — leave blank to keep)</span>}</span>
            <input data-testid="cld-api-secret" type="password" value={cl.api_secret} onChange={(e) => setCl({ ...cl, api_secret: e.target.value })} placeholder={s.cloudinary.has_secret ? "•••••••• (unchanged)" : "paste secret"} className={inputCls} autoComplete="new-password" /></label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={busy} data-testid="settings-save-button" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 disabled:opacity-60">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save</button>
          <button type="button" onClick={runTest} disabled={!s.media_enabled || test === "running"} data-testid="cld-test-button" className="border border-slate-300 hover:border-slate-900 font-semibold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50">
            {test === "running" ? <Loader2 className="w-4 h-4 animate-spin" /> : test === "ok" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : test === "fail" ? <XCircle className="w-4 h-4 text-red-600" /> : <KeyRound className="w-4 h-4" />} Test connection
          </button>
        </div>
      </form>
      <aside className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-sm text-slate-600 space-y-2">
          <h3 className="font-bold text-slate-900">Where uploads are used</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li>Owner photos & videos on claimed listings</li>
            <li>Free-listing form (phone camera / gallery)</li>
            <li>Customer reviews with photos/videos</li>
            <li>Claim proof documents (admin-only view)</li>
          </ul>
          <p className="text-xs text-slate-400 pt-2">Files are stored in folders <code>nearbyok/&#123;purpose&#125;/&#123;user_id&#125;</code>. Signed uploads: browsers get a one-time signature from our server; the secret never leaves the backend.</p>
        </div>
      </aside>
    </div>
  );
};
