#!/usr/bin/env bash
# Deploy Supabase edge functions through the management API (no CLI needed; the token is injected by the environment proxy).
#   bash scripts/deploy_functions.sh            → job + studio (they share supabase/functions/_shared)
#   bash scripts/deploy_functions.sh oauth job  → just those
# verify_jwt: studio on, job and oauth off (scripts/setup.sh). Each upload = <name>/index.ts + every _shared/*.ts.
set -euo pipefail
cd "$(dirname "$0")/../supabase/functions"
REF=$(python3 -c "import json;print(json.load(open('../../channel.json'))['infra']['supabase_ref'])")
NAMES=("$@"); [ ${#NAMES[@]} -eq 0 ] && NAMES=(job studio)
for n in "${NAMES[@]}"; do
  [ -f "$n/index.ts" ] || { echo "no supabase/functions/$n/index.ts"; exit 1; }
  jwt=false; [ "$n" = studio ] && jwt=true
  args=(-F "metadata={\"entrypoint_path\":\"$n/index.ts\",\"name\":\"$n\",\"verify_jwt\":$jwt}" -F "file=@$n/index.ts;filename=$n/index.ts")
  for f in _shared/*.ts; do args+=(-F "file=@$f;filename=$f"); done
  out=$(curl -sS -X POST "https://api.supabase.com/v1/projects/$REF/functions/deploy?slug=$n" -H "Authorization: Bearer proxy-injected" "${args[@]}")
  echo "$out" | python3 -c "import sys,json; d=json.load(sys.stdin); print('$n:', 'version', d.get('version'), d.get('status'), d.get('message') or '')"
done
