#!/usr/bin/env python3
"""Backend test suite for AI Trip Planner API endpoints."""
import os
import sys
import time
import requests
from datetime import datetime

# Backend URL from frontend/.env
API_BASE = "https://destination-plan-hub.preview.emergentagent.com/api"

# Test results tracking
passed = 0
failed = 0
test_results = []


def log_test(name, success, details=""):
    """Log test result."""
    global passed, failed
    if success:
        passed += 1
        print(f"✅ {name}")
    else:
        failed += 1
        print(f"❌ {name}")
        if details:
            print(f"   Details: {details}")
    test_results.append({"name": name, "success": success, "details": details})


def create_test_user_session():
    """Create a test user and session in MongoDB."""
    import subprocess
    timestamp = int(time.time() * 1000)
    user_id = f"test-user-{timestamp}"
    session_token = f"test_session_{timestamp}"
    
    mongo_cmd = f"""
mongosh --quiet --eval "
use('nearbyok');
db.users.insertOne({{user_id: '{user_id}', email: 'test.trip.{timestamp}@example.com', name: 'Trip Test User', picture: null, created_at: new Date()}});
db.user_sessions.insertOne({{user_id: '{user_id}', session_token: '{session_token}', expires_at: new Date(Date.now() + 7*24*60*60*1000), created_at: new Date()}});
print('Session token: ' + '{session_token}');
print('User ID: ' + '{user_id}');"
"""
    
    try:
        result = subprocess.run(mongo_cmd, shell=True, capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print(f"✓ Created test user session: {session_token}")
            return session_token, user_id
        else:
            print(f"✗ Failed to create test user: {result.stderr}")
            return None, None
    except Exception as e:
        print(f"✗ Error creating test user: {e}")
        return None, None


def cleanup_test_user(user_id):
    """Clean up test user and session."""
    import subprocess
    mongo_cmd = f"""
mongosh --quiet --eval "
use('nearbyok');
db.users.deleteOne({{user_id: '{user_id}'}});
db.user_sessions.deleteMany({{user_id: '{user_id}'}});
db.trip_saved.deleteMany({{user_email: /test\\.trip\\./}});
print('Cleaned up test user');"
"""
    try:
        subprocess.run(mongo_cmd, shell=True, capture_output=True, text=True, timeout=10)
    except Exception as e:
        print(f"Warning: cleanup failed: {e}")


def test_trip_meta():
    """Test GET /api/trip/meta endpoint."""
    print("\n=== Testing GET /api/trip/meta ===")
    try:
        resp = requests.get(f"{API_BASE}/trip/meta", timeout=10)
        
        if resp.status_code != 200:
            log_test("GET /api/trip/meta returns 200", False, f"Status: {resp.status_code}")
            return
        
        log_test("GET /api/trip/meta returns 200", True)
        
        data = resp.json()
        
        # Check interests (should be 12)
        interests = data.get("interests", [])
        if len(interests) == 12:
            log_test("interests has 12 items", True)
        else:
            log_test("interests has 12 items", False, f"Found {len(interests)} items")
        
        # Verify interests structure
        if interests and all(k in interests[0] for k in ["key", "label", "icon"]):
            log_test("interests items have key/label/icon", True)
        else:
            log_test("interests items have key/label/icon", False)
        
        # Check transports (should be 6)
        transports = data.get("transports", [])
        if len(transports) == 6:
            log_test("transports has 6 items", True)
        else:
            log_test("transports has 6 items", False, f"Found {len(transports)} items")
        
        # Check countries (should be 6)
        countries = data.get("countries", [])
        if len(countries) == 6:
            log_test("countries has 6 items", True)
        else:
            log_test("countries has 6 items", False, f"Found {len(countries)} items")
        
        # Verify countries structure (key/currency/symbol)
        if countries and all(k in countries[0] for k in ["key", "currency", "symbol"]):
            log_test("countries items have key/currency/symbol", True)
        else:
            log_test("countries items have key/currency/symbol", False)
        
        # Check popular_routes (should be 12)
        routes = data.get("popular_routes", [])
        if len(routes) == 12:
            log_test("popular_routes has 12 items", True)
        else:
            log_test("popular_routes has 12 items", False, f"Found {len(routes)} items")
        
        # Verify routes have slug like "chandigarh-to-leh-ladakh"
        if routes and all("slug" in r for r in routes):
            sample_slug = routes[0].get("slug", "")
            if "-to-" in sample_slug:
                log_test("popular_routes items have slug with '-to-' format", True)
                print(f"   Sample slug: {sample_slug}")
            else:
                log_test("popular_routes items have slug with '-to-' format", False, f"Sample: {sample_slug}")
        else:
            log_test("popular_routes items have slug", False)
        
    except Exception as e:
        log_test("GET /api/trip/meta", False, str(e))


def test_trip_popular():
    """Test GET /api/trip/popular endpoint."""
    print("\n=== Testing GET /api/trip/popular ===")
    try:
        resp = requests.get(f"{API_BASE}/trip/popular", timeout=10)
        
        if resp.status_code != 200:
            log_test("GET /api/trip/popular returns 200", False, f"Status: {resp.status_code}")
            return
        
        log_test("GET /api/trip/popular returns 200", True)
        
        data = resp.json()
        routes = data.get("routes", [])
        
        if routes and all("slug" in r for r in routes):
            log_test("routes[] contains items with slug", True)
            print(f"   Found {len(routes)} routes")
        else:
            log_test("routes[] contains items with slug", False)
        
    except Exception as e:
        log_test("GET /api/trip/popular", False, str(e))


def test_trip_plan(request_data, test_name, timeout=120):
    """Test POST /api/trip/plan with given request data."""
    print(f"\n=== Testing POST /api/trip/plan: {test_name} ===")
    print(f"Request: {request_data}")
    
    try:
        start_time = time.time()
        resp = requests.post(f"{API_BASE}/trip/plan", json=request_data, timeout=timeout)
        elapsed = time.time() - start_time
        
        print(f"Response time: {elapsed:.1f}s")
        
        if resp.status_code != 200:
            log_test(f"{test_name}: returns 200", False, f"Status: {resp.status_code}, Body: {resp.text[:500]}")
            return None
        
        log_test(f"{test_name}: returns 200", True)
        
        data = resp.json()
        
        # Check response structure
        if "id" in data and "slug" in data and "plan" in data and "cached" in data:
            log_test(f"{test_name}: has id/slug/plan/cached", True)
        else:
            log_test(f"{test_name}: has id/slug/plan/cached", False, f"Keys: {list(data.keys())}")
            return None
        
        plan = data.get("plan", {})
        
        # Check plan.days is non-empty
        days = plan.get("days", [])
        if days and len(days) > 0:
            log_test(f"{test_name}: plan.days is non-empty", True)
            print(f"   Found {len(days)} day(s)")
        else:
            log_test(f"{test_name}: plan.days is non-empty", False)
            return None
        
        # Check budget_breakdown is non-empty
        budget = plan.get("budget_breakdown", [])
        if budget and len(budget) > 0:
            log_test(f"{test_name}: budget_breakdown is non-empty", True)
            print(f"   Budget items: {len(budget)}")
        else:
            log_test(f"{test_name}: budget_breakdown is non-empty", False)
        
        # Check faqs is non-empty
        faqs = plan.get("faqs", [])
        if faqs and len(faqs) > 0:
            log_test(f"{test_name}: faqs is non-empty", True)
            print(f"   FAQs: {len(faqs)}")
        else:
            log_test(f"{test_name}: faqs is non-empty", False)
        
        # Check map.waypoints is non-empty with lat/lng
        waypoints = plan.get("map", {}).get("waypoints", [])
        if waypoints and len(waypoints) > 0:
            if all("lat" in w and "lng" in w for w in waypoints):
                log_test(f"{test_name}: map.waypoints has lat/lng", True)
                print(f"   Waypoints: {len(waypoints)}")
            else:
                log_test(f"{test_name}: map.waypoints has lat/lng", False)
        else:
            log_test(f"{test_name}: map.waypoints is non-empty", False)
        
        # CRITICAL: Check for songs[] in travel items
        songs_found = []
        for day in days:
            for item in day.get("items", []):
                if item.get("type") == "travel" and item.get("songs"):
                    songs_found.extend(item.get("songs", []))
        
        if songs_found:
            log_test(f"{test_name}: CRITICAL - travel items have songs[]", True)
            print(f"   Total songs found: {len(songs_found)}")
            if songs_found:
                print(f"   Sample song: {songs_found[0].get('title', 'N/A')} by {songs_found[0].get('artist', 'N/A')}")
        else:
            log_test(f"{test_name}: CRITICAL - travel items have songs[]", False, "No songs found in any travel segment")
        
        # CRITICAL: Check for moments[] across the plan
        moments_found = []
        for day in days:
            for item in day.get("items", []):
                if item.get("moments"):
                    moments_found.extend(item.get("moments", []))
        
        if moments_found:
            log_test(f"{test_name}: CRITICAL - plan has moments[]", True)
            print(f"   Total moments found: {len(moments_found)}")
            if moments_found:
                print(f"   Sample moment: {moments_found[0].get('title', 'N/A')} ({moments_found[0].get('kind', 'N/A')})")
        else:
            log_test(f"{test_name}: CRITICAL - plan has moments[]", False, "No moments found in the plan")
        
        # For US trip, check currency symbol
        if request_data.get("country") == "US":
            total_budget = plan.get("total_budget", "")
            if "$" in total_budget:
                log_test(f"{test_name}: US trip uses $ symbol", True)
                print(f"   Total budget: {total_budget}")
            else:
                log_test(f"{test_name}: US trip uses $ symbol", False, f"Budget: {total_budget}")
        
        return data
        
    except requests.exceptions.Timeout:
        log_test(f"{test_name}: request timeout", False, f"Exceeded {timeout}s timeout")
        return None
    except Exception as e:
        log_test(f"{test_name}", False, str(e))
        return None


def test_caching(request_data):
    """Test that repeating the same request returns cached result."""
    print("\n=== Testing Caching ===")
    try:
        start_time = time.time()
        resp = requests.post(f"{API_BASE}/trip/plan", json=request_data, timeout=10)
        elapsed = time.time() - start_time
        
        if resp.status_code != 200:
            log_test("Cached request returns 200", False, f"Status: {resp.status_code}")
            return
        
        data = resp.json()
        
        if data.get("cached") == True:
            log_test("Cached request returns cached:true", True)
            print(f"   Response time: {elapsed:.1f}s (should be fast)")
            
            if elapsed < 5:
                log_test("Cached request is fast (<5s)", True)
            else:
                log_test("Cached request is fast (<5s)", False, f"Took {elapsed:.1f}s")
        else:
            log_test("Cached request returns cached:true", False, f"cached={data.get('cached')}")
        
    except Exception as e:
        log_test("Caching test", False, str(e))


def test_auth_save_flow():
    """Test auth-protected save flow."""
    print("\n=== Testing Auth-Protected Save Flow ===")
    
    # First, create a plan to save
    print("Creating a plan to test save flow...")
    plan_request = {
        "origin": "Hoshiarpur",
        "destination": "Chandigarh",
        "transport": "bus",
        "country": "IN",
        "days": 1,
        "budget": 800,
        "travelers": 1,
        "interests": ["music_movies", "photography", "foodie"],
        "pace": "balanced"
    }
    
    try:
        resp = requests.post(f"{API_BASE}/trip/plan", json=plan_request, timeout=120)
        if resp.status_code != 200:
            log_test("Create plan for save test", False, f"Status: {resp.status_code}")
            return
        
        plan_data = resp.json()
        plan_id = plan_data.get("id")
        
        if not plan_id:
            log_test("Get plan ID for save test", False, "No ID in response")
            return
        
        print(f"✓ Created plan with ID: {plan_id}")
        
        # Test 1: POST /api/trip/save WITHOUT auth -> expect 401
        resp = requests.post(f"{API_BASE}/trip/save", json={"id": plan_id}, timeout=10)
        if resp.status_code == 401:
            log_test("POST /api/trip/save without auth returns 401", True)
        else:
            log_test("POST /api/trip/save without auth returns 401", False, f"Status: {resp.status_code}")
        
        # Create a user session
        session_token, user_id = create_test_user_session()
        if not session_token:
            log_test("Create user session for auth test", False, "Failed to create session")
            return
        
        headers = {"Authorization": f"Bearer {session_token}"}
        
        # Test 2: POST /api/trip/save WITH auth -> expect 200
        resp = requests.post(f"{API_BASE}/trip/save", json={"id": plan_id}, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("saved") == True:
                log_test("POST /api/trip/save with auth returns 200 {saved:true}", True)
            else:
                log_test("POST /api/trip/save with auth returns 200 {saved:true}", False, f"Response: {data}")
        else:
            log_test("POST /api/trip/save with auth returns 200", False, f"Status: {resp.status_code}, Body: {resp.text[:300]}")
        
        # Test 3: GET /api/trip/saved WITH auth -> should contain the saved plan
        resp = requests.get(f"{API_BASE}/trip/saved", headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            items = data.get("items", [])
            if items and any(item.get("plan_id") == plan_id for item in items):
                log_test("GET /api/trip/saved returns saved plan", True)
                print(f"   Found {len(items)} saved plan(s)")
                saved_id = items[0].get("id")
            else:
                log_test("GET /api/trip/saved returns saved plan", False, f"Plan ID {plan_id} not found in {len(items)} items")
                saved_id = None
        else:
            log_test("GET /api/trip/saved returns 200", False, f"Status: {resp.status_code}")
            saved_id = None
        
        # Test 4: DELETE /api/trip/saved/{saved_id} WITH auth -> expect 200
        if saved_id:
            resp = requests.delete(f"{API_BASE}/trip/saved/{saved_id}", headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("deleted") == True:
                    log_test("DELETE /api/trip/saved/{id} returns 200 {deleted:true}", True)
                else:
                    log_test("DELETE /api/trip/saved/{id} returns 200 {deleted:true}", False, f"Response: {data}")
            else:
                log_test("DELETE /api/trip/saved/{id} returns 200", False, f"Status: {resp.status_code}")
            
            # Verify it's deleted
            resp = requests.get(f"{API_BASE}/trip/saved", headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items", [])
                if not any(item.get("id") == saved_id for item in items):
                    log_test("Deleted plan no longer in GET /api/trip/saved", True)
                else:
                    log_test("Deleted plan no longer in GET /api/trip/saved", False, "Plan still present")
        
        # Test 5: POST /api/trip/save with bogus id -> expect 404
        resp = requests.post(f"{API_BASE}/trip/save", json={"id": "bogus-plan-id-12345"}, headers=headers, timeout=10)
        if resp.status_code == 404:
            log_test("POST /api/trip/save with bogus id returns 404", True)
        else:
            log_test("POST /api/trip/save with bogus id returns 404", False, f"Status: {resp.status_code}")
        
        # Cleanup
        cleanup_test_user(user_id)
        
    except Exception as e:
        log_test("Auth save flow test", False, str(e))


def test_route_endpoints():
    """Test GET /api/trip/route/{slug} endpoints."""
    print("\n=== Testing GET /api/trip/route/{slug} ===")
    
    # Test valid route
    try:
        print("Testing valid route: chandigarh-to-leh-ladakh (may take ~40s first call)...")
        start_time = time.time()
        resp = requests.get(f"{API_BASE}/trip/route/chandigarh-to-leh-ladakh", timeout=120)
        elapsed = time.time() - start_time
        
        print(f"Response time: {elapsed:.1f}s")
        
        if resp.status_code == 200:
            log_test("GET /api/trip/route/chandigarh-to-leh-ladakh returns 200", True)
            
            data = resp.json()
            if "plan" in data:
                log_test("Route response has plan", True)
                
                # Check if plan has days
                plan = data.get("plan", {})
                days = plan.get("days", [])
                if days:
                    print(f"   Plan has {len(days)} day(s)")
                    log_test("Route plan has days", True)
                else:
                    log_test("Route plan has days", False)
            else:
                log_test("Route response has plan", False, f"Keys: {list(data.keys())}")
        else:
            log_test("GET /api/trip/route/chandigarh-to-leh-ladakh returns 200", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("GET /api/trip/route/chandigarh-to-leh-ladakh", False, str(e))
    
    # Test invalid route
    try:
        resp = requests.get(f"{API_BASE}/trip/route/not-a-real-route", timeout=10)
        if resp.status_code == 404:
            log_test("GET /api/trip/route/not-a-real-route returns 404", True)
        else:
            log_test("GET /api/trip/route/not-a-real-route returns 404", False, f"Status: {resp.status_code}")
    except Exception as e:
        log_test("GET /api/trip/route/not-a-real-route", False, str(e))


def main():
    """Run all tests."""
    print("=" * 80)
    print("AI TRIP PLANNER BACKEND TEST SUITE")
    print("=" * 80)
    print(f"Backend URL: {API_BASE}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 1: Meta endpoint
    test_trip_meta()
    
    # Test 2: Popular endpoint
    test_trip_popular()
    
    # Test 3a: Short non-stop trip
    short_trip = {
        "origin": "Hoshiarpur",
        "destination": "Chandigarh",
        "transport": "bus",
        "country": "IN",
        "days": 1,
        "budget": 800,
        "travelers": 1,
        "interests": ["music_movies", "photography", "foodie"],
        "pace": "balanced"
    }
    short_result = test_trip_plan(short_trip, "Short non-stop trip (Hoshiarpur->Chandigarh)", timeout=120)
    
    # Test 3b: Multi-day India trip
    india_trip = {
        "origin": "Delhi",
        "destination": "Manali",
        "transport": "car",
        "country": "IN",
        "days": 3,
        "budget": 15000,
        "travelers": 2,
        "interests": ["nature", "foodie"]
    }
    test_trip_plan(india_trip, "Multi-day India trip (Delhi->Manali)", timeout=120)
    
    # Test 3c: US trip
    us_trip = {
        "origin": "Los Angeles",
        "destination": "Las Vegas",
        "transport": "car",
        "country": "US",
        "days": 3,
        "budget": 1200,
        "travelers": 2,
        "interests": ["nightlife", "photography"]
    }
    test_trip_plan(us_trip, "US trip (Los Angeles->Las Vegas)", timeout=120)
    
    # Test 4: Caching (repeat short trip)
    if short_result:
        print("\nWaiting 2s before testing cache...")
        time.sleep(2)
        test_caching(short_trip)
    
    # Test 5: Auth-protected save flow
    test_auth_save_flow()
    
    # Test 6: Route endpoints
    test_route_endpoints()
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"Total tests: {passed + failed}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    
    if failed > 0:
        print("\nFailed tests:")
        for result in test_results:
            if not result["success"]:
                print(f"  - {result['name']}")
                if result["details"]:
                    print(f"    {result['details']}")
    
    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
