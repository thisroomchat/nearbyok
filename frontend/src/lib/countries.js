// Mirror of backend/countries.py (static so routing works before any API call).
export const COUNTRIES = [
  { code: "us", name: "United States", short: "USA", flag: "🇺🇸", prefix: "", symbol: "$", unit: "mi", hreflang: "en-US", regionLabel: "State" },
  { code: "in", name: "India", short: "India", flag: "🇮🇳", prefix: "/in", symbol: "₹", unit: "km", hreflang: "en-IN", regionLabel: "State" },
  { code: "ae", name: "United Arab Emirates", short: "UAE", flag: "🇦🇪", prefix: "/ae", symbol: "AED ", unit: "km", hreflang: "en-AE", regionLabel: "Emirate" },
  { code: "ca", name: "Canada", short: "Canada", flag: "🇨🇦", prefix: "/ca", symbol: "C$", unit: "km", hreflang: "en-CA", regionLabel: "Province" },
  { code: "uk", name: "United Kingdom", short: "UK", flag: "🇬🇧", prefix: "/uk", symbol: "£", unit: "mi", hreflang: "en-GB", regionLabel: "Region" },
  { code: "au", name: "Australia", short: "Australia", flag: "🇦🇺", prefix: "/au", symbol: "A$", unit: "km", hreflang: "en-AU", regionLabel: "State" },
];
export const COUNTRY_CODES = COUNTRIES.filter((c) => c.prefix).map((c) => c.code);
export const byCode = (code) => COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];

export const ccFromPath = (pathname) => {
  const seg = (pathname || "/").split("/")[1];
  return COUNTRY_CODES.includes(seg) ? seg : "us";
};

const TZ = [
  ["in", /^Asia\/(Kolkata|Calcutta)$/], ["ae", /^Asia\/Dubai$/], ["uk", /^Europe\/(London|Belfast)$/],
  ["au", /^Australia\//],
  ["ca", /^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns|Montreal|Moncton|Whitehorse|Yellowknife)$|^Canada\//],
];
const LANG = { "en-IN": "in", "hi": "in", "pa": "in", "en-AE": "ae", "ar-AE": "ae", "en-CA": "ca", "fr-CA": "ca", "en-GB": "uk", "en-AU": "au" };

// Free, client-side country guess: timezone first, then browser language. No paid geo-IP.
export const detectCountry = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    for (const [cc, re] of TZ) if (re.test(tz)) return cc;
    if (/^America\//.test(tz) || /^US\//.test(tz) || tz === "Pacific/Honolulu") return "us";
    for (const l of navigator.languages || [navigator.language]) if (LANG[l]) return LANG[l];
  } catch { /* ignore */ }
  return null;
};

export const isBot = () => /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|lighthouse|headless/i.test(navigator.userAgent || "");

const KEY = "nbk_cc";
export const getSavedCountry = () => {
  const m = document.cookie.match(new RegExp(`(?:^|; )${KEY}=([a-z]{2})`));
  return m ? m[1] : null;
};
export const saveCountry = (cc) => { document.cookie = `${KEY}=${cc}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`; };
