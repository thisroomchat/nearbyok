#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================
user_problem_statement: |
  nearbyok.com (programmatic SEO local business directory, React + FastAPI + MongoDB). Phase 1 of continuation:
  (1) Secure admin: /admin now 404s; secret console path from REACT_APP_ADMIN_PATH; username+password login -> JWT (X-Admin-Token header); 5 failed attempts -> 15 min IP lock.
  (2) Site settings in DB (Cloudinary creds set from admin panel at runtime, secret masked) + signed Cloudinary upload signature endpoint.
  (3) Claim listing flow: user claims Google-sourced business -> admin approve/reject/revoke -> owner gets Verified badge, can edit listing (PUT /api/my/listings/{id}) incl. owner photos/videos.
  (4) Reviews accept media[]; free-listing submit accepts media[]; PHOTO_LIMIT 10 for Google ingest; Google re-ingest preserves owner edits/media on claimed listings.

backend:
  - task: "Admin auth: username/password -> JWT, rate limit, X-Admin-Token guard on /api/admin/*"
    implemented: true
    working: true
    file: "backend/auth.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST /api/auth/admin-login {username,password} -> {token, expires_at}; GET /api/auth/admin-me; wrong creds 401; 5 fails -> 429 lock. Credentials in /app/memory/test_credentials.md."
      - working: true
        agent: "testing"
        comment: "✓ Admin login with valid credentials returns token and expires_at. ✓ Wrong password returns 401. ✓ GET /api/auth/admin-me works with token. ✓ Admin endpoints without token return 401. ✓ Rate limit: after 5 failed attempts, 6th attempt returns 429 (IP-based, 15 min lock). All tests passed."
  - task: "Settings API (Cloudinary + site) and public settings"
    implemented: true
    working: true
    file: "backend/owner.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "GET/PUT /api/admin/settings (secret masked, blank secret keeps old), GET /api/settings/public -> media_enabled, POST /api/admin/settings/cloudinary-test."
      - working: true
        agent: "testing"
        comment: "✓ GET /api/settings/public returns media_enabled (false initially). ✓ GET /api/admin/settings returns cloudinary with has_secret and secret_hint. ✓ PUT /api/admin/settings sets cloudinary creds, media_enabled becomes true, api_secret not returned, secret_hint shows '••••t123'. ✓ PUT with empty api_secret keeps has_secret true. ✓ POST /api/admin/settings/cloudinary-test with fake creds returns 400. ✓ Disabling cloudinary (blank cloud_name) makes media_enabled false and signature endpoint returns 503. All tests passed."
  - task: "Media signature + delete endpoints"
    implemented: true
    working: true
    file: "backend/owner.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "GET /api/media/signature?resource_type=image|video&purpose=review|listing|claim (auth) -> 503 when Cloudinary not configured; returns signature when configured (use dummy creds to test signature shape). POST /api/media/delete."
      - working: true
        agent: "testing"
        comment: "✓ GET /api/media/signature with valid auth returns signature, timestamp, cloud_name, api_key, folder (nearbyok/{purpose}/{user_id}), upload_url. ✓ Invalid purpose returns 400. ✓ Unauthenticated request returns 401. ✓ When cloudinary disabled, returns 503. All tests passed."
  - task: "Claim listing flow (user claim, my claims, admin claims approve/reject/revoke)"
    implemented: true
    working: true
    file: "backend/owner.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST /api/businesses/{id}/claim, GET /api/my/claims, GET /api/admin/claims, POST /api/admin/claims/{id}/{approve|reject|revoke}. Approve sets owner_user_id, claimed=true, verified=true. Detail endpoint returns claim{claimed,is_owner,my_claim_status,can_claim}."
      - working: true
        agent: "testing"
        comment: "✓ User A claims business with proof_media, returns status 'pending'. ✓ Duplicate claim returns 409. ✓ GET /api/my/claims shows claim with business. ✓ GET /api/detail as User A shows my_claim_status 'pending', can_claim false. ✓ GET /api/admin/claims?status=pending includes the claim with counts. ✓ Admin approve sets owner_user_id, claimed=true, verified=true. ✓ GET /api/detail as User A after approve shows is_owner true, claimed true, verified true. ✓ GET /api/detail as User B shows claimed true, can_claim false. ✓ User B claim attempt returns 409 (already claimed). ✓ Admin revoke removes owner, sets claimed false. All tests passed."
  - task: "Owner listing edit (GET/PUT /api/my/listings/{id}) with media"
    implemented: true
    working: true
    file: "backend/owner.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Owner only (403 otherwise). media[] -> owner_media, images = owner images + google_images, videos[]. format_business now returns videos, claimed, tagline etc."
      - working: true
        agent: "testing"
        comment: "✓ GET /api/my/listings/{id} returns business, raw (editable fields), owner_media, google_images. ✓ PUT /api/my/listings/{id} with phone, tagline, description, services, hours, media (image + video) updates successfully. ✓ business.images[0] is owner image (p1.jpg), videos length 1 with thumb ending .jpg, tagline returned. ✓ GET /api/detail reflects changes (hours table shows Sunday Closed, services updated). ✓ User B PUT returns 403. ✓ PUT with empty body returns 400. ✓ GET /api/my/listings includes claimed business. All tests passed."
  - task: "Reviews with media + submit with media + Google ingest preserving owner data"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "ReviewIn.media, SubmitIn.media. ingest_google skips OWNER_EDITABLE fields for claimed docs. Existing endpoints (home/listing/detail/search/leads/favorites/admin stats/ingest) must still work; admin endpoints now need X-Admin-Token."
      - working: true
        agent: "testing"
        comment: "✓ POST /api/businesses/{id}/reviews with media returns users[0].media with 1 item. ✓ Non-https URL filtered out. ✓ GET /api/detail shows review media in reviews.users. ✓ POST /api/businesses/submit with media creates business with images[0] = s.jpg. ✓ GET /api/my/listings shows submission with media. ✓ Owner submissions are owner-managed (User B can GET/PUT their submission). ✓ POST /api/admin/ingest?category=dentists&city=new-york&pages=1 returns 200 with inserted count 20 (real Google API call successful). ✓ Google businesses have images (up to 10). ✓ All regression tests passed: /api/home, /api/catalog, /api/listing, /api/detail, /api/search, /api/leads, /api/favorites, /api/admin/stats (includes pending_claims and claimed), /api/admin/leads, /api/admin/submissions, /api/sitemap.xml. All tests passed."

  - task: "Phase2: console analytics/businesses manager/reviews/users/audit/leads csv"
    implemented: true
    working: true
    file: "backend/admin_extra.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "GET /api/admin/analytics?days=30, GET /api/admin/businesses (filters q/category/city/source/status/flag/sort/page), PATCH/DELETE /api/admin/businesses/{id}, GET /api/admin/reviews + DELETE /api/admin/reviews/{id}, GET /api/admin/users, GET /api/admin/audit, GET /api/admin/leads/export.csv"
      - working: true
        agent: "testing"
        comment: "✓ Analytics: GET /api/admin/analytics returns all required keys (leads_daily, users_daily, reviews_daily, claims_daily, leads_by_category, leads_by_city, businesses_by_category[34], businesses_by_city[32], totals with categories=34, cities=32, seo_pages=1088, coverage_done). Unauthenticated returns 401. ✓ Businesses manager: GET /api/admin/businesses?limit=10 returns items, total, pages. Filters work (category=dentists&city=new-york&source=google returns 20 google dentists, ?q=<search>, ?flag=unverified, ?sort=rating). PATCH /api/admin/businesses/{id} updates sponsored, verified, name correctly. PATCH {} returns 400. PATCH bad status/category returns 400. DELETE removes business (404 on subsequent PATCH). Audit log contains business_patch and business_delete entries. ✓ Reviews/Users: GET /api/admin/reviews includes review with business{name,slug,state}. ?q=<text> filters work. DELETE /api/admin/reviews/{id} removes review. GET /api/admin/users includes test user with counts (reviews, favorites, claims, listings). GET /api/admin/leads/export.csv returns text/csv with header row. All 20 tests passed."
  - task: "Phase2: SEO settings + per-page overrides + admin media signature + robots/sitemap"
    implemented: true
    working: true
    file: "backend/admin_extra.py, backend/owner.py, backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "PUT /api/admin/settings {site:{...}} (favicon_url, ga_id, keywords, google_verification, robots_extra...), GET /api/settings/public returns site; GET /api/seo?path= ; GET/PUT/DELETE /api/admin/seo; GET /api/admin/media/signature (503 w/o cloudinary); robots.txt appends robots_extra; sitemap includes /nearby pages"
      - working: true
        agent: "testing"
        comment: "✓ SEO settings: GET /api/settings/public returns site with all keys (name, title_suffix, description, keywords, favicon_url, og_image_url, ga_id, adsense_client, robots_extra, canonical_base, google_verification). PUT /api/admin/settings updates site (favicon_url, ga_id, robots_extra, keywords), ignores bogus_key, preserves cloudinary. GET /api/robots.txt contains robots_extra 'Disallow: /secret'. Reset robots_extra to empty works. ✓ SEO overrides: PUT /api/admin/seo normalizes path '/plumbers/texas/austin/', creates override with title, description, noindex. GET /api/seo?path=/Plumbers/Texas/Austin returns override (case-insensitive). GET /api/admin/seo lists overrides. DELETE /api/admin/seo?path=/plumbers/texas/austin removes override (GET returns null). ✓ Admin media: GET /api/admin/media/signature returns 503 when Cloudinary not configured. Returns 401 without token. All 11 tests passed."
  - task: "Phase2: Google Trends CSV upload -> trend_queries -> public /api/nearby pages; 14 new categories"
    implemented: true
    working: true
    file: "backend/admin_extra.py, backend/catalog_trends.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST /api/admin/trends/upload (multipart file + kind=top|rising), GET /api/admin/trends, PATCH/DELETE /api/admin/trends/{id}, POST /api/admin/trends/bulk; public GET /api/nearby, GET /api/nearby/{slug}?lat&lng | city. CSVs already uploaded (56 live). Catalog now 34 categories x 32 cities; /api/home & /api/catalog should list new categories (pizza, bars, ...)."
      - working: true
        agent: "testing"
        comment: "✓ Trends admin: GET /api/admin/trends returns ~89 items with fields (id, query, slug, category, enabled, kinds, top_interest/rising_change_pct, category_name) and 34 categories. POST /api/admin/trends/upload (rising) parsed 50, updated 50. kind=bad returns 400. Tiny CSV with Google Trends preamble parsed 2 (header lines skipped). 'weather tomorrow' unmapped (category null, enabled false), deleted successfully. PATCH /api/admin/trends/{id} enabled=false makes GET /api/nearby/coffee-nearby return 404. PATCH enabled=true restores access (200). PATCH bad category returns 400. POST /api/admin/trends/bulk modified 2 trends. ✓ Public nearby: GET /api/nearby returns groups (category, category_name, icon, image, queries[]), trending[], total (>=50), cities (32). GET /api/nearby/coffee-nearby returns query, title, intro, category{slug:coffee-shops}, city{slug:new-york} (default), located false, businesses[], faqs (>=5), related[], other_queries[], cities. With ?lat=30.27&lng=-97.74 returns city.slug austin, located true, businesses sorted by distance ascending. With ?city=chicago returns city.slug chicago. Unknown slug returns 404. Views incremented (coffee-nearby views >= 1). ✓ Catalog regression: GET /api/home returns 34 categories including pizza, gas-stations, bars. GET /api/listing/pizza/texas/austin returns 200 with seeded businesses. GET /api/search?what=pizza&where=austin returns category pizza. GET /api/sitemap.xml contains /nearby/coffee-nearby. Phase 1 spot check: GET /api/admin/claims and GET /api/admin/settings return 200. All 29 tests passed."

frontend:
  - task: "Secret admin console route + username/password login + Claims & Settings tabs"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/Admin.jsx, App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Route /nbk-console-i2r5lwly (REACT_APP_ADMIN_PATH); /admin -> NotFound page."
  - task: "Claim modal, owner manage card, OwnerEditor, gallery with videos/lightbox, reviews with media, MediaUploader"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/BusinessDetail.jsx, components/ClaimModal.jsx, components/OwnerEditor.jsx, components/MediaUploader.jsx, components/Reviews.jsx, pages/Account.jsx, pages/ListBusiness.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Not yet tested by agent (ask user first)."

metadata:
  created_by: "main_agent"
  version: "3.0"
  test_sequence: 3
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Phase 1 backend done. Admin creds in /app/memory/test_credentials.md. User sessions: create user+session in Mongo per /app/auth_testing.md and use Authorization: Bearer. Please also run ONE real Google ingest (POST /api/admin/ingest?category=dentists&city=new-york) to verify GOOGLE key works and google_images field is saved; do not run ingest-all. Do not test frontend."
  - agent: "testing"
    message: "Backend testing complete. All 6 backend tasks tested and working. Comprehensive test suite executed with 49 passed tests covering: (1) Admin auth with JWT, rate limiting (IP-based, 15 min lock after 5 failures), X-Admin-Token guard. (2) Settings API with Cloudinary config, secret masking, media_enabled flag. (3) Media signature endpoint with auth, purpose validation, 503 when disabled. (4) Complete claim flow: user claim with proof_media, admin approve/reject/revoke, ownership transfer, verified badge. (5) Owner listing edit with media (images + videos), hours, services, tagline - owner-only access (403 for others). (6) Reviews with media, free listing submit with media, Google ingest (real API call successful, 20 businesses with up to 10 images). All regression tests passed: home, catalog, listing, detail, search, leads, favorites, admin stats (includes pending_claims and claimed), admin leads, submissions, sitemap. Google API key working. No critical issues found. Ready for user acceptance testing."
  - agent: "main"
    message: "Phase 2 backend added (admin_extra.py). Phase 1 tasks already passed - only regression-spot-check them. Test files for trends upload: /tmp/top.csv and /tmp/rising.csv (3 cols: query,search interest,increase percent). Do NOT run Google ingest this time."
  - agent: "testing"
    message: "Phase 2 backend testing complete. All 3 Phase 2 backend tasks tested and working. Comprehensive test suite executed with 60 passed tests (0 failed). ✓ Analytics endpoint returns all required data structures with correct counts (34 categories, 32 cities, 1088 SEO pages). ✓ Businesses manager with full CRUD operations, filters (category, city, source, search, flag, sort), audit logging. ✓ Reviews/users admin endpoints with search, deletion, counts, CSV export. ✓ SEO settings with site config updates, robots.txt integration, per-page overrides (PUT/GET/DELETE), path normalization, case-insensitive lookup. ✓ Admin media signature (503 without Cloudinary, 401 without auth). ✓ Google Trends CSV upload with header line skipping, auto-mapping to categories, enable/disable toggle, bulk operations. ✓ Public /api/nearby pages with geolocation support, city filtering, distance sorting, view tracking. ✓ Catalog regression confirms 34 categories including new ones (pizza, bars, gas-stations), sitemap includes nearby pages. Phase 1 spot checks passed. No critical issues. All backend APIs working correctly."
