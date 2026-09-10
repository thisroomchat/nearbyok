"""AI Trip Planner — Gemini (user key) + Google Places/Geocoding.

Exposes /api/trip/* endpoints. Generates a full, personalised, budget-aware,
transport-aware day-by-day itinerary with en-route "moments" (songs, photo/
video/reel spots, live-cover cues) even for non-stop journeys. Country-aware
(India vs USA etc.) suggestions. SEO route pages for popular routes.
"""
import os
import re
import json
import time
import asyncio
import hashlib
import logging
from datetime import datetime, timezone
from typing import List, Optional

import httpx
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

from db import db
from auth import get_current_user, optional_user, User

logger = logging.getLogger("nearbyok.trip")

GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
GOOGLE_KEY = os.environ.get("GOOGLE_MAPS_API_KEY") or os.environ.get("GOOGLE_PLACES_API_KEY", "")
# Primary pinned per integration playbook (2026-09); fallbacks used only when
# the primary returns transient 503/overload so the feature stays reliable.
MODEL = "gemini-3.8-flash"
MODEL_FALLBACKS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-flash-latest"]

router = APIRouter(prefix="/api/trip")

# ------------------------------------------------------------------ metadata
INTERESTS = [
    {"key": "spiritual", "label": "Spiritual / Religious", "icon": "🛕", "hint": "Gurdwaras, temples, churches, shrines"},
    {"key": "photography", "label": "Photography", "icon": "📸", "hint": "Best photo & viewpoint spots"},
    {"key": "foodie", "label": "Foodie", "icon": "🍽️", "hint": "Local dishes, dhabas, cafes"},
    {"key": "adventure", "label": "Adventure", "icon": "🧗", "hint": "Treks, rafting, thrill"},
    {"key": "nature", "label": "Nature / Scenic", "icon": "🏔️", "hint": "Lakes, valleys, waterfalls"},
    {"key": "history", "label": "History / Culture", "icon": "🏛️", "hint": "Forts, museums, heritage"},
    {"key": "music_movies", "label": "Music & Movies", "icon": "🎬", "hint": "Songs & films for the vibe"},
    {"key": "shopping", "label": "Shopping", "icon": "🛍️", "hint": "Markets & local crafts"},
    {"key": "family", "label": "Family-friendly", "icon": "👨‍👩‍👧", "hint": "Kid & elder friendly stops"},
    {"key": "backpacker", "label": "Budget Backpacker", "icon": "🎒", "hint": "Cheapest routes & stays"},
    {"key": "nightlife", "label": "Nightlife", "icon": "🌃", "hint": "Bars, live music, late spots"},
    {"key": "wellness", "label": "Wellness / Relax", "icon": "🧘", "hint": "Spas, calm, slow travel"},
]
INTEREST_LABELS = {i["key"]: i["label"] for i in INTERESTS}

TRANSPORTS = [
    {"key": "car", "label": "Car", "icon": "🚗"},
    {"key": "bus", "label": "Bus", "icon": "🚌"},
    {"key": "train", "label": "Train", "icon": "🚆"},
    {"key": "motorcycle", "label": "Motorcycle", "icon": "🏍️"},
    {"key": "flight", "label": "Flight", "icon": "✈️"},
    {"key": "walking", "label": "Walking / Cycling", "icon": "🚶"},
]

COUNTRIES = [
    {"key": "IN", "label": "India", "currency": "INR", "symbol": "₹"},
    {"key": "US", "label": "United States", "currency": "USD", "symbol": "$"},
    {"key": "GB", "label": "United Kingdom", "currency": "GBP", "symbol": "£"},
    {"key": "AE", "label": "UAE", "currency": "AED", "symbol": "د.إ"},
    {"key": "CA", "label": "Canada", "currency": "CAD", "symbol": "C$"},
    {"key": "AU", "label": "Australia", "currency": "AUD", "symbol": "A$"},
]
COUNTRY_MAP = {c["key"]: c for c in COUNTRIES}

POPULAR_ROUTES = [
    {"origin": "Chandigarh", "destination": "Leh Ladakh", "transport": "car", "country": "IN", "days": 6},
    {"origin": "Delhi", "destination": "Manali", "transport": "car", "country": "IN", "days": 3},
    {"origin": "Manali", "destination": "Leh", "transport": "motorcycle", "country": "IN", "days": 4},
    {"origin": "Mumbai", "destination": "Goa", "transport": "car", "country": "IN", "days": 3},
    {"origin": "Bangalore", "destination": "Ooty", "transport": "car", "country": "IN", "days": 2},
    {"origin": "Jaipur", "destination": "Udaipur", "transport": "car", "country": "IN", "days": 2},
    {"origin": "Hoshiarpur", "destination": "Chandigarh", "transport": "bus", "country": "IN", "days": 1},
    {"origin": "Delhi", "destination": "Agra", "transport": "train", "country": "IN", "days": 1},
    {"origin": "Los Angeles", "destination": "Las Vegas", "transport": "car", "country": "US", "days": 3},
    {"origin": "San Francisco", "destination": "Yosemite", "transport": "car", "country": "US", "days": 2},
    {"origin": "New York", "destination": "Niagara Falls", "transport": "car", "country": "US", "days": 2},
    {"origin": "Chicago", "destination": "Nashville", "transport": "car", "country": "US", "days": 2},
]


def slugify(s: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")
    return re.sub(r"-+", "-", s)


def route_slug(origin: str, destination: str) -> str:
    return f"{slugify(origin)}-to-{slugify(destination)}"


# ------------------------------------------------------------------ schema (Gemini structured output)
class Song(BaseModel):
    title: str = ""
    artist: str = ""
    why: str = ""


class Movie(BaseModel):
    title: str = ""
    why: str = ""


class Moment(BaseModel):
    at: str = Field(default="", description="landmark / stretch on the route")
    kind: str = Field(default="photo", description="photo | video | reel | live | view")
    title: str = ""
    tip: str = Field(default="", description="what & how to capture")


class TimelineItem(BaseModel):
    time: str = Field(default="", description="clock time like 08:30 or 'Hour 1'")
    type: str = Field(default="travel", description="travel|breakfast|lunch|dinner|snack|stop|explore|activity|rest|checkin")
    title: str = ""
    location: str = Field(default="", description="place / area name for map & Google Places")
    description: str = ""
    duration: str = ""
    cost: str = Field(default="", description="approx cost with currency symbol")
    tips: List[str] = Field(default_factory=list)
    songs: List[Song] = Field(default_factory=list)
    movies: List[Movie] = Field(default_factory=list)
    moments: List[Moment] = Field(default_factory=list)


class DayPlan(BaseModel):
    day: int = 1
    title: str = ""
    summary: str = ""
    items: List[TimelineItem] = Field(default_factory=list)


class BudgetLine(BaseModel):
    category: str = ""
    amount: str = ""
    note: str = ""


class FAQ(BaseModel):
    q: str = ""
    a: str = ""


class TripPlan(BaseModel):
    title: str = ""
    summary: str = ""
    origin: str = ""
    destination: str = ""
    transport: str = ""
    country: str = ""
    currency: str = ""
    distance_text: str = ""
    duration_text: str = ""
    best_time_to_visit: str = ""
    total_budget: str = ""
    days: List[DayPlan] = Field(default_factory=list)
    budget_breakdown: List[BudgetLine] = Field(default_factory=list)
    packing: List[str] = Field(default_factory=list)
    tips: List[str] = Field(default_factory=list)
    faqs: List[FAQ] = Field(default_factory=list)


# ------------------------------------------------------------------ request models
class PlanRequest(BaseModel):
    origin: str = Field(min_length=2, max_length=120)
    destination: str = Field(min_length=2, max_length=120)
    transport: str = "car"
    country: str = "IN"
    days: int = Field(default=0, ge=0, le=30)  # 0 = let AI decide
    budget: Optional[float] = None
    travelers: int = Field(default=2, ge=1, le=30)
    interests: List[str] = Field(default_factory=list)
    pace: str = Field(default="balanced")
    notes: str = Field(default="", max_length=500)


# ------------------------------------------------------------------ gemini
_genai_client = None


def _client():
    global _genai_client
    if _genai_client is None:
        if not GEMINI_KEY:
            raise HTTPException(500, "GEMINI_API_KEY not configured")
        from google import genai
        _genai_client = genai.Client(api_key=GEMINI_KEY)
    return _genai_client


def _build_prompt(req: PlanRequest) -> str:
    country = COUNTRY_MAP.get(req.country, COUNTRY_MAP["IN"])
    interests = [INTEREST_LABELS.get(k, k) for k in req.interests] or ["general highlights"]
    days_line = (f"Plan exactly {req.days} day(s)." if req.days
                 else "Decide the ideal number of days from the distance and transport.")
    budget_line = (f"Total budget is about {country['symbol']}{int(req.budget)} for the whole trip "
                   f"for {req.travelers} traveler(s); keep the plan within it and show where money goes."
                   if req.budget else f"Suggest a sensible budget for {req.travelers} traveler(s).")
    return f"""You are an expert local travel planner. Build a practical, realistic, {country['label']}-context trip plan.

TRIP
- From: {req.origin}
- To: {req.destination}
- Traveling by: {req.transport}
- Country / audience: {country['label']} (currency {country['currency']} {country['symbol']}). Use {country['label']} culture, food, language flavour, road/rail realities.
- Travelers: {req.travelers}. Pace: {req.pace}. {days_line}
- {budget_line}
- Traveler interests (sort & weight the plan toward these): {', '.join(interests)}
- Extra user notes: {req.notes or 'none'}

WHAT TO PRODUCE (fill the JSON schema)
- title + short summary, distance_text, duration_text, best_time_to_visit, total_budget (with {country['symbol']}).
- days[]: each day has a timeline items[] IN ORDER with clock time, type, title, location (real place/area name usable on Google Maps), description, duration, cost (with {country['symbol']}).
- For meals put type breakfast/lunch/dinner/snack with a REAL, well-known eatery/dhaba/cafe name in that town when possible.
- budget_breakdown[]: Transport, Food, Stay, Activities, Misc — amounts add up near total_budget.
- packing[], tips[], and 4-6 SEO faqs[] (common questions travelers google for this route).

CRITICAL — EN-ROUTE MOMENTS (this is the app's magic):
Even if the vehicle is NON-STOP (e.g. a 3-hour non-stop bus that never halts), you MUST still fill every travel segment with moments[]:
- which SONG(s) to play on which stretch (songs[] with title, artist, why — pick songs that match {country['label']} taste & the scenery/mood),
- WHERE to shoot a window photo / video / reel / go live (moments[] with at=landmark, kind=photo|video|reel|live|view, tip=how to capture),
- what scenery/landmark to watch for.
Never leave a long travel segment without at least 1 song and 1 moment.
If interest includes Music & Movies, also suggest a movie set in / about the destination (movies[]).
If interest includes Spiritual, prioritise gurdwaras/temples/churches on the way.

Return ONLY the JSON object matching the schema. No markdown, no commentary. Use realistic {country['symbol']} costs."""


async def _generate(req: PlanRequest) -> dict:
    from google.genai import types
    prompt = _build_prompt(req)
    client = _client()

    def _cfg(with_schema: bool):
        if with_schema:
            return types.GenerateContentConfig(temperature=0.55, response_mime_type="application/json",
                                               response_schema=TripPlan)
        return types.GenerateContentConfig(temperature=0.55, response_mime_type="application/json")

    last_err = None
    for model in MODEL_FALLBACKS:
        cfg = _cfg(True)
        for attempt in range(2):
            try:
                resp = await client.aio.models.generate_content(model=model, contents=prompt, config=cfg)
                plan = TripPlan.model_validate_json(resp.text)
                if not plan.days:
                    raise ValueError("no days")
                logger.info(f"trip plan generated via {model}")
                return plan.model_dump()
            except Exception as e:  # noqa
                msg = str(e)
                last_err = msg
                logger.warning(f"gemini {model} attempt {attempt+1} failed: {msg[:160]}")
                transient = ("503" in msg or "UNAVAILABLE" in msg or "overload" in msg.lower()
                             or "high demand" in msg.lower() or "429" in msg or "RESOURCE_EXHAUSTED" in msg)
                if transient:
                    if attempt == 0:
                        await asyncio.sleep(1.5)
                        continue
                    break  # move to next fallback model
                # schema rejected / bad output -> retry once schema-less on same model
                if attempt == 0:
                    cfg = _cfg(False)
                    await asyncio.sleep(0.5)
                    continue
                break
    raise HTTPException(503, f"AI is busy right now, please retry in a moment. ({(last_err or '')[:120]})")


# ------------------------------------------------------------------ google places / geocode
async def _geocode(client: httpx.AsyncClient, address: str):
    cached = await db.trip_geo_cache.find_one({"q": address}, {"_id": 0, "lat": 1, "lng": 1})
    if cached:
        return cached.get("lat"), cached.get("lng")
    lat = lng = None
    try:
        r = await client.get("https://maps.googleapis.com/maps/api/geocode/json",
                             params={"address": address, "key": GOOGLE_KEY})
        j = r.json()
        if j.get("status") == "OK" and j.get("results"):
            loc = j["results"][0]["geometry"]["location"]
            lat, lng = loc["lat"], loc["lng"]
    except Exception as e:
        logger.warning(f"geocode failed for {address}: {e}")
    if lat is not None:
        await db.trip_geo_cache.update_one({"q": address}, {"$set": {"q": address, "lat": lat, "lng": lng}}, upsert=True)
    return lat, lng


async def _place_lookup(client: httpx.AsyncClient, query: str):
    """Return one real place {name, rating, address, maps_url} via Places Text Search (New)."""
    cached = await db.trip_place_cache.find_one({"q": query}, {"_id": 0, "data": 1})
    if cached:
        return cached.get("data")
    data = None
    try:
        r = await client.post(
            "https://places.googleapis.com/v1/places:searchText",
            headers={"X-Goog-Api-Key": GOOGLE_KEY,
                     "X-Goog-FieldMask": "places.displayName,places.rating,places.formattedAddress,places.googleMapsUri,places.userRatingCount",
                     "Content-Type": "application/json"},
            json={"textQuery": query, "pageSize": 1},
        )
        j = r.json()
        places = j.get("places") or []
        if places:
            p = places[0]
            data = {
                "name": (p.get("displayName") or {}).get("text", ""),
                "rating": p.get("rating"),
                "reviews": p.get("userRatingCount"),
                "address": p.get("formattedAddress", ""),
                "maps_url": p.get("googleMapsUri", ""),
            }
    except Exception as e:
        logger.warning(f"place lookup failed for {query}: {e}")
    if data:
        await db.trip_place_cache.update_one({"q": query}, {"$set": {"q": query, "data": data}}, upsert=True)
    return data


async def _enrich(plan: dict, destination: str):
    """Add map waypoints (geocoded) + real place info for meal/stop items."""
    async with httpx.AsyncClient(timeout=20) as client:
        # collect unique locations in order
        seen, ordered = set(), []
        for day in plan.get("days", []):
            for it in day.get("items", []):
                loc = (it.get("location") or "").strip()
                if loc and loc.lower() not in seen:
                    seen.add(loc.lower())
                    ordered.append((loc, it.get("type", "")))
        ordered = ordered[:18]

        # geocode origin + destination + waypoints concurrently
        geo_targets = [plan.get("origin") or "", destination] + [f"{l}, {destination}" if l.lower() not in destination.lower() else l for l, _ in ordered]
        geo_res = await asyncio.gather(*[_geocode(client, t) for t in geo_targets if t])
        waypoints = []
        idx = 0
        labels = [plan.get("origin"), destination] + [l for l, _ in ordered]
        types_ = ["origin", "destination"] + [t for _, t in ordered]
        for (lat, lng), label, typ in zip(geo_res, labels, types_):
            if lat is not None:
                waypoints.append({"name": label, "lat": lat, "lng": lng, "type": typ})
        plan["map"] = {"waypoints": waypoints,
                       "center": (waypoints[len(waypoints)//2] if waypoints else None)}

        # enrich meal/stop items with a real place (limit to control latency/quota)
        food_types = {"breakfast", "lunch", "dinner", "snack", "stop", "checkin", "explore"}
        enrich_items = []
        for day in plan.get("days", []):
            for it in day.get("items", []):
                if it.get("type") in food_types and it.get("location"):
                    enrich_items.append(it)
        enrich_items = enrich_items[:8]
        queries = [f"{(it.get('title') or it.get('type'))} {it.get('location')}" for it in enrich_items]
        results = await asyncio.gather(*[_place_lookup(client, q) for q in queries]) if queries else []
        for it, res in zip(enrich_items, results):
            if res and res.get("name"):
                it["place"] = res
    return plan


# ------------------------------------------------------------------ cache key
def _plan_key(req: PlanRequest) -> str:
    raw = json.dumps({
        "o": slugify(req.origin), "d": slugify(req.destination), "t": req.transport,
        "c": req.country, "days": req.days, "b": req.budget, "trav": req.travelers,
        "i": sorted(req.interests), "p": req.pace, "n": req.notes.strip().lower(),
    }, sort_keys=True)
    return hashlib.sha256(raw.encode()).hexdigest()[:24]


# ------------------------------------------------------------------ endpoints
@router.get("/meta")
async def trip_meta():
    return {"interests": INTERESTS, "transports": TRANSPORTS, "countries": COUNTRIES,
            "popular_routes": [{**r, "slug": route_slug(r["origin"], r["destination"])} for r in POPULAR_ROUTES]}


@router.get("/popular")
async def trip_popular():
    return {"routes": [{**r, "slug": route_slug(r["origin"], r["destination"])} for r in POPULAR_ROUTES]}


@router.post("/plan")
async def trip_plan(req: PlanRequest, user: Optional[User] = Depends(optional_user)):
    key = _plan_key(req)
    cached = await db.trip_plans.find_one({"key": key}, {"_id": 0})
    if cached and cached.get("plan"):
        await db.trip_plans.update_one({"key": key}, {"$inc": {"hits": 1}})
        return {"cached": True, "id": cached["id"], "slug": cached.get("slug"), "plan": cached["plan"]}

    plan = await _generate(req)
    plan = await _enrich(plan, req.destination)

    import uuid
    doc = {
        "id": str(uuid.uuid4()), "key": key, "slug": route_slug(req.origin, req.destination),
        "request": req.model_dump(), "plan": plan, "hits": 1,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": (user.email if user else None),
    }
    await db.trip_plans.insert_one(doc)
    return {"cached": False, "id": doc["id"], "slug": doc["slug"], "plan": plan}


@router.get("/route/{slug}")
async def trip_route(slug: str):
    """SEO canonical route page. Uses/creates a default plan for the popular route."""
    match = next((r for r in POPULAR_ROUTES if route_slug(r["origin"], r["destination"]) == slug), None)
    if not match:
        raise HTTPException(404, "Unknown route")
    existing = await db.trip_routes.find_one({"slug": slug}, {"_id": 0})
    if existing and existing.get("plan"):
        return {"slug": slug, "route": match, "plan": existing["plan"]}
    req = PlanRequest(origin=match["origin"], destination=match["destination"],
                      transport=match["transport"], country=match["country"], days=match["days"],
                      travelers=2, interests=["nature", "foodie", "photography"], pace="balanced")
    plan = await _generate(req)
    plan = await _enrich(plan, req.destination)
    await db.trip_routes.update_one({"slug": slug}, {"$set": {
        "slug": slug, "route": match, "plan": plan, "created_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"slug": slug, "route": match, "plan": plan}


@router.post("/save")
async def trip_save(body: dict, user: User = Depends(get_current_user)):
    plan_id = body.get("id")
    if not plan_id:
        raise HTTPException(400, "id required")
    src = await db.trip_plans.find_one({"id": plan_id}, {"_id": 0})
    if not src:
        raise HTTPException(404, "Plan not found")
    import uuid
    saved = {"id": str(uuid.uuid4()), "user_email": user.email, "plan_id": plan_id,
             "slug": src.get("slug"), "request": src.get("request"), "plan": src.get("plan"),
             "saved_at": datetime.now(timezone.utc).isoformat()}
    await db.trip_saved.update_one({"user_email": user.email, "plan_id": plan_id},
                                   {"$setOnInsert": saved}, upsert=True)
    return {"saved": True}


@router.get("/saved")
async def trip_saved(user: User = Depends(get_current_user)):
    items = await db.trip_saved.find({"user_email": user.email}, {"_id": 0}).sort("saved_at", -1).to_list(100)
    return {"items": items}


@router.delete("/saved/{saved_id}")
async def trip_saved_delete(saved_id: str, user: User = Depends(get_current_user)):
    await db.trip_saved.delete_one({"id": saved_id, "user_email": user.email})
    return {"deleted": True}
