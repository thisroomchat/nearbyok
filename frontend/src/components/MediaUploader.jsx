import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, PlayCircle, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getPublicSettings, uploadMedia, deleteMedia } from "@/lib/nbk";

let _settingsPromise = null;
export const useMediaEnabled = () => {
  const [enabled, setEnabled] = useState(null);
  useEffect(() => {
    _settingsPromise = _settingsPromise || getPublicSettings().catch(() => ({ media_enabled: false }));
    _settingsPromise.then((s) => setEnabled(!!s.media_enabled));
  }, []);
  return enabled;
};

const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 100;

export const MediaThumb = ({ m, className = "", onClick }) => (
  <button type="button" onClick={onClick} className={`relative block overflow-hidden rounded-lg bg-slate-100 ${className}`}>
    <img src={m.thumb || m.url} alt="" className="w-full h-full object-cover" loading="lazy" />
    {m.type === "video" && <span className="absolute inset-0 flex items-center justify-center bg-black/25"><PlayCircle className="w-8 h-8 text-white drop-shadow" /></span>}
  </button>
);

/**
 * Phone-friendly photo/video uploader (signed Cloudinary uploads).
 * value: [{url, public_id, type, thumb}] ; onChange(nextArray)
 */
export const MediaUploader = ({ value = [], onChange, purpose = "review", max = 6, allowVideo = true, label = "Add photos or videos", compact = false, testId = "media-uploader" }) => {
  const enabled = useMediaEnabled();
  const [uploads, setUploads] = useState([]); // [{id, name, pct, error}]
  const galleryRef = useRef(null);
  const cameraRef = useRef(null);

  const handleFiles = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    const room = max - value.length - uploads.length;
    if (room <= 0) { toast.error(`Maximum ${max} files`); return; }
    const picked = list.slice(0, room);
    const results = [];
    await Promise.all(picked.map(async (file) => {
      const isVideo = file.type.startsWith("video/");
      if (isVideo && !allowVideo) { toast.error("Videos not allowed here"); return; }
      if (!isVideo && !file.type.startsWith("image/")) { toast.error(`${file.name}: only images/videos`); return; }
      const mb = file.size / (1024 * 1024);
      if (mb > (isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB)) { toast.error(`${file.name} is too large (max ${isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB} MB)`); return; }
      const id = `${Date.now()}-${Math.random()}`;
      setUploads((u) => [...u, { id, name: file.name, pct: 0 }]);
      try {
        const m = await uploadMedia(file, purpose, (pct) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, pct } : x))));
        results.push(m);
      } catch (err) {
        const msg = err?.response?.data?.detail || err?.response?.data?.error?.message || "Upload failed";
        toast.error(`${file.name}: ${msg}`);
      } finally {
        setUploads((u) => u.filter((x) => x.id !== id));
      }
    }));
    if (results.length) onChange([...value, ...results]);
  };

  const remove = async (m) => {
    onChange(value.filter((x) => x !== m));
    if (m.public_id) deleteMedia(m.public_id, m.type).catch(() => {});
  };

  if (enabled === false) {
    return (
      <div data-testid={`${testId}-disabled`} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> Photo & video uploads are being set up. Please try again a little later.
      </div>
    );
  }

  const size = compact ? "h-16 w-16" : "h-24 w-24 sm:h-28 sm:w-28";
  const canAdd = value.length + uploads.length < max;
  return (
    <div data-testid={testId}>
      <div className="flex flex-wrap gap-2">
        {value.map((m, i) => (
          <div key={m.public_id || m.url || i} className={`relative ${size}`} data-testid="media-item">
            <MediaThumb m={m} className="w-full h-full" />
            <button type="button" onClick={() => remove(m)} data-testid="media-remove" aria-label="Remove" className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center shadow hover:bg-red-600"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        {uploads.map((u) => (
          <div key={u.id} className={`${size} rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-[10px] text-slate-500 gap-1`} data-testid="media-uploading">
            <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> {u.pct}%
          </div>
        ))}
        {canAdd && (
          <>
            <button type="button" onClick={() => galleryRef.current?.click()} data-testid="media-add-button"
              className={`${size} rounded-lg border-2 border-dashed border-slate-300 hover:border-orange-500 hover:bg-orange-50 text-slate-500 hover:text-orange-700 flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors`}>
              <ImagePlus className="w-5 h-5" /> {compact ? "Add" : "Gallery"}
            </button>
            <button type="button" onClick={() => cameraRef.current?.click()} data-testid="media-camera-button"
              className={`${size} rounded-lg border-2 border-dashed border-slate-300 hover:border-orange-500 hover:bg-orange-50 text-slate-500 hover:text-orange-700 flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors sm:hidden`}>
              <Camera className="w-5 h-5" /> Camera
            </button>
          </>
        )}
      </div>
      <input ref={galleryRef} type="file" className="hidden" multiple accept={allowVideo ? "image/*,video/*" : "image/*"} onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} data-testid="media-file-input" />
      <input ref={cameraRef} type="file" className="hidden" accept={allowVideo ? "image/*,video/*" : "image/*"} capture="environment" onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
      {!compact && <p className="text-[11px] text-slate-400 mt-2">{label} · up to {max} files · photos ≤ {MAX_IMAGE_MB} MB{allowVideo ? `, videos ≤ ${MAX_VIDEO_MB} MB` : ""}. Tap to choose from your phone gallery or camera.</p>}
    </div>
  );
};

/** Simple lightbox for images & videos */
export const MediaLightbox = ({ items, index, onClose, onIndex }) => {
  if (index === null || index === undefined || !items?.length) return null;
  const m = items[index];
  const go = (d) => onIndex((index + d + items.length) % items.length);
  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4" onClick={onClose} data-testid="media-lightbox">
      <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={onClose} aria-label="Close"><X className="w-7 h-7" /></button>
      {items.length > 1 && <button className="absolute left-3 text-white/70 hover:text-white text-4xl px-3" onClick={(e) => { e.stopPropagation(); go(-1); }}>‹</button>}
      <div className="max-w-5xl max-h-[85vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {m.type === "video" ? <video src={m.url} controls autoPlay playsInline className="max-h-[85vh] max-w-full rounded-lg" />
          : <img src={m.url} alt="" referrerPolicy="no-referrer" className="max-h-[85vh] max-w-full rounded-lg object-contain" />}
      </div>
      {items.length > 1 && <button className="absolute right-3 text-white/70 hover:text-white text-4xl px-3" onClick={(e) => { e.stopPropagation(); go(1); }}>›</button>}
      <p className="absolute bottom-4 text-white/60 text-xs">{index + 1} / {items.length}</p>
    </div>
  );
};
