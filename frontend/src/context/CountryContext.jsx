import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { COUNTRIES, byCode, ccFromPath, detectCountry, getSavedCountry, saveCountry, isBot } from "@/lib/countries";
import { getGeo } from "@/lib/nbk";

const Ctx = createContext({ cc: "us", cfg: COUNTRIES[0], prefix: "", p: (x) => x, suggested: null, dismiss: () => {}, choose: () => {} });

const DISMISS_KEY = "nbk_cc_dismissed";

/** Country scope = first URL segment (/in, /ae, /ca, /uk, /au; none = USA). Indeed-style sub-folders. */
export const CountryProvider = ({ children }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const cc = ccFromPath(pathname);
  const cfg = byCode(cc);
  const [suggested, setSuggested] = useState(null);

  useEffect(() => {
    if (isBot()) return; // never redirect crawlers (SEO safe)
    const saved = getSavedCountry();
    if (saved) { if (saved !== cc && !sessionStorage.getItem(DISMISS_KEY)) setSuggested(saved); return; }
    const apply = (guess) => {
      const g = guess || detectCountry() || "us";
      saveCountry(g);
      if (g === cc) return;
      if (pathname === "/" || pathname === "") navigate(`${byCode(g).prefix}/`, { replace: true });
      else setSuggested(g);
    };
    getGeo().then((r) => apply(r?.country)).catch(() => apply(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({
    cc, cfg, prefix: cfg.prefix, countries: COUNTRIES,
    p: (path) => `${cfg.prefix}${path.startsWith("/") ? path : `/${path}`}`,
    suggested: suggested && suggested !== cc ? byCode(suggested) : null,
    dismiss: () => { sessionStorage.setItem(DISMISS_KEY, "1"); saveCountry(cc); setSuggested(null); },
    choose: (code) => { saveCountry(code); setSuggested(null); navigate(`${byCode(code).prefix}/`); },
  }), [cc, cfg, suggested, navigate]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useCountry = () => useContext(Ctx);
