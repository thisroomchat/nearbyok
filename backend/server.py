"""nearbyok.com — Programmatic SEO Local Business Directory backend."""
import os
import re
import uuid
import random
import hashlib
import logging
import asyncio
from datetime import datetime, timezone
from math import radians, sin, cos, sqrt, atan2
from typing import List, Optional, Annotated

import httpx
from fastapi import FastAPI, APIRouter, HTTPException, Query, Request, Depends
from fastapi.responses import Response, PlainTextResponse
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict

from db import client, db
from auth import router as auth_router, get_current_user, optional_user, require_admin, User
from catalog_extra import EXTRA_CATEGORIES, EXTRA_CITIES
from owner import build_router as build_owner_router, Media, clean_media, EDITABLE_FIELDS as OWNER_EDITABLE, get_settings
from admin_extra import build_router as build_console_router
from catalog_trends import TREND_CATEGORIES

GOOGLE_KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("nearbyok")

app = FastAPI(title="nearbyok.com API")
api = APIRouter(prefix="/api")

PyObjectId = Annotated[str, BeforeValidator(str)]

# ---------------------------------------------------------------------------
# Static config: categories & cities (the programmatic SEO matrix seeds)
# ---------------------------------------------------------------------------
COFFEE = ["https://images.unsplash.com/photo-1563808642296-39d7022e2de1?crop=entropy&cs=srgb&fm=jpg&q=85",
          "https://images.unsplash.com/photo-1777467180589-917bbf04ee79?crop=entropy&cs=srgb&fm=jpg&q=85",
          "https://images.unsplash.com/photo-1636028277333-b3e4b0a4c081?crop=entropy&cs=srgb&fm=jpg&q=85"]
REST = ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?crop=entropy&cs=srgb&fm=jpg&q=85",
        "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?crop=entropy&cs=srgb&fm=jpg&q=85",
        "https://images.unsplash.com/photo-1592861956120-e524fc739696?crop=entropy&cs=srgb&fm=jpg&q=85"]
PLUMB = ["https://images.unsplash.com/photo-1676210134188-4c05dd172f89?crop=entropy&cs=srgb&fm=jpg&q=85",
         "https://images.unsplash.com/photo-1676210133055-eab6ef033ce3?crop=entropy&cs=srgb&fm=jpg&q=85"]
DENT = ["https://images.unsplash.com/photo-1629909613654-28e377c37b09?crop=entropy&cs=srgb&fm=jpg&q=85",
        "https://images.unsplash.com/photo-1704455306251-b4634215d98f?crop=entropy&cs=srgb&fm=jpg&q=85"]
AUTO = ["https://images.unsplash.com/photo-1615906655593-ad0386982a0f?crop=entropy&cs=srgb&fm=jpg&q=85",
        "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?crop=entropy&cs=srgb&fm=jpg&q=85"]
SUPER = ["https://images.unsplash.com/photo-1604719312566-8912e9227c6a?crop=entropy&cs=srgb&fm=jpg&q=85",
         "https://images.unsplash.com/photo-1578916171728-46686eac8d58?crop=entropy&cs=srgb&fm=jpg&q=85"]
GYM = ["https://images.unsplash.com/photo-1637430308606-86576d8fef3c?crop=entropy&cs=srgb&fm=jpg&q=85",
       "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?crop=entropy&cs=srgb&fm=jpg&q=85"]
SALON = ["https://images.unsplash.com/photo-1600948836101-f9ffda59d250?crop=entropy&cs=srgb&fm=jpg&q=85",
         "https://images.unsplash.com/photo-1626379501846-0df4067b8bb9?crop=entropy&cs=srgb&fm=jpg&q=85"]
PHARM = ["https://images.unsplash.com/photo-1576091358783-a212ec293ff3?crop=entropy&cs=srgb&fm=jpg&q=85",
         "https://images.unsplash.com/photo-1580281657527-47f249e8f4df?crop=entropy&cs=srgb&fm=jpg&q=85"]
ELEC = ["https://images.unsplash.com/photo-1758101755915-462eddc23f57?crop=entropy&cs=srgb&fm=jpg&q=85",
        "https://images.unsplash.com/photo-1601462904263-f2fa0c851cb9?crop=entropy&cs=srgb&fm=jpg&q=85"]
CITY_IMG = ["https://images.unsplash.com/photo-1695168790836-dfd7228b7fa2?crop=entropy&cs=srgb&fm=jpg&q=85",
            "https://images.unsplash.com/photo-1606661403337-ddcadaa22f16?crop=entropy&cs=srgb&fm=jpg&q=85",
            "https://images.unsplash.com/photo-1605969836886-9c59acd3ea7a?crop=entropy&cs=srgb&fm=jpg&q=85"]

CATEGORIES = [
    {"slug": "plumbers", "name": "Plumbers", "singular": "Plumber", "icon": "wrench", "images": PLUMB,
     "services": ["Emergency Leak Repair", "Drain Cleaning", "Water Heater Install", "Pipe Fitting", "Sewer Line Repair", "Faucet & Fixture Install"]},
    {"slug": "electricians", "name": "Electricians", "singular": "Electrician", "icon": "zap", "images": ELEC,
     "services": ["Wiring & Rewiring", "Panel Upgrade", "Lighting Installation", "EV Charger Setup", "Emergency Electrical", "Ceiling Fan Install"]},
    {"slug": "coffee-shops", "name": "Coffee Shops", "singular": "Coffee Shop", "icon": "coffee", "images": COFFEE,
     "services": ["Espresso & Latte", "Cold Brew", "Fresh Pastries", "Breakfast Menu", "Free WiFi", "Outdoor Seating"]},
    {"slug": "dentists", "name": "Dentists", "singular": "Dentist", "icon": "smile", "images": DENT,
     "services": ["Teeth Cleaning", "Root Canal", "Teeth Whitening", "Dental Implants", "Braces & Aligners", "Emergency Dental"]},
    {"slug": "auto-repair", "name": "Auto Repair", "singular": "Auto Repair Shop", "icon": "car", "images": AUTO,
     "services": ["Oil Change", "Brake Repair", "Engine Diagnostics", "Tire Replacement", "AC Service", "Transmission Repair"]},
    {"slug": "restaurants", "name": "Restaurants", "singular": "Restaurant", "icon": "utensils", "images": REST,
     "services": ["Dine In", "Takeout", "Home Delivery", "Family Dining", "Bar & Cocktails", "Catering"]},
    {"slug": "supermarkets", "name": "Supermarkets", "singular": "Supermarket", "icon": "shopping-cart", "images": SUPER,
     "services": ["Fresh Produce", "Grocery Delivery", "Bakery", "Deli Counter", "Household Essentials", "Organic Foods"]},
    {"slug": "locksmiths", "name": "Locksmiths", "singular": "Locksmith", "icon": "key", "images": ELEC,
     "services": ["Emergency Lockout", "Rekeying", "Lock Installation", "Car Key Replacement", "Safe Opening", "Smart Lock Setup"]},
    {"slug": "pharmacy", "name": "Pharmacies", "singular": "Pharmacy", "icon": "pill", "images": PHARM,
     "services": ["Prescription Refills", "24/7 Service", "Vaccinations", "Health Consultation", "Home Delivery", "OTC Medicines"]},
    {"slug": "gyms", "name": "Gyms", "singular": "Gym", "icon": "dumbbell", "images": GYM,
     "services": ["Weight Training", "Cardio Zone", "Personal Training", "Group Classes", "24 Hour Access", "Sauna & Steam"]},
    {"slug": "salons", "name": "Hair Salons", "singular": "Hair Salon", "icon": "scissors", "images": SALON,
     "services": ["Haircut & Styling", "Hair Coloring", "Keratin Treatment", "Beard Grooming", "Bridal Makeup", "Spa & Facial"]},
    {"slug": "storage-units", "name": "Storage Units", "singular": "Storage Facility", "icon": "package", "images": SUPER,
     "services": ["Climate Controlled Units", "24/7 Access", "Drive-Up Storage", "Vehicle Storage", "Business Storage", "Moving Supplies"]},
]
CATEGORIES += EXTRA_CATEGORIES
CATEGORIES += TREND_CATEGORIES
CAT_BY_SLUG = {c["slug"]: c for c in CATEGORIES}

CITIES = [
    {"slug": "new-york", "name": "New York", "state": "new-york", "state_name": "New York", "abbr": "NY", "lat": 40.7128, "lng": -74.0060, "tz": -4,
     "areas": ["Manhattan", "Brooklyn", "Queens", "Bronx", "Harlem", "SoHo", "Chelsea", "Upper East Side", "Williamsburg", "Astoria"]},
    {"slug": "los-angeles", "name": "Los Angeles", "state": "california", "state_name": "California", "abbr": "CA", "lat": 34.0522, "lng": -118.2437, "tz": -7,
     "areas": ["Hollywood", "Santa Monica", "Downtown LA", "Venice", "Silver Lake", "Koreatown", "Echo Park", "Culver City", "Westwood", "Pasadena"]},
    {"slug": "chicago", "name": "Chicago", "state": "illinois", "state_name": "Illinois", "abbr": "IL", "lat": 41.8781, "lng": -87.6298, "tz": -5,
     "areas": ["The Loop", "Lincoln Park", "Wicker Park", "Hyde Park", "Lakeview", "River North", "Logan Square", "Pilsen", "Gold Coast", "Bucktown"]},
    {"slug": "houston", "name": "Houston", "state": "texas", "state_name": "Texas", "abbr": "TX", "lat": 29.7604, "lng": -95.3698, "tz": -5,
     "areas": ["Downtown", "Midtown", "The Heights", "Montrose", "River Oaks", "Galleria", "Memorial", "Katy", "Sugar Land", "Pearland"]},
    {"slug": "phoenix", "name": "Phoenix", "state": "arizona", "state_name": "Arizona", "abbr": "AZ", "lat": 33.4484, "lng": -112.0740, "tz": -7,
     "areas": ["Downtown Phoenix", "Scottsdale", "Tempe", "Mesa", "Chandler", "Glendale", "Arcadia", "Ahwatukee", "Paradise Valley", "Gilbert"]},
    {"slug": "philadelphia", "name": "Philadelphia", "state": "pennsylvania", "state_name": "Pennsylvania", "abbr": "PA", "lat": 39.9526, "lng": -75.1652, "tz": -4,
     "areas": ["Center City", "Fishtown", "South Philly", "University City", "Old City", "Northern Liberties", "Manayunk", "Rittenhouse", "Fairmount", "Kensington"]},
    {"slug": "san-antonio", "name": "San Antonio", "state": "texas", "state_name": "Texas", "abbr": "TX", "lat": 29.4241, "lng": -98.4936, "tz": -5,
     "areas": ["Downtown", "Alamo Heights", "Stone Oak", "The Pearl", "Southtown", "Medical Center", "Northwest Side", "King William", "Leon Valley", "Helotes"]},
    {"slug": "san-diego", "name": "San Diego", "state": "california", "state_name": "California", "abbr": "CA", "lat": 32.7157, "lng": -117.1611, "tz": -7,
     "areas": ["Gaslamp Quarter", "La Jolla", "Pacific Beach", "North Park", "Hillcrest", "Little Italy", "Mission Valley", "Coronado", "Chula Vista", "Ocean Beach"]},
    {"slug": "dallas", "name": "Dallas", "state": "texas", "state_name": "Texas", "abbr": "TX", "lat": 32.7767, "lng": -96.7970, "tz": -5,
     "areas": ["Downtown", "Uptown", "Deep Ellum", "Bishop Arts", "Oak Lawn", "Highland Park", "Plano", "Frisco", "Irving", "Richardson"]},
    {"slug": "austin", "name": "Austin", "state": "texas", "state_name": "Texas", "abbr": "TX", "lat": 30.2672, "lng": -97.7431, "tz": -5,
     "areas": ["Downtown", "South Congress", "East Austin", "Zilker", "Hyde Park", "The Domain", "Barton Hills", "Mueller", "Round Rock", "Cedar Park"]},
    {"slug": "miami", "name": "Miami", "state": "florida", "state_name": "Florida", "abbr": "FL", "lat": 25.7617, "lng": -80.1918, "tz": -4,
     "areas": ["South Beach", "Brickell", "Wynwood", "Little Havana", "Coral Gables", "Coconut Grove", "Downtown", "Design District", "Doral", "Kendall"]},
    {"slug": "seattle", "name": "Seattle", "state": "washington", "state_name": "Washington", "abbr": "WA", "lat": 47.6062, "lng": -122.3321, "tz": -7,
     "areas": ["Capitol Hill", "Ballard", "Fremont", "Downtown", "Queen Anne", "South Lake Union", "West Seattle", "Green Lake", "Wallingford", "Belltown"]},
]
CITIES += EXTRA_CITIES
CITY_BY_SLUG = {c["slug"]: c for c in CITIES}
LIVE = {"status": {"$ne": "rejected"}}

BIZ_PREFIX = ["Prime", "Elite", "All-Star", "Metro", "Reliable", "Golden", "Summit", "Liberty", "Premier", "Sunrise",
              "Pioneer", "Evergreen", "First Choice", "Blue Ribbon", "Ace", "Cornerstone", "Trusted", "Rapid", "Star", "Peak"]
BIZ_SUFFIX = ["Co.", "& Sons", "Group", "Services", "Center", "Experts", "Pros", "LLC", "Hub", "Works"]

# ---------------------------------------------------------------------------
def slugify(text: str) -> str:
    text = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    return re.sub(r"[\s_-]+", "-", text)


def haversine(lat1, lng1, lat2, lng2):
    R = 3958.8  # miles
    dlat, dlng = radians(lat2 - lat1), radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return round(R * 2 * atan2(sqrt(a), sqrt(1 - a)), 1)


def is_open_now(biz, tz_offset):
    if biz.get("is_24_7"):
        return True, "Open 24 hours"
    now = datetime.now(timezone.utc)
    local_hour = (now.hour + tz_offset) % 24
    oh, ch = biz.get("open_hour", 9), biz.get("close_hour", 21)
    if oh <= local_hour < ch:
        return True, f"Open now · Closes {ch % 12 or 12} {'AM' if ch < 12 else 'PM'}"
    return False, f"Closed · Opens {oh % 12 or 12} {'AM' if oh < 12 else 'PM'}"


def hours_table(biz):
    if biz.get("is_24_7"):
        return {d: "Open 24 hours" for d in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]}
    oh, ch = biz.get("open_hour", 9), biz.get("close_hour", 21)
    o = f"{oh % 12 or 12}:00 {'AM' if oh < 12 else 'PM'}"
    c = f"{ch % 12 or 12}:00 {'AM' if ch < 12 else 'PM'}"
    tbl = {d: f"{o} - {c}" for d in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]}
    tbl["Sunday"] = "Closed" if biz.get("closed_sunday") else f"{o} - {c}"
    return tbl


def format_business(doc, center_lat=None, center_lng=None):
    cat = CAT_BY_SLUG.get(doc["category"], {})
    city = CITY_BY_SLUG.get(doc["city"], {})
    open_now, hours_status = is_open_now(doc, city.get("tz", -5))
    dist = None
    if center_lat is not None and doc.get("lat"):
        dist = haversine(center_lat, center_lng, doc["lat"], doc["lng"])
    return {
        "id": doc["id"], "slug": doc["slug"], "name": doc["name"],
        "category": doc["category"], "category_name": cat.get("name"), "category_singular": cat.get("singular"),
        "icon": cat.get("icon"), "state": doc["city"] and city.get("state"), "state_name": city.get("state_name"),
        "city": doc["city"], "city_name": city.get("name"), "abbr": city.get("abbr"),
        "rating": doc["rating"], "reviews_count": doc["reviews_count"],
        "phone": doc["phone"], "address": doc["address"], "area": doc.get("area"),
        "website": doc.get("website"), "lat": doc.get("lat"), "lng": doc.get("lng"),
        "images": doc.get("images", []), "price_level": doc.get("price_level", 2),
        "verified": doc.get("verified", False), "sponsored": doc.get("sponsored", False),
        "years": doc.get("years", 5), "source": doc.get("source", "seed"),
        "status": doc.get("status", "approved"),
        "open_now": open_now, "hours_status": hours_status, "is_24_7": doc.get("is_24_7", False),
        "distance": dist,
        "google_maps_uri": doc.get("google_maps_uri"), "editorial_summary": doc.get("editorial_summary"),
        "description": doc.get("description"), "own_services": doc.get("services"),
        "leads_call": doc.get("leads_call", 0),
        "videos": doc.get("videos", []), "owner_media": doc.get("owner_media", []),
        "claimed": bool(doc.get("claimed")), "claim_status": doc.get("claim_status"),
        "tagline": doc.get("tagline"), "email": doc.get("email"), "social": doc.get("social"),
        "owner_user_id": doc.get("owner_user_id"),
    }


# ---------------------------------------------------------------------------
# Programmatic SEO content generators
# ---------------------------------------------------------------------------
def gen_description(cat, city, count, top_rated=None):
    n = cat["name"]
    return (f"Looking for the best {n} in {city['name']}, {city['abbr']}? nearbyok.com lists {count} top-rated "
            f"{n.lower()} across {city['name']} and nearby areas, complete with verified phone numbers, ratings, "
            f"reviews, opening hours and directions. Whether you need a highly-rated {cat['singular'].lower()} in "
            f"{', '.join(city['areas'][:3])} or an option open right now, our directory helps you compare and connect "
            f"instantly. {('Currently, ' + top_rated + ' is the highest-rated choice among locals. ') if top_rated else ''}"
            f"Every listing is refreshed regularly so you always get accurate contact details and real customer feedback.")


def gen_faqs(cat, city, businesses):
    n, cn = cat["name"], city["name"]
    top = max(businesses, key=lambda b: (b["rating"], b["reviews_count"]))["name"] if businesses else "our top listing"
    cheapest = min(businesses, key=lambda b: b.get("price_level", 2))["name"] if businesses else top
    open247 = next((b["name"] for b in businesses if b.get("is_24_7")), None)
    faqs = [
        {"q": f"Which is the best rated {cat['singular'].lower()} in {cn}?",
         "a": f"According to nearbyok.com ratings, {top} is currently among the top-rated {n.lower()} in {cn}, {city['abbr']} based on customer reviews and overall rating."},
        {"q": f"How many {n.lower()} are listed in {cn}?",
         "a": f"There are {len(businesses)} {n.lower()} listed in {cn} on nearbyok.com, each with verified contact details, ratings and opening hours."},
        {"q": f"Which {cat['singular'].lower()} in {cn} is most affordable?",
         "a": f"Based on our data, {cheapest} offers competitive pricing among {n.lower()} in {cn}. We recommend calling ahead to confirm current rates."},
        {"q": f"Are there any 24 hour {n.lower()} in {cn}?",
         "a": (f"Yes. {open247} operates 24 hours in {cn}. You can call them any time using the number on their listing." if open247
               else f"Most {n.lower()} in {cn} operate during standard business hours. Check individual listings for exact timings and 'Open Now' status.")},
        {"q": f"How do I contact a {cat['singular'].lower()} in {cn}?",
         "a": f"Click the 'Show Number' button on any listing to reveal the phone number, or use the WhatsApp button to send an instant enquiry. All contact details on nearbyok.com are verified."},
    ]
    return faqs


def gen_searched_for(cat, city):
    n, cn = cat["name"], city["name"]
    return [
        n, cat["singular"], f"Best {n} in {cn}", f"24 Hour {n}", f"{n} Near Me",
        f"Cheap {cat['singular']}", f"Top Rated {n}", f"Emergency {cat['singular']}",
        f"{cn} {n}", f"Verified {n}",
    ]


def gen_related_searches(cat, city):
    n, cn, ab = cat["name"], city["name"], city["abbr"]
    out = [f"Best {cat['singular']} in {cn}", f"Cheapest {n} in {cn}", f"24 Hour {n} {cn}",
           f"Top Rated {cat['singular']} {cn} {ab}", f"Emergency {cat['singular']} Near Me",
           f"Affordable {n} in {cn}", f"{n} With Reviews", f"Open Now {n} {cn}"]
    return out


# ---------------------------------------------------------------------------
# Seeding
# ---------------------------------------------------------------------------
def make_business(cat, city, idx):
    seed = int(hashlib.md5(f"{cat['slug']}-{city['slug']}-{idx}".encode()).hexdigest(), 16)
    rnd = random.Random(seed)
    prefix = BIZ_PREFIX[idx % len(BIZ_PREFIX)]
    base = f"{prefix} {city['name']} {cat['singular']}" if rnd.random() < 0.4 else f"{prefix} {cat['singular']} {rnd.choice(BIZ_SUFFIX)}"
    name = base
    area = rnd.choice(city["areas"])
    lat = round(city["lat"] + rnd.uniform(-0.08, 0.08), 5)
    lng = round(city["lng"] + rnd.uniform(-0.08, 0.08), 5)
    rating = round(rnd.uniform(3.4, 4.9), 1)
    reviews = rnd.randint(28, 1450)
    is_247 = cat["slug"] in ("pharmacy", "gyms", "storage-units", "supermarkets") and rnd.random() < 0.35
    oh = rnd.choice([7, 8, 9, 10])
    ch = rnd.choice([18, 19, 20, 21, 22])
    imgs = cat["images"][:]
    rnd.shuffle(imgs)
    street_no = rnd.randint(100, 9800)
    return {
        "id": f"{cat['slug']}-{city['slug']}-{idx}",
        "place_id": None,
        "slug": slugify(f"{name}-{area}"),
        "name": name,
        "category": cat["slug"],
        "city": city["slug"],
        "area": area,
        "rating": rating,
        "reviews_count": reviews,
        "phone": f"+1 ({rnd.randint(201,989)}) {rnd.randint(200,999)}-{rnd.randint(1000,9999)}",
        "address": f"{street_no} {area} {rnd.choice(['St','Ave','Blvd','Rd','Way'])}, {city['name']}, {city['abbr']} {rnd.randint(10000,99999)}",
        "website": f"https://www.{slugify(prefix+city['name']+cat['singular'])[:28]}.com",
        "lat": lat, "lng": lng,
        "images": imgs,
        "price_level": rnd.randint(1, 4),
        "verified": rnd.random() < 0.6,
        "sponsored": idx < 1,
        "years": rnd.randint(2, 28),
        "is_24_7": is_247,
        "open_hour": oh, "close_hour": ch,
        "closed_sunday": rnd.random() < 0.3,
        "source": "seed",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


async def seed_db():
    await db.businesses.create_index("id", unique=True)
    await db.businesses.create_index([("category", 1), ("city", 1)])
    await db.leads.create_index("business_id")
    await db.favorites.create_index([("user_id", 1), ("business_id", 1)], unique=True)
    await db.reviews.create_index([("user_id", 1), ("business_id", 1)], unique=True)
    await db.user_sessions.create_index("session_token")
    existing = set()
    async for row in db.businesses.aggregate([{"$group": {"_id": {"c": "$category", "ci": "$city"}}}]):
        existing.add((row["_id"]["c"], row["_id"]["ci"]))
    docs = []
    for cat in CATEGORIES:
        for city in CITIES:
            if (cat["slug"], city["slug"]) in existing:
                continue
            n = random.Random(int(hashlib.md5((cat["slug"] + city["slug"]).encode()).hexdigest(), 16)).randint(6, 10)
            for i in range(n):
                docs.append(make_business(cat, city, i))
    if docs:
        await db.businesses.insert_many(docs)
    logger.info(f"Seeded {len(docs)} new businesses; matrix {len(CATEGORIES)}x{len(CITIES)}.")


# ---------------------------------------------------------------------------
# Google Places ingestion (live data)
# ---------------------------------------------------------------------------
PHOTO_LIMIT = 10
PLACES_MASK = ("places.id,places.displayName,places.formattedAddress,places.location,places.rating,"
               "places.userRatingCount,places.nationalPhoneNumber,places.internationalPhoneNumber,"
               "places.websiteUri,places.regularOpeningHours,places.googleMapsUri,places.priceLevel,"
               "places.photos,places.reviews,places.addressComponents,places.editorialSummary,"
               "places.businessStatus,nextPageToken")


async def fetch_photo_uri(c, name):
    r = await c.get(f"https://places.googleapis.com/v1/{name}/media",
                    params={"maxWidthPx": 900, "skipHttpRedirect": "true"}, headers={"X-Goog-Api-Key": GOOGLE_KEY})
    return None if r.is_error else r.json().get("photoUri")


def pick_area(components, city):
    for t in ("neighborhood", "sublocality_level_1", "sublocality", "locality"):
        for comp in components:
            txt = comp.get("longText")
            if t in comp.get("types", []) and txt and txt.lower() != city["name"].lower():
                return txt
    return None


def hours_from_periods(reg):
    periods = reg.get("periods") or []
    weekday = [p for p in periods if (p.get("open") or {}).get("day") in (1, 2, 3, 4, 5) and p.get("close")]
    p = weekday[0] if weekday else (periods[0] if periods else None)
    if not p or not p.get("close"):
        return 9, 21, False
    closed_sunday = not any((pp.get("open") or {}).get("day") == 0 for pp in periods)
    return p["open"].get("hour", 9), p["close"].get("hour", 21), closed_sunday


def map_review(rv):
    a = rv.get("authorAttribution") or {}
    return {"author": a.get("displayName", "Google user"), "author_photo": a.get("photoUri"),
            "rating": rv.get("rating"), "text": (rv.get("text") or {}).get("text", ""),
            "time": rv.get("relativePublishTimeDescription", ""), "published_at": rv.get("publishTime"), "source": "google"}


async def ingest_google(cat_slug, city_slug, pages=1):
    if not GOOGLE_KEY:
        raise HTTPException(400, "GOOGLE_PLACES_API_KEY not configured")
    cat, city = CAT_BY_SLUG.get(cat_slug), CITY_BY_SLUG.get(city_slug)
    if not cat or not city:
        raise HTTPException(404, "Unknown category or city")
    headers = {"X-Goog-Api-Key": GOOGLE_KEY, "X-Goog-FieldMask": PLACES_MASK, "Content-Type": "application/json"}
    places, token = [], None
    async with httpx.AsyncClient(timeout=40) as c:
        for _ in range(max(1, min(pages, 3))):
            body = {"textQuery": f"{cat['name']} in {city['name']}, {city['abbr']}", "pageSize": 20,
                    "languageCode": "en", "regionCode": "US"}
            if token:
                body["pageToken"] = token
            r = await c.post("https://places.googleapis.com/v1/places:searchText", headers=headers, json=body)
            if r.is_error:
                raise HTTPException(502, f"Google Places error: {r.text[:300]}")
            j = r.json()
            places += j.get("places", [])
            token = j.get("nextPageToken")
            if not token:
                break
        inserted = 0
        now = datetime.now(timezone.utc).isoformat()
        for i, p in enumerate(places):
            if p.get("businessStatus") == "CLOSED_PERMANENTLY" or not p.get("id"):
                continue
            pid = p["id"]
            loc = p.get("location") or {}
            price = {"PRICE_LEVEL_INEXPENSIVE": 1, "PRICE_LEVEL_MODERATE": 2,
                     "PRICE_LEVEL_EXPENSIVE": 3, "PRICE_LEVEL_VERY_EXPENSIVE": 4}.get(p.get("priceLevel"), 2)
            name = (p.get("displayName") or {}).get("text", "Unnamed")
            reg = p.get("regularOpeningHours") or {}
            is247 = any("24 hours" in d.lower() for d in reg.get("weekdayDescriptions", []))
            oh, ch, closed_sunday = hours_from_periods(reg)
            area = pick_area(p.get("addressComponents") or [], city) or city["areas"][i % len(city["areas"])]
            uris = await asyncio.gather(*[fetch_photo_uri(c, ph["name"]) for ph in (p.get("photos") or [])[:PHOTO_LIMIT]])
            images = [u for u in uris if u] or cat["images"]
            slug = slugify(f"{name}-{area}") or pid.lower()
            clash = await db.businesses.find_one({"slug": slug, "city": city_slug, "category": cat_slug, "id": {"$ne": f"g-{pid}"}}, {"_id": 0, "id": 1})
            if clash:
                slug = f"{slug}-{pid[-4:].lower()}"
            doc = {
                "id": f"g-{pid}", "place_id": pid, "slug": slug, "name": name,
                "category": cat_slug, "city": city_slug, "area": area,
                "rating": p.get("rating") or 0, "reviews_count": p.get("userRatingCount") or 0,
                "phone": p.get("internationalPhoneNumber") or p.get("nationalPhoneNumber") or "",
                "address": p.get("formattedAddress", ""), "website": p.get("websiteUri", ""),
                "lat": loc.get("latitude", city["lat"]), "lng": loc.get("longitude", city["lng"]),
                "images": images, "price_level": price,
                "verified": True, "sponsored": False, "years": random.Random(pid).randint(3, 20),
                "is_24_7": is247, "open_hour": oh, "close_hour": ch, "closed_sunday": closed_sunday,
                "google_maps_uri": p.get("googleMapsUri"),
                "weekday_descriptions": reg.get("weekdayDescriptions", []),
                "editorial_summary": (p.get("editorialSummary") or {}).get("text"),
                "reviews": [map_review(rv) for rv in (p.get("reviews") or [])],
                "source": "google", "status": "approved", "google_updated_at": now, "google_images": images,
            }
            existing = await db.businesses.find_one({"id": doc["id"]}, {"_id": 0, "claimed": 1, "owner_media": 1, "owner_updated_at": 1})
            if existing and existing.get("claimed"):
                # Owner-managed listing: Google refresh must not overwrite owner edits / media.
                if existing.get("owner_updated_at"):
                    for k in OWNER_EDITABLE:
                        doc.pop(k, None)
                owner_imgs = [m["url"] for m in existing.get("owner_media", []) if m.get("type") == "image"]
                doc["images"] = (owner_imgs + [u for u in uris if u]) or images
                doc["verified"] = True
            await db.businesses.update_one({"id": doc["id"]}, {"$set": doc, "$setOnInsert": {"created_at": now}}, upsert=True)
            inserted += 1
    if inserted:
        await db.businesses.delete_many({"category": cat_slug, "city": city_slug, "source": "seed"})
    await db.ingest_log.update_one({"category": cat_slug, "city": city_slug},
                                   {"$set": {"count": inserted, "at": now}}, upsert=True)
    return inserted


async def run_ingest_all(job_id, pages, skip_done):
    combos = [(c["slug"], ci["slug"]) for ci in CITIES for c in CATEGORIES]
    done_set = set()
    if skip_done:
        async for row in db.ingest_log.find({"count": {"$gt": 0}}, {"_id": 0}):
            done_set.add((row["category"], row["city"]))
    todo = [x for x in combos if x not in done_set]
    await db.ingest_jobs.update_one({"id": job_id}, {"$set": {"status": "running", "total": len(todo), "done": 0, "inserted": 0, "errors": []}})
    for cat, city in todo:
        job = await db.ingest_jobs.find_one({"id": job_id}, {"_id": 0})
        if job.get("cancel"):
            await db.ingest_jobs.update_one({"id": job_id}, {"$set": {"status": "cancelled"}})
            return
        try:
            n = await ingest_google(cat, city, pages)
            await db.ingest_jobs.update_one({"id": job_id}, {"$inc": {"done": 1, "inserted": n}, "$set": {"current": f"{cat} / {city}"}})
        except Exception as e:
            await db.ingest_jobs.update_one({"id": job_id}, {"$inc": {"done": 1}, "$push": {"errors": f"{cat}/{city}: {str(e)[:120]}"}})
        await asyncio.sleep(0.2)
    await db.ingest_jobs.update_one({"id": job_id}, {"$set": {"status": "completed", "finished_at": datetime.now(timezone.utc).isoformat()}})


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@api.get("/")
async def root():
    return {"message": "nearbyok.com API", "status": "ok"}


@api.get("/home")
async def home():
    total = await db.businesses.count_documents({})
    return {
        "categories": [{"slug": c["slug"], "name": c["name"], "icon": c["icon"], "image": c["images"][0], "services": c["services"]} for c in CATEGORIES],
        "cities": [{"slug": c["slug"], "name": c["name"], "state": c["state"], "state_name": c["state_name"],
                    "abbr": c["abbr"], "image": CITY_IMG[i % len(CITY_IMG)]} for i, c in enumerate(CITIES)],
        "stats": {"businesses": total, "cities": len(CITIES), "categories": len(CATEGORIES),
                  "pages": len(CITIES) * len(CATEGORIES)},
    }


@api.get("/search")
async def search(what: str = Query(""), where: str = Query("")):
    w = what.lower().strip()
    l = where.lower().strip()
    cat = None
    for c in CATEGORIES:
        if w and (w in c["name"].lower() or w in c["singular"].lower() or c["slug"].replace("-", " ") in w or w in c["slug"]):
            cat = c
            break
    if not cat and w:
        for c in CATEGORIES:
            if any(tok in c["name"].lower() for tok in w.split()):
                cat = c
                break
    cat = cat or CAT_BY_SLUG["restaurants"]
    city = None
    for c in CITIES:
        if l and (c["name"].lower() in l or c["abbr"].lower() == l or c["slug"].replace("-", " ") in l):
            city = c
            break
    city = city or CITY_BY_SLUG["new-york"]
    return {"category": cat["slug"], "state": city["state"], "city": city["slug"],
            "category_name": cat["name"], "city_name": city["name"]}


@api.get("/catalog")
async def catalog():
    return {"categories": [{"slug": c["slug"], "name": c["name"], "singular": c["singular"], "icon": c["icon"], "services": c["services"]} for c in CATEGORIES],
            "cities": [{"slug": c["slug"], "name": c["name"], "state": c["state"], "state_name": c["state_name"], "abbr": c["abbr"], "areas": c["areas"]} for c in CITIES]}


@api.get("/listing/{category}/{state}/{city}")
async def listing(category: str, state: str, city: str,
                  min_rating: float = 0, open_now: bool = False, sort: str = "recommended",
                  lat: Optional[float] = None, lng: Optional[float] = None):
    cat, city_cfg = CAT_BY_SLUG.get(category), CITY_BY_SLUG.get(city)
    if not cat or not city_cfg:
        raise HTTPException(404, "Page not found")
    docs = await db.businesses.find({"category": category, "city": city, **LIVE}, {"_id": 0}).to_list(200)
    center_lat = lat if lat is not None else city_cfg["lat"]
    center_lng = lng if lng is not None else city_cfg["lng"]
    items = [format_business(d, center_lat, center_lng) for d in docs]
    if min_rating:
        items = [b for b in items if b["rating"] >= min_rating]
    if open_now:
        items = [b for b in items if b["open_now"]]
    if sort == "rating":
        items.sort(key=lambda b: (b["rating"], b["reviews_count"]), reverse=True)
    elif sort == "reviews":
        items.sort(key=lambda b: b["reviews_count"], reverse=True)
    elif sort == "distance" and (lat is not None):
        items.sort(key=lambda b: b["distance"] if b["distance"] is not None else 999)
    else:
        items.sort(key=lambda b: (b["sponsored"], b["rating"], b["reviews_count"]), reverse=True)
    top_rated = items[0]["name"] if items else None
    # nearby: same category in other cities of same state
    nearby_cities = [{"slug": c["slug"], "name": c["name"], "state": c["state"]} for c in CITIES if c["slug"] != city]
    return {
        "meta": {"category": category, "category_name": cat["name"], "category_singular": cat["singular"],
                 "state": state, "state_name": city_cfg["state_name"], "city": city, "city_name": city_cfg["name"],
                 "abbr": city_cfg["abbr"], "icon": cat["icon"], "hero_image": CITY_IMG[0]},
        "center": {"lat": city_cfg["lat"], "lng": city_cfg["lng"]},
        "count": len(items),
        "businesses": items,
        "seo": {
            "description": gen_description(cat, city_cfg, len(docs), top_rated),
            "faqs": gen_faqs(cat, city_cfg, items),
            "searched_for": gen_searched_for(cat, city_cfg),
            "related_searches": gen_related_searches(cat, city_cfg),
            "nearby_areas": [{"area": a, "category": category, "city": city, "state": state} for a in city_cfg["areas"]],
            "popular_cities": [{"slug": c["slug"], "name": c["name"], "state": c["state"], "category": category} for c in CITIES],
            "similar_categories": [{"slug": c["slug"], "name": c["name"]} for c in CATEGORIES if c["slug"] != category][:10],
            "nearby_cities": nearby_cities,
        },
    }


@api.get("/detail/{category}/{state}/{city}/{slug}")
async def detail(category: str, state: str, city: str, slug: str, user: Optional[User] = Depends(optional_user)):
    cat, city_cfg = CAT_BY_SLUG.get(category), CITY_BY_SLUG.get(city)
    if not cat or not city_cfg:
        raise HTTPException(404, "Page not found")
    doc = await db.businesses.find_one({"category": category, "city": city, "slug": slug, **LIVE}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Business not found")
    biz = format_business(doc, city_cfg["lat"], city_cfg["lng"])
    biz["saved"] = bool(user and await db.favorites.find_one({"user_id": user.user_id, "business_id": doc["id"]}))
    user_reviews = await db.reviews.find({"business_id": doc["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    similar_docs = await db.businesses.find(
        {"category": category, "city": city, "slug": {"$ne": slug}, **LIVE}, {"_id": 0}).to_list(50)
    similar = [format_business(d, city_cfg["lat"], city_cfg["lng"]) for d in similar_docs]
    similar.sort(key=lambda b: (b["rating"], b["reviews_count"]), reverse=True)
    all_for_faq = [biz] + similar
    my_claim = None
    if user:
        my_claim = await db.claims.find_one({"business_id": doc["id"], "user_id": user.user_id}, {"_id": 0, "status": 1, "created_at": 1})
    claim = {
        "claimed": bool(doc.get("claimed")),
        "is_owner": bool(user and doc.get("owner_user_id") == user.user_id),
        "my_claim_status": my_claim["status"] if my_claim else None,
        "can_claim": not doc.get("owner_user_id") and doc.get("source") != "owner" and not (my_claim and my_claim["status"] == "pending"),
        "owner_name": doc.get("owner_name") if doc.get("claimed") else None,
    }
    return {
        "business": biz,
        "claim": claim,
        "hours": doc.get("weekday_descriptions") or hours_table(doc),
        "services": doc.get("services") or cat["services"],
        "seo": {
            "description": doc.get("description") or (f"{biz['name']} is a {cat['singular'].lower()} located in {biz['area']}, {city_cfg['name']}, "
                            f"{city_cfg['abbr']}. Rated {biz['rating']} stars by {biz['reviews_count']} customers, it is "
                            f"one of the trusted {cat['name'].lower()} in {city_cfg['name']}. "
                            f"{biz['name']} has been serving the local community for over {biz['years']} years, offering "
                            f"reliable service, competitive pricing and quick response. Find the address, contact number, "
                            f"opening hours, photos, ratings and directions below."),
            "overview": (f"{biz['name']} in {biz['area']}, {city_cfg['name']} is a top player in the {cat['name']} category. "
                         f"This well-known establishment serves customers both local and from other parts of {city_cfg['name']}. "
                         f"The belief that customer satisfaction is as important as their products and services has helped this "
                         f"business build a loyal base of customers. It occupies a prominent location in {biz['area']} making it "
                         f"an effortless task for first-time visitors to locate it. It is known to provide top service in the "
                         f"following categories: {', '.join(cat['services'][:4])}."),
            "faqs": gen_faqs(cat, city_cfg, all_for_faq),
            "searched_for": gen_searched_for(cat, city_cfg),
            "related_searches": gen_related_searches(cat, city_cfg),
            "nearby_areas": [{"area": a, "category": category, "city": city, "state": state} for a in city_cfg["areas"]],
            "popular_cities": [{"slug": c["slug"], "name": c["name"], "state": c["state"], "category": category} for c in CITIES],
            "categories": [{"slug": c["slug"], "name": c["name"], "icon": c["icon"]} for c in CATEGORIES],
        },
        "similar": similar[:8],
        "center": {"lat": biz["lat"], "lng": biz["lng"]},
        "reviews": {"google": doc.get("reviews", []), "users": user_reviews},
    }


# ------ Lead logging (direct Google Places phone, no Twilio) ------
class LeadIn(BaseModel):
    business_id: str
    type: str = "call"  # call | whatsapp | directions | enquiry
    caller: Optional[str] = None
    message: Optional[str] = None


@api.post("/leads")
async def create_lead(lead: LeadIn):
    doc = await db.businesses.find_one({"id": lead.business_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Business not found")
    lead_doc = {
        "id": hashlib.md5(f"{lead.business_id}{datetime.now(timezone.utc).isoformat()}{random.random()}".encode()).hexdigest()[:16],
        "business_id": lead.business_id, "business_name": doc["name"],
        "type": lead.type, "caller": lead.caller, "message": lead.message,
        "phone": doc.get("phone"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.leads.insert_one(dict(lead_doc))
    await db.businesses.update_one({"id": lead.business_id}, {"$inc": {f"leads_{lead.type}": 1}})
    return {"phone": doc.get("phone"), "lead_id": lead_doc["id"]}


# ------ User features: favorites & reviews ------
def with_state(b):
    b["state"] = CITY_BY_SLUG.get(b["city"], {}).get("state")
    return b


@api.post("/favorites/{business_id}")
async def toggle_favorite(business_id: str, user: User = Depends(get_current_user)):
    q = {"user_id": user.user_id, "business_id": business_id}
    if await db.favorites.find_one(q):
        await db.favorites.delete_one(q)
        return {"saved": False}
    if not await db.businesses.find_one({"id": business_id}, {"_id": 0, "id": 1}):
        raise HTTPException(404, "Business not found")
    await db.favorites.insert_one({**q, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"saved": True}


@api.get("/favorites")
async def list_favorites(user: User = Depends(get_current_user)):
    favs = await db.favorites.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    ids = [f["business_id"] for f in favs]
    docs = await db.businesses.find({"id": {"$in": ids}}, {"_id": 0}).to_list(200)
    by_id = {d["id"]: d for d in docs}
    return {"items": [with_state(format_business(by_id[i])) for i in ids if i in by_id]}


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    text: str = Field(min_length=3, max_length=2000)
    media: List[Media] = []


@api.post("/businesses/{business_id}/reviews")
async def post_review(business_id: str, body: ReviewIn, user: User = Depends(get_current_user)):
    if not await db.businesses.find_one({"id": business_id}, {"_id": 0, "id": 1}):
        raise HTTPException(404, "Business not found")
    doc = {"id": f"r-{uuid.uuid4().hex[:12]}", "business_id": business_id, "user_id": user.user_id,
           "author": user.name, "author_photo": user.picture, "rating": body.rating, "text": body.text.strip(),
           "media": clean_media(body.media, 6),
           "source": "nearbyok", "created_at": datetime.now(timezone.utc).isoformat()}
    await db.reviews.update_one({"user_id": user.user_id, "business_id": business_id}, {"$set": doc}, upsert=True)
    users = await db.reviews.find({"business_id": business_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"users": users}


@api.get("/my/reviews")
async def my_reviews(user: User = Depends(get_current_user)):
    rows = await db.reviews.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    ids = [r["business_id"] for r in rows]
    docs = {d["id"]: d for d in await db.businesses.find({"id": {"$in": ids}}, {"_id": 0}).to_list(200)}
    return {"items": [{**r, "business": with_state(format_business(docs[r["business_id"]]))} for r in rows if r["business_id"] in docs]}


# ------ Free listing (owner submissions) ------
class SubmitIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    category: str
    city: str
    area: str = Field(min_length=2, max_length=80)
    address: str = Field(min_length=5, max_length=200)
    phone: str = Field(min_length=7, max_length=30)
    website: str = ""
    description: str = Field(default="", max_length=2000)
    services: List[str] = []
    open_hour: int = Field(default=9, ge=0, le=23)
    close_hour: int = Field(default=18, ge=1, le=24)
    closed_sunday: bool = False
    is_24_7: bool = False
    images: List[str] = []
    media: List[Media] = []


async def geocode(address):
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get("https://nominatim.openstreetmap.org/search", params={"q": address, "format": "json", "limit": 1},
                            headers={"User-Agent": "nearbyok.com directory (contact@nearbyok.com)"})
        j = r.json()
        if j:
            return float(j[0]["lat"]), float(j[0]["lon"])
    except Exception as e:
        logger.warning(f"geocode failed: {e}")
    return None, None


@api.post("/businesses/submit")
async def submit_business(body: SubmitIn, user: User = Depends(get_current_user)):
    cat, city = CAT_BY_SLUG.get(body.category), CITY_BY_SLUG.get(body.city)
    if not cat or not city:
        raise HTTPException(400, "Unknown category or city")
    lat, lng = await geocode(f"{body.address}, {city['name']}, {city['abbr']}")
    rnd = random.Random(body.name + body.address)
    slug = slugify(f"{body.name}-{body.area}") or uuid.uuid4().hex[:8]
    if await db.businesses.find_one({"slug": slug, "city": body.city, "category": body.category}, {"_id": 0, "id": 1}):
        slug = f"{slug}-{uuid.uuid4().hex[:4]}"
    now = datetime.now(timezone.utc).isoformat()
    owner_media = clean_media(body.media, 20)
    owner_imgs = [m["url"] for m in owner_media if m["type"] == "image"]
    doc = {
        "id": f"o-{uuid.uuid4().hex[:12]}", "place_id": None, "slug": slug, "name": body.name.strip(),
        "category": body.category, "city": body.city, "area": body.area.strip(),
        "rating": 0, "reviews_count": 0, "phone": body.phone.strip(), "address": body.address.strip(),
        "website": body.website.strip(), "lat": lat or round(city["lat"] + rnd.uniform(-0.03, 0.03), 5),
        "lng": lng or round(city["lng"] + rnd.uniform(-0.03, 0.03), 5),
        "images": (owner_imgs + [u for u in body.images if u.startswith("http")])[:20] or cat["images"],
        "owner_media": owner_media, "videos": [m for m in owner_media if m["type"] == "video"], "google_images": [],
        "price_level": 2, "verified": False, "sponsored": False, "years": 1,
        "is_24_7": body.is_24_7, "open_hour": body.open_hour, "close_hour": body.close_hour,
        "closed_sunday": body.closed_sunday, "description": body.description.strip() or None,
        "services": [s for s in body.services if s][:12] or None, "geocoded": bool(lat),
        "source": "owner", "status": "pending", "owner_user_id": user.user_id, "owner_email": user.email,
        "created_at": now,
    }
    await db.businesses.insert_one(dict(doc))
    return {"id": doc["id"], "slug": slug, "category": body.category, "state": city["state"], "city": body.city, "status": "pending"}


@api.get("/my/listings")
async def my_listings(user: User = Depends(get_current_user)):
    docs = await db.businesses.find({"owner_user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"items": [with_state(format_business(d)) for d in docs]}


# ------ Admin ------
@api.get("/admin/stats", dependencies=[Depends(require_admin)])
async def admin_stats():
    total_leads = await db.leads.count_documents({})
    by_type = {r["_id"]: r["n"] async for r in db.leads.aggregate([{"$group": {"_id": "$type", "n": {"$sum": 1}}}])}
    top_rows = await db.leads.aggregate([
        {"$group": {"_id": "$business_id", "total": {"$sum": 1},
                    "calls": {"$sum": {"$cond": [{"$eq": ["$type", "call"]}, 1, 0]}},
                    "whatsapp": {"$sum": {"$cond": [{"$eq": ["$type", "whatsapp"]}, 1, 0]}},
                    "enquiries": {"$sum": {"$cond": [{"$eq": ["$type", "enquiry"]}, 1, 0]}},
                    "last": {"$max": "$created_at"}}},
        {"$sort": {"total": -1}}, {"$limit": 30}]).to_list(30)
    docs = {d["id"]: d for d in await db.businesses.find({"id": {"$in": [r["_id"] for r in top_rows]}}, {"_id": 0}).to_list(50)}
    top = []
    for r in top_rows:
        d = docs.get(r["_id"])
        if not d:
            continue
        top.append({"business_id": r["_id"], "name": d["name"], "category": d["category"], "city": d["city"],
                    "state": CITY_BY_SLUG.get(d["city"], {}).get("state"), "slug": d["slug"], "phone": d.get("phone"),
                    "source": d.get("source"), "total": r["total"], "calls": r["calls"], "whatsapp": r["whatsapp"],
                    "enquiries": r["enquiries"], "last": r["last"]})
    daily = await db.leads.aggregate([{"$group": {"_id": {"$substr": ["$created_at", 0, 10]}, "n": {"$sum": 1}}},
                                      {"$sort": {"_id": -1}}, {"$limit": 14}]).to_list(14)
    by_source = {r["_id"]: r["n"] async for r in db.businesses.aggregate([{"$group": {"_id": "$source", "n": {"$sum": 1}}}])}
    recent = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(30)
    pending = await db.businesses.count_documents({"source": "owner", "status": "pending"})
    pending_claims = await db.claims.count_documents({"status": "pending"})
    covered = await db.ingest_log.count_documents({"count": {"$gt": 0}})
    return {"total_leads": total_leads, "by_type": by_type, "top": top, "daily": list(reversed(daily)),
            "by_source": by_source, "recent": recent, "pending_submissions": pending, "pending_claims": pending_claims,
            "claimed": await db.businesses.count_documents({"claimed": True}),
            "coverage": {"done": covered, "total": len(CATEGORIES) * len(CITIES)},
            "users": await db.users.count_documents({}), "reviews": await db.reviews.count_documents({})}


@api.get("/admin/ingest-status", dependencies=[Depends(require_admin)])
async def ingest_status(city: str):
    if city not in CITY_BY_SLUG:
        raise HTTPException(404, "Unknown city")
    counts = {}
    async for r in db.businesses.aggregate([{"$match": {"city": city}}, {"$group": {"_id": {"c": "$category", "s": "$source"}, "n": {"$sum": 1}}}]):
        counts.setdefault(r["_id"]["c"], {})[r["_id"]["s"]] = r["n"]
    logs = {r["category"]: r async for r in db.ingest_log.find({"city": city}, {"_id": 0})}
    rows = [{"category": c["slug"], "name": c["name"], "google": counts.get(c["slug"], {}).get("google", 0),
             "seed": counts.get(c["slug"], {}).get("seed", 0), "owner": counts.get(c["slug"], {}).get("owner", 0),
             "last_ingest": logs.get(c["slug"], {}).get("at")} for c in CATEGORIES]
    return {"city": city, "rows": rows,
            "cities": [{"slug": c["slug"], "name": c["name"], "abbr": c["abbr"]} for c in CITIES]}


@api.post("/admin/ingest", dependencies=[Depends(require_admin)])
async def admin_ingest(category: str, city: str, pages: int = 1):
    inserted = await ingest_google(category, city, pages)
    return {"inserted": inserted, "category": category, "city": city}


@api.post("/admin/ingest-city", dependencies=[Depends(require_admin)])
async def admin_ingest_city(city: str, pages: int = 1):
    if city not in CITY_BY_SLUG:
        raise HTTPException(404, "Unknown city")
    results = {}
    for c in CATEGORIES:
        try:
            results[c["slug"]] = await ingest_google(c["slug"], city, pages)
        except Exception as e:
            results[c["slug"]] = f"error: {str(e)[:80]}"
    return {"city": city, "results": results}


@api.post("/admin/ingest-all", dependencies=[Depends(require_admin)])
async def admin_ingest_all(pages: int = 1, skip_done: bool = True):
    running = await db.ingest_jobs.find_one({"status": "running"}, {"_id": 0})
    if running:
        return running
    job = {"id": f"job-{uuid.uuid4().hex[:8]}", "status": "queued", "pages": pages, "skip_done": skip_done,
           "total": 0, "done": 0, "inserted": 0, "errors": [], "cancel": False,
           "started_at": datetime.now(timezone.utc).isoformat()}
    await db.ingest_jobs.insert_one(dict(job))
    asyncio.create_task(run_ingest_all(job["id"], pages, skip_done))
    return job


@api.get("/admin/ingest-jobs/latest", dependencies=[Depends(require_admin)])
async def latest_job():
    job = await db.ingest_jobs.find_one({}, {"_id": 0}, sort=[("started_at", -1)])
    return job or {}


@api.post("/admin/ingest-all/cancel", dependencies=[Depends(require_admin)])
async def cancel_job():
    await db.ingest_jobs.update_many({"status": "running"}, {"$set": {"cancel": True}})
    return {"ok": True}


@api.get("/admin/submissions", dependencies=[Depends(require_admin)])
async def admin_submissions():
    docs = await db.businesses.find({"source": "owner"}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"items": [{**with_state(format_business(d)), "owner_email": d.get("owner_email"), "geocoded": d.get("geocoded"),
                       "created_at": d.get("created_at")} for d in docs]}


@api.post("/admin/submissions/{business_id}/{action}", dependencies=[Depends(require_admin)])
async def review_submission(business_id: str, action: str):
    if action not in ("approve", "reject", "pending"):
        raise HTTPException(400, "Bad action")
    status = {"approve": "approved", "reject": "rejected", "pending": "pending"}[action]
    res = await db.businesses.update_one({"id": business_id, "source": "owner"},
                                         {"$set": {"status": status, "verified": status == "approved",
                                                   "reviewed_at": datetime.now(timezone.utc).isoformat()}})
    if not res.matched_count:
        raise HTTPException(404, "Submission not found")
    return {"id": business_id, "status": status}


@api.get("/admin/leads", dependencies=[Depends(require_admin)])
async def list_leads(limit: int = 200):
    leads = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return {"total": await db.leads.count_documents({}), "leads": leads}


@app.get("/api/sitemap.xml")
async def sitemap():
    base = "https://nearbyok.com"
    urls = [f"{base}/"]
    for cat in CATEGORIES:
        for city in CITIES:
            urls.append(f"{base}/{cat['slug']}/{city['state']}/{city['slug']}")
    docs = await db.businesses.find(LIVE, {"_id": 0, "category": 1, "city": 1, "slug": 1}).to_list(50000)
    for d in docs:
        c = CITY_BY_SLUG.get(d["city"])
        if c:
            urls.append(f"{base}/{d['category']}/{c['state']}/{d['city']}/{d['slug']}")
    trends = await db.trend_queries.find({"enabled": True, "category": {"$ne": None}}, {"_id": 0, "slug": 1}).to_list(2000)
    if trends:
        urls.append(f"{base}/nearby")
        urls += [f"{base}/nearby/{t['slug']}" for t in trends]
    urls.append(f"{base}/list-your-business")
    body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    body += "\n".join(f"  <url><loc>{u}</loc></url>" for u in urls)
    body += "\n</urlset>"
    return Response(content=body, media_type="application/xml")


@app.get("/api/robots.txt")
async def robots():
    s = await get_settings()
    extra = (s.get("site") or {}).get("robots_extra") or ""
    body = "User-agent: *\nAllow: /\nDisallow: /account\nDisallow: /api/\nAllow: /api/sitemap.xml\n"
    if extra.strip():
        body += extra.strip() + "\n"
    body += "Sitemap: https://nearbyok.com/api/sitemap.xml\n"
    return PlainTextResponse(body)


app.include_router(api)
app.include_router(auth_router)
app.include_router(build_owner_router(format_business, with_state, CAT_BY_SLUG, CITY_BY_SLUG))
app.include_router(build_console_router({"CATEGORIES": CATEGORIES, "CITIES": CITIES, "CAT_BY_SLUG": CAT_BY_SLUG, "CITY_BY_SLUG": CITY_BY_SLUG,
                                         "format_business": format_business, "haversine": haversine, "LIVE": LIVE, "gen_faqs": gen_faqs}))
from trip import router as trip_router  # noqa: E402
app.include_router(trip_router)
app.add_middleware(
    CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"], allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await seed_db()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
