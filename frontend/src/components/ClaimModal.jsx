import { useState } from "react";
import { BadgeCheck, Loader2, ShieldCheck, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { claimBusiness } from "@/lib/nbk";
import { MediaUploader } from "@/components/MediaUploader";

const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white";
const ROLES = ["Owner", "Co-owner / Partner", "Manager", "Authorized representative"];

export const ClaimModal = ({ business, onClose, onSubmitted }) => {
  const { user, login } = useAuth();
  const [f, setF] = useState({ role: "Owner", full_name: user?.name || "", phone: "", email: user?.email || "", website: business.website || "", message: "", proof_media: [] });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }));

  const submit = async (e) => {
    e.preventDefault();
    if (!user) { login(); return; }
    setBusy(true);
    try {
      await claimBusiness(business.id, f);
      setDone(true);
      onSubmitted?.();
    } catch (err) {
      const d = err?.response?.data?.detail;
      toast.error(Array.isArray(d) ? `${d[0].loc?.slice(-1)[0]}: ${d[0].msg}` : d || "Could not submit claim");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose} data-testid="claim-modal">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h3 className="font-bold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-orange-500" /> Claim {business.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        {done ? (
          <div className="p-8 text-center" data-testid="claim-success">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <h4 className="font-bold text-lg mt-3 text-slate-900">Claim submitted!</h4>
            <p className="text-sm text-slate-500 mt-1">Our team will verify your details within 24–48 hours. Once approved you can edit this page, add photos & videos and you'll get the <span className="font-semibold text-blue-700">Verified</span> badge.</p>
            <button onClick={onClose} className="mt-5 bg-slate-900 text-white px-6 py-2.5 rounded-lg font-semibold text-sm">Done</button>
          </div>
        ) : !user ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-600">Sign in with Google to claim this business. It's free.</p>
            <button data-testid="claim-login-button" onClick={() => login()} className="mt-5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-lg w-full">Continue with Google</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-4" data-testid="claim-form">
            <ul className="text-xs text-slate-600 bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1">
              <li className="flex gap-1.5"><BadgeCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Get the Verified badge & rank higher</li>
              <li className="flex gap-1.5"><BadgeCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Edit hours, phone, website, services & description</li>
              <li className="flex gap-1.5"><BadgeCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Upload your own photos & videos</li>
            </ul>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block"><span className="text-xs font-semibold text-slate-600">Your role</span>
                <select data-testid="claim-role" value={f.role} onChange={set("role")} className={inputCls}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></label>
              <label className="block"><span className="text-xs font-semibold text-slate-600">Full name</span>
                <input data-testid="claim-name" required value={f.full_name} onChange={set("full_name")} className={inputCls} /></label>
              <label className="block"><span className="text-xs font-semibold text-slate-600">Business phone</span>
                <input data-testid="claim-phone" required value={f.phone} onChange={set("phone")} placeholder={business.phone || "+1 …"} className={inputCls} /></label>
              <label className="block"><span className="text-xs font-semibold text-slate-600">Business email</span>
                <input data-testid="claim-email" type="email" value={f.email} onChange={set("email")} className={inputCls} /></label>
              <label className="block sm:col-span-2"><span className="text-xs font-semibold text-slate-600">Website (optional)</span>
                <input data-testid="claim-website" value={f.website} onChange={set("website")} placeholder="https://" className={inputCls} /></label>
              <label className="block sm:col-span-2"><span className="text-xs font-semibold text-slate-600">Anything that helps us verify you (optional)</span>
                <textarea data-testid="claim-message" rows={3} value={f.message} onChange={set("message")} placeholder="e.g. I'm the owner since 2015, business license no. …" className={inputCls} /></label>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1.5">Proof (optional) — storefront photo, business card, license, utility bill</p>
              <MediaUploader value={f.proof_media} onChange={set("proof_media")} purpose="claim" max={5} compact testId="claim-proof-uploader" />
            </div>
            <button type="submit" disabled={busy} data-testid="claim-submit-button" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Submit claim
            </button>
            <p className="text-[11px] text-slate-400 text-center">By claiming you confirm you are authorized to manage this business.</p>
          </form>
        )}
      </div>
    </div>
  );
};
