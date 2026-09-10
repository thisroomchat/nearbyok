import { useState } from "react";
import { Share2, Link as LinkIcon, MessageCircle, FileDown, Check } from "lucide-react";
import { toast } from "sonner";

/** Share link (native share / copy / WhatsApp) + "Download PDF" via the browser print dialog. */
export const TripShareBar = ({ shareUrl, title }) => {
  const [copied, setCopied] = useState(false);
  if (!shareUrl) return null;
  const text = `${title || "My trip plan"} — planned on nearbyok`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); toast.success("Link copied"); setTimeout(() => setCopied(false), 2000); }
    catch { window.prompt("Copy this link", shareUrl); }
  };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: text, url: shareUrl }); } catch { /* cancelled */ } }
    else copy();
  };
  const pdf = () => { document.body.classList.add("nbk-printing"); setTimeout(() => { window.print(); document.body.classList.remove("nbk-printing"); }, 50); };

  const btn = "inline-flex items-center gap-1.5 rounded-lg text-sm font-bold px-3.5 py-2 transition-colors";
  return (
    <div data-testid="trip-share-bar" className="flex flex-wrap gap-2 print:hidden">
      <button data-testid="trip-share-btn" onClick={share} className={`${btn} bg-white text-orange-600 hover:bg-orange-50`}><Share2 className="w-4 h-4" /> Share</button>
      <button data-testid="trip-copy-link-btn" onClick={copy} className={`${btn} bg-white/15 text-white hover:bg-white/25`}>{copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />} {copied ? "Copied" : "Copy link"}</button>
      <a data-testid="trip-whatsapp-btn" href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`} target="_blank" rel="noreferrer" className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}><MessageCircle className="w-4 h-4" /> WhatsApp</a>
      <button data-testid="trip-pdf-btn" onClick={pdf} className={`${btn} bg-slate-900 text-white hover:bg-slate-800`}><FileDown className="w-4 h-4" /> Download PDF</button>
    </div>
  );
};
