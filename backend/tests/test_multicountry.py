"""Iteration-3 tests: multi-country (us/in/ae/ca/uk/au) + trip route/share."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_KEY = "Admin@Travel2025"  # from test_credentials.md
ADMIN_USERNAME = "admin"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# ---------- /api/countries ----------
def test_countries_list(s):
    r = s.get(f"{API}/countries", timeout=15)
    assert r.status_code == 200
    data = r.json()
    items = data.get("countries") if isinstance(data, dict) else data
    assert isinstance(items, list)
    codes = {c["code"] for c in items}
    assert codes >= {"us", "in", "ae", "ca", "uk", "au"}
    by_code = {c["code"]: c for c in items}
    assert by_code["us"]["cities"] == 32
    for cc in ("in", "ae", "ca", "uk", "au"):
        assert by_code[cc]["cities"] == 20, f"{cc} cities={by_code[cc]['cities']}"
        assert by_code[cc].get("prefix") == f"/{cc}"
        assert by_code[cc].get("symbol")
        assert by_code[cc].get("unit") in ("km", "mi")


# ---------- /api/geo ----------
def test_geo_no_headers(s):
    # Note: we can't strip CF-IPCountry that ingress adds, but if the endpoint just echos
    r = s.get(f"{API}/geo", timeout=10)
    assert r.status_code == 200
    d = r.json()
    assert "country" in d


def test_geo_with_header_in(s):
    # NOTE: CF-IPCountry is stripped by k8s ingress on the public URL; use X-Country-Code equivalent
    r = s.get(f"{API}/geo", headers={"CF-IPCountry": "IN", "X-Country-Code": "IN"}, timeout=10)
    assert r.status_code == 200
    assert r.json().get("country") == "in"


def test_geo_with_header_gb(s):
    r = s.get(f"{API}/geo", headers={"CF-IPCountry": "GB", "X-Country-Code": "GB"}, timeout=10)
    assert r.status_code == 200
    assert r.json().get("country") == "uk"


# ---------- /api/home ----------
def test_home_in(s):
    r = s.get(f"{API}/home", params={"country": "in"}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert d["country"]["code"] == "in"
    assert len(d["cities"]) == 20
    assert d["cities"][0]["slug"] == "delhi"
    assert d["stats"]["businesses"] >= 0


def test_home_bad_country(s):
    r = s.get(f"{API}/home", params={"country": "xx"}, timeout=10)
    assert r.status_code == 404


def test_home_default_us(s):
    r = s.get(f"{API}/home", timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert d["country"]["code"] == "us"
    assert len(d["cities"]) == 32


# ---------- /api/search ----------
def test_search_in(s):
    r = s.get(f"{API}/search", params={"what": "dentist", "where": "mumbai", "country": "in"}, timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d.get("city") == "mumbai"
    assert d.get("path") == "/in/dentists/maharashtra/mumbai", f"path={d.get('path')}"


def test_search_ae(s):
    r = s.get(f"{API}/search", params={"what": "plumber", "where": "dubai", "country": "ae"}, timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d.get("path", "").startswith("/ae/"), f"path={d.get('path')}"


# ---------- /api/catalog ----------
def test_catalog_au(s):
    r = s.get(f"{API}/catalog", params={"country": "au"}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert len(d["cities"]) == 20
    assert "areas" in d["cities"][0]


# ---------- /api/listing ----------
def test_listing_au(s):
    r = s.get(f"{API}/listing/plumbers/new-south-wales/sydney", params={"country": "au"}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    meta = d["meta"]
    assert meta["country"]["code"] == "au"
    assert meta.get("prefix") == "/au"
    for b in d["businesses"][:5]:
        assert b.get("distance_unit") == "km"
        assert b["path"].startswith("/au/"), b["path"]
        # phone: seeds may be +61
    phones = [b.get("phone", "") for b in d["businesses"] if b.get("phone")]
    assert any(p.startswith("+61") for p in phones), phones[:5]


def test_listing_wrong_country(s):
    # New York is not in India catalog -> 404
    r = s.get(f"{API}/listing/plumbers/new-york/new-york", params={"country": "in"}, timeout=15)
    assert r.status_code == 404


def test_listing_legacy_us(s):
    r = s.get(f"{API}/listing/plumbers/new-york/new-york", timeout=30)
    assert r.status_code == 200
    d = r.json()
    for b in d["businesses"][:5]:
        assert b.get("distance_unit") == "mi"
        assert b["path"].startswith("/plumbers/"), b["path"]


def test_listing_in_dentists_delhi(s):
    r = s.get(f"{API}/listing/dentists/delhi/delhi", params={"country": "in"}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert d["meta"]["country"]["code"] == "in"
    # data may be seed or google


# ---------- /api/detail ----------
def test_detail_in(s):
    lst = s.get(f"{API}/listing/dentists/delhi/delhi", params={"country": "in"}, timeout=30).json()
    if not lst.get("businesses"):
        pytest.skip("No businesses to test detail")
    slug = lst["businesses"][0]["slug"]
    r = s.get(f"{API}/detail/dentists/delhi/delhi/{slug}", params={"country": "in"}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert d["business"]["country"] == "in"
    assert d["business"]["path"].startswith("/in/")
    assert d.get("prefix") == "/in"


def test_detail_us_legacy(s):
    lst = s.get(f"{API}/listing/plumbers/new-york/new-york", timeout=30).json()
    slug = lst["businesses"][0]["slug"]
    r = s.get(f"{API}/detail/plumbers/new-york/new-york/{slug}", timeout=30)
    assert r.status_code == 200


# ---------- Sitemap multi-country ----------
def test_sitemap_multicountry(s):
    r = s.get(f"{API}/sitemap.xml", timeout=30)
    assert r.status_code == 200
    body = r.text
    assert "/in/" in body
    assert "/ae/" in body
    assert "/in/plumbers/delhi/delhi" in body


# ---------- Admin ingest-status country ----------
@pytest.fixture(scope="module")
def admin_session(s):
    r = s.post(f"{API}/auth/admin-login", json={"username": ADMIN_USERNAME, "password": ADMIN_KEY}, timeout=10)
    if r.status_code != 200:
        pytest.skip(f"admin-login failed {r.status_code} {r.text}")
    token = r.json().get("token")
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


def test_admin_ingest_status_ae(admin_session):
    r = admin_session.get(f"{API}/admin/ingest-status", params={"country": "ae"}, timeout=20)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("rows")
    assert len(d.get("cities", [])) == 20
    assert len(d.get("countries", [])) == 6
    assert "lazy" in d
    assert "used_today" in d["lazy"] and "cap" in d["lazy"]


def test_admin_ingest_status_us_default(admin_session):
    r = admin_session.get(f"{API}/admin/ingest-status", params={"city": "new-york"}, timeout=20)
    assert r.status_code == 200
    assert r.json().get("rows")


# ---------- Trip planner ----------
@pytest.fixture(scope="module")
def trip_plan(s):
    payload = {
        "origin": "Hoshiarpur", "destination": "Chandigarh",
        "transport": "bus", "country": "IN",
        "days": 1, "travelers": 2, "interests": ["foodie"],
    }
    r = s.post(f"{API}/trip/plan", json=payload, timeout=120)
    assert r.status_code == 200, r.text
    return r.json()


def test_trip_plan_route(trip_plan):
    plan = trip_plan.get("plan", trip_plan)
    route = plan.get("route")
    assert route, f"no route in plan keys={list(plan.keys())}"
    assert route.get("mode") == "driving"
    assert len(route.get("polyline", [])) > 10
    assert "km" in route.get("distance_text", "").lower() or "mi" in route.get("distance_text", "").lower()
    assert route.get("duration_text")
    legs = route.get("legs", [])
    assert legs
    l0 = legs[0]
    assert "distance_text" in l0
    assert plan.get("drive_time_text")


def test_trip_plan_get_by_id(s, trip_plan):
    pid = trip_plan.get("id") or trip_plan.get("plan_id") or (trip_plan.get("plan") or {}).get("id")
    assert pid, f"no id in {list(trip_plan.keys())}"
    r = s.get(f"{API}/trip/plan/{pid}", timeout=30)
    assert r.status_code == 200


def test_trip_plan_bad_id(s):
    r = s.get(f"{API}/trip/plan/bad-id-does-not-exist-xyz", timeout=15)
    assert r.status_code == 404


def test_trip_popular_route(s):
    r = s.get(f"{API}/trip/route/delhi-to-agra", timeout=90)
    assert r.status_code == 200
    plan = r.json().get("plan") or r.json()
    # allow slight backfill delay
    if not plan.get("route"):
        time.sleep(5)
        r = s.get(f"{API}/trip/route/delhi-to-agra", timeout=90)
        plan = r.json().get("plan") or r.json()
    assert plan.get("route"), "route not present after retry"
