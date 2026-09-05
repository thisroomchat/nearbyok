"""Backend tests for nearbyok.com API - Iteration 2 (auth, admin, favs, reviews, submit)"""
import os
import time
import pytest
import requests
from pymongo import MongoClient
from datetime import datetime, timezone, timedelta
import uuid

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_KEY = "nearbyok-admin-2026"

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"
mongo = MongoClient(MONGO_URL)[DB_NAME]


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def admin_headers():
    return {"X-Admin-Key": ADMIN_KEY}


@pytest.fixture(scope="module")
def test_user():
    """Create a test user + session directly in Mongo."""
    uid = f"test-user-{uuid.uuid4().hex[:8]}"
    tok = f"test_session_{uuid.uuid4().hex[:12]}"
    mongo.users.insert_one({
        "user_id": uid, "email": f"test.user.{uid}@example.com",
        "name": "Test User", "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    mongo.user_sessions.insert_one({
        "user_id": uid, "session_token": tok,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    yield {"user_id": uid, "token": tok, "headers": {"Authorization": f"Bearer {tok}"}}
    # Cleanup
    mongo.users.delete_many({"user_id": uid})
    mongo.user_sessions.delete_many({"user_id": uid})
    mongo.reviews.delete_many({"user_id": uid})
    mongo.favorites.delete_many({"user_id": uid})
    mongo.businesses.delete_many({"owner_user_id": uid})


# ---------- Home / catalog (20x32 matrix) ----------
def test_home_matrix(s):
    r = s.get(f"{API}/home", timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert len(d["categories"]) == 20
    assert len(d["cities"]) == 32
    assert d["stats"]["categories"] == 20
    assert d["stats"]["cities"] == 32
    assert d["stats"]["pages"] == 640
    assert "services" in d["categories"][0]
    assert isinstance(d["categories"][0]["services"], list)


def test_catalog(s):
    r = s.get(f"{API}/catalog", timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert len(d["categories"]) == 20
    assert len(d["cities"]) == 32
    assert "areas" in d["cities"][0]
    assert isinstance(d["cities"][0]["areas"], list) and len(d["cities"][0]["areas"]) > 0


# ---------- Admin login ----------
def test_admin_login_ok(s):
    r = s.post(f"{API}/auth/admin-login", json={"password": ADMIN_KEY}, timeout=10)
    assert r.status_code == 200
    assert r.json().get("ok") is True


def test_admin_login_wrong(s):
    r = s.post(f"{API}/auth/admin-login", json={"password": "wrong"}, timeout=10)
    assert r.status_code == 401


# ---------- Admin protected endpoints ----------
def test_admin_endpoints_require_key(s):
    for path in ["/admin/stats", "/admin/ingest-status?city=austin", "/admin/submissions",
                 "/admin/leads", "/admin/ingest-jobs/latest"]:
        r = s.get(f"{API}{path}", timeout=15)
        assert r.status_code == 401, f"{path} should be 401 without admin key, got {r.status_code}"


def test_admin_stats(s, admin_headers):
    r = s.get(f"{API}/admin/stats", headers=admin_headers, timeout=30)
    assert r.status_code == 200
    d = r.json()
    for k in ["total_leads", "by_type", "top", "daily", "by_source", "coverage", "users", "reviews", "pending_submissions"]:
        assert k in d, f"missing key {k}"
    assert d["coverage"]["total"] == 640
    assert isinstance(d["top"], list)
    assert isinstance(d["daily"], list)


def test_admin_ingest_status(s, admin_headers):
    r = s.get(f"{API}/admin/ingest-status", params={"city": "austin"}, headers=admin_headers, timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d["city"] == "austin"
    assert len(d["rows"]) == 20


def test_admin_latest_job(s, admin_headers):
    r = s.get(f"{API}/admin/ingest-jobs/latest", headers=admin_headers, timeout=15)
    assert r.status_code == 200  # may be {} or job doc


# ---------- Auth /me and logout ----------
def test_auth_me_without_token(s):
    r = requests.get(f"{API}/auth/me", timeout=10)
    assert r.status_code == 401


def test_auth_me_with_token(test_user):
    r = requests.get(f"{API}/auth/me", headers=test_user["headers"], timeout=10)
    assert r.status_code == 200
    d = r.json()
    assert d["user_id"] == test_user["user_id"]
    assert d["email"].startswith("test.user.")


def test_auth_logout_ok(test_user):
    # Use cookie for logout
    r = requests.post(f"{API}/auth/logout", cookies={"session_token": test_user["token"]}, timeout=10)
    assert r.status_code == 200
    assert r.json().get("ok") is True
    # Recreate session for later tests
    mongo.user_sessions.insert_one({
        "user_id": test_user["user_id"], "session_token": test_user["token"],
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })


# ---------- Favorites ----------
def test_favorites_unauth():
    r = requests.get(f"{API}/favorites", timeout=10)
    assert r.status_code == 401


def test_favorites_toggle(test_user, s):
    # get a real business
    listing = s.get(f"{API}/listing/plumbers/texas/houston", timeout=30).json()
    biz_id = listing["businesses"][0]["id"]
    # toggle on
    r1 = requests.post(f"{API}/favorites/{biz_id}", headers=test_user["headers"], timeout=15)
    assert r1.status_code == 200
    assert r1.json()["saved"] is True
    # list
    lr = requests.get(f"{API}/favorites", headers=test_user["headers"], timeout=15)
    assert lr.status_code == 200
    items = lr.json()["items"]
    assert any(x["id"] == biz_id for x in items)
    assert "state" in items[0]
    # toggle off
    r2 = requests.post(f"{API}/favorites/{biz_id}", headers=test_user["headers"], timeout=15)
    assert r2.status_code == 200
    assert r2.json()["saved"] is False


# ---------- Reviews ----------
def test_reviews_valid_and_dedup(test_user, s):
    listing = s.get(f"{API}/listing/plumbers/texas/houston", timeout=30).json()
    biz_id = listing["businesses"][0]["id"]
    slug = listing["businesses"][0]["slug"]
    r = requests.post(f"{API}/businesses/{biz_id}/reviews",
                      headers=test_user["headers"],
                      json={"rating": 5, "text": "Great service"}, timeout=15)
    assert r.status_code == 200
    users = r.json()["users"]
    assert any(u["user_id"] == test_user["user_id"] and u["rating"] == 5 for u in users)

    # Post again - should update (no duplicate)
    r2 = requests.post(f"{API}/businesses/{biz_id}/reviews",
                       headers=test_user["headers"],
                       json={"rating": 4, "text": "Updated review"}, timeout=15)
    users2 = r2.json()["users"]
    mine = [u for u in users2 if u["user_id"] == test_user["user_id"]]
    assert len(mine) == 1
    assert mine[0]["rating"] == 4

    # detail should include reviews.users and business.saved
    dr = requests.get(f"{API}/detail/plumbers/texas/houston/{slug}",
                      headers=test_user["headers"], timeout=15)
    assert dr.status_code == 200
    dj = dr.json()
    assert "reviews" in dj and "google" in dj["reviews"] and "users" in dj["reviews"]
    assert "saved" in dj["business"]
    assert any(u["user_id"] == test_user["user_id"] for u in dj["reviews"]["users"])


def test_reviews_validation(test_user, s):
    listing = s.get(f"{API}/listing/plumbers/texas/houston", timeout=30).json()
    biz_id = listing["businesses"][0]["id"]
    r = requests.post(f"{API}/businesses/{biz_id}/reviews",
                      headers=test_user["headers"],
                      json={"rating": 6, "text": "Great"}, timeout=10)
    assert r.status_code == 422
    r2 = requests.post(f"{API}/businesses/{biz_id}/reviews",
                       headers=test_user["headers"],
                       json={"rating": 5, "text": "ok"}, timeout=10)
    assert r2.status_code == 422


# ---------- Submit listing ----------
@pytest.fixture(scope="module")
def submitted(test_user, s):
    payload = {
        "name": f"Test Plumbing Co {uuid.uuid4().hex[:4]}",
        "category": "plumbers", "city": "austin", "area": "Downtown",
        "address": "100 Congress Ave", "phone": "+1 512 555 0100",
        "description": "Test plumbing description",
        "services": ["Leak repair", "Pipe fitting"],
        "open_hour": 8, "close_hour": 18,
    }
    r = requests.post(f"{API}/businesses/submit", headers=test_user["headers"],
                      json=payload, timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["status"] == "pending"
    assert d["state"] == "texas"
    assert d["city"] == "austin"
    yield d


def test_submit_unknown_category(test_user):
    r = requests.post(f"{API}/businesses/submit", headers=test_user["headers"],
                      json={"name": "Valid Name", "category": "nope", "city": "austin",
                            "area": "Downtown", "address": "100 Test Ave",
                            "phone": "+1 555 555 5555"}, timeout=15)
    assert r.status_code == 400


def test_submitted_appears_in_listing(submitted, s):
    r = s.get(f"{API}/listing/plumbers/texas/austin", timeout=30)
    assert r.status_code == 200
    match = next((b for b in r.json()["businesses"] if b["id"] == submitted["id"]), None)
    assert match is not None
    assert match["source"] == "owner"
    assert match["verified"] is False
    assert match.get("status") == "pending"


def test_my_listings(test_user, submitted):
    r = requests.get(f"{API}/my/listings", headers=test_user["headers"], timeout=15)
    assert r.status_code == 200
    items = r.json()["items"]
    assert any(x["id"] == submitted["id"] for x in items)


# ---------- Admin moderation ----------
def test_admin_submissions_list(admin_headers, submitted, s):
    r = s.get(f"{API}/admin/submissions", headers=admin_headers, timeout=15)
    assert r.status_code == 200
    items = r.json()["items"]
    assert any(x["id"] == submitted["id"] for x in items)


def test_admin_approve(admin_headers, submitted, s):
    r = s.post(f"{API}/admin/submissions/{submitted['id']}/approve", headers=admin_headers, timeout=15)
    assert r.status_code == 200
    assert r.json()["status"] == "approved"
    # verify visible in listing with verified=True
    lst = s.get(f"{API}/listing/plumbers/texas/austin", timeout=30).json()
    match = next((b for b in lst["businesses"] if b["id"] == submitted["id"]), None)
    assert match is not None
    assert match["verified"] is True


def test_admin_reject(admin_headers, submitted, s):
    r = s.post(f"{API}/admin/submissions/{submitted['id']}/reject", headers=admin_headers, timeout=15)
    assert r.status_code == 200
    # should DISAPPEAR from listing
    lst = s.get(f"{API}/listing/plumbers/texas/austin", timeout=30).json()
    assert not any(b["id"] == submitted["id"] for b in lst["businesses"])
    # detail returns 404
    dr = s.get(f"{API}/detail/plumbers/texas/austin/{submitted['slug']}", timeout=15)
    assert dr.status_code == 404


def test_admin_restore_pending(admin_headers, submitted, s):
    r = s.post(f"{API}/admin/submissions/{submitted['id']}/pending", headers=admin_headers, timeout=15)
    assert r.status_code == 200
    lst = s.get(f"{API}/listing/plumbers/texas/austin", timeout=30).json()
    assert any(b["id"] == submitted["id"] for b in lst["businesses"])


# ---------- Google-ingested data (coffee-shops/austin) ----------
def test_google_data_present(s):
    r = s.get(f"{API}/listing/coffee-shops/texas/austin", timeout=30)
    assert r.status_code == 200
    biz = r.json()["businesses"]
    google_items = [b for b in biz if b.get("source") == "google"]
    if not google_items:
        pytest.skip("Google data not yet ingested for coffee-shops/austin")
    b = google_items[0]
    assert b.get("phone")
    assert any("googleusercontent" in (img or "") for img in b.get("images", []))
    # Detail
    dr = s.get(f"{API}/detail/coffee-shops/texas/austin/{b['slug']}", timeout=30).json()
    assert isinstance(dr["hours"], list)
    assert len(dr["reviews"]["google"]) > 0


# ---------- Leads (no twilio) ----------
def test_leads_no_twilio(s):
    listing = s.get(f"{API}/listing/plumbers/texas/houston", timeout=30).json()
    biz_id = listing["businesses"][0]["id"]
    r = s.post(f"{API}/leads", json={"business_id": biz_id, "type": "call"}, timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d.get("phone")
    assert d.get("lead_id")
    # tracking_number is not required now that Twilio removed; if present that's ok
    # No twilio_sid field
    assert "twilio_sid" not in d


# ---------- Sitemap ----------
def test_sitemap(s):
    r = s.get(f"{API}/sitemap.xml", timeout=30)
    assert r.status_code == 200
    assert "<urlset" in r.text
    # 640 category*city pages
    assert r.text.count("<url>") >= 640
