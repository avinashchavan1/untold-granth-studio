#!/usr/bin/env bash
# One-time setup for a fresh cloud session (safe to re-run). Run from the repo root: bash scripts/bootstrap.sh
# Installs what the reel engine needs; ffmpeg, node and Playwright's Chromium come with the container.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -m pip install -q --disable-pip-version-check faster-whisper huggingface_hub pillow numpy soundfile scipy 2>&1 | tail -2 || true
[ -d node_modules ] || npm ci --silent
command -v ffmpeg >/dev/null || { echo "ffmpeg missing: apt-get install -y ffmpeg"; exit 1; }
node -e "require('playwright')" 2>/dev/null || echo "note: Playwright not found globally; the renderer needs it (it is preinstalled in Claude cloud sessions)"
python3 -c "import faster_whisper, huggingface_hub, PIL, numpy; print('engine python deps OK')"
echo "Restore an old reel's audio before re-rendering it:  python3 scripts/audiopack.py pull <ID>"
# refresh the repo's media index (live post links change when the app posts) and commit it if it changed
[ -f channel.json ] && ! grep -q '"example"' channel.json && python3 scripts/media_index.py --commit 2>/dev/null | tail -1 || true
