#!/usr/bin/env bash
# Build the app and deploy it to the channel's Netlify site (channel.json → infra.netlify_site_id, app_url)
# (Netlify token is injected by the environment proxy; never put it in code.)
set -euo pipefail
cd "$(dirname "$0")/.."
SITE=$(python3 -c "import json;print(json.load(open('channel.json'))['infra']['netlify_site_id'])")
URL=$(python3 -c "import json;print(json.load(open('channel.json'))['app_url'])")
npm run build
ZIP=$(mktemp --suffix .zip)
(cd dist && python3 -c "import zipfile,os,sys; z=zipfile.ZipFile(sys.argv[1],'w',zipfile.ZIP_DEFLATED); [z.write(os.path.join(r,f), os.path.relpath(os.path.join(r,f),'.')) for r,d,fs in os.walk('.') for f in fs]; z.close()" "$ZIP")
ID=$(curl -sS -X POST "https://api.netlify.com/api/v1/sites/$SITE/deploys" -H "Authorization: Bearer proxy-injected" -H "Content-Type: application/zip" --data-binary @"$ZIP" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
for i in $(seq 1 30); do S=$(curl -sS "https://api.netlify.com/api/v1/deploys/$ID" -H "Authorization: Bearer proxy-injected" | python3 -c "import sys,json; print(json.load(sys.stdin).get('state'))"); [ "$S" = ready ] && break; sleep 4; done
rm -f "$ZIP"; echo "deploy $ID: $S → $URL"
