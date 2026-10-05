from __future__ import annotations
import json, os, re
from collections import Counter
from pathlib import Path
from espn_api.football import League

LEAGUE_ID = 1438350867
SEASONS = range(2021, 2027)
THRESHOLD = 35.0

def owner_name(team):
    owners = getattr(team, "owners", []) or []
    if owners:
        o = owners[0]
        if isinstance(o, dict):
            first = o.get("firstName") or o.get("first_name") or ""
            last = o.get("lastName") or o.get("last_name") or ""
            name = f"{first} {last}".strip()
            if name:
                return name
            display = o.get("displayName") or o.get("display_name")
            if display:
                return display
        s = str(o)
        for name in MANAGERS:
            if name.lower() in s.lower():
                return name
    return ""

MANAGERS = [
    "Chris Turner","Frankie Yentz","Larry Terrell","Chance Robinson","Macon Moore",
    "Casey Hutchins","Louis Swanson","Glen Hutchins","Ryan Mays","Zak Wesolek","Ryan Hutchins"
]

swid = os.environ["ESPN_SWID"].strip()
espn_s2 = os.environ["ESPN_S2"].strip()
counts = Counter({name: 0 for name in MANAGERS})
details = []

for season in SEASONS:
    league = League(league_id=LEAGUE_ID, year=season, swid=swid, espn_s2=espn_s2)
    settings = getattr(league, "settings", None)
    reg_weeks = int(getattr(settings, "reg_season_count", 14) or 14)
    final_week = 18 if season == 2021 else 17
    for week in range(1, final_week + 1):
        try:
            boxes = league.box_scores(week)
        except Exception:
            continue
        for box in boxes:
            home, away = getattr(box,"home_team",None), getattr(box,"away_team",None)
            if not home or not away:
                continue
            hs = float(getattr(box,"home_score",0) or 0)
            aws = float(getattr(box,"away_score",0) or 0)
            if hs == aws:
                continue
            is_playoff = bool(getattr(box,"is_playoff",False)) or week > reg_weeks
            # 2021-23 used multi-week playoff matchups. Those aggregates are excluded
            # from one-week records. 2024+ playoff matchups are one week.
            if is_playoff and season <= 2023:
                continue
            margin = abs(hs-aws)
            if margin <= THRESHOLD:
                continue
            loser = home if hs < aws else away
            winner = away if hs < aws else home
            loser_name = owner_name(loser)
            winner_name = owner_name(winner)
            if loser_name not in counts:
                continue
            counts[loser_name] += 1
            details.append({
                "Season":season,"Week":week,"Loser":loser_name,"Winner":winner_name,
                "Loser Score":min(hs,aws),"Winner Score":max(hs,aws),"Margin":round(margin,2)
            })

ordered = sorted(counts.items(), key=lambda x:(-x[1], x[0]))
rows = [{"Rank":i+1,"Manager":name,"Losses":n} for i,(name,n) in enumerate(ordered)]
Path("blowout-losses.js").write_text(
    "window.BLOWOUT_LOSSES = " + json.dumps(rows,separators=(",",":")) + ";\n" +
    "window.BLOWOUT_LOSS_DETAILS = " + json.dumps(details,separators=(",",":")) + ";\n",
    encoding="utf-8"
)
print(json.dumps(rows, indent=2))
