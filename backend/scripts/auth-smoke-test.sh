#!/usr/bin/env bash
#
# Auth smoke test for the UER backend.
#
# Run it against a DEV database (it creates throwaway accounts and incidents):
#
#   BASE_URL=http://127.0.0.1:8080 \
#   ADMIN_LOGIN=admin@uer.test \
#   ADMIN_PASSWORD='AdminPassw0rd!2026' \
#   ./backend/scripts/auth-smoke-test.sh
#
# Requires: curl, python3. Exit code 0 = every check passed.
# Re-running is safe: account IDs include a timestamp + process id.

set -uo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"
ADMIN_LOGIN="${ADMIN_LOGIN:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
RUN_ID="$(date +%s)-$$"

BODY_FILE="$(mktemp)"
trap 'rm -f "$BODY_FILE"' EXIT

pass=0
fail=0

http() {
    local method=$1 path=$2 data=${3-} token=${4-}
    local args=(-s -o "$BODY_FILE" -w '%{http_code}' -X "$method" "$BASE_URL$path"
                -H 'Content-Type: application/json')
    [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
    [ -n "$data" ] && args+=(-d "$data")
    curl "${args[@]}"
}

field() {
    python3 -c "import json;d=json.load(open('$BODY_FILE'));print(d.get('$1',''))" 2>/dev/null
}

nested() {
    python3 -c "import json;d=json.load(open('$BODY_FILE'));print(d['user'].get('$1',''))" 2>/dev/null
}

check() {
    local name=$1 expect=$2 got=$3
    if [ "$expect" = "$got" ]; then
        printf 'PASS  %s  [%s]\n' "$name" "$got"
        pass=$((pass + 1))
    else
        printf 'FAIL  %s  [expected %s, got %s]\n' "$name" "$expect" "$got"
        head -c 300 "$BODY_FILE" 2>/dev/null
        echo
        fail=$((fail + 1))
    fi
}

check_true() {
    local name=$1 condition=$2
    check "$name" true "$condition"
}

contains_incident() {
    python3 -c "import json,sys;d=json.load(open('$BODY_FILE'));print('true' if any(item.get('id')==sys.argv[1] for item in d) else 'false')" "$1" 2>/dev/null
}

year2=$(printf '%02d' $(( $(date +%Y) % 100 )))
old_year2=$(printf '%02d' $(( ( $(date +%Y) - 9 + 100 ) % 100 )))
suffix_a=$(printf '%07d' $(( (RANDOM * 32768 + RANDOM) % 10000000 )))
suffix_b=$(printf '%07d' $(( (RANDOM * 32768 + RANDOM) % 10000000 )))
suffix_c=$(printf '%07d' $(( (RANDOM * 32768 + RANDOM) % 10000000 )))
suffix_d=$(printf '%07d' $(( (RANDOM * 32768 + RANDOM) % 10000000 )))
suffix_e=$(printf '%07d' $(( (RANDOM * 32768 + RANDOM) % 10000000 )))
suffix_f=$(printf '%07d' $(( (RANDOM * 32768 + RANDOM) % 10000000 )))
MATRIC_A="${year2}${suffix_a}"
MATRIC_B="${year2}${suffix_b}"
MATRIC_INJECT="${year2}${suffix_d}"
MATRIC_LEVEL="${year2}${suffix_e}"
MATRIC_PASSWORD="${year2}${suffix_f}"

STUDENT_A=$(printf '{"displayName":"Smoke Student A","gender":"FEMALE","matricNo":"%s","academicDepartment":"Computer Science","academicLevel":300,"password":"StudentPass1!"}' "$MATRIC_A")
STUDENT_B=$(printf '{"displayName":"Smoke Student B","gender":"MALE","matricNo":"%s","academicDepartment":"Physics","academicLevel":200,"password":"StudentPass2!"}' "$MATRIC_B")
STUDENT_OLD=$(printf '{"displayName":"Old Student","gender":"MALE","matricNo":"%s%s","academicDepartment":"Physics","academicLevel":400,"password":"StudentPass1!"}' "$old_year2" "$suffix_c")
LOGIN_A=$(printf '{"loginId":"%s","password":"StudentPass1!"}' "$MATRIC_A")

echo "Testing $BASE_URL (run $RUN_ID)"
if ! curl -s -o /dev/null --max-time 5 "$BASE_URL/api/v1/health"; then
    echo "ERROR: no backend reachable at $BASE_URL"
    echo "Start it first (see backend/scripts/README.md) or set BASE_URL."
    exit 1
fi
echo

echo "=== public surface ==="
check "health is public" 200 "$(http GET /api/v1/health)"
check "incident feed requires auth" 401 "$(http GET /api/v1/incidents)"

echo
echo "=== student signup validation ==="
code=$(http POST /api/v1/auth/register "$STUDENT_A")
check "valid signup" 201 "$code"
ACCESS_A=$(field accessToken)
REFRESH_A=$(field refreshToken)
USER_A=$(nested id)
check_true "returns access token" "$([ -n "$ACCESS_A" ] && echo true)"
check_true "returns refresh token" "$([ -n "$REFRESH_A" ] && echo true)"
check "signup role is REPORTER" REPORTER "$(nested role)"
check "signup starts UNVERIFIED" UNVERIFIED "$(nested verificationStatus)"
check "client cannot inject a role" REPORTER "$(http POST /api/v1/auth/register '{"displayName":"Hacker","gender":"MALE","matricNo":"'$MATRIC_INJECT'","academicDepartment":"Physics","academicLevel":300,"password":"StudentPass1!","role":"ADMIN","enabled":false}' >/dev/null; nested role)"
check "injected enabled flag ignored" true "$(python3 -c "import json;d=json.load(open('$BODY_FILE'));print('true' if d['user']['enabled'] is True else 'false')" 2>/dev/null)"
check "entry year older than 8 years rejected" 400 "$(http POST /api/v1/auth/register "$STUDENT_OLD")"
check "non-digit matric rejected" 400 "$(http POST /api/v1/auth/register '{"displayName":"Bad","gender":"MALE","matricNo":"12345","academicDepartment":"Physics","academicLevel":300,"password":"StudentPass1!"}')"
check "non-100 level rejected" 400 "$(http POST /api/v1/auth/register '{"displayName":"Bad","gender":"MALE","matricNo":"'$MATRIC_LEVEL'","academicDepartment":"Physics","academicLevel":250,"password":"StudentPass1!"}')"
check "short password rejected" 400 "$(http POST /api/v1/auth/register '{"displayName":"Bad","gender":"MALE","matricNo":"'$MATRIC_PASSWORD'","academicDepartment":"Physics","academicLevel":300,"password":"short"}')"
check "duplicate matric rejected" 409 "$(http POST /api/v1/auth/register "$STUDENT_A")"

echo
echo "=== login and lockout ==="
check "wrong password" 401 "$(http POST /api/v1/auth/login '{"loginId":"'$MATRIC_A'","password":"WrongPassword!"}')"
code=$(http POST /api/v1/auth/login "$LOGIN_A")
check "correct login" 200 "$code"
ACCESS_A=$(field accessToken)
REFRESH_A=$(field refreshToken)

check "second student signup" 201 "$(http POST /api/v1/auth/register "$STUDENT_B")"
REFRESH_B=$(field refreshToken)
for attempt in 1 2 3 4 5; do
    code=$(http POST /api/v1/auth/login '{"loginId":"'$MATRIC_B'","password":"NopeNopeNope!"}')
    [ "$attempt" = 5 ] && check "fifth failed login is still 401" 401 "$code"
done
check "locked account rejects correct password" 423 "$(http POST /api/v1/auth/login '{"loginId":"'$MATRIC_B'","password":"StudentPass2!"}')"
check "unknown account is a uniform 401" 401 "$(http POST /api/v1/auth/login '{"loginId":"nobody@nowhere.test","password":"Whatever123!"}')"

echo
echo "=== roles and ownership ==="
check "student reads own reports" 200 "$(http GET /api/v1/incidents/mine '' "$ACCESS_A")"
check "student blocked from responder feed" 403 "$(http GET /api/v1/incidents '' "$ACCESS_A")"

echo
echo "=== refresh rotation and theft detection ==="
OLD_REFRESH=$REFRESH_A
check "refresh rotates" 200 "$(http POST /api/v1/auth/refresh '{"refreshToken":"'$OLD_REFRESH'"}')"
NEW_REFRESH=$(field refreshToken)
check_true "refresh token changed" "$([ "$OLD_REFRESH" != "$NEW_REFRESH" ] && echo true)"
check "reused refresh token rejected" 401 "$(http POST /api/v1/auth/refresh '{"refreshToken":"'$OLD_REFRESH'"}')"
check "reuse revoked the whole family" 401 "$(http POST /api/v1/auth/refresh '{"refreshToken":"'$NEW_REFRESH'"}')"

echo
echo "=== admin-created responder accounts ==="
if [ -z "$ADMIN_LOGIN" ] || [ -z "$ADMIN_PASSWORD" ]; then
    echo "SKIP  set ADMIN_LOGIN and ADMIN_PASSWORD to test provisioning, unit scoping and verification"
else
    code=$(http POST /api/v1/auth/login "$(printf '{"loginId":"%s","password":"%s"}' "$ADMIN_LOGIN" "$ADMIN_PASSWORD")")
    if [ "$code" != "200" ]; then
        check "admin login" 200 "$code"
    else
        pass=$((pass + 1)); echo "PASS  admin login  [200]"
        ACCESS_ADMIN=$(field accessToken)
        FIRE_EMAIL="smoke-fire-$RUN_ID@uer.test"
        MED_EMAIL="smoke-med-$RUN_ID@uer.test"
        check "admin lists responders" 200 "$(http GET /api/v1/admin/responders '' "$ACCESS_ADMIN")"
        check "admin creates fire responder" 201 "$(http POST /api/v1/admin/responders '{"loginId":"'$FIRE_EMAIL'","displayName":"Smoke Fire","unit":"Fire Station","password":"ResponderPass1!"}' "$ACCESS_ADMIN")"
        check "admin creates medical responder" 201 "$(http POST /api/v1/admin/responders '{"loginId":"'$MED_EMAIL'","displayName":"Smoke Medic","unit":"Medical Center","password":"ResponderPass1!"}' "$ACCESS_ADMIN")"
        check "unknown unit rejected" 400 "$(http POST /api/v1/admin/responders '{"loginId":"bad-'$RUN_ID'@uer.test","displayName":"Bad","unit":"Unknown","password":"ResponderPass1!"}' "$ACCESS_ADMIN")"
        check "student blocked from admin endpoints" 403 "$(http GET /api/v1/admin/students '' "$ACCESS_A")"

        check "fire responder login" 200 "$(http POST /api/v1/auth/login '{"loginId":"'$FIRE_EMAIL'","password":"ResponderPass1!"}')"
        ACCESS_FIRE=$(field accessToken)
        REFRESH_FIRE=$(field refreshToken)
        check "medical responder login" 200 "$(http POST /api/v1/auth/login '{"loginId":"'$MED_EMAIL'","password":"ResponderPass1!"}')"
        ACCESS_MED=$(field accessToken)

        # Re-login the student: the refresh-family test above revoked its refresh
        # token family, and we only want to rely on a fresh access token here.
        check "student re-login" 200 "$(http POST /api/v1/auth/login "$LOGIN_A")"
        ACCESS_A=$(field accessToken)
        USER_A=$(nested id)

        INCIDENT_ID="smoke-incident-$RUN_ID"
        check "student files incident" 201 "$(http POST /api/v1/incidents '{"id":"'$INCIDENT_ID'","type":"Fire","location":"LT1","locationText":"Smoke test","time":"14:05","tagged":"Fire Station","severity":"high","text":"Smoke in the lab","images":[]}' "$ACCESS_A")"
        check "server stamps reporter_id" "$USER_A" "$(field reporterId)"
        check "incident without id is 400 not 500" 400 "$(http POST /api/v1/incidents '{"type":"Fire","location":"LT1","locationText":"No id","time":"14:06","tagged":"Fire Station","severity":"high","text":"no id","images":[]}' "$ACCESS_A")"
        check "responder cannot file as student" 403 "$(http POST /api/v1/incidents '{"id":"'$INCIDENT_ID'-2","type":"Fire","location":"LT2","locationText":"Nope","time":"14:07","tagged":"Fire Station","severity":"high","text":"nope","images":[]}' "$ACCESS_FIRE")"

        check "fire feed" 200 "$(http GET /api/v1/incidents '' "$ACCESS_FIRE")"
        check "fire unit sees its incident" true "$(contains_incident "$INCIDENT_ID")"
        check "medical feed" 200 "$(http GET /api/v1/incidents '' "$ACCESS_MED")"
        check "medical unit cannot see fire incident" false "$(contains_incident "$INCIDENT_ID")"
        check "admin sees all incidents" 200 "$(http GET /api/v1/incidents '' "$ACCESS_ADMIN")"
        check "admin feed contains the report" true "$(contains_incident "$INCIDENT_ID")"
        check "student history" 200 "$(http GET /api/v1/incidents/mine '' "$ACCESS_A")"
        check "student history contains the report" true "$(contains_incident "$INCIDENT_ID")"

        check "assigned unit reads detail" 200 "$(http GET /api/v1/incidents/$INCIDENT_ID '' "$ACCESS_FIRE")"
        check "other unit cannot read detail" 403 "$(http GET /api/v1/incidents/$INCIDENT_ID '' "$ACCESS_MED")"
        check "assigned unit updates status" 200 "$(http PATCH /api/v1/incidents/$INCIDENT_ID/status '{"status":"En Route"}' "$ACCESS_FIRE")"
        check "other unit cannot update" 403 "$(http PATCH /api/v1/incidents/$INCIDENT_ID/status '{"status":"Resolved"}' "$ACCESS_MED")"
        check "student cannot update" 403 "$(http PATCH /api/v1/incidents/$INCIDENT_ID/status '{"status":"Resolved"}' "$ACCESS_A")"
        check "invalid status rejected" 400 "$(http PATCH /api/v1/incidents/$INCIDENT_ID/status '{"status":"Lost"}' "$ACCESS_FIRE")"

        check "admin verifies student" 200 "$(http PATCH /api/v1/admin/students/$USER_A/verification '{"status":"VERIFIED"}' "$ACCESS_ADMIN")"
        check "verification persisted" VERIFIED "$(field verificationStatus)"
        check "verification source recorded" MANUAL "$(field verificationSource)"

        check "responder logout" 204 "$(http POST /api/v1/auth/logout '{"refreshToken":"'$REFRESH_FIRE'"}')"
    fi
fi

echo
echo "=== session lifetime ==="
TTL=$(python3 - "$ACCESS_A" <<'PY'
import base64, json, sys
payload = sys.argv[1].split('.')[1]
payload += '=' * (-len(payload) % 4)
claims = json.loads(base64.urlsafe_b64decode(payload))
print(claims['exp'] - claims['iat'])
PY
)
check "access token TTL is 300 seconds" 300 "$TTL"
check "logout revokes refresh token" 204 "$(http POST /api/v1/auth/logout '{"refreshToken":"'$REFRESH_B'"}')"
check "logged-out refresh token rejected" 401 "$(http POST /api/v1/auth/refresh '{"refreshToken":"'$REFRESH_B'"}')"

echo
echo "RESULT: $pass passed, $fail failed"
exit $((fail > 0))
