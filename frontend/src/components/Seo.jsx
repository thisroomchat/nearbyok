import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getSeoOverride } from "@/lib/nbk";
import { useSite } from "@/context/SiteContext";

const overrideCache = new Map();

// SEO helper: title, meta, canonical, OG/Twitter, robots + JSON-LD. Per-path admin overrides win over page defaults.
export const Seo = ({ title, description, canonical, jsonLd, image, noindex = false }) => {
  const { pathname } = useLocation();
  const { site } = useSite();
  const [ov, setOv] = useState(() => overrideCache.get(pathname) ?? null);

  useEffect(() => {
    const key = pathname.toLowerCase().replace(/\/+$/, "") || "/";
    if (overrideCache.has(key)) { setOv(overrideCache.get(key)); return; }
    getSeoOverride(key).then((r) => { overrideCache.set(key, r.override || null); setOv(r.override || null); }).catch(() => setOv(null));
  }, [pathname]);

  const finalTitle = ov?.title || title;
  const finalDesc = ov?.description || description || site.description;
  const finalCanonical = ov?.canonical || canonical;
  const finalImage = ov?.og_image || image || site.og_image_url;
  const finalNoindex = ov?.noindex || noindex;
  const jsonKey = JSON.stringify(jsonLd || null);

  useEffect(() => {
    if (finalTitle) document.title = finalTitle;
    const setMeta = (attr, key, content) => {
      let el = document.head.querySelector(`meta[${attr}="${key}"]`);
      if (!content) { if (el) el.remove(); return; }
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("name", "description", finalDesc);
    setMeta("name", "keywords", ov?.keywords || site.keywords);
    setMeta("name", "robots", finalNoindex ? "noindex, nofollow" : "index, follow, max-image-preview:large");
    setMeta("property", "og:site_name", site.name || "nearbyok");
    setMeta("property", "og:title", finalTitle);
    setMeta("property", "og:description", finalDesc);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", finalCanonical);
    setMeta("property", "og:image", finalImage);
    setMeta("name", "twitter:card", finalImage ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", finalTitle);
    setMeta("name", "twitter:description", finalDesc);
    setMeta("name", "twitter:image", finalImage);

    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.setAttribute("rel", "canonical"); document.head.appendChild(link); }
    if (finalCanonical) link.setAttribute("href", finalCanonical);

    const scripts = [];
    const blocks = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
    blocks.forEach((block) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.setAttribute("data-nbk-jsonld", "true");
      s.text = JSON.stringify(block);
      document.head.appendChild(s);
      scripts.push(s);
    });
    return () => scripts.forEach((s) => s.remove());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalTitle, finalDesc, finalCanonical, finalImage, finalNoindex, jsonKey, site.name, site.keywords, ov?.keywords]);

  return null;
};
