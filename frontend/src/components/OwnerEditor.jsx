import { useEffect, useState } from "react";
import { Loader2, Save, X, Clock, Phone, FileText, Image as ImageIcon, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { getMyListing, updateMyListing } from "@/lib/nbk";
import { MediaUploader } from "@/components/MediaUploader";

const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white";
const HOURS = Array.from({ length: 24 }, (_, h) => [h, `${h % 12 || 12}:00 ${h < 12 ? "AM" : "PM"}`]);
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const Field = ({ label, children }) => <label className="block"><span className="text-xs font-semibold text-slate-600">{label}</span>{children}</label>;
const Sec = ({ icon: Icon, title, children }) => (
  <section className="border border-slate-200 rounded-xl p-4">
    <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm"><Icon className="w-4 h-4 text-orange-500" /> {title}</h4>
    {children}
  </section>
);

/** Owner dashboard editor for a claimed / owner-submitted listing. */
export const OwnerEditor = ({ businessId, onClose, onSaved }) => {
  const [data, setData] = useState(null);
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const [customHours, setCustomHours] = useState(false);

  useEffect(() => {
    getMyListing(businessId).then((d) => {
      setData(d);
      const raw = d.raw || {};
      const wd = raw.weekday_descriptions || [];
      setCustomHours(wd.length === 7);
      setF({
        phone: raw.phone || "", website: raw.website || "", email: raw.email || "", tagline: raw.tagline || "",
        description: raw.description || "", services: (raw.services || []).join("\n"),
        open_hour: raw.open_hour ?? 9, close_hour: raw.close_hour ?? 18, closed_sunday: !!raw.closed_sunday, is_24_7: !!raw.is_24_7,
        weekday_descriptions: wd.length === 7 ? wd.map((s) => s.replace(/^[A-Za-z]+:\s*/, "")) : DAYS.map(() => ""),
        media: d.owner_media || [],
      });
    }).catch(() => { toast.error("Could not load listing"); onClose(); });
  }, [businessId, onClose]);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        phone: f.phone, website: f.website, email: f.email, tagline: f.tagline, description: f.description,
        services: f.services.split("\n").map((s) => s.trim()).filter(Boolean),
        open_hour: +f.open_hour, close_hour: +f.close_hour, closed_sunday: f.closed_sunday, is_24_7: f.is_24_7,
        weekday_descriptions: customHours ? DAYS.map((d, i) => `${d}: ${f.weekday_descriptions[i] || "Closed"}`) : [],
        media: f.media,
      };
      const r = await updateMyListing(businessId, body);
      toast.success("Listing updated — changes are live");
      onSaved?.(r.business);
      onClose();
    } catch (err) {
      const d = err?.response?.data?.detail;
      toast.error(Array.isArray(d) ? `${d[0].loc?.slice(-1)[0]}: ${d[0].msg}` : d || "Save failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose} data-testid="owner-editor">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[94vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-slate-900">Manage listing</h3>
            {data && <p className="text-xs text-slate-500">{data.business.name} · {data.business.area}, {data.business.city_name}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        {!f ? <div className="p-10 text-center text-slate-400 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div> : (
          <form onSubmit={save} className="p-5 space-y-4">
            <Sec icon={ImageIcon} title="Photos & videos">
              <MediaUploader value={f.media} onChange={set("media")} purpose="listing" max={20} label="Your photos appear first on your page" testId="owner-media-uploader" />
              {data?.google_images?.length > 0 && <p className="text-[11px] text-slate-400 mt-2">{data.google_images.length} Google photos stay in your gallery after your own photos.</p>}
            </Sec>
            <Sec icon={Phone} title="Contact">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Phone"><input data-testid="owner-phone" value={f.phone} onChange={set("phone")} className={inputCls} /></Field>
                <Field label="Website"><input data-testid="owner-website" value={f.website} onChange={set("website")} placeholder="https://" className={inputCls} /></Field>
                <Field label="Business email"><input data-testid="owner-email" type="email" value={f.email} onChange={set("email")} className={inputCls} /></Field>
                <Field label="Tagline"><input data-testid="owner-tagline" value={f.tagline} onChange={set("tagline")} maxLength={120} placeholder="e.g. Family dentist since 1998" className={inputCls} /></Field>
              </div>
            </Sec>
            <Sec icon={FileText} title="About your business">
              <textarea data-testid="owner-description" rows={5} value={f.description} onChange={set("description")} maxLength={3000} placeholder="Tell customers what makes you special…" className={inputCls} />
            </Sec>
            <Sec icon={ListChecks} title="Services (one per line)">
              <textarea data-testid="owner-services" rows={5} value={f.services} onChange={set("services")} placeholder={"Teeth Cleaning\nRoot Canal\nInvisalign"} className={inputCls} />
            </Sec>
            <Sec icon={Clock} title="Opening hours">
              <div className="flex flex-wrap gap-4 text-sm mb-3">
                <label className="flex items-center gap-2"><input type="checkbox" checked={f.is_24_7} onChange={set("is_24_7")} data-testid="owner-247" /> Open 24/7</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={customHours} onChange={(e) => setCustomHours(e.target.checked)} data-testid="owner-custom-hours" /> Different hours per day</label>
              </div>
              {!f.is_24_7 && !customHours && (
                <div className="grid sm:grid-cols-3 gap-3">
                  <Field label="Opens"><select value={f.open_hour} onChange={set("open_hour")} className={inputCls}>{HOURS.map(([h, l]) => <option key={h} value={h}>{l}</option>)}</select></Field>
                  <Field label="Closes"><select value={f.close_hour} onChange={set("close_hour")} className={inputCls}>{HOURS.slice(1).concat([[24, "12:00 AM (midnight)"]]).map(([h, l]) => <option key={h} value={h}>{l}</option>)}</select></Field>
                  <label className="flex items-center gap-2 text-sm mt-5"><input type="checkbox" checked={f.closed_sunday} onChange={set("closed_sunday")} /> Closed on Sunday</label>
                </div>
              )}
              {!f.is_24_7 && customHours && (
                <div className="grid sm:grid-cols-2 gap-2">
                  {DAYS.map((d, i) => (
                    <Field key={d} label={d}><input value={f.weekday_descriptions[i]} onChange={(e) => setF((s) => { const w = [...s.weekday_descriptions]; w[i] = e.target.value; return { ...s, weekday_descriptions: w }; })} placeholder="9:00 AM – 6:00 PM or Closed" className={inputCls} /></Field>
                  ))}
                </div>
              )}
            </Sec>
            <div className="flex gap-2 sticky bottom-0 bg-white pt-2">
              <button type="button" onClick={onClose} className="flex-1 border border-slate-300 font-semibold py-3 rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={busy} data-testid="owner-save-button" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-60">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
