"""Advanced console: analytics, businesses manager, reviews/users moderation, leads export, SEO overrides, Google Trends -> nearby pages."""
import io
import csv
import re
import time
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import cloudinary.utils
from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from db import db
from auth import require_admin
from owner import get_settings, cloudinary_ready
from catalog_trends import TREND_KEYWORDS

logger = logging.getLogger("nearbyok.console")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def slugify(text):
    text = re.sub(r"[^\w\s-]", "", (text or "").lower()).strip()
    return re.sub(r"[\s_-]+", "-", text)


LOCAL_INTENT = re.compile(r"\b(nearby|near me|open now|around me|close to me|in my area)\b", re.I)


def map_query_to_category(q: str, cat_by_slug) -> Optional[str]:
    ql = q.lower()
    for keys, slug in TREND_KEYWORDS:
        if slug not in cat_by_slug:
            continue
        for k in keys:
            k = k.strip()
            # whole-word match; allow plural "s" and possessive
            if re.search(rf"\b{re.escape(k)}(s|'s)?\b", ql):
                return slug
    return None


def is_local_intent(q: str) -> bool:
    return bool(LOCAL_INTENT.search(q or ""))


def parse_percent(v):
    if v is None:
        return None
    s = str(v).strip().lower()
    if not s:
        return None
    if "breakout" in s:
        return 5000
    s = s.replace("%", "").replace(",", "").replace("+", "")
    try:
        return int(float(s))
    except ValueError:
        return None


def parse_interest(v):
    s = str(v or "").strip().replace("<", "").replace(",", "")
    try:
        return int(float(s))
    except ValueError:
        return 0


def parse_trends_csv(raw: bytes):
    """Accepts our 3-col CSV or raw Google Trends export (with preamble)."""
    text = raw.decode("utf-8-sig", errors="ignore")
    rows = list(csv.reader(io.StringIO(text)))
    out = []
    for r in rows:
        if not r or not r[0].strip():
            continue
        head = r[0].strip().lower()
        if head in ("query", "top", "rising", "category: all categories") or head.startswith("category:"):
            continue
        q = r[0].strip()
        if len(q) < 2 or len(q) > 80:
            continue
        interest, pct = 0, None
        for c in r[1:]:
            cs = str(c).strip()
            if "%" in cs or "breakout" in cs.lower():
                pct = parse_percent(cs)
            elif cs and interest == 0:
                interest = parse_interest(cs)
        out.append({"query": q, "interest": interest, "change_pct": pct})
    return out


def build_router(ctx):
    r = APIRouter(prefix="/api")
    CATEGORIES, CITIES = ctx["CATEGORIES"], ctx["CITIES"]
    CAT_BY_SLUG, CITY_BY_SLUG = ctx["CAT_BY_SLUG"], ctx["CITY_BY_SLUG"]
    format_business, haversine, LIVE, gen_faqs = ctx["format_business"], ctx["haversine"], ctx["LIVE"], ctx["gen_faqs"]
    ADMIN = [Depends(require_admin)]

    # ------------------------------------------------------------------ analytics
    @r.get("/admin/analytics", dependencies=ADMIN)
    async def analytics(days: int = 30):
        since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

        async def daily(coll, field="created_at", match=None):
            q = {field: {"$gte": since}}
            if match:
                q.update(match)
            rows = await db[coll].aggregate([{"$match": q}, {"$group": {"_id": {"$substr": [f"${field}", 0, 10]}, "n": {"$sum": 1}}}, {"$sort": {"_id": 1}}]).to_list(400)
            return [{"date": x["_id"], "n": x["n"]} for x in rows]

        by_cat = await db.leads.aggregate([{"$lookup": {"from": "businesses", "localField": "business_id", "foreignField": "id", "as": "b"}}, {"$unwind": "$b"},
                                           {"$group": {"_id": "$b.category", "n": {"$sum": 1}}}, {"$sort": {"n": -1}}, {"$limit": 12}]).to_list(12)
        by_city = await db.leads.aggregate([{"$lookup": {"from": "businesses", "localField": "business_id", "foreignField": "id", "as": "b"}}, {"$unwind": "$b"},
                                            {"$group": {"_id": "$b.city", "n": {"$sum": 1}}}, {"$sort": {"n": -1}}, {"$limit": 12}]).to_list(12)
        biz_by_cat = {x["_id"]: x["n"] async for x in db.businesses.aggregate([{"$match": {"source": {"$ne": "seed"}}}, {"$group": {"_id": "$category", "n": {"$sum": 1}}}])}
        biz_by_city = {x["_id"]: x["n"] async for x in db.businesses.aggregate([{"$match": {"source": {"$ne": "seed"}}}, {"$group": {"_id": "$city", "n": {"$sum": 1}}}])}
        claims = {x["_id"]: x["n"] async for x in db.claims.aggregate([{"$group": {"_id": "$status", "n": {"$sum": 1}}}])}
        sources = {x["_id"]: x["n"] async for x in db.businesses.aggregate([{"$group": {"_id": "$source", "n": {"$sum": 1}}}])}
        lead_types = {x["_id"]: x["n"] async for x in db.leads.aggregate([{"$group": {"_id": "$type", "n": {"$sum": 1}}}])}
        last_ingest = await db.ingest_log.find({}, {"_id": 0}).sort("at", -1).to_list(1)
        return {
            "days": days,
            "leads_daily": await daily("leads"), "users_daily": await daily("users"), "reviews_daily": await daily("reviews"), "claims_daily": await daily("claims"),
            "leads_by_category": [{"key": x["_id"], "name": CAT_BY_SLUG.get(x["_id"], {}).get("name", x["_id"]), "n": x["n"]} for x in by_cat],
            "leads_by_city": [{"key": x["_id"], "name": CITY_BY_SLUG.get(x["_id"], {}).get("name", x["_id"]), "n": x["n"]} for x in by_city],
            "businesses_by_category": [{"key": c["slug"], "name": c["name"], "n": biz_by_cat.get(c["slug"], 0)} for c in CATEGORIES],
            "businesses_by_city": [{"key": c["slug"], "name": c["name"], "n": biz_by_city.get(c["slug"], 0)} for c in CITIES],
            "claims": claims, "sources": sources, "lead_types": lead_types,
            "totals": {"businesses": await db.businesses.count_documents({}), "real_businesses": await db.businesses.count_documents({"source": {"$ne": "seed"}}),
                       "users": await db.users.count_documents({}), "reviews": await db.reviews.count_documents({}), "leads": await db.leads.count_documents({}),
                       "claimed": await db.businesses.count_documents({"claimed": True}), "pending_claims": claims.get("pending", 0),
                       "pending_submissions": await db.businesses.count_documents({"source": "owner", "status": "pending"}),
                       "trend_pages": await db.trend_queries.count_documents({"enabled": True}),
                       "categories": len(CATEGORIES), "cities": len(CITIES), "seo_pages": len(CATEGORIES) * len(CITIES),
                       "coverage_done": await db.ingest_log.count_documents({"count": {"$gt": 0}})},
            "last_ingest_at": last_ingest[0]["at"] if last_ingest else None,
        }

    # ------------------------------------------------------------------ businesses manager
    @r.get("/admin/businesses", dependencies=ADMIN)
    async def admin_businesses(q: str = "", category: str = "", city: str = "", source: str = "", status: str = "",
                               flag: str = "", page: int = 1, limit: int = 25, sort: str = "recent"):
        match = {}
        if q.strip():
            rx = {"$regex": re.escape(q.strip()), "$options": "i"}
            match["$or"] = [{"name": rx}, {"phone": rx}, {"address": rx}, {"slug": rx}, {"id": rx}, {"owner_email": rx}]
        if category:
            match["category"] = category
        if city:
            match["city"] = city
        if source:
            match["source"] = source
        if status:
            match["status"] = status
        if flag == "claimed":
            match["claimed"] = True
        elif flag == "sponsored":
            match["sponsored"] = True
        elif flag == "unverified":
            match["verified"] = {"$ne": True}
        sort_spec = {"recent": [("created_at", -1)], "rating": [("rating", -1)], "reviews": [("reviews_count", -1)],
                     "leads": [("leads_call", -1)], "name": [("name", 1)]}.get(sort, [("created_at", -1)])
        total = await db.businesses.count_documents(match)
        limit = max(5, min(limit, 100))
        docs = await db.businesses.find(match, {"_id": 0}).sort(sort_spec).skip((max(1, page) - 1) * limit).to_list(limit)
        items = []
        for d in docs:
            b = format_business(d)
            b.update({"created_at": d.get("created_at"), "google_updated_at": d.get("google_updated_at"), "owner_email": d.get("owner_email"),
                      "leads_whatsapp": d.get("leads_whatsapp", 0), "leads_enquiry": d.get("leads_enquiry", 0), "featured_until": d.get("featured_until")})
            items.append(b)
        return {"items": items, "total": total, "page": page, "pages": max(1, -(-total // limit))}

    class BizPatch(BaseModel):
        name: Optional[str] = Field(default=None, min_length=2, max_length=120)
        phone: Optional[str] = None
        website: Optional[str] = None
        address: Optional[str] = None
        area: Optional[str] = None
        description: Optional[str] = None
        verified: Optional[bool] = None
        sponsored: Optional[bool] = None
        status: Optional[str] = None  # approved | pending | rejected
        category: Optional[str] = None
        rating: Optional[float] = Field(default=None, ge=0, le=5)

    @r.patch("/admin/businesses/{business_id}", dependencies=ADMIN)
    async def patch_business(business_id: str, body: BizPatch):
        upd = {k: v for k, v in body.model_dump().items() if v is not None}
        if "status" in upd and upd["status"] not in ("approved", "pending", "rejected"):
            raise HTTPException(400, "Bad status")
        if "category" in upd and upd["category"] not in CAT_BY_SLUG:
            raise HTTPException(400, "Unknown category")
        if not upd:
            raise HTTPException(400, "Nothing to update")
        upd["admin_updated_at"] = now_iso()
        res = await db.businesses.update_one({"id": business_id}, {"$set": upd})
        if not res.matched_count:
            raise HTTPException(404, "Business not found")
        await db.admin_audit.insert_one({"type": "business_patch", "business_id": business_id, "changes": list(upd.keys()), "at": now_iso()})
        doc = await db.businesses.find_one({"id": business_id}, {"_id": 0})
        return format_business(doc)

    @r.delete("/admin/businesses/{business_id}", dependencies=ADMIN)
    async def delete_business(business_id: str):
        res = await db.businesses.delete_one({"id": business_id})
        if not res.deleted_count:
            raise HTTPException(404, "Business not found")
        await db.favorites.delete_many({"business_id": business_id})
        await db.reviews.delete_many({"business_id": business_id})
        await db.claims.delete_many({"business_id": business_id})
        await db.admin_audit.insert_one({"type": "business_delete", "business_id": business_id, "at": now_iso()})
        return {"ok": True}

    # ------------------------------------------------------------------ reviews & users
    @r.get("/admin/reviews", dependencies=ADMIN)
    async def admin_reviews(q: str = "", page: int = 1, limit: int = 30):
        match = {}
        if q.strip():
            rx = {"$regex": re.escape(q.strip()), "$options": "i"}
            match["$or"] = [{"text": rx}, {"author": rx}]
        total = await db.reviews.count_documents(match)
        rows = await db.reviews.find(match, {"_id": 0}).sort("created_at", -1).skip((max(1, page) - 1) * limit).to_list(limit)
        ids = [x["business_id"] for x in rows]
        bs = {d["id"]: d for d in await db.businesses.find({"id": {"$in": ids}}, {"_id": 0, "id": 1, "name": 1, "category": 1, "city": 1, "slug": 1}).to_list(len(ids) or 1)}
        for x in rows:
            b = bs.get(x["business_id"])
            x["business"] = {**b, "state": CITY_BY_SLUG.get(b["city"], {}).get("state")} if b else None
        return {"items": rows, "total": total, "pages": max(1, -(-total // limit))}

    @r.delete("/admin/reviews/{review_id}", dependencies=ADMIN)
    async def delete_review(review_id: str):
        res = await db.reviews.delete_one({"id": review_id})
        if not res.deleted_count:
            raise HTTPException(404, "Review not found")
        return {"ok": True}

    @r.get("/admin/users", dependencies=ADMIN)
    async def admin_users(q: str = "", page: int = 1, limit: int = 30):
        match = {}
        if q.strip():
            rx = {"$regex": re.escape(q.strip()), "$options": "i"}
            match["$or"] = [{"email": rx}, {"name": rx}]
        total = await db.users.count_documents(match)
        rows = await db.users.find(match, {"_id": 0}).sort("created_at", -1).skip((max(1, page) - 1) * limit).to_list(limit)
        ids = [u["user_id"] for u in rows]

        async def counts(coll, field="user_id"):
            return {x["_id"]: x["n"] async for x in db[coll].aggregate([{"$match": {field: {"$in": ids}}}, {"$group": {"_id": f"${field}", "n": {"$sum": 1}}}])}
        rv, fav, cl, own = await counts("reviews"), await counts("favorites"), await counts("claims"), await counts("businesses", "owner_user_id")
        for u in rows:
            u.update({"reviews": rv.get(u["user_id"], 0), "favorites": fav.get(u["user_id"], 0), "claims": cl.get(u["user_id"], 0), "listings": own.get(u["user_id"], 0)})
        return {"items": rows, "total": total, "pages": max(1, -(-total // limit))}

    @r.get("/admin/leads/export.csv", dependencies=ADMIN)
    async def export_leads():
        rows = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(20000)
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(["created_at", "type", "business_id", "business_name", "phone", "caller", "message"])
        for x in rows:
            w.writerow([x.get("created_at"), x.get("type"), x.get("business_id"), x.get("business_name"), x.get("phone"), x.get("caller") or "", (x.get("message") or "").replace("\n", " ")])
        buf.seek(0)
        return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=nearbyok-leads.csv"})

    @r.get("/admin/audit", dependencies=ADMIN)
    async def audit(limit: int = 100):
        return {"items": await db.admin_audit.find({}, {"_id": 0}).sort("at", -1).to_list(min(limit, 500))}

    # ------------------------------------------------------------------ SEO overrides + admin media signature
    class SeoOverride(BaseModel):
        path: str = Field(min_length=1, max_length=300)
        title: str = Field(default="", max_length=200)
        description: str = Field(default="", max_length=400)
        keywords: str = Field(default="", max_length=300)
        og_image: str = Field(default="", max_length=500)
        noindex: bool = False
        canonical: str = Field(default="", max_length=500)

    def norm_path(p):
        p = "/" + p.strip().strip("/")
        return p.lower()

    @r.get("/seo")
    async def seo_lookup(path: str = Query("/")):
        doc = await db.seo_overrides.find_one({"path": norm_path(path)}, {"_id": 0})
        return {"override": doc}

    @r.get("/admin/seo", dependencies=ADMIN)
    async def seo_list():
        return {"items": await db.seo_overrides.find({}, {"_id": 0}).sort("updated_at", -1).to_list(1000)}

    @r.put("/admin/seo", dependencies=ADMIN)
    async def seo_put(body: SeoOverride):
        doc = body.model_dump()
        doc["path"] = norm_path(doc["path"])
        doc["updated_at"] = now_iso()
        await db.seo_overrides.update_one({"path": doc["path"]}, {"$set": doc}, upsert=True)
        return doc

    @r.delete("/admin/seo", dependencies=ADMIN)
    async def seo_delete(path: str):
        res = await db.seo_overrides.delete_one({"path": norm_path(path)})
        return {"ok": bool(res.deleted_count)}

    @r.get("/admin/media/signature", dependencies=ADMIN)
    async def admin_media_signature(resource_type: str = "image"):
        if resource_type not in ("image", "video"):
            raise HTTPException(400, "Bad resource_type")
        s = await get_settings()
        if not cloudinary_ready(s):
            raise HTTPException(503, "Cloudinary not configured — add credentials in Settings first")
        c = s["cloudinary"]
        folder = "nearbyok/site"
        ts = int(time.time())
        sig = cloudinary.utils.api_sign_request({"timestamp": ts, "folder": folder}, c["api_secret"])
        return {"signature": sig, "timestamp": ts, "cloud_name": c["cloud_name"], "api_key": c["api_key"], "folder": folder,
                "resource_type": resource_type, "upload_url": f"https://api.cloudinary.com/v1_1/{c['cloud_name']}/{resource_type}/upload"}

    # ------------------------------------------------------------------ Google Trends -> nearby pages
    @r.post("/admin/trends/upload", dependencies=ADMIN)
    async def trends_upload(file: UploadFile = File(...), kind: str = Form("top"), region: str = Form("US")):
        if kind not in ("top", "rising"):
            raise HTTPException(400, "kind must be top or rising")
        raw = await file.read()
        if len(raw) > 2_000_000:
            raise HTTPException(400, "File too large")
        rows = parse_trends_csv(raw)
        if not rows:
            raise HTTPException(400, "No queries found in CSV")
        ts = now_iso()
        added = updated = 0
        for row in rows:
            slug = slugify(row["query"])
            if not slug:
                continue
            existing = await db.trend_queries.find_one({"slug": slug}, {"_id": 0})
            cat = map_query_to_category(row["query"], CAT_BY_SLUG)
            base = {"query": row["query"], "slug": slug, "region": region, "updated_at": ts, f"{kind}_interest": row["interest"], f"{kind}_change_pct": row["change_pct"]}
            if existing:
                sets = dict(base)
                sets["kinds"] = sorted(set((existing.get("kinds") or []) + [kind]))
                await db.trend_queries.update_one({"slug": slug}, {"$set": sets})
                updated += 1
            else:
                await db.trend_queries.insert_one({**base, "id": f"t-{uuid.uuid4().hex[:10]}", "kinds": [kind], "category": cat, "enabled": bool(cat) and is_local_intent(row["query"]),
                                                   "local_intent": is_local_intent(row["query"]),
                                                   "title": "", "intro": "", "created_at": ts, "views": 0})
                added += 1
        await db.admin_audit.insert_one({"type": "trends_upload", "kind": kind, "rows": len(rows), "added": added, "updated": updated, "at": ts})
        return {"parsed": len(rows), "added": added, "updated": updated}

    @r.get("/admin/trends", dependencies=ADMIN)
    async def trends_list():
        rows = await db.trend_queries.find({}, {"_id": 0}).sort([("enabled", -1), ("top_interest", -1), ("rising_change_pct", -1)]).to_list(2000)
        for x in rows:
            x["category_name"] = CAT_BY_SLUG.get(x.get("category") or "", {}).get("name")
        return {"items": rows, "categories": [{"slug": c["slug"], "name": c["name"]} for c in CATEGORIES]}

    class TrendPatch(BaseModel):
        category: Optional[str] = None
        enabled: Optional[bool] = None
        title: Optional[str] = Field(default=None, max_length=160)
        intro: Optional[str] = Field(default=None, max_length=2000)

    @r.patch("/admin/trends/{trend_id}", dependencies=ADMIN)
    async def trends_patch(trend_id: str, body: TrendPatch):
        upd = {k: v for k, v in body.model_dump().items() if v is not None}
        if "category" in upd:
            if upd["category"] == "":
                upd["category"] = None
            elif upd["category"] not in CAT_BY_SLUG:
                raise HTTPException(400, "Unknown category")
        if not upd:
            raise HTTPException(400, "Nothing to update")
        upd["updated_at"] = now_iso()
        res = await db.trend_queries.update_one({"id": trend_id}, {"$set": upd})
        if not res.matched_count:
            raise HTTPException(404, "Not found")
        return await db.trend_queries.find_one({"id": trend_id}, {"_id": 0})

    @r.delete("/admin/trends/{trend_id}", dependencies=ADMIN)
    async def trends_delete(trend_id: str):
        res = await db.trend_queries.delete_one({"id": trend_id})
        return {"ok": bool(res.deleted_count)}

    class BulkIn(BaseModel):
        ids: List[str]
        enabled: Optional[bool] = None
        category: Optional[str] = None

    @r.post("/admin/trends/bulk", dependencies=ADMIN)
    async def trends_bulk(body: BulkIn):
        upd = {}
        if body.enabled is not None:
            upd["enabled"] = body.enabled
        if body.category:
            if body.category not in CAT_BY_SLUG:
                raise HTTPException(400, "Unknown category")
            upd["category"] = body.category
        if not upd:
            raise HTTPException(400, "Nothing to update")
        res = await db.trend_queries.update_many({"id": {"$in": body.ids}}, {"$set": {**upd, "updated_at": now_iso()}})
        return {"modified": res.modified_count}

    # ---- public nearby pages
    PUBLIC_TQ = {"_id": 0, "id": 0, "created_at": 0}

    def nearest_city(lat, lng):
        return min(CITIES, key=lambda c: haversine(lat, lng, c["lat"], c["lng"]))

    def trend_title(t, cat):
        return t.get("title") or f"{t['query'].title()} — Best {cat['name']} Near You"

    @r.get("/nearby")
    async def nearby_index():
        rows = await db.trend_queries.find({"enabled": True, "category": {"$ne": None}}, PUBLIC_TQ).sort([("top_interest", -1), ("rising_change_pct", -1)]).to_list(500)
        groups = {}
        for t in rows:
            cat = CAT_BY_SLUG.get(t["category"])
            if not cat:
                continue
            g = groups.setdefault(cat["slug"], {"category": cat["slug"], "category_name": cat["name"], "icon": cat["icon"], "image": cat["images"][0], "queries": []})
            g["queries"].append({"query": t["query"], "slug": t["slug"], "interest": t.get("top_interest") or 0, "change_pct": t.get("rising_change_pct"), "kinds": t.get("kinds", [])})
        trending = sorted([t for t in rows if t.get("rising_change_pct")], key=lambda t: -(t.get("rising_change_pct") or 0))[:12]
        return {"groups": list(groups.values()), "total": len(rows),
                "trending": [{"query": t["query"], "slug": t["slug"], "change_pct": t.get("rising_change_pct"), "category": t["category"]} for t in trending],
                "cities": [{"slug": c["slug"], "name": c["name"], "state": c["state"], "abbr": c["abbr"]} for c in CITIES]}

    @r.get("/nearby/{slug}")
    async def nearby_page(slug: str, lat: Optional[float] = None, lng: Optional[float] = None, city: str = ""):
        t = await db.trend_queries.find_one({"slug": slug, "enabled": True}, PUBLIC_TQ)
        if not t or not t.get("category"):
            raise HTTPException(404, "Page not found")
        cat = CAT_BY_SLUG.get(t["category"])
        if not cat:
            raise HTTPException(404, "Page not found")
        located = lat is not None and lng is not None
        city_cfg = CITY_BY_SLUG.get(city) or (nearest_city(lat, lng) if located else CITY_BY_SLUG["new-york"])
        center_lat, center_lng = (lat, lng) if located else (city_cfg["lat"], city_cfg["lng"])
        docs = await db.businesses.find({"category": cat["slug"], "city": city_cfg["slug"], **LIVE}, {"_id": 0}).to_list(200)
        items = [format_business(d, center_lat, center_lng) for d in docs]
        if located:
            items.sort(key=lambda b: (b["distance"] if b["distance"] is not None else 999))
        else:
            items.sort(key=lambda b: (b["sponsored"], b["rating"], b["reviews_count"]), reverse=True)
        related = await db.trend_queries.find({"enabled": True, "slug": {"$ne": slug}, "category": {"$ne": None}}, PUBLIC_TQ).sort("top_interest", -1).to_list(200)
        same_cat = [x for x in related if x["category"] == cat["slug"]][:8]
        others = [x for x in related if x["category"] != cat["slug"]][:12]
        await db.trend_queries.update_one({"slug": slug}, {"$inc": {"views": 1}})
        q = t["query"]
        intro = t.get("intro") or (f"Searching for \"{q}\"? nearbyok lists {len(items)} {cat['name'].lower()} in {city_cfg['name']}, {city_cfg['abbr']} with phone numbers, "
                                   f"opening hours, ratings, photos and directions. {'Results are sorted by distance from your current location.' if located else 'Allow location access to see the closest options first, or pick another city below.'} "
                                   f"Data is sourced from Google and verified business owners, refreshed regularly.")
        return {
            "query": q, "slug": slug, "title": trend_title(t, cat), "intro": intro, "kinds": t.get("kinds", []),
            "interest": t.get("top_interest"), "change_pct": t.get("rising_change_pct"),
            "category": {"slug": cat["slug"], "name": cat["name"], "singular": cat["singular"], "icon": cat["icon"], "image": cat["images"][0], "services": cat["services"]},
            "city": {"slug": city_cfg["slug"], "name": city_cfg["name"], "state": city_cfg["state"], "state_name": city_cfg["state_name"], "abbr": city_cfg["abbr"], "lat": city_cfg["lat"], "lng": city_cfg["lng"]},
            "located": located, "center": {"lat": center_lat, "lng": center_lng},
            "count": len(items), "businesses": items[:40],
            "faqs": gen_faqs(cat, city_cfg, items) + [
                {"q": f"What does \"{q}\" mean on nearbyok?", "a": f"\"{q}\" is one of the most searched local queries in the US. This page shows {cat['name'].lower()} closest to you, using your device location when allowed, otherwise the city you pick."},
                {"q": f"How often is the {cat['name'].lower()} data updated?", "a": "Listings are pulled from Google Places and refreshed regularly; verified owners can update details anytime."}],
            "related": [{"query": x["query"], "slug": x["slug"]} for x in same_cat],
            "other_queries": [{"query": x["query"], "slug": x["slug"], "category": x["category"]} for x in others],
            "cities": [{"slug": c["slug"], "name": c["name"], "state": c["state"], "abbr": c["abbr"]} for c in CITIES],
        }

    return r
