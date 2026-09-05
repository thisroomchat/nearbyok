"""Owner features: site settings (Cloudinary), signed media uploads, claim listing flow, owner edits."""
import time
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional

import cloudinary
import cloudinary.utils
import cloudinary.uploader
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

from db import db
from auth import get_current_user, require_admin, User

logger = logging.getLogger("nearbyok.owner")

SETTINGS_ID = "site"
MEDIA_PURPOSES = ("review", "listing", "claim", "site")
EDITABLE_FIELDS = ("phone", "website", "description", "services", "open_hour", "close_hour",
                   "closed_sunday", "is_24_7", "weekday_descriptions", "tagline", "email", "social")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------
DEFAULT_SETTINGS = {
    "id": SETTINGS_ID,
    "cloudinary": {"cloud_name": "", "api_key": "", "api_secret": ""},
    "site": {"name": "nearbyok", "title_suffix": "nearbyok.com", "description": "", "keywords": "", "favicon_url": "", "og_image_url": "",
             "home_title": "", "home_description": "", "twitter": "", "google_verification": "", "bing_verification": "",
             "ga_id": "", "adsense_client": "", "robots_extra": "", "canonical_base": "https://nearbyok.com"},
}


async def get_settings() -> dict:
    doc = await db.settings.find_one({"id": SETTINGS_ID}, {"_id": 0})
    if not doc:
        return dict(DEFAULT_SETTINGS)
    merged = {**DEFAULT_SETTINGS, **doc}
    merged["cloudinary"] = {**DEFAULT_SETTINGS["cloudinary"], **(doc.get("cloudinary") or {})}
    merged["site"] = {**DEFAULT_SETTINGS["site"], **(doc.get("site") or {})}
    return merged


def cloudinary_ready(s: dict) -> bool:
    c = s.get("cloudinary") or {}
    return bool(c.get("cloud_name") and c.get("api_key") and c.get("api_secret"))


def mask_settings(s: dict) -> dict:
    c = dict(s.get("cloudinary") or {})
    secret = c.pop("api_secret", "") or ""
    c["has_secret"] = bool(secret)
    c["secret_hint"] = f"••••{secret[-4:]}" if secret else ""
    return {**s, "cloudinary": c, "media_enabled": cloudinary_ready(s)}


class Media(BaseModel):
    url: str
    public_id: str = ""
    type: str = "image"  # image | video
    thumb: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None


def clean_media(items: List[Media], limit: int) -> List[dict]:
    out = []
    for m in items[:limit]:
        if not m.url.startswith("https://"):
            continue
        t = "video" if m.type == "video" else "image"
        thumb = m.thumb
        if t == "video" and not thumb and "/video/upload/" in m.url:
            # Cloudinary auto-generates a jpg poster frame for videos.
            thumb = m.url.rsplit(".", 1)[0] + ".jpg"
        out.append({"url": m.url, "public_id": m.public_id, "type": t, "thumb": thumb,
                    "width": m.width, "height": m.height, "duration": m.duration})
    return out


def build_router(format_business, with_state, CAT_BY_SLUG, CITY_BY_SLUG):
    r = APIRouter(prefix="/api")

    # ------------------------------ settings ------------------------------
    @r.get("/settings/public")
    async def public_settings():
        s = await get_settings()
        return {"media_enabled": cloudinary_ready(s), "site": s["site"]}

    @r.get("/admin/settings", dependencies=[Depends(require_admin)])
    async def admin_get_settings():
        return mask_settings(await get_settings())

    class SettingsIn(BaseModel):
        cloudinary: Optional[dict] = None
        site: Optional[dict] = None

    @r.put("/admin/settings", dependencies=[Depends(require_admin)])
    async def admin_put_settings(body: SettingsIn):
        cur = await get_settings()
        if body.cloudinary is not None:
            c = {k: (body.cloudinary.get(k) or "").strip() for k in ("cloud_name", "api_key")}
            new_secret = (body.cloudinary.get("api_secret") or "").strip()
            c["api_secret"] = new_secret or cur["cloudinary"].get("api_secret", "")
            cur["cloudinary"] = c
        if body.site is not None:
            cur["site"] = {**cur["site"], **{k: (v if isinstance(v, str) else v) for k, v in body.site.items() if k in DEFAULT_SETTINGS["site"]}}
        cur["updated_at"] = now_iso()
        await db.settings.update_one({"id": SETTINGS_ID}, {"$set": cur}, upsert=True)
        return mask_settings(cur)

    @r.post("/admin/settings/cloudinary-test", dependencies=[Depends(require_admin)])
    async def cloudinary_test():
        s = await get_settings()
        if not cloudinary_ready(s):
            raise HTTPException(400, "Cloudinary not configured")
        c = s["cloudinary"]
        try:
            import cloudinary.api
            cloudinary.config(cloud_name=c["cloud_name"], api_key=c["api_key"], api_secret=c["api_secret"], secure=True)
            res = cloudinary.api.ping()
            return {"ok": True, "status": res.get("status", "ok")}
        except Exception as e:
            raise HTTPException(400, f"Cloudinary test failed: {str(e)[:200]}")

    # ------------------------------ media ------------------------------
    @r.get("/media/signature")
    async def media_signature(resource_type: str = Query("image"), purpose: str = Query("review"),
                              user: User = Depends(get_current_user)):
        if resource_type not in ("image", "video"):
            raise HTTPException(400, "resource_type must be image or video")
        if purpose not in MEDIA_PURPOSES:
            raise HTTPException(400, "Invalid purpose")
        s = await get_settings()
        if not cloudinary_ready(s):
            raise HTTPException(503, "Media uploads are not enabled yet")
        c = s["cloudinary"]
        folder = f"nearbyok/{purpose}/{user.user_id}"
        ts = int(time.time())
        params = {"timestamp": ts, "folder": folder}
        sig = cloudinary.utils.api_sign_request(params, c["api_secret"])
        return {"signature": sig, "timestamp": ts, "cloud_name": c["cloud_name"], "api_key": c["api_key"],
                "folder": folder, "resource_type": resource_type,
                "upload_url": f"https://api.cloudinary.com/v1_1/{c['cloud_name']}/{resource_type}/upload"}

    class DeleteIn(BaseModel):
        public_id: str
        resource_type: str = "image"

    @r.post("/media/delete")
    async def media_delete(body: DeleteIn, user: User = Depends(get_current_user)):
        if not body.public_id.startswith(f"nearbyok/") or f"/{user.user_id}/" not in body.public_id + "/":
            raise HTTPException(403, "Not your asset")
        s = await get_settings()
        if cloudinary_ready(s):
            c = s["cloudinary"]
            try:
                cloudinary.config(cloud_name=c["cloud_name"], api_key=c["api_key"], api_secret=c["api_secret"], secure=True)
                cloudinary.uploader.destroy(body.public_id, resource_type=body.resource_type, invalidate=True)
            except Exception as e:
                logger.warning(f"cloudinary destroy failed: {e}")
        return {"ok": True}

    # ------------------------------ claims ------------------------------
    class ClaimIn(BaseModel):
        role: str = Field(default="owner", max_length=40)
        full_name: str = Field(min_length=2, max_length=80)
        phone: str = Field(min_length=7, max_length=30)
        email: str = Field(default="", max_length=120)
        website: str = Field(default="", max_length=200)
        message: str = Field(default="", max_length=1500)
        proof_media: List[Media] = []

    @r.post("/businesses/{business_id}/claim")
    async def claim_business(business_id: str, body: ClaimIn, user: User = Depends(get_current_user)):
        biz = await db.businesses.find_one({"id": business_id}, {"_id": 0})
        if not biz:
            raise HTTPException(404, "Business not found")
        if biz.get("owner_user_id") == user.user_id:
            raise HTTPException(400, "You already own this listing")
        if biz.get("owner_user_id"):
            raise HTTPException(409, "This listing is already claimed. Contact support if you believe this is a mistake.")
        if await db.claims.find_one({"business_id": business_id, "user_id": user.user_id, "status": "pending"}):
            raise HTTPException(409, "You already have a pending claim for this listing")
        doc = {
            "id": f"c-{uuid.uuid4().hex[:12]}", "business_id": business_id, "business_name": biz["name"],
            "category": biz["category"], "city": biz["city"], "slug": biz["slug"],
            "user_id": user.user_id, "user_email": user.email, "user_name": user.name,
            "role": body.role, "full_name": body.full_name.strip(), "phone": body.phone.strip(),
            "email": body.email.strip(), "website": body.website.strip(), "message": body.message.strip(),
            "proof_media": clean_media(body.proof_media, 5),
            "phone_matches": _digits(body.phone)[-7:] == _digits(biz.get("phone", ""))[-7:] if biz.get("phone") else None,
            "status": "pending", "created_at": now_iso(),
        }
        await db.claims.insert_one(dict(doc))
        await db.businesses.update_one({"id": business_id}, {"$set": {"claim_status": "pending"}})
        return {"id": doc["id"], "status": "pending"}

    @r.get("/my/claims")
    async def my_claims(user: User = Depends(get_current_user)):
        rows = await db.claims.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
        ids = [c["business_id"] for c in rows]
        docs = {d["id"]: d for d in await db.businesses.find({"id": {"$in": ids}}, {"_id": 0}).to_list(100)}
        return {"items": [{**c, "business": with_state(format_business(docs[c["business_id"]]))} for c in rows if c["business_id"] in docs]}

    @r.get("/admin/claims", dependencies=[Depends(require_admin)])
    async def admin_claims(status: str = Query("")):
        q = {"status": status} if status else {}
        rows = await db.claims.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
        counts = {x["_id"]: x["n"] async for x in db.claims.aggregate([{"$group": {"_id": "$status", "n": {"$sum": 1}}}])}
        for c in rows:
            c["state"] = CITY_BY_SLUG.get(c["city"], {}).get("state")
        return {"items": rows, "counts": counts}

    class DecisionIn(BaseModel):
        note: str = ""

    @r.post("/admin/claims/{claim_id}/{action}", dependencies=[Depends(require_admin)])
    async def decide_claim(claim_id: str, action: str, body: DecisionIn = DecisionIn()):
        if action not in ("approve", "reject", "revoke"):
            raise HTTPException(400, "Bad action")
        claim = await db.claims.find_one({"id": claim_id}, {"_id": 0})
        if not claim:
            raise HTTPException(404, "Claim not found")
        ts = now_iso()
        if action == "approve":
            await db.claims.update_one({"id": claim_id}, {"$set": {"status": "approved", "decided_at": ts, "note": body.note}})
            await db.claims.update_many({"business_id": claim["business_id"], "id": {"$ne": claim_id}, "status": "pending"},
                                        {"$set": {"status": "rejected", "decided_at": ts, "note": "Another claim was approved"}})
            await db.businesses.update_one({"id": claim["business_id"]}, {"$set": {
                "owner_user_id": claim["user_id"], "owner_email": claim["user_email"], "owner_name": claim["full_name"],
                "claimed": True, "claim_status": "approved", "claimed_at": ts, "verified": True, "status": "approved"}})
        elif action == "reject":
            await db.claims.update_one({"id": claim_id}, {"$set": {"status": "rejected", "decided_at": ts, "note": body.note}})
            still = await db.claims.count_documents({"business_id": claim["business_id"], "status": "pending"})
            if not still:
                await db.businesses.update_one({"id": claim["business_id"], "claimed": {"$ne": True}}, {"$set": {"claim_status": "rejected"}})
        else:  # revoke ownership
            await db.claims.update_one({"id": claim_id}, {"$set": {"status": "revoked", "decided_at": ts, "note": body.note}})
            await db.businesses.update_one({"id": claim["business_id"], "owner_user_id": claim["user_id"]},
                                           {"$set": {"claimed": False, "claim_status": "revoked"},
                                            "$unset": {"owner_user_id": "", "owner_email": "", "owner_name": ""}})
        return {"id": claim_id, "status": (await db.claims.find_one({"id": claim_id}, {"_id": 0, "status": 1}))["status"]}

    # ------------------------------ owner edits ------------------------------
    class OwnerUpdate(BaseModel):
        phone: Optional[str] = Field(default=None, max_length=30)
        website: Optional[str] = Field(default=None, max_length=200)
        email: Optional[str] = Field(default=None, max_length=120)
        tagline: Optional[str] = Field(default=None, max_length=120)
        description: Optional[str] = Field(default=None, max_length=3000)
        services: Optional[List[str]] = None
        open_hour: Optional[int] = Field(default=None, ge=0, le=23)
        close_hour: Optional[int] = Field(default=None, ge=1, le=24)
        closed_sunday: Optional[bool] = None
        is_24_7: Optional[bool] = None
        weekday_descriptions: Optional[List[str]] = None
        social: Optional[dict] = None
        media: Optional[List[Media]] = None  # owner photos & videos

    async def _owned(business_id, user):
        biz = await db.businesses.find_one({"id": business_id}, {"_id": 0})
        if not biz:
            raise HTTPException(404, "Business not found")
        if biz.get("owner_user_id") != user.user_id:
            raise HTTPException(403, "You do not manage this listing")
        return biz

    @r.get("/my/listings/{business_id}")
    async def my_listing_detail(business_id: str, user: User = Depends(get_current_user)):
        biz = await _owned(business_id, user)
        return {"business": with_state(format_business(biz)), "raw": {k: biz.get(k) for k in EDITABLE_FIELDS},
                "owner_media": biz.get("owner_media", []), "google_images": biz.get("google_images") or ([] if biz.get("source") != "google" else biz.get("images", []))}

    @r.put("/my/listings/{business_id}")
    async def update_my_listing(business_id: str, body: OwnerUpdate, user: User = Depends(get_current_user)):
        biz = await _owned(business_id, user)
        upd = {}
        for k in EDITABLE_FIELDS:
            v = getattr(body, k, None)
            if v is None:
                continue
            if isinstance(v, str):
                v = v.strip()
            if k == "services":
                v = [s.strip() for s in v if s and s.strip()][:16]
            if k == "weekday_descriptions":
                v = [s.strip() for s in v if s and s.strip()][:7]
            upd[k] = v
        if body.media is not None:
            media = clean_media(body.media, 20)
            upd["owner_media"] = media
            google_images = biz.get("google_images")
            if google_images is None:
                google_images = biz.get("images", []) if biz.get("source") == "google" else []
                upd["google_images"] = google_images
            owner_imgs = [m["url"] for m in media if m["type"] == "image"]
            cat_defaults = CAT_BY_SLUG.get(biz["category"], {}).get("images", [])
            upd["images"] = (owner_imgs + [g for g in google_images if g not in cat_defaults]) or google_images or cat_defaults
            upd["videos"] = [m for m in media if m["type"] == "video"]
        if not upd:
            raise HTTPException(400, "Nothing to update")
        upd["owner_updated_at"] = now_iso()
        await db.businesses.update_one({"id": business_id}, {"$set": upd})
        biz = await db.businesses.find_one({"id": business_id}, {"_id": 0})
        return {"business": with_state(format_business(biz)), "owner_media": biz.get("owner_media", [])}

    return r


def _digits(s: str) -> str:
    return "".join(ch for ch in (s or "") if ch.isdigit())
