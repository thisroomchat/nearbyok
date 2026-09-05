# PRD — nearbyok.com

## Original problem statement
Programmatic SEO local business directory (JustDial/Yelp style) for US cities. Blueprint asked for Next.js/Supabase/Vercel/Twilio/Mapbox; adapted to platform stack React + FastAPI + MongoDB. URL matrix `/[category]/[state]/[city]` + business detail pages. Data cached from Google Places (not per-request). Monetization: ads + featured/sponsored listings. Twilio DROPPED by user (paid) — real Google Places phone shown directly. JustDial-style SEO-rich detail page.

## User choices
- Data source: real Google Places API (key provided).
- Region: US cities.
- SEO: ALL JustDial sections (People searched for, Related Searches, overview, FAQs, nearby areas, popular cities, JSON-LD, meta, sitemap).
- Call tracking: NO Twilio (user decision, Jun 2026). Real business phone from Google Places shown directly; clicks logged free in `leads` collection.
- Maps: free Leaflet/OpenStreetMap.
- Simple design, advanced logic/architecture, realtime.

## Architecture
- Backend `server.py` (+ `auth.py`, `db.py`, `catalog_extra.py`): FastAPI + Motor/MongoDB. 20 categories × 32 US cities = 640 SEO pages; seeds missing combos on startup, seed rows deleted per combo once Google data lands. Live Google Places Text Search (New) ingestion via `POST /api/ingest`. Dynamic open-now computation per city timezone, haversine distance, programmatic SEO content generators (descriptions, FAQs, chips, related searches).
- Auth: Emergent-managed Google OAuth (`/api/auth/session|me|logout`, httpOnly cookie `session_token`). Admin: password in `.env` `ADMIN_PASSWORD`, header `X-Admin-Key`.
- User features: favorites (`/api/favorites`), reviews (`/api/businesses/{id}/reviews`, merged with Google reviews on detail), free listing (`/api/businesses/submit` → live instantly as pending/Unverified; admin approve→Verified, reject→hidden), `/api/my/listings|reviews`.
- Admin: `/api/admin/stats|leads|ingest-status|ingest|ingest-city|ingest-all (background job)|ingest-jobs/latest|submissions/{id}/{approve|reject|pending}`.
- Google ingest pulls photos (lh3 URIs), 5 reviews, editorial summary, neighbourhood from addressComponents, hours periods; owner submissions geocoded via free Nominatim.
- Endpoints: `/api/home`, `/api/catalog`, `/api/listing/{category}/{state}/{city}`, `/api/detail/{category}/{state}/{city}/{slug}`, `/api/leads` (GET/POST), `/api/ingest`, `/api/search`, `/api/sitemap.xml`, `/api/robots.txt`.
- Frontend (React SPA, react-router): Home, Listing, BusinessDetail (JustDial replica + Reviews + Save), Account (Saved/My Listings/My Reviews), ListBusiness (free listing form), Admin (Leads & Stats / Google Data ingest / Submissions), AuthCallback. SEO via `Seo.jsx` (document title/meta/canonical + injected JSON-LD: LocalBusiness/BreadcrumbList/FAQPage/ItemList).

## Personas
- Consumer searching local services (finds, filters, calls/WhatsApps businesses).
- Business owner (free listing + pay-per-call leads).

## Implemented (2026-06)
- Full programmatic SEO directory: home, listing, detail pages with all JustDial-style SEO blocks.
- 12 categories × 12 US cities matrix (144 listing pages), 1134 seeded businesses.
- Leaflet/OSM maps with category pins; distance + open-now logic.
- Show Number / WhatsApp / Directions / Enquiry lead capture → MongoDB `leads` collection (pay-per-call foundation).
- Live Google Places ingestion (verified: inserted real places for plumbers/austin).
- Dynamic sitemap.xml + robots.txt; JSON-LD structured data + meta tags.
- Tested: backend 100% (10 pytest), frontend 100%.

## Backlog
- P1: Scheduled monthly Google re-ingestion (cron) — admin one-tap + Ingest ALL exist.
- P2: True SSR/prerender for maximum SEO (platform is SPA — current SEO is client-side title/meta/JSON-LD).
- P2: Claim existing Google listing by owner; featured/sponsored paid upgrade; AdSense slots wiring.
- P2: Photo upload (object storage) for owner listings instead of URLs.

## Next tasks
- Let ingest-all finish (restart from /admin → Google Data → Ingest ALL (remaining); skip_done resumes).
- Owner claim flow for Google-sourced listings; featured upgrade.


## Changelog
- Jun 2026: Removed Twilio entirely (env vars, backend tracking_number logic, frontend copy). `/api/leads` now returns `{phone, lead_id}` with the direct Google Places number.
- Jun 2026 (iteration 2): Admin dashboard (password), Emergent Google login, favorites, user reviews, free listing flow with moderation, Google ingest with photos/reviews/location, +8 categories +20 cities (640 pages), Ingest ALL background job. Tested: 25/25 backend, all frontend flows pass (iteration_2.json).
