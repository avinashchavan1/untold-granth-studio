#!/usr/bin/env python3
"""Turn on the server timers (run once per channel, after migrations 0013/0014 and the job function are deployed):
  - every 5 minutes: start scheduled posts that are due   (job function ?cron=1)
  - every hour at :23: refresh the stats that are due (new posts hourly, then every 6 h, then daily) + followers (job function ?cron=stats)
  - every day at 02:47 UTC (8:17 am IST): best-time scan (similar channels, audience, model, Autopilot) + health checks (job function ?cron=daily).
  - every week (Sunday 02:43 IST): database backup, minus secrets, to the private HF dataset (backups/db/<date>.json) (job function ?cron=backup).
    Stats skip 00:00-08:00 IST (quiet hours). Set YouTube search terms for similar channels in autopilot.peer_search (Best time page lets the owner add channels too).
Creates a random CRON_SECRET, stores it as a Supabase function secret and inside the pg_cron jobs (never printed).
  python3 scripts/schedule_setup.py            uses the Supabase management API (PAT as a network secret, 'proxy-injected')"""
import json, os, secrets, sys, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from channel import C

REF = C["infra"]["supabase_ref"]; API = f"https://api.supabase.com/v1/projects/{REF}"
H = {"Authorization": "Bearer proxy-injected", "Content-Type": "application/json"}
def call(path, body):
    rq = urllib.request.Request(f"{API}/{path}", json.dumps(body).encode(), H, method="POST")
    return urllib.request.urlopen(rq, timeout=60).read().decode()

sec = secrets.token_urlsafe(32)
call("secrets", [{"name": "CRON_SECRET", "value": sec}])
url = f"https://{REF}.supabase.co/functions/v1/job"
job = lambda q: (f"select net.http_post(url := '{url}?cron={q}', headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','{sec}'), "
                 f"body := '{{}}'::jsonb, timeout_milliseconds := 120000)")
sid = C["id"]
sql = f"""create extension if not exists pg_cron; create extension if not exists pg_net;
select cron.unschedule(jobname) from cron.job where jobname in ('{sid}-scheduler', '{sid}-daily', '{sid}-stats', '{sid}-backup');
select cron.schedule('{sid}-scheduler', '*/5 * * * *', $${job('1')}$$);
select cron.schedule('{sid}-stats', '23 * * * *', $${job('stats')}$$);
select cron.schedule('{sid}-daily', '47 2 * * *', $${job('daily')}$$);
select cron.schedule('{sid}-backup', '13 21 * * 6', $${job('backup')}$$);
select jobname, schedule from cron.job where jobname like '{sid}-%';"""
print(call("database/query", {"query": sql}))
print("timers on: posts every 5 min, stats hourly (only what is due), health daily at 02:47 UTC (8:17 IST), no stats 00:00-08:00 IST")
