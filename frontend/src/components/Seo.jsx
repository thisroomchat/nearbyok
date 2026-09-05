import { useEffect } from "react";

// Lightweight SEO helper: sets title, meta, canonical + injects JSON-LD.
export const Seo = ({ title, description, canonical, jsonLd }) => {
  useEffect(() => {
    if (title) document.title = title;
    const setMeta = (attr, key, content) => {
      if (!content) return;
      let el = document.head.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", "website");
    setMeta("name", "twitter:card", "summary_large_image");

    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    if (canonical) link.setAttribute("href", canonical);

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
  }, [title, description, canonical, JSON.stringify(jsonLd)]);

  return null;
};
