# Auth-Gated App Testing Playbook (Emergent Google Auth)

## Step 1: Create test user & session (Mongo)
mongosh --quiet --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({user_id: userId, email: 'test.user.' + Date.now() + '@example.com', name: 'Test User', picture: null, created_at: new Date()});
db.user_sessions.insertOne({user_id: userId, session_token: sessionToken, expires_at: new Date(Date.now() + 7*24*60*60*1000), created_at: new Date()});
print('Session token: ' + sessionToken); print('User ID: ' + userId);"

## Step 2: Backend
curl "$API/api/auth/me" -H "Authorization: Bearer $TOKEN"
curl -X POST "$API/api/favorites/<business_id>" -H "Authorization: Bearer $TOKEN"
curl -X POST "$API/api/businesses/<business_id>/reviews" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"rating":5,"text":"Great place"}'
curl -X POST "$API/api/businesses/submit" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"Test Biz","category":"plumbers","city":"austin","area":"Downtown","address":"100 Congress Ave","phone":"+1 512 555 0100"}'

## Step 3: Browser
await page.context.add_cookies([{"name":"session_token","value":TOKEN,"domain":"<preview-host>","path":"/","httpOnly":True,"secure":True,"sameSite":"None"}])
await page.goto("https://<preview-host>/account")

## Checklist
- users doc has `user_id`; sessions `user_id` matches; queries exclude `_id`
- /api/auth/me returns user; /account shows tabs instead of login prompt
- Callback detection uses `useLocation().hash` (App.js AppRouter)

## Cleanup
mongosh --quiet --eval "use('test_database'); db.users.deleteMany({email: /test\.user\./}); db.user_sessions.deleteMany({session_token: /test_session/});"
