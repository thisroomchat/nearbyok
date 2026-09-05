import React, { createContext, useContext, useEffect, useState } from "react";
import { getPublicSettings } from "@/lib/nbk";

const SiteCtx = createContext({ site: {}, mediaEnabled: false, loaded: false });

const ensureTag = (selector, create) => {
  let el = document.head.querySelector(selector);
  if (!el) { el = create(); document.head.appendChild(el); }
  return el;
};

/** Loads site-wide settings (favicon, GA, AdSense, verification, defaults) once and applies them to <head>. */
export const SiteProvider = ({ children }) => {
  const [state, setState] = useState({ site: {}, mediaEnabled: false, loaded: false });

  useEffect(() => {
    getPublicSettings().then((s) => {
      const site = s.site || {};
      setState({ site, mediaEnabled: !!s.media_enabled, loaded: true });
      if (site.favicon_url) {
        const link = ensureTag('link[rel="icon"]', () => { const l = document.createElement("link"); l.rel = "icon"; return l; });
        link.href = site.favicon_url;
        const apple = ensureTag('link[rel="apple-touch-icon"]', () => { const l = document.createElement("link"); l.rel = "apple-touch-icon"; return l; });
        apple.href = site.favicon_url;
      }
      const setMeta = (name, content) => {
        if (!content) return;
        const m = ensureTag(`meta[name="${name}"]`, () => { const x = document.createElement("meta"); x.name = name; return x; });
        m.content = content;
      };
      setMeta("google-site-verification", site.google_verification);
      setMeta("msvalidate.01", site.bing_verification);
      setMeta("keywords", site.keywords);
      if (site.twitter) setMeta("twitter:site", site.twitter.startsWith("@") ? site.twitter : `@${site.twitter}`);
      if (site.ga_id && !document.getElementById("nbk-ga")) {
        const s1 = document.createElement("script"); s1.id = "nbk-ga"; s1.async = true; s1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(site.ga_id)}`;
        document.head.appendChild(s1);
        const s2 = document.createElement("script");
        s2.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${site.ga_id.replace(/'/g, "")}');`;
        document.head.appendChild(s2);
      }
      if (site.adsense_client && !document.getElementById("nbk-adsense")) {
        const a = document.createElement("script"); a.id = "nbk-adsense"; a.async = true; a.crossOrigin = "anonymous";
        a.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(site.adsense_client)}`;
        document.head.appendChild(a);
      }
    }).catch(() => setState((s) => ({ ...s, loaded: true })));
  }, []);

  return <SiteCtx.Provider value={state}>{children}</SiteCtx.Provider>;
};

export const useSite = () => useContext(SiteCtx);
