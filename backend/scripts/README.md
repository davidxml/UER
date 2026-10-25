# Testing the UER backend

Four levels, cheapest first.

## 1. Unit tests (no database)

```bash
cd backend
./mvnw -o -Dtest=JwtServiceTest,StudentSignupRequestTest test
```

Covers JWT claim round-trips/tamper rejection and the matric-year / academic-level
rules (9 tests).

> `./mvnw test` also runs `UerApplicationTests`, which boots the full Spring
> context against whatever datasource `.env` points at. Until a dedicated test
> profile exists, either name the unit tests explicitly as above, or point the
> datasource at the throwaway database from step 2.

## 2. Full API smoke test (recommended)

Starts a disposable Postgres so nothing touches Supabase.

```bash
docker run -d --name uer-test-pg \
  -e POSTGRES_PASSWORD=test -e POSTGRES_DB=uer \
  -p 55432:5432 postgres:15-alpine

cd backend
SPRING_DATASOURCE_URL='jdbc:postgresql://localhost:55432/uer' \
SPRING_DATASOURCE_USERNAME=postgres \
SPRING_DATASOURCE_PASSWORD=test \
JWT_SECRET='0123456789abcdef0123456789abcdef' \
ADMIN_LOGIN='admin@uer.test' \
ADMIN_PASSWORD='AdminPassw0rd!2026' \
PORT=18080 \
./mvnw -o spring-boot:run
```

In a second terminal:

```bash
cd backend
BASE_URL=http://127.0.0.1:18080 \
ADMIN_LOGIN='admin@uer.test' \
ADMIN_PASSWORD='AdminPassw0rd!2026' \
./scripts/auth-smoke-test.sh
```

The script creates uniquely-named students/responders/incidents, so it can be
re-run against the same database. Expected final line: `RESULT: N passed, 0 failed`.

What it checks:

- signup field validation (matric format + 8-year window, level, password, duplicates)
- role injection is ignored; new students are `REPORTER` + `UNVERIFIED`
- wrong password `401`, 5 failures → `423` lockout
- refresh rotation, old-token rejection, family revocation on reuse
- student/responder/admin route boundaries and `/incidents/mine`
- admin provisioning of responders, unit scoping on read *and* write
- student verification audit (`VERIFIED` + `MANUAL`)
- logout revokes the refresh token, access-token TTL is 300 s

Stop the database when done:

```bash
docker rm -f uer-test-pg
```

## 3. Manual requests (Postman / Insomnia / curl)

Use these when building the signup form. Base URL `http://localhost:8080`
(or `:18080` in the smoke-test setup).

```bash
# Sign up (201)
curl -i -X POST http://localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "displayName": "Ada Obi",
    "gender": "FEMALE",
    "matricNo": "260201001",
    "academicDepartment": "Computer Science",
    "academicLevel": 300,
    "password": "StudentPass1!"
  }'

# Log in (200)
curl -i -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"loginId":"260201001","password":"StudentPass1!"}'

# Use the access token
curl -i http://localhost:8080/api/v1/incidents/mine \
  -H "Authorization: Bearer <accessToken>"

# Rotate (200) — always store the NEW refresh token
curl -i -X POST http://localhost:8080/api/v1/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"<refreshToken>"}'

# Admin creates a responder (201)
curl -i -X POST http://localhost:8080/api/v1/admin/responders \
  -H "Authorization: Bearer <adminAccessToken>" \
  -H 'Content-Type: application/json' \
  -d '{"loginId":"fire@uer.test","displayName":"Fire Officer","unit":"Fire Station","password":"ResponderPass1!"}'
```

Negative cases worth trying by hand: wrong password (`401`), 6th login attempt
(`423`), student reading `/api/v1/incidents` (`403`), invalid matric year (`400`),
duplicate matric (`409`), and an incident for another unit (`403`).

## 4. Inspect what actually landed in the database

```bash
docker exec -it uer-test-pg psql -U postgres -d uer

select login_id, role, verification_status, enabled,
       left(password_hash, 7) as hash_prefix
from users;

select role, expires_at - created_at as ttl, revoked_at is not null as revoked
from refresh_tokens t join users u on u.id = t.user_id;

select id, tagged, status, reporter_id is not null as has_reporter from incidents;
```

Expected: `$2a$12$` hashes, 64-character hex refresh hashes, 14-day student TTLs,
18-hour staff TTLs.

## 5. WebSocket / STOMP

The responder console is the only client allowed on the socket. A quick manual
check is to open the responder app, confirm the feed connects with a responder
token, then clear `localStorage` (or use a student token) and reload — the
connection must be rejected with `Authentication required` /
`Not authorized for the responder channel`.

A scripted version can be added under `frontend/scripts/` using
`@stomp/stompjs`, which is already a dependency. It should assert: anonymous
CONNECT rejected, student CONNECT rejected, tampered token rejected, responder
CONNECT accepted, and a broadcast arrives after a student files an incident.

## Safety rules

- Only run the smoke test against the throwaway database above, never Supabase —
  it creates real accounts and incidents.
- Always override `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and
  `SPRING_DATASOURCE_PASSWORD`; otherwise the `.env` post-processor points the
  app at the shared Supabase database.
- Do not paste production tokens into jwt.io or similar sites. Decode locally:

```bash
python3 -c "import base64,json,sys; p=sys.argv[1].split('.')[1]; p+='='*(-len(p)%4); print(json.loads(base64.urlsafe_b64decode(p)))" '<token>'
```
