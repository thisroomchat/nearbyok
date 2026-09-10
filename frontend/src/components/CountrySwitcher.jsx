import { useState } from "react";
import { Globe, ChevronDown, Check, X } from "lucide-react";
import { useCountry } from "@/context/CountryContext";

export const CountrySwitcher = () => {
  const { cfg, countries, choose } = useCountry();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button data-testid="country-switcher-button" onClick={() => setOpen((v) => !v)} aria-label="Change country"
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-white px-2.5 py-2 rounded-lg hover:bg-white/10 transition-colors">
        <span className="text-base leading-none">{cfg.flag}</span>
        <span className="hidden sm:inline">{cfg.short}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div data-testid="country-switcher-menu" onMouseLeave={() => setOpen(false)}
          className="absolute right-0 mt-2 w-60 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-2 z-50">
          <p className="px-4 py-1.5 text-[11px] uppercase tracking-wide text-slate-400 flex items-center gap-1"><Globe className="w-3 h-3" /> Choose your country</p>
          {countries.map((c) => (
            <button key={c.code} data-testid={`country-option-${c.code}`} onClick={() => { setOpen(false); choose(c.code); }}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50 ${c.code === cfg.code ? "font-bold text-orange-600" : ""}`}>
              <span className="text-lg leading-none">{c.flag}</span>
              <span className="flex-1 text-left">{c.name}</span>
              {c.code === cfg.code && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/** "You seem to be in India — switch?" strip shown when detected country differs from the page's country. */
export const GeoBanner = () => {
  const { cfg, suggested, choose, dismiss } = useCountry();
  if (!suggested) return null;
  return (
    <div data-testid="geo-banner" className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-base leading-none">{suggested.flag}</span>
        <span>You seem to be browsing from <b>{suggested.name}</b>. You&apos;re viewing <b>{cfg.short}</b> listings.</span>
        <button data-testid="geo-banner-switch" onClick={() => choose(suggested.code)}
          className="font-bold text-orange-700 hover:text-orange-900 underline underline-offset-2">Switch to {suggested.short} →</button>
        <button data-testid="geo-banner-dismiss" onClick={dismiss} aria-label="Dismiss" className="ml-auto p-1 rounded hover:bg-amber-100"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
};
