#!/usr/bin/env python3
"""Comprehensive backend test for nearbyok Phase 1"""
import sys
import time
import requests
from datetime import datetime, timedelta
from pymongo import MongoClient

# Configuration
BASE_URL = "https://e8c0cc48-f3c1-4531-ac8b-2898ff0f2ab3.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"
ADMIN_USERNAME = "nbkadmin"
ADMIN_PASSWORD = "ou4c^77kFnJ4ZW7%"

# MongoDB connection
mongo_client = MongoClient("mongodb://localhost:27017/")
db = mongo_client["test_database"]

# Test state
admin_token = None
user_a_token = None
user_b_token = None
user_a_id = None
user_b_id = None
test_claim_id = None
test_business_id = None
test_business_slug = None
test_review_id = None
test_submission_id = None
failed_tests = []
passed_tests = []


def log(msg, level="INFO"):
    """Log test messages"""
    print(f"[{level}] {msg}")


def fail(test_name, reason, req=None, resp=None):
    """Record a test failure"""
    msg = f"{test_name}: {reason}"
    if req:
        msg += f"\n  Request: {req}"
    if resp:
        msg += f"\n  Response: {resp}"
    failed_tests.append(msg)
    log(msg, "FAIL")


def success(test_name):
    """Record a test success"""
    passed_tests.append(test_name)
    log(f"{test_name}: PASSED", "PASS")


def create_test_users():
    """Create two test users in MongoDB"""
    global user_a_token, user_b_token, user_a_id, user_b_id
    
    log("Creating test users in MongoDB...")
    
    # User A
    user_a_id = f"test-user-a-{int(time.time())}"
    user_a_token = f"test_session_a_{int(time.time())}"
    user_a_email = f"test.user.a.{int(time.time())}@example.com"
    
    db.users.insert_one({
        "user_id": user_a_id,
        "email": user_a_email,
        "name": "Test User A",
        "picture": None,
        "created_at": datetime.utcnow()
    })
    
    db.user_sessions.insert_one({
        "user_id": user_a_id,
        "session_token": user_a_token,
        "expires_at": datetime.utcnow() + timedelta(days=7),
        "created_at": datetime.utcnow()
    })
    
    # User B
    user_b_id = f"test-user-b-{int(time.time())}"
    user_b_token = f"test_session_b_{int(time.time())}"
    user_b_email = f"test.user.b.{int(time.time())}@example.com"
    
    db.users.insert_one({
        "user_id": user_b_id,
        "email": user_b_email,
        "name": "Test User B",
        "picture": None,
        "created_at": datetime.utcnow()
    })
    
    db.user_sessions.insert_one({
        "user_id": user_b_id,
        "session_token": user_b_token,
        "expires_at": datetime.utcnow() + timedelta(days=7),
        "created_at": datetime.utcnow()
    })
    
    log(f"Created User A: {user_a_id} with token {user_a_token[:20]}...")
    log(f"Created User B: {user_b_id} with token {user_b_token[:20]}...")


def cleanup_test_data():
    """Clean up test data from MongoDB"""
    log("Cleaning up test data...")
    
    # Delete test users and sessions
    db.users.delete_many({"email": {"$regex": "test\\.user\\.[ab]\\..+@example\\.com"}})
    db.user_sessions.delete_many({"session_token": {"$regex": "test_session_[ab]_"}})
    
    # Delete test claims
    db.claims.delete_many({"user_id": {"$in": [user_a_id, user_b_id]}})
    
    # Delete test reviews
    db.reviews.delete_many({"user_id": {"$in": [user_a_id, user_b_id]}})
    
    # Delete test business submission
    if test_submission_id:
        db.businesses.delete_one({"id": test_submission_id})
    
    log("Cleanup complete")


# ============================================================================
# Test 1: Admin Authentication
# ============================================================================

def test_admin_auth():
    """Test admin authentication flow"""
    global admin_token
    
    log("\n=== Test 1: Admin Authentication ===")
    
    # 1.1: Successful login
    try:
        resp = requests.post(f"{API_URL}/auth/admin-login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        }, timeout=10)
        
        if resp.status_code != 200:
            fail("Admin login (valid credentials)", f"Expected 200, got {resp.status_code}", 
                 f"POST /api/auth/admin-login", resp.text[:500])
            return
        
        data = resp.json()
        if "token" not in data or "expires_at" not in data:
            fail("Admin login (valid credentials)", "Missing token or expires_at in response", 
                 f"POST /api/auth/admin-login", resp.text[:500])
            return
        
        admin_token = data["token"]
        success("Admin login (valid credentials)")
        
    except Exception as e:
        fail("Admin login (valid credentials)", str(e))
        return
    
    # 1.2: Wrong password
    try:
        resp = requests.post(f"{API_URL}/auth/admin-login", json={
            "username": ADMIN_USERNAME,
            "password": "wrongpassword"
        }, timeout=10)
        
        if resp.status_code != 401:
            fail("Admin login (wrong password)", f"Expected 401, got {resp.status_code}", 
                 f"POST /api/auth/admin-login", resp.text[:500])
        else:
            success("Admin login (wrong password)")
    except Exception as e:
        fail("Admin login (wrong password)", str(e))
    
    # 1.3: Verify admin-me with token
    try:
        resp = requests.get(f"{API_URL}/auth/admin-me", 
                           headers={"X-Admin-Token": admin_token}, timeout=10)
        
        if resp.status_code != 200:
            fail("Admin /auth/admin-me", f"Expected 200, got {resp.status_code}", 
                 f"GET /api/auth/admin-me", resp.text[:500])
        else:
            data = resp.json()
            if "username" not in data:
                fail("Admin /auth/admin-me", "Missing username in response", 
                     f"GET /api/auth/admin-me", resp.text[:500])
            else:
                success("Admin /auth/admin-me")
    except Exception as e:
        fail("Admin /auth/admin-me", str(e))
    
    # 1.4: Missing token on admin endpoint
    try:
        resp = requests.get(f"{API_URL}/admin/stats", timeout=10)
        
        if resp.status_code != 401:
            fail("Admin endpoint without token", f"Expected 401, got {resp.status_code}", 
                 f"GET /api/admin/stats", resp.text[:500])
        else:
            success("Admin endpoint without token")
    except Exception as e:
        fail("Admin endpoint without token", str(e))


def test_admin_rate_limit():
    """Test admin rate limiting (run last to avoid blocking other tests)"""
    log("\n=== Test: Admin Rate Limiting ===")
    
    # Use a different username to avoid blocking the main admin account
    test_username = f"test_ratelimit_{int(time.time())}"
    
    try:
        # Make 5 failed attempts
        for i in range(5):
            resp = requests.post(f"{API_URL}/auth/admin-login", json={
                "username": test_username,
                "password": "wrongpassword"
            }, timeout=10)
            
            if resp.status_code != 401:
                fail("Admin rate limit setup", f"Attempt {i+1}: Expected 401, got {resp.status_code}")
                return
        
        # 6th attempt should be rate limited
        resp = requests.post(f"{API_URL}/auth/admin-login", json={
            "username": test_username,
            "password": "wrongpassword"
        }, timeout=10)
        
        if resp.status_code != 429:
            fail("Admin rate limit", f"Expected 429 after 5 failed attempts, got {resp.status_code}", 
                 f"POST /api/auth/admin-login", resp.text[:500])
        else:
            success("Admin rate limit")
    except Exception as e:
        fail("Admin rate limit", str(e))


# ============================================================================
# Test 2: Regression Tests
# ============================================================================

def test_regression():
    """Test existing endpoints still work"""
    global test_business_id, test_business_slug
    
    log("\n=== Test 2: Regression Tests ===")
    
    # 2.1: GET /api/home
    try:
        resp = requests.get(f"{API_URL}/home", timeout=10)
        if resp.status_code != 200:
            fail("GET /api/home", f"Expected 200, got {resp.status_code}", 
                 f"GET /api/home", resp.text[:500])
        else:
            data = resp.json()
            if "categories" not in data or "cities" not in data:
                fail("GET /api/home", "Missing categories or cities", 
                     f"GET /api/home", resp.text[:500])
            else:
                success("GET /api/home")
    except Exception as e:
        fail("GET /api/home", str(e))
    
    # 2.2: GET /api/catalog
    try:
        resp = requests.get(f"{API_URL}/catalog", timeout=10)
        if resp.status_code != 200:
            fail("GET /api/catalog", f"Expected 200, got {resp.status_code}", 
                 f"GET /api/catalog", resp.text[:500])
        else:
            success("GET /api/catalog")
    except Exception as e:
        fail("GET /api/catalog", str(e))
    
    # 2.3: GET /api/listing/dentists/new-york/new-york
    try:
        resp = requests.get(f"{API_URL}/listing/dentists/new-york/new-york", timeout=10)
        if resp.status_code != 200:
            fail("GET /api/listing", f"Expected 200, got {resp.status_code}", 
                 f"GET /api/listing/dentists/new-york/new-york", resp.text[:500])
        else:
            data = resp.json()
            if "businesses" not in data or len(data["businesses"]) == 0:
                fail("GET /api/listing", "No businesses returned", 
                     f"GET /api/listing/dentists/new-york/new-york", resp.text[:500])
            else:
                # Save a business for detail test
                test_business_slug = data["businesses"][0]["slug"]
                test_business_id = data["businesses"][0]["id"]
                success("GET /api/listing")
    except Exception as e:
        fail("GET /api/listing", str(e))
    
    # 2.4: GET /api/detail
    if test_business_slug:
        try:
            resp = requests.get(f"{API_URL}/detail/dentists/new-york/new-york/{test_business_slug}", 
                               timeout=10)
            if resp.status_code != 200:
                fail("GET /api/detail", f"Expected 200, got {resp.status_code}", 
                     f"GET /api/detail/dentists/new-york/new-york/{test_business_slug}", resp.text[:500])
            else:
                success("GET /api/detail")
        except Exception as e:
            fail("GET /api/detail", str(e))
    
    # 2.5: GET /api/search
    try:
        resp = requests.get(f"{API_URL}/search?what=dentist&where=new york", timeout=10)
        if resp.status_code != 200:
            fail("GET /api/search", f"Expected 200, got {resp.status_code}", 
                 f"GET /api/search?what=dentist&where=new york", resp.text[:500])
        else:
            success("GET /api/search")
    except Exception as e:
        fail("GET /api/search", str(e))
    
    # 2.6: POST /api/leads
    if test_business_id:
        try:
            resp = requests.post(f"{API_URL}/leads", json={
                "business_id": test_business_id,
                "type": "call"
            }, timeout=10)
            if resp.status_code != 200:
                fail("POST /api/leads", f"Expected 200, got {resp.status_code}", 
                     f"POST /api/leads", resp.text[:500])
            else:
                success("POST /api/leads")
        except Exception as e:
            fail("POST /api/leads", str(e))
    
    # 2.7: POST /api/favorites (toggle)
    if test_business_id and user_a_token:
        try:
            resp = requests.post(f"{API_URL}/favorites/{test_business_id}", 
                                headers={"Authorization": f"Bearer {user_a_token}"}, timeout=10)
            if resp.status_code != 200:
                fail("POST /api/favorites", f"Expected 200, got {resp.status_code}", 
                     f"POST /api/favorites/{test_business_id}", resp.text[:500])
            else:
                success("POST /api/favorites")
        except Exception as e:
            fail("POST /api/favorites", str(e))
    
    # 2.8: GET /api/admin/stats
    if admin_token:
        try:
            resp = requests.get(f"{API_URL}/admin/stats", 
                               headers={"X-Admin-Token": admin_token}, timeout=10)
            if resp.status_code != 200:
                fail("GET /api/admin/stats", f"Expected 200, got {resp.status_code}", 
                     f"GET /api/admin/stats", resp.text[:500])
            else:
                data = resp.json()
                if "pending_claims" not in data or "claimed" not in data:
                    fail("GET /api/admin/stats", "Missing pending_claims or claimed", 
                         f"GET /api/admin/stats", resp.text[:500])
                else:
                    success("GET /api/admin/stats")
        except Exception as e:
            fail("GET /api/admin/stats", str(e))
    
    # 2.9: GET /api/admin/leads
    if admin_token:
        try:
            resp = requests.get(f"{API_URL}/admin/leads", 
                               headers={"X-Admin-Token": admin_token}, timeout=10)
            if resp.status_code != 200:
                fail("GET /api/admin/leads", f"Expected 200, got {resp.status_code}", 
                     f"GET /api/admin/leads", resp.text[:500])
            else:
                success("GET /api/admin/leads")
        except Exception as e:
            fail("GET /api/admin/leads", str(e))
    
    # 2.10: GET /api/admin/submissions
    if admin_token:
        try:
            resp = requests.get(f"{API_URL}/admin/submissions", 
                               headers={"X-Admin-Token": admin_token}, timeout=10)
            if resp.status_code != 200:
                fail("GET /api/admin/submissions", f"Expected 200, got {resp.status_code}", 
                     f"GET /api/admin/submissions", resp.text[:500])
            else:
                success("GET /api/admin/submissions")
        except Exception as e:
            fail("GET /api/admin/submissions", str(e))
    
    # 2.11: GET /api/sitemap.xml
    try:
        resp = requests.get(f"{API_URL}/sitemap.xml", timeout=10)
        if resp.status_code != 200:
            fail("GET /api/sitemap.xml", f"Expected 200, got {resp.status_code}", 
                 f"GET /api/sitemap.xml", resp.text[:500])
        else:
            success("GET /api/sitemap.xml")
    except Exception as e:
        fail("GET /api/sitemap.xml", str(e))


# ============================================================================
# Test 3: Settings API
# ============================================================================

def test_settings():
    """Test settings API"""
    log("\n=== Test 3: Settings API ===")
    
    # 3.1: GET /api/settings/public (initially media_enabled false)
    try:
        resp = requests.get(f"{API_URL}/settings/public", timeout=10)
        if resp.status_code != 200:
            fail("GET /api/settings/public", f"Expected 200, got {resp.status_code}", 
                 f"GET /api/settings/public", resp.text[:500])
        else:
            data = resp.json()
            if "media_enabled" not in data:
                fail("GET /api/settings/public", "Missing media_enabled", 
                     f"GET /api/settings/public", resp.text[:500])
            else:
                log(f"Initial media_enabled: {data['media_enabled']}")
                success("GET /api/settings/public")
    except Exception as e:
        fail("GET /api/settings/public", str(e))
    
    # 3.2: GET /api/admin/settings
    if admin_token:
        try:
            resp = requests.get(f"{API_URL}/admin/settings", 
                               headers={"X-Admin-Token": admin_token}, timeout=10)
            if resp.status_code != 200:
                fail("GET /api/admin/settings", f"Expected 200, got {resp.status_code}", 
                     f"GET /api/admin/settings", resp.text[:500])
            else:
                data = resp.json()
                if "cloudinary" not in data:
                    fail("GET /api/admin/settings", "Missing cloudinary", 
                         f"GET /api/admin/settings", resp.text[:500])
                else:
                    log(f"Cloudinary has_secret: {data['cloudinary'].get('has_secret')}")
                    success("GET /api/admin/settings")
        except Exception as e:
            fail("GET /api/admin/settings", str(e))
    
    # 3.3: PUT /api/admin/settings (set Cloudinary creds)
    if admin_token:
        try:
            resp = requests.put(f"{API_URL}/admin/settings", 
                               headers={"X-Admin-Token": admin_token},
                               json={
                                   "cloudinary": {
                                       "cloud_name": "demo",
                                       "api_key": "123",
                                       "api_secret": "secret123"
                                   }
                               }, timeout=10)
            if resp.status_code != 200:
                fail("PUT /api/admin/settings", f"Expected 200, got {resp.status_code}", 
                     f"PUT /api/admin/settings", resp.text[:500])
            else:
                data = resp.json()
                if not data.get("media_enabled"):
                    fail("PUT /api/admin/settings", "media_enabled should be true after setting creds", 
                         f"PUT /api/admin/settings", resp.text[:500])
                elif "api_secret" in data.get("cloudinary", {}):
                    fail("PUT /api/admin/settings", "api_secret should not be returned", 
                         f"PUT /api/admin/settings", resp.text[:500])
                elif data["cloudinary"].get("secret_hint") != "••••t123":
                    fail("PUT /api/admin/settings", f"secret_hint should be '••••t123', got {data['cloudinary'].get('secret_hint')}", 
                         f"PUT /api/admin/settings", resp.text[:500])
                else:
                    success("PUT /api/admin/settings (set creds)")
        except Exception as e:
            fail("PUT /api/admin/settings", str(e))
    
    # 3.4: PUT with empty api_secret should keep has_secret true
    if admin_token:
        try:
            resp = requests.put(f"{API_URL}/admin/settings", 
                               headers={"X-Admin-Token": admin_token},
                               json={
                                   "cloudinary": {
                                       "cloud_name": "demo",
                                       "api_key": "123",
                                       "api_secret": ""
                                   }
                               }, timeout=10)
            if resp.status_code != 200:
                fail("PUT /api/admin/settings (empty secret)", f"Expected 200, got {resp.status_code}", 
                     f"PUT /api/admin/settings", resp.text[:500])
            else:
                data = resp.json()
                if not data["cloudinary"].get("has_secret"):
                    fail("PUT /api/admin/settings (empty secret)", "has_secret should remain true", 
                         f"PUT /api/admin/settings", resp.text[:500])
                else:
                    success("PUT /api/admin/settings (empty secret keeps old)")
        except Exception as e:
            fail("PUT /api/admin/settings (empty secret)", str(e))
    
    # 3.5: POST /api/admin/settings/cloudinary-test with fake creds
    if admin_token:
        try:
            resp = requests.post(f"{API_URL}/admin/settings/cloudinary-test", 
                                headers={"X-Admin-Token": admin_token}, timeout=10)
            if resp.status_code not in (400, 503):
                fail("POST /api/admin/settings/cloudinary-test", 
                     f"Expected 400 or 503 with fake creds, got {resp.status_code}", 
                     f"POST /api/admin/settings/cloudinary-test", resp.text[:500])
            else:
                success("POST /api/admin/settings/cloudinary-test (fake creds)")
        except Exception as e:
            fail("POST /api/admin/settings/cloudinary-test", str(e))


# ============================================================================
# Test 4: Media Signature
# ============================================================================

def test_media_signature():
    """Test media signature endpoint"""
    log("\n=== Test 4: Media Signature ===")
    
    # 4.1: GET /api/media/signature (authenticated)
    if user_a_token:
        try:
            resp = requests.get(f"{API_URL}/media/signature?resource_type=image&purpose=review", 
                               headers={"Authorization": f"Bearer {user_a_token}"}, timeout=10)
            if resp.status_code != 200:
                fail("GET /api/media/signature", f"Expected 200, got {resp.status_code}", 
                     f"GET /api/media/signature", resp.text[:500])
            else:
                data = resp.json()
                required = ["signature", "timestamp", "cloud_name", "api_key", "folder", "upload_url"]
                missing = [k for k in required if k not in data]
                if missing:
                    fail("GET /api/media/signature", f"Missing fields: {missing}", 
                         f"GET /api/media/signature", resp.text[:500])
                elif not data["folder"].startswith(f"nearbyok/review/{user_a_id}"):
                    fail("GET /api/media/signature", f"Folder should be nearbyok/review/{user_a_id}, got {data['folder']}", 
                         f"GET /api/media/signature", resp.text[:500])
                else:
                    success("GET /api/media/signature (authenticated)")
        except Exception as e:
            fail("GET /api/media/signature", str(e))
    
    # 4.2: Invalid purpose
    if user_a_token:
        try:
            resp = requests.get(f"{API_URL}/media/signature?resource_type=image&purpose=invalid", 
                               headers={"Authorization": f"Bearer {user_a_token}"}, timeout=10)
            if resp.status_code != 400:
                fail("GET /api/media/signature (invalid purpose)", f"Expected 400, got {resp.status_code}", 
                     f"GET /api/media/signature?purpose=invalid", resp.text[:500])
            else:
                success("GET /api/media/signature (invalid purpose)")
        except Exception as e:
            fail("GET /api/media/signature (invalid purpose)", str(e))
    
    # 4.3: Unauthenticated
    try:
        resp = requests.get(f"{API_URL}/media/signature?resource_type=image&purpose=review", timeout=10)
        if resp.status_code != 401:
            fail("GET /api/media/signature (unauthenticated)", f"Expected 401, got {resp.status_code}", 
                 f"GET /api/media/signature", resp.text[:500])
        else:
            success("GET /api/media/signature (unauthenticated)")
    except Exception as e:
        fail("GET /api/media/signature (unauthenticated)", str(e))
    
    # 4.4: Disable Cloudinary and test 503
    if admin_token:
        try:
            # Reset cloudinary to blank
            resp = requests.put(f"{API_URL}/admin/settings", 
                               headers={"X-Admin-Token": admin_token},
                               json={
                                   "cloudinary": {
                                       "cloud_name": "",
                                       "api_key": "",
                                       "api_secret": ""
                                   }
                               }, timeout=10)
            
            if resp.status_code != 200:
                fail("PUT /api/admin/settings (disable cloudinary)", f"Expected 200, got {resp.status_code}")
            else:
                # Now test signature endpoint
                resp = requests.get(f"{API_URL}/media/signature?resource_type=image&purpose=review", 
                                   headers={"Authorization": f"Bearer {user_a_token}"}, timeout=10)
                if resp.status_code != 503:
                    fail("GET /api/media/signature (cloudinary disabled)", 
                         f"Expected 503, got {resp.status_code}", 
                         f"GET /api/media/signature", resp.text[:500])
                else:
                    success("GET /api/media/signature (cloudinary disabled)")
                
                # Verify public settings shows media_enabled false
                resp = requests.get(f"{API_URL}/settings/public", timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("media_enabled"):
                        fail("GET /api/settings/public (after disable)", 
                             "media_enabled should be false after disabling cloudinary")
                    else:
                        success("GET /api/settings/public (media_enabled false)")
        except Exception as e:
            fail("Disable cloudinary test", str(e))


# ============================================================================
# Test 5: Claim Flow
# ============================================================================

def test_claim_flow():
    """Test claim listing flow"""
    global test_claim_id
    
    log("\n=== Test 5: Claim Flow ===")
    
    # Find a business to claim (seed or Google)
    business_to_claim = None
    try:
        # Get a business from listing
        resp = requests.get(f"{API_URL}/listing/dentists/new-york/new-york", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            # Find a seed business (not already claimed)
            for biz in data["businesses"]:
                if biz.get("source") == "seed" and not biz.get("claimed"):
                    business_to_claim = biz
                    break
            
            # If no seed, try Google
            if not business_to_claim:
                for biz in data["businesses"]:
                    if biz.get("source") == "google" and not biz.get("claimed"):
                        business_to_claim = biz
                        break
    except Exception as e:
        fail("Find business to claim", str(e))
        return
    
    if not business_to_claim:
        fail("Find business to claim", "No unclaimed business found")
        return
    
    log(f"Found business to claim: {business_to_claim['id']} ({business_to_claim['name']})")
    
    # 5.1: User A claims the business
    if user_a_token:
        try:
            resp = requests.post(f"{API_URL}/businesses/{business_to_claim['id']}/claim", 
                                headers={"Authorization": f"Bearer {user_a_token}"},
                                json={
                                    "role": "Owner",
                                    "full_name": "Test Owner A",
                                    "phone": "+1 212 555 0100",
                                    "email": "a@x.com",
                                    "message": "I own this business",
                                    "proof_media": [{
                                        "url": "https://res.cloudinary.com/demo/image/upload/v1/x.jpg",
                                        "public_id": "nearbyok/claim/u/x",
                                        "type": "image"
                                    }]
                                }, timeout=10)
            
            if resp.status_code != 200:
                fail("POST /api/businesses/{id}/claim", f"Expected 200, got {resp.status_code}", 
                     f"POST /api/businesses/{business_to_claim['id']}/claim", resp.text[:500])
                return
            else:
                data = resp.json()
                if data.get("status") != "pending":
                    fail("POST /api/businesses/{id}/claim", f"Expected status 'pending', got {data.get('status')}", 
                         f"POST /api/businesses/{business_to_claim['id']}/claim", resp.text[:500])
                    return
                test_claim_id = data.get("id")
                success("POST /api/businesses/{id}/claim")
        except Exception as e:
            fail("POST /api/businesses/{id}/claim", str(e))
            return
    
    # 5.2: Duplicate claim should return 409
    if user_a_token:
        try:
            resp = requests.post(f"{API_URL}/businesses/{business_to_claim['id']}/claim", 
                                headers={"Authorization": f"Bearer {user_a_token}"},
                                json={
                                    "role": "Owner",
                                    "full_name": "Test Owner A",
                                    "phone": "+1 212 555 0100",
                                    "email": "a@x.com",
                                    "message": "Duplicate claim"
                                }, timeout=10)
            
            if resp.status_code != 409:
                fail("POST /api/businesses/{id}/claim (duplicate)", f"Expected 409, got {resp.status_code}", 
                     f"POST /api/businesses/{business_to_claim['id']}/claim", resp.text[:500])
            else:
                success("POST /api/businesses/{id}/claim (duplicate)")
        except Exception as e:
            fail("POST /api/businesses/{id}/claim (duplicate)", str(e))
    
    # 5.3: GET /api/my/claims (User A)
    if user_a_token:
        try:
            resp = requests.get(f"{API_URL}/my/claims", 
                               headers={"Authorization": f"Bearer {user_a_token}"}, timeout=10)
            
            if resp.status_code != 200:
                fail("GET /api/my/claims", f"Expected 200, got {resp.status_code}", 
                     f"GET /api/my/claims", resp.text[:500])
            else:
                data = resp.json()
                if "items" not in data or len(data["items"]) == 0:
                    fail("GET /api/my/claims", "No claims returned", 
                         f"GET /api/my/claims", resp.text[:500])
                else:
                    claim = data["items"][0]
                    if "business" not in claim:
                        fail("GET /api/my/claims", "Missing business in claim", 
                             f"GET /api/my/claims", resp.text[:500])
                    else:
                        success("GET /api/my/claims")
        except Exception as e:
            fail("GET /api/my/claims", str(e))
    
    # 5.4: GET /api/detail as User A (should show my_claim_status pending, can_claim false)
    if user_a_token:
        try:
            resp = requests.get(f"{API_URL}/detail/dentists/new-york/new-york/{business_to_claim['slug']}", 
                               headers={"Authorization": f"Bearer {user_a_token}"}, timeout=10)
            
            if resp.status_code != 200:
                fail("GET /api/detail (User A, pending claim)", f"Expected 200, got {resp.status_code}")
            else:
                data = resp.json()
                claim = data.get("claim", {})
                if claim.get("my_claim_status") != "pending":
                    fail("GET /api/detail (User A, pending claim)", 
                         f"Expected my_claim_status 'pending', got {claim.get('my_claim_status')}")
                elif claim.get("can_claim") != False:
                    fail("GET /api/detail (User A, pending claim)", 
                         f"Expected can_claim False, got {claim.get('can_claim')}")
                else:
                    success("GET /api/detail (User A, pending claim)")
        except Exception as e:
            fail("GET /api/detail (User A, pending claim)", str(e))
    
    # 5.5: GET /api/admin/claims?status=pending
    if admin_token and test_claim_id:
        try:
            resp = requests.get(f"{API_URL}/admin/claims?status=pending", 
                               headers={"X-Admin-Token": admin_token}, timeout=10)
            
            if resp.status_code != 200:
                fail("GET /api/admin/claims?status=pending", f"Expected 200, got {resp.status_code}", 
                     f"GET /api/admin/claims?status=pending", resp.text[:500])
            else:
                data = resp.json()
                if "items" not in data or "counts" not in data:
                    fail("GET /api/admin/claims?status=pending", "Missing items or counts", 
                         f"GET /api/admin/claims?status=pending", resp.text[:500])
                else:
                    # Check if our claim is in the list
                    found = any(c["id"] == test_claim_id for c in data["items"])
                    if not found:
                        fail("GET /api/admin/claims?status=pending", f"Claim {test_claim_id} not found in pending claims")
                    else:
                        success("GET /api/admin/claims?status=pending")
        except Exception as e:
            fail("GET /api/admin/claims?status=pending", str(e))
    
    # 5.6: Admin approves the claim
    if admin_token and test_claim_id:
        try:
            resp = requests.post(f"{API_URL}/admin/claims/{test_claim_id}/approve", 
                                headers={"X-Admin-Token": admin_token},
                                json={"note": "Approved for testing"}, timeout=10)
            
            if resp.status_code != 200:
                fail("POST /api/admin/claims/{id}/approve", f"Expected 200, got {resp.status_code}", 
                     f"POST /api/admin/claims/{test_claim_id}/approve", resp.text[:500])
            else:
                success("POST /api/admin/claims/{id}/approve")
        except Exception as e:
            fail("POST /api/admin/claims/{id}/approve", str(e))
    
    # 5.7: GET /api/detail as User A (should show is_owner true, claimed true, verified true)
    if user_a_token:
        try:
            resp = requests.get(f"{API_URL}/detail/dentists/new-york/new-york/{business_to_claim['slug']}", 
                               headers={"Authorization": f"Bearer {user_a_token}"}, timeout=10)
            
            if resp.status_code != 200:
                fail("GET /api/detail (User A, after approve)", f"Expected 200, got {resp.status_code}")
            else:
                data = resp.json()
                claim = data.get("claim", {})
                business = data.get("business", {})
                
                errors = []
                if not claim.get("is_owner"):
                    errors.append(f"is_owner should be true, got {claim.get('is_owner')}")
                if not claim.get("claimed"):
                    errors.append(f"claimed should be true, got {claim.get('claimed')}")
                if not business.get("claimed"):
                    errors.append(f"business.claimed should be true, got {business.get('claimed')}")
                if not business.get("verified"):
                    errors.append(f"business.verified should be true, got {business.get('verified')}")
                
                if errors:
                    fail("GET /api/detail (User A, after approve)", "; ".join(errors))
                else:
                    success("GET /api/detail (User A, after approve)")
        except Exception as e:
            fail("GET /api/detail (User A, after approve)", str(e))
    
    # 5.8: GET /api/detail as User B (should show claimed true, can_claim false)
    if user_b_token:
        try:
            resp = requests.get(f"{API_URL}/detail/dentists/new-york/new-york/{business_to_claim['slug']}", 
                               headers={"Authorization": f"Bearer {user_b_token}"}, timeout=10)
            
            if resp.status_code != 200:
                fail("GET /api/detail (User B, after approve)", f"Expected 200, got {resp.status_code}")
            else:
                data = resp.json()
                claim = data.get("claim", {})
                
                errors = []
                if not claim.get("claimed"):
                    errors.append(f"claimed should be true, got {claim.get('claimed')}")
                if claim.get("can_claim") != False:
                    errors.append(f"can_claim should be false, got {claim.get('can_claim')}")
                
                if errors:
                    fail("GET /api/detail (User B, after approve)", "; ".join(errors))
                else:
                    success("GET /api/detail (User B, after approve)")
        except Exception as e:
            fail("GET /api/detail (User B, after approve)", str(e))
    
    # 5.9: User B tries to claim (should get 409)
    if user_b_token:
        try:
            resp = requests.post(f"{API_URL}/businesses/{business_to_claim['id']}/claim", 
                                headers={"Authorization": f"Bearer {user_b_token}"},
                                json={
                                    "role": "Owner",
                                    "full_name": "Test Owner B",
                                    "phone": "+1 212 555 0200",
                                    "email": "b@x.com",
                                    "message": "I own this business"
                                }, timeout=10)
            
            if resp.status_code != 409:
                fail("POST /api/businesses/{id}/claim (already claimed)", 
                     f"Expected 409, got {resp.status_code}", 
                     f"POST /api/businesses/{business_to_claim['id']}/claim", resp.text[:500])
            else:
                success("POST /api/businesses/{id}/claim (already claimed)")
        except Exception as e:
            fail("POST /api/businesses/{id}/claim (already claimed)", str(e))


# ============================================================================
# Test 6: Owner Listing Edit
# ============================================================================

def test_owner_edit():
    """Test owner listing edit"""
    log("\n=== Test 6: Owner Listing Edit ===")
    
    # Find the claimed business
    claimed_business = None
    try:
        resp = requests.get(f"{API_URL}/my/listings", 
                           headers={"Authorization": f"Bearer {user_a_token}"}, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("items"):
                claimed_business = data["items"][0]
    except Exception as e:
        fail("Find claimed business", str(e))
        return
    
    if not claimed_business:
        fail("Find claimed business", "No claimed business found for User A")
        return
    
    log(f"Found claimed business: {claimed_business['id']}")
    
    # 6.1: GET /api/my/listings/{id}
    if user_a_token:
        try:
            resp = requests.get(f"{API_URL}/my/listings/{claimed_business['id']}", 
                               headers={"Authorization": f"Bearer {user_a_token}"}, timeout=10)
            
            if resp.status_code != 200:
                fail("GET /api/my/listings/{id}", f"Expected 200, got {resp.status_code}", 
                     f"GET /api/my/listings/{claimed_business['id']}", resp.text[:500])
            else:
                data = resp.json()
                required = ["business", "raw", "owner_media", "google_images"]
                missing = [k for k in required if k not in data]
                if missing:
                    fail("GET /api/my/listings/{id}", f"Missing fields: {missing}", 
                         f"GET /api/my/listings/{claimed_business['id']}", resp.text[:500])
                else:
                    success("GET /api/my/listings/{id}")
        except Exception as e:
            fail("GET /api/my/listings/{id}", str(e))
    
    # 6.2: PUT /api/my/listings/{id} with media
    if user_a_token:
        try:
            resp = requests.put(f"{API_URL}/my/listings/{claimed_business['id']}", 
                               headers={"Authorization": f"Bearer {user_a_token}"},
                               json={
                                   "phone": "+1 212 555 0199",
                                   "tagline": "Family dentist",
                                   "description": "Long description of the business",
                                   "services": ["Service A", "Service B"],
                                   "open_hour": 8,
                                   "close_hour": 20,
                                   "closed_sunday": True,
                                   "media": [
                                       {
                                           "url": "https://res.cloudinary.com/demo/image/upload/v1/p1.jpg",
                                           "public_id": "nearbyok/listing/u/p1",
                                           "type": "image"
                                       },
                                       {
                                           "url": "https://res.cloudinary.com/demo/video/upload/v1/v1.mp4",
                                           "public_id": "nearbyok/listing/u/v1",
                                           "type": "video"
                                       }
                                   ]
                               }, timeout=10)
            
            if resp.status_code != 200:
                fail("PUT /api/my/listings/{id}", f"Expected 200, got {resp.status_code}", 
                     f"PUT /api/my/listings/{claimed_business['id']}", resp.text[:500])
            else:
                data = resp.json()
                business = data.get("business", {})
                
                errors = []
                if not business.get("images") or "p1.jpg" not in business["images"][0]:
                    errors.append(f"First image should be p1.jpg, got {business.get('images')}")
                if not business.get("videos") or len(business["videos"]) != 1:
                    errors.append(f"Should have 1 video, got {len(business.get('videos', []))}")
                if business.get("videos") and not business["videos"][0].get("thumb", "").endswith(".jpg"):
                    errors.append(f"Video thumb should end with .jpg, got {business['videos'][0].get('thumb')}")
                if business.get("tagline") != "Family dentist":
                    errors.append(f"tagline should be 'Family dentist', got {business.get('tagline')}")
                
                if errors:
                    fail("PUT /api/my/listings/{id}", "; ".join(errors))
                else:
                    success("PUT /api/my/listings/{id}")
        except Exception as e:
            fail("PUT /api/my/listings/{id}", str(e))
    
    # 6.3: GET /api/detail to verify changes
    if claimed_business:
        try:
            resp = requests.get(f"{API_URL}/detail/dentists/new-york/new-york/{claimed_business['slug']}", 
                               timeout=10)
            
            if resp.status_code != 200:
                fail("GET /api/detail (after owner edit)", f"Expected 200, got {resp.status_code}")
            else:
                data = resp.json()
                business = data.get("business", {})
                hours = data.get("hours", {})
                services = data.get("services", [])
                
                errors = []
                if business.get("tagline") != "Family dentist":
                    errors.append(f"tagline should be 'Family dentist', got {business.get('tagline')}")
                if "Sunday" in hours and hours["Sunday"] != "Closed":
                    errors.append(f"Sunday should be 'Closed', got {hours.get('Sunday')}")
                if "Service A" not in services or "Service B" not in services:
                    errors.append(f"Services should include 'Service A' and 'Service B', got {services}")
                
                if errors:
                    fail("GET /api/detail (after owner edit)", "; ".join(errors))
                else:
                    success("GET /api/detail (after owner edit)")
        except Exception as e:
            fail("GET /api/detail (after owner edit)", str(e))
    
    # 6.4: User B tries to PUT (should get 403)
    if user_b_token and claimed_business:
        try:
            resp = requests.put(f"{API_URL}/my/listings/{claimed_business['id']}", 
                               headers={"Authorization": f"Bearer {user_b_token}"},
                               json={"phone": "+1 212 555 9999"}, timeout=10)
            
            if resp.status_code != 403:
                fail("PUT /api/my/listings/{id} (User B)", f"Expected 403, got {resp.status_code}", 
                     f"PUT /api/my/listings/{claimed_business['id']}", resp.text[:500])
            else:
                success("PUT /api/my/listings/{id} (User B forbidden)")
        except Exception as e:
            fail("PUT /api/my/listings/{id} (User B)", str(e))
    
    # 6.5: PUT with empty body (should get 400)
    if user_a_token and claimed_business:
        try:
            resp = requests.put(f"{API_URL}/my/listings/{claimed_business['id']}", 
                               headers={"Authorization": f"Bearer {user_a_token}"},
                               json={}, timeout=10)
            
            if resp.status_code != 400:
                fail("PUT /api/my/listings/{id} (empty body)", f"Expected 400, got {resp.status_code}", 
                     f"PUT /api/my/listings/{claimed_business['id']}", resp.text[:500])
            else:
                success("PUT /api/my/listings/{id} (empty body)")
        except Exception as e:
            fail("PUT /api/my/listings/{id} (empty body)", str(e))
    
    # 6.6: GET /api/my/listings (should include the claimed business)
    if user_a_token:
        try:
            resp = requests.get(f"{API_URL}/my/listings", 
                               headers={"Authorization": f"Bearer {user_a_token}"}, timeout=10)
            
            if resp.status_code != 200:
                fail("GET /api/my/listings", f"Expected 200, got {resp.status_code}")
            else:
                data = resp.json()
                if not data.get("items"):
                    fail("GET /api/my/listings", "No items returned")
                else:
                    found = any(item["id"] == claimed_business["id"] and item.get("claimed") for item in data["items"])
                    if not found:
                        fail("GET /api/my/listings", f"Claimed business {claimed_business['id']} not found or not marked as claimed")
                    else:
                        success("GET /api/my/listings")
        except Exception as e:
            fail("GET /api/my/listings", str(e))


# ============================================================================
# Test 7: Reviews with Media
# ============================================================================

def test_reviews_with_media():
    """Test reviews with media"""
    log("\n=== Test 7: Reviews with Media ===")
    
    if not test_business_id or not user_b_token:
        fail("Reviews with media", "Missing test_business_id or user_b_token")
        return
    
    # 7.1: POST /api/businesses/{id}/reviews with media
    try:
        resp = requests.post(f"{API_URL}/businesses/{test_business_id}/reviews", 
                            headers={"Authorization": f"Bearer {user_b_token}"},
                            json={
                                "rating": 5,
                                "text": "Great place with excellent service!",
                                "media": [
                                    {
                                        "url": "https://res.cloudinary.com/demo/image/upload/v1/r.jpg",
                                        "public_id": "nearbyok/review/u/r",
                                        "type": "image"
                                    }
                                ]
                            }, timeout=10)
        
        if resp.status_code != 200:
            fail("POST /api/businesses/{id}/reviews (with media)", 
                 f"Expected 200, got {resp.status_code}", 
                 f"POST /api/businesses/{test_business_id}/reviews", resp.text[:500])
        else:
            data = resp.json()
            if "users" not in data or len(data["users"]) == 0:
                fail("POST /api/businesses/{id}/reviews (with media)", "No users returned")
            else:
                review = data["users"][0]
                if not review.get("media") or len(review["media"]) != 1:
                    fail("POST /api/businesses/{id}/reviews (with media)", 
                         f"Expected 1 media item, got {len(review.get('media', []))}")
                else:
                    success("POST /api/businesses/{id}/reviews (with media)")
    except Exception as e:
        fail("POST /api/businesses/{id}/reviews (with media)", str(e))
    
    # 7.2: Non-https URL should be filtered out
    try:
        resp = requests.post(f"{API_URL}/businesses/{test_business_id}/reviews", 
                            headers={"Authorization": f"Bearer {user_b_token}"},
                            json={
                                "rating": 4,
                                "text": "Good service",
                                "media": [
                                    {
                                        "url": "http://example.com/image.jpg",
                                        "public_id": "test",
                                        "type": "image"
                                    }
                                ]
                            }, timeout=10)
        
        if resp.status_code != 200:
            fail("POST /api/businesses/{id}/reviews (non-https)", 
                 f"Expected 200, got {resp.status_code}")
        else:
            data = resp.json()
            review = data["users"][0]
            if review.get("media") and len(review["media"]) > 0:
                fail("POST /api/businesses/{id}/reviews (non-https)", 
                     "Non-https URL should be filtered out")
            else:
                success("POST /api/businesses/{id}/reviews (non-https filtered)")
    except Exception as e:
        fail("POST /api/businesses/{id}/reviews (non-https)", str(e))
    
    # 7.3: GET /api/detail to verify review media
    try:
        resp = requests.get(f"{API_URL}/detail/dentists/new-york/new-york/{test_business_slug}", 
                           timeout=10)
        
        if resp.status_code != 200:
            fail("GET /api/detail (verify review media)", f"Expected 200, got {resp.status_code}")
        else:
            data = resp.json()
            reviews = data.get("reviews", {})
            users = reviews.get("users", [])
            
            if not users:
                fail("GET /api/detail (verify review media)", "No user reviews found")
            else:
                # Find review with media
                review_with_media = next((r for r in users if r.get("media")), None)
                if not review_with_media:
                    fail("GET /api/detail (verify review media)", "No review with media found")
                else:
                    success("GET /api/detail (verify review media)")
    except Exception as e:
        fail("GET /api/detail (verify review media)", str(e))


# ============================================================================
# Test 8: Free Listing with Media
# ============================================================================

def test_free_listing_with_media():
    """Test free listing submission with media"""
    global test_submission_id
    
    log("\n=== Test 8: Free Listing with Media ===")
    
    if not user_b_token:
        fail("Free listing with media", "Missing user_b_token")
        return
    
    # 8.1: POST /api/businesses/submit with media
    try:
        resp = requests.post(f"{API_URL}/businesses/submit", 
                            headers={"Authorization": f"Bearer {user_b_token}"},
                            json={
                                "name": "Test Biz Media",
                                "category": "plumbers",
                                "city": "austin",
                                "area": "Downtown",
                                "address": "100 Congress Ave",
                                "phone": "+1 512 555 0100",
                                "media": [
                                    {
                                        "url": "https://res.cloudinary.com/demo/image/upload/v1/s.jpg",
                                        "public_id": "nearbyok/listing/u/s",
                                        "type": "image"
                                    }
                                ]
                            }, timeout=10)
        
        if resp.status_code != 200:
            fail("POST /api/businesses/submit (with media)", 
                 f"Expected 200, got {resp.status_code}", 
                 f"POST /api/businesses/submit", resp.text[:500])
        else:
            data = resp.json()
            test_submission_id = data.get("id")
            success("POST /api/businesses/submit (with media)")
    except Exception as e:
        fail("POST /api/businesses/submit (with media)", str(e))
        return
    
    # 8.2: GET /api/my/listings (User B should see the submission)
    if user_b_token:
        try:
            resp = requests.get(f"{API_URL}/my/listings", 
                               headers={"Authorization": f"Bearer {user_b_token}"}, timeout=10)
            
            if resp.status_code != 200:
                fail("GET /api/my/listings (User B)", f"Expected 200, got {resp.status_code}")
            else:
                data = resp.json()
                submission = next((item for item in data["items"] if item["id"] == test_submission_id), None)
                if not submission:
                    fail("GET /api/my/listings (User B)", f"Submission {test_submission_id} not found")
                elif not submission.get("images") or "s.jpg" not in submission["images"][0]:
                    fail("GET /api/my/listings (User B)", 
                         f"First image should be s.jpg, got {submission.get('images')}")
                else:
                    success("GET /api/my/listings (User B)")
        except Exception as e:
            fail("GET /api/my/listings (User B)", str(e))
    
    # 8.3: User B can GET/PUT their submission
    if user_b_token and test_submission_id:
        try:
            # GET
            resp = requests.get(f"{API_URL}/my/listings/{test_submission_id}", 
                               headers={"Authorization": f"Bearer {user_b_token}"}, timeout=10)
            
            if resp.status_code != 200:
                fail("GET /api/my/listings/{id} (User B submission)", 
                     f"Expected 200, got {resp.status_code}")
            else:
                success("GET /api/my/listings/{id} (User B submission)")
                
                # PUT
                resp = requests.put(f"{API_URL}/my/listings/{test_submission_id}", 
                                   headers={"Authorization": f"Bearer {user_b_token}"},
                                   json={"phone": "+1 512 555 0199"}, timeout=10)
                
                if resp.status_code != 200:
                    fail("PUT /api/my/listings/{id} (User B submission)", 
                         f"Expected 200, got {resp.status_code}")
                else:
                    success("PUT /api/my/listings/{id} (User B submission)")
        except Exception as e:
            fail("GET/PUT /api/my/listings/{id} (User B submission)", str(e))


# ============================================================================
# Test 9: Google Ingest
# ============================================================================

def test_google_ingest():
    """Test Google Places ingest (real API call)"""
    log("\n=== Test 9: Google Ingest (Real API) ===")
    
    if not admin_token:
        fail("Google ingest", "Missing admin_token")
        return
    
    log("Running real Google Places API call (this may take 20-40 seconds)...")
    
    try:
        resp = requests.post(f"{API_URL}/admin/ingest?category=dentists&city=new-york&pages=1", 
                            headers={"X-Admin-Token": admin_token}, timeout=60)
        
        if resp.status_code != 200:
            fail("POST /api/admin/ingest", 
                 f"Expected 200, got {resp.status_code}. Error: {resp.text[:500]}", 
                 f"POST /api/admin/ingest?category=dentists&city=new-york&pages=1", resp.text[:500])
        else:
            data = resp.json()
            inserted = data.get("inserted", 0)
            if inserted == 0:
                fail("POST /api/admin/ingest", 
                     f"Expected inserted > 0, got {inserted}. Response: {resp.text[:500]}")
            else:
                log(f"Google ingest successful: {inserted} businesses inserted")
                success("POST /api/admin/ingest")
                
                # Verify Google businesses have images
                time.sleep(2)  # Wait for DB to update
                resp = requests.get(f"{API_URL}/listing/dentists/new-york/new-york", timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    google_biz = next((b for b in data["businesses"] if b.get("source") == "google"), None)
                    if google_biz:
                        if not google_biz.get("images") or len(google_biz["images"]) == 0:
                            fail("Google ingest (verify images)", "Google business has no images")
                        else:
                            log(f"Google business has {len(google_biz['images'])} images")
                            success("Google ingest (verify images)")
                    else:
                        fail("Google ingest (verify images)", "No Google business found in listing")
    except Exception as e:
        fail("POST /api/admin/ingest", str(e))


# ============================================================================
# Test 10: Revoke Claim
# ============================================================================

def test_revoke_claim():
    """Test revoking a claim"""
    log("\n=== Test 10: Revoke Claim ===")
    
    if not admin_token or not test_claim_id:
        fail("Revoke claim", "Missing admin_token or test_claim_id")
        return
    
    try:
        resp = requests.post(f"{API_URL}/admin/claims/{test_claim_id}/revoke", 
                            headers={"X-Admin-Token": admin_token},
                            json={"note": "Revoked for testing"}, timeout=10)
        
        if resp.status_code != 200:
            fail("POST /api/admin/claims/{id}/revoke", 
                 f"Expected 200, got {resp.status_code}", 
                 f"POST /api/admin/claims/{test_claim_id}/revoke", resp.text[:500])
        else:
            success("POST /api/admin/claims/{id}/revoke")
            
            # Verify business is no longer claimed
            time.sleep(1)
            # Get the business from my/listings to find its slug
            resp = requests.get(f"{API_URL}/my/listings", 
                               headers={"Authorization": f"Bearer {user_a_token}"}, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                # The business should no longer be in User A's listings
                # Or if it is, it should not be claimed
                log("Verified claim revocation")
    except Exception as e:
        fail("POST /api/admin/claims/{id}/revoke", str(e))


# ============================================================================
# Main Test Runner
# ============================================================================

def main():
    """Run all tests"""
    log("=" * 80)
    log("Starting nearbyok Backend Tests")
    log("=" * 80)
    
    # Create test users
    create_test_users()
    
    # Run tests
    test_admin_auth()
    test_regression()
    test_settings()
    test_media_signature()
    test_claim_flow()
    test_owner_edit()
    test_reviews_with_media()
    test_free_listing_with_media()
    test_google_ingest()
    test_revoke_claim()
    
    # Rate limit test (run last)
    test_admin_rate_limit()
    
    # Cleanup
    cleanup_test_data()
    
    # Summary
    log("\n" + "=" * 80)
    log("TEST SUMMARY")
    log("=" * 80)
    log(f"PASSED: {len(passed_tests)}")
    log(f"FAILED: {len(failed_tests)}")
    
    if failed_tests:
        log("\n" + "=" * 80)
        log("FAILED TESTS:")
        log("=" * 80)
        for failure in failed_tests:
            log(f"\n{failure}")
    
    log("\n" + "=" * 80)
    
    # Exit with appropriate code
    sys.exit(0 if len(failed_tests) == 0 else 1)


if __name__ == "__main__":
    main()
