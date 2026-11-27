#!/usr/bin/env python3
"""The owner's reel request queue (Plan page → "Make this"), in order. Read it at the start of a session and make
these before the plan order.   python3 scripts/request_queue.py"""
import json, os, sys, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from channel import SID, SUPA
rq = urllib.request.Request(f"{SUPA}/rest/v1/reels?select=code,title,request_note,requested_at,request_pos&series_id=eq.{SID}&stage=eq.idea&requested_at=not.is.null&order=request_pos",
                            headers={"apikey": "proxy-injected"})
rows = json.load(urllib.request.urlopen(rq, timeout=30))
if not rows: print("Request queue is empty: follow the plan order."); sys.exit()
for i, r in enumerate(rows, 1): print(f"{i}. {r['code']}  {r['title']}" + (f"   (note: {r['request_note']})" if r.get("request_note") else ""))
