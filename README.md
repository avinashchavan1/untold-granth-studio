# Untold Granth Studio

Production studio + publishing app for **Untold Granth** (Instagram @untoldgranth.official · YouTube @untoldgranth).

**App:** https://untold-granth-studio.avinashchavan.com (sign in with an allowed email)

| Part | Where |
|---|---|
| App (React 18 + TypeScript + Vite + Tailwind + TanStack Query) | `src/` → Netlify (`scripts/deploy.sh`) |
| Database, login, previews | Supabase project `untold-granth-studio` (Mumbai) · schema in `supabase/migrations/` |
| Full-quality masters | private Hugging Face dataset `Avinash1443/untold-granth-masters` |
| Reel engine (renderer, voices, mix) | `studio/` · rules in `studio/STYLE_GUIDE.md` |
| Workflow skill | `.claude/skills/make-reel/SKILL.md` |

## Data model
`series` (one per book) → `characters`, `locations`, `docs` · `reels` (the 100-reel plan + produced reels, stage idea → published) → `claims` (verse citations), `files` (previews, posters, masters), `publications` (per platform) · `activity` log · `app_admins` (who can sign in). Every table is admin-only via row-level security.

## Everyday commands
```bash
python3 scripts/sync.py studio            # studio folder → database (plan, cast, docs, produced reels)
python3 scripts/media.py A02 preview studio/.../A02_final.mp4   # previews/posters/docs → storage (≤50 MB)
python3 scripts/masters.py A02 studio     # Instagram + YouTube masters → Hugging Face, linked in the app
scripts/deploy.sh                         # build + deploy the app
```
Secrets (Supabase secret key, Hugging Face and Netlify tokens) are injected by the cloud environment's proxy and never stored in the repo.
